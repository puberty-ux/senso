//! Printable receipts (sized for 58 or 80 mm thermal paper) and CSV export.

use crate::clock;
use crate::store::{Order, Settings};

pub fn esc(s: &str) -> String {
    let mut o = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '&' => o.push_str("&amp;"),
            '<' => o.push_str("&lt;"),
            '>' => o.push_str("&gt;"),
            '"' => o.push_str("&quot;"),
            '\'' => o.push_str("&#39;"),
            c => o.push(c),
        }
    }
    o
}

/// Whole Afghani with thousands separators: 1240 -> "1,240".
pub fn money(n: f64) -> String {
    let neg = n < 0.0;
    let digits = (n.abs().round() as i64).to_string();
    let mut out = String::new();
    for (i, c) in digits.chars().enumerate() {
        if i > 0 && (digits.len() - i) % 3 == 0 {
            out.push(',');
        }
        out.push(c);
    }
    if neg { format!("-{out}") } else { out }
}

pub fn receipt_html(o: &Order, s: &Settings, autoprint: bool) -> String {
    let off = s.utc_offset_min;
    let w = if s.paper < 70 { 58 } else { 80 };
    let small = w < 70;
    let mut items = String::new();
    for i in &o.items {
        items.push_str(&format!(
            r#"<div class="it"><div class="row"><span class="fa">{fa}</span><span>{lt}</span></div><div class="row sm"><span>{en}</span><span>{q} × {p}</span></div></div>"#,
            fa = esc(&i.fa),
            en = esc(&i.en),
            lt = money(i.price * i.qty as f64),
            q = i.qty,
            p = money(i.price),
        ));
    }
    let discount = if o.discount > 0.0 {
        format!(
            r#"<div class="row"><span>Subtotal</span><span>{}</span></div><div class="row"><span>Discount</span><span>−{}</span></div>"#,
            money(o.subtotal),
            money(o.discount)
        )
    } else {
        String::new()
    };
    let note = if o.note.is_empty() { String::new() } else { format!(r#"<div class="sm note">Note: {}</div>"#, esc(&o.note)) };
    let void = if o.void { r#"<div class="void">VOID</div>"# } else { "" };
    let script = if autoprint { "<script>addEventListener('load',()=>setTimeout(()=>print(),300))</script>" } else { "" };
    format!(
        r##"<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Receipt #{no} · {name}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@800&family=Vazirmatn:wght@400;700&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
@page{{size:{w}mm auto;margin:0}}
body{{margin:0;background:#2a2520;color:#111;font-family:'JetBrains Mono','Courier New',monospace}}
.bar{{display:flex;gap:10px;justify-content:center;padding:16px}}
.bar button{{font:600 15px system-ui,sans-serif;padding:11px 22px;border-radius:10px;border:0;cursor:pointer;background:#F3A93C;color:#1a1207}}
.bar button.alt{{background:#3a332b;color:#f4eee4}}
.r{{width:{w}mm;margin:0 auto 32px;background:#fff;padding:5mm 3.5mm 7mm;box-sizing:border-box;font-size:{fs}px;line-height:1.45}}
.fa{{font-family:'Vazirmatn',Tahoma,sans-serif;direction:rtl}}
.h{{text-align:center}}.name{{font-family:'Bricolage Grotesque',Arial,sans-serif;font-weight:800;font-size:{ns}px;letter-spacing:.05em;text-transform:uppercase}}
.sm{{font-size:.86em}}.cut{{border-top:1px dashed #000;margin:7px 0}}
.row{{display:flex;justify-content:space-between;gap:8px}}.it{{padding:2px 0}}.it .fa{{font-weight:700}}
.tot{{font-size:1.35em;font-weight:700}}.void{{text-align:center;font-weight:700;letter-spacing:.3em;border:2px solid #000;margin:6px 0}}
.foot{{text-align:center;font-size:.9em}}.note{{margin-top:6px}}
@media print{{body{{background:#fff}}.bar{{display:none}}.r{{margin:0;width:auto}}}}
</style></head><body>
<div class="bar"><button onclick="print()">Print receipt</button><button class="alt" onclick="close()">Close</button></div>
<div class="r">
<div class="h"><div class="name">{name}</div><div class="fa">{fa} · {tag}</div><div class="sm">{phone} · {insta}</div></div>
<div class="cut"></div>
<div class="row"><b>Order #{no}</b><span>{table}</span></div>
<div class="row sm"><span>{date}</span><span>{time}</span></div>{void}
<div class="cut"></div>{items}
<div class="cut"></div>{discount}
<div class="row tot"><span>TOTAL</span><span>{total} {cur}</span></div>{note}
<div class="cut"></div><div class="foot">{footer}</div>
</div>{script}</body></html>"##,
        w = w,
        fs = if small { 11.0 } else { 12.5 },
        ns = if small { 17 } else { 20 },
        no = o.no,
        name = esc(&s.name),
        fa = esc(&s.fa),
        tag = esc(&s.tagline),
        phone = esc(&s.phone),
        insta = esc(&s.insta),
        table = esc(&o.table),
        date = clock::date_long(o.at, off),
        time = clock::time_hm(o.at, off),
        void = void,
        items = items,
        discount = discount,
        total = money(o.total),
        cur = esc(&s.currency),
        note = note,
        footer = esc(&s.footer),
        script = script,
    )
}

fn csv_field(s: &str) -> String {
    format!("\"{}\"", s.replace('"', "\"\""))
}

/// One row per order line; opens cleanly in Excel (UTF-8 BOM for Dari text).
pub fn orders_csv(orders: &[Order], s: &Settings) -> String {
    let mut out = String::from("\u{feff}order_no,date,time,table,status,item_en,item_fa,qty,unit_price,line_total,order_discount,order_total\n");
    for o in orders {
        for i in &o.items {
            out.push_str(&format!(
                "{},{},{},{},{},{},{},{},{},{},{},{}\n",
                o.no,
                o.day,
                clock::time_hm(o.at, s.utc_offset_min),
                csv_field(&o.table),
                if o.void { "void" } else { "paid" },
                csv_field(&i.en),
                csv_field(&i.fa),
                i.qty,
                i.price,
                i.price * i.qty as f64,
                o.discount,
                o.total
            ));
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn money_format() {
        assert_eq!(money(0.0), "0");
        assert_eq!(money(90.0), "90");
        assert_eq!(money(1240.0), "1,240");
        assert_eq!(money(1234567.0), "1,234,567");
    }

    #[test]
    fn escapes_html() {
        assert_eq!(esc("<b>\"x\"&'"), "&lt;b&gt;&quot;x&quot;&amp;&#39;");
    }
}
