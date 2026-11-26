//! Senso Bar — a point-of-sale and back office for a small cafe.
//!
//! Run it on the shop computer and open the printed address in a browser.
//! Phones and tablets on the same Wi-Fi can use it too.
//!
//! Settings (environment variables):
//!   SENSO_ADDR  address to listen on  (default 0.0.0.0:8080)
//!   SENSO_DATA  data file             (default ./senso-data.json)

#[macro_use]
mod json;
mod api;
mod clock;
mod http;
mod receipt;
mod seed;
mod store;

use std::env;
use std::net::{TcpListener, UdpSocket};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::thread;

/// Best guess at this machine's LAN address, so staff phones know where to connect.
fn lan_ip() -> Option<String> {
    let s = UdpSocket::bind("0.0.0.0:0").ok()?;
    s.connect("10.255.255.255:1").ok()?;
    let ip = s.local_addr().ok()?.ip();
    (!ip.is_loopback() && !ip.is_unspecified()).then(|| ip.to_string())
}

fn main() {
    let addr = env::var("SENSO_ADDR").unwrap_or_else(|_| "0.0.0.0:8080".into());
    let path = PathBuf::from(env::var("SENSO_DATA").unwrap_or_else(|_| "senso-data.json".into()));

    let store = match store::Store::load_or_seed(path.clone()) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("senso: couldn't open the data file: {e}");
            std::process::exit(1);
        }
    };
    let listener = match TcpListener::bind(&addr) {
        Ok(l) => l,
        Err(e) => {
            eprintln!("senso: couldn't listen on {addr}: {e}\nTry another port, e.g. SENSO_ADDR=0.0.0.0:8090");
            std::process::exit(1);
        }
    };
    let port = listener.local_addr().map(|a| a.port()).unwrap_or(8080);

    println!("\n  Senso Bar is running");
    println!("  On this computer:   http://localhost:{port}");
    if addr.starts_with("0.0.0.0") {
        if let Some(ip) = lan_ip() {
            println!("  On phones (Wi-Fi):  http://{ip}:{port}");
        }
    }
    println!("  Data file:          {}", path.display());
    println!("  Press Ctrl+C to stop.\n");

    let store = Arc::new(Mutex::new(store));
    for conn in listener.incoming() {
        let Ok(mut stream) = conn else { continue };
        let store = Arc::clone(&store);
        thread::spawn(move || {
            let req = match http::read_request(&mut stream) {
                Ok(Some(r)) => r,
                Ok(None) => return,
                Err(_) => {
                    let _ = http::write_response(&mut stream, &http::Response::new(413, "text/plain", "Request too large"));
                    return;
                }
            };
            let resp = api::handle(&req, &store);
            let _ = http::write_response(&mut stream, &resp);
        });
    }
}
