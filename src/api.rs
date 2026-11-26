//! Routes. Every change returns the full app state so all screens stay in step.

use crate::clock;
use crate::http::{Request, Response};
use crate::json::Json;
use crate::receipt;
use crate::store::Store;
use std::sync::Mutex;

const INDEX: &str = include_str!("../ui/index.html");

fn err(status: u16, msg: &str) -> Response {
    Response::json(status, jobj! {"error" => msg}.to_string())
}

fn body_json(req: &Request) -> Result<Json, Response> {
    if req.body.is_empty() {
        return Ok(Json::Obj(Vec::new()));
    }
    let text = std::str::from_utf8(&req.body).map_err(|_| err(400, "The request wasn't valid text."))?;
    Json::parse(text).map_err(|e| err(400, &format!("The request wasn't valid JSON ({e}).")))
}

fn valid_id(id: &str) -> bool {
    !id.is_empty() && id.len() <= 80 && id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}

pub fn handle(req: &Request, store: &Mutex<Store>) -> Response {
    let segs: Vec<&str> = req.path.trim_matches('/').split('/').filter(|s| !s.is_empty()).collect();
    let m = req.method.as_str();

    // Read-only routes
    match (m, segs.as_slice()) {
        ("GET", []) | ("GET", ["index.html"]) => {
            return Response::html(INDEX.to_string()).header("Cache-Control", "no-cache");
        }
        ("GET", ["favicon.ico"]) => return Response::new(404, "text/plain", "none"),
        ("GET", ["api", "health"]) => return Response::json(200, jobj! {"ok" => true}.to_string()),
        _ => {}
    }

    let mut s = store.lock().unwrap_or_else(|e| e.into_inner());
    let now = clock::now();

    match (m, segs.as_slice()) {
        ("GET", ["api", "state"]) => return Response::json(200, s.state_json(now).to_string()),
        ("GET", ["api", "rev"]) => return Response::json(200, jobj! {"rev" => s.rev}.to_string()),
        ("GET", ["api", "orders"]) => {
            let day = req.query_param("day").unwrap_or_else(|| s.today(now));
            return Response::json(200, jobj! {"day" => day.clone(), "orders" => s.orders_on(&day)}.to_string());
        }
        ("GET", ["receipt", id]) => {
            return match s.orders.iter().find(|o| o.id == *id) {
                Some(o) => Response::html(receipt::receipt_html(o, &s.settings, req.query_param("print").is_some())),
                None => Response::new(404, "text/plain; charset=utf-8", "That order wasn't found."),
            };
        }
        ("GET", ["export", "orders.csv"]) => {
            let name = format!("senso-orders-{}.csv", s.today(now));
            return Response::new(200, "text/csv; charset=utf-8", receipt::orders_csv(&s.orders, &s.settings))
                .header("Content-Disposition", format!("attachment; filename=\"{name}\""));
        }
        ("GET", ["export", "backup.json"]) => {
            let name = format!("senso-backup-{}.json", s.today(now));
            let text = match &s.path {
                Some(p) => std::fs::read_to_string(p).unwrap_or_default(),
                None => String::new(),
            };
            return Response::json(200, text).header("Content-Disposition", format!("attachment; filename=\"{name}\""));
        }
        ("GET", _) => return err(404, "Not found."),
        _ => {}
    }

    // Changes
    let body = match body_json(req) {
        Ok(b) => b,
        Err(r) => return r,
    };
    for id in segs.iter().skip(2).take(1) {
        if !valid_id(id) {
            return err(400, "That id isn't valid.");
        }
    }

    let mut extra: Option<(&str, Json)> = None;
    let result: Result<(), String> = match (m, segs.as_slice()) {
        ("POST", ["api", "orders"]) => s.create_order(&body, now).map(|o| extra = Some(("order", o.to_json()))),
        ("POST", ["api", "orders", id, "void"]) => s.void_order(id).map(|o| extra = Some(("order", o.to_json()))),
        ("PUT", ["api", "menu", id]) => s.put_menu(id, &body),
        ("DELETE", ["api", "menu", id]) => s.delete_menu(id),
        ("POST", ["api", "menu"]) => {
            let id = s.new_id("m");
            s.put_menu(&id, &body)
        }
        ("PUT", ["api", "ingredients", id]) => s.put_ingredient(id, &body),
        ("POST", ["api", "ingredients"]) => {
            let id = s.new_id("i");
            s.put_ingredient(&id, &body)
        }
        ("DELETE", ["api", "ingredients", id]) => s.delete_ingredient(id),
        ("POST", ["api", "ingredients", id, "adjust"]) => match body.num("delta") {
            Some(d) => s.adjust_ingredient(id, d),
            None => Err("Send the amount to add or remove.".into()),
        },
        ("POST", ["api", "shopping"]) => s.add_shopping(&body, now),
        ("POST", ["api", "shopping", "clear"]) => {
            s.shopping.retain(|x| !x.done);
            Ok(())
        }
        ("POST", ["api", "shopping", id, "toggle"]) => s.toggle_shopping(id),
        ("DELETE", ["api", "shopping", id]) => {
            s.shopping.retain(|x| x.id != *id);
            Ok(())
        }
        ("POST", ["api", "prep"]) => s.add_prep(&body, now),
        ("POST", ["api", "prep", "clear"]) => {
            s.prep.retain(|x| !x.done);
            Ok(())
        }
        ("POST", ["api", "prep", id, "toggle"]) => s.toggle_prep(id),
        ("DELETE", ["api", "prep", id]) => {
            s.prep.retain(|x| x.id != *id);
            Ok(())
        }
        ("PUT", ["api", "settings"]) => {
            s.settings = s.settings.merged(&body);
            if body.has("sample_stock") {
                s.sample_stock = body.flag("sample_stock", false);
            }
            Ok(())
        }
        (_, ["api", ..]) => return err(404, "Not found."),
        _ => return err(405, "Method not allowed."),
    };

    if let Err(e) = result {
        return err(400, &e);
    }
    s.rev += 1;
    if let Err(e) = s.save() {
        eprintln!("senso: could not save data: {e}");
        return err(500, "The change was made but couldn't be saved to disk. Check the data folder.");
    }
    let mut out = vec![("ok".to_string(), Json::Bool(true)), ("state".to_string(), s.state_json(now))];
    if let Some((k, v)) = extra {
        out.push((k.to_string(), v));
    }
    Response::json(200, Json::Obj(out).to_string())
}
