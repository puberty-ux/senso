//! The cafe's data model, its rules (orders take ingredients out of stock,
//! voids put them back), and saving to a JSON file.

use crate::clock;
use crate::json::Json;
use crate::seed;
use std::collections::BTreeMap;
use std::fs;
use std::io;
use std::path::PathBuf;

pub const UNITS: [&str; 7] = ["pcs", "kg", "g", "L", "ml", "bunch", "pack"];
const TEXT: usize = 200;

pub fn r3(n: f64) -> f64 {
    (n * 1000.0).round() / 1000.0
}

#[derive(Clone, Debug)]
pub struct Settings {
    pub name: String,
    pub fa: String,
    pub tagline: String,
    pub phone: String,
    pub insta: String,
    pub footer: String,
    pub paper: u32,
    pub currency: String,
    pub utc_offset_min: i64,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            name: "Senso Bar".into(),
            fa: "سنسو بار".into(),
            tagline: "حس خوب".into(),
            phone: "0794456022".into(),
            insta: "@senso_bar_".into(),
            footer: "Thank you for visiting · ممنون از شما".into(),
            paper: 80,
            currency: "؋".into(),
            utc_offset_min: 270,
        }
    }
}

impl Settings {
    pub fn to_json(&self) -> Json {
        jobj! {
            "name" => &self.name, "fa" => &self.fa, "tagline" => &self.tagline,
            "phone" => &self.phone, "insta" => &self.insta, "footer" => &self.footer,
            "paper" => self.paper, "currency" => &self.currency, "utc_offset_min" => self.utc_offset_min,
        }
    }

    /// Apply the fields present in `j`, keeping the rest.
    pub fn merged(&self, j: &Json) -> Settings {
        let mut s = self.clone();
        let take = |k: &str, dst: &mut String| {
            if j.has(k) {
                *dst = j.text(k, TEXT);
            }
        };
        take("name", &mut s.name);
        take("fa", &mut s.fa);
        take("tagline", &mut s.tagline);
        take("phone", &mut s.phone);
        take("insta", &mut s.insta);
        take("footer", &mut s.footer);
        take("currency", &mut s.currency);
        if s.name.is_empty() {
            s.name = "Senso Bar".into();
        }
        if s.currency.is_empty() {
            s.currency = "؋".into();
        }
        if let Some(p) = j.num("paper") {
            s.paper = if p < 70.0 { 58 } else { 80 };
        }
        if let Some(o) = j.num("utc_offset_min") {
            s.utc_offset_min = (o as i64).clamp(-720, 840);
        }
        s
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct RecipeLine {
    pub ing: String,
    pub qty: f64,
}

#[derive(Clone, Debug)]
pub struct MenuItem {
    pub id: String,
    pub fa: String,
    pub en: String,
    pub cat: String,
    pub ord: i64,
    pub price: f64,
    pub active: bool,
    pub verify: bool,
    pub color: String,
    pub recipe: Vec<RecipeLine>,
}

fn recipe_json(r: &[RecipeLine]) -> Json {
    Json::Arr(r.iter().map(|l| jobj! {"ing" => &l.ing, "qty" => l.qty}).collect())
}

fn recipe_from(j: &Json) -> Vec<RecipeLine> {
    j.get("recipe")
        .and_then(|v| v.as_arr())
        .map(|a| {
            a.iter()
                .filter_map(|l| {
                    let ing = l.text("ing", 80);
                    let qty = l.num("qty").unwrap_or(0.0);
                    (!ing.is_empty() && qty > 0.0).then(|| RecipeLine { ing, qty: r3(qty) })
                })
                .take(40)
                .collect()
        })
        .unwrap_or_default()
}

fn valid_color(s: &str) -> bool {
    s.len() == 7 && s.starts_with('#') && s[1..].chars().all(|c| c.is_ascii_hexdigit())
}

impl MenuItem {
    pub fn to_json(&self) -> Json {
        jobj! {
            "id" => &self.id, "fa" => &self.fa, "en" => &self.en, "cat" => &self.cat, "ord" => self.ord,
            "price" => self.price, "active" => self.active, "verify" => self.verify, "color" => &self.color,
            "recipe" => recipe_json(&self.recipe),
        }
    }

    /// Validate an item sent by the app (or read back from disk).
    pub fn from_json(id: &str, j: &Json) -> Result<MenuItem, String> {
        let fa = j.text("fa", TEXT);
        let en = j.text("en", TEXT);
        if fa.is_empty() && en.is_empty() {
            return Err("Give the item a name.".into());
        }
        let cat = j.text("cat", 60);
        if cat.is_empty() {
            return Err("Choose a category.".into());
        }
        let price = j.num("price").ok_or("Enter a price.")?;
        if !(0.0..=10_000_000.0).contains(&price) {
            return Err("The price must be zero or more.".into());
        }
        let color = j.text("color", 7);
        Ok(MenuItem {
            id: id.to_string(),
            fa,
            en,
            cat,
            ord: j.num("ord").unwrap_or(99.0) as i64,
            price: price.round(),
            active: j.flag("active", true),
            verify: j.flag("verify", false),
            color: if valid_color(&color) { color } else { "#C9A27E".into() },
            recipe: recipe_from(j),
        })
    }
}

#[derive(Clone, Debug)]
pub struct Ingredient {
    pub id: String,
    pub name: String,
    pub qty: f64,
    pub unit: String,
    pub min: f64,
    pub cost: Option<f64>,
    pub supplier: String,
}

impl Ingredient {
    pub fn to_json(&self) -> Json {
        jobj! {
            "id" => &self.id, "name" => &self.name, "qty" => self.qty, "unit" => &self.unit,
            "min" => self.min, "cost" => self.cost, "supplier" => &self.supplier,
        }
    }

    pub fn from_json(id: &str, j: &Json) -> Result<Ingredient, String> {
        let name = j.text("name", TEXT);
        if name.is_empty() {
            return Err("Give the ingredient a name.".into());
        }
        let unit = j.text("unit", 10);
        Ok(Ingredient {
            id: id.to_string(),
            name,
            qty: r3(j.num("qty").unwrap_or(0.0).max(0.0)),
            unit: if UNITS.contains(&unit.as_str()) { unit } else { "pcs".into() },
            min: r3(j.num("min").unwrap_or(0.0).max(0.0)),
            cost: j.num("cost").filter(|c| *c >= 0.0),
            supplier: j.text("supplier", TEXT),
        })
    }
}

#[derive(Clone, Debug)]
pub struct OrderLine {
    pub id: String,
    pub fa: String,
    pub en: String,
    pub price: f64,
    pub qty: u32,
}

#[derive(Clone, Debug)]
pub struct Order {
    pub id: String,
    pub no: u32,
    pub at: i64,
    pub day: String,
    pub items: Vec<OrderLine>,
    pub subtotal: f64,
    pub discount: f64,
    pub total: f64,
    pub table: String,
    pub note: String,
    pub usage: Vec<RecipeLine>,
    pub void: bool,
}

impl Order {
    pub fn to_json(&self) -> Json {
        jobj! {
            "id" => &self.id, "no" => self.no, "at" => self.at, "day" => &self.day,
            "items" => Json::Arr(self.items.iter().map(|i| jobj!{
                "id" => &i.id, "fa" => &i.fa, "en" => &i.en, "price" => i.price, "qty" => i.qty
            }).collect()),
            "subtotal" => self.subtotal, "discount" => self.discount, "total" => self.total,
            "table" => &self.table, "note" => &self.note, "usage" => recipe_json(&self.usage),
            "status" => if self.void { "void" } else { "paid" },
        }
    }

    fn from_disk(j: &Json) -> Option<Order> {
        let items = j
            .get("items")?
            .as_arr()?
            .iter()
            .map(|i| OrderLine {
                id: i.text("id", 80),
                fa: i.text("fa", TEXT),
                en: i.text("en", TEXT),
                price: i.num("price").unwrap_or(0.0),
                qty: i.num("qty").unwrap_or(1.0) as u32,
            })
            .collect();
        let usage = j
            .get("usage")
            .map(|u| recipe_from(&jobj! {"recipe" => u.clone()}))
            .unwrap_or_default();
        Some(Order {
            id: j.text("id", 80),
            no: j.num("no")? as u32,
            at: j.num("at")? as i64,
            day: j.text("day", 10),
            items,
            subtotal: j.num("subtotal").unwrap_or(0.0),
            discount: j.num("discount").unwrap_or(0.0),
            total: j.num("total").unwrap_or(0.0),
            table: j.text("table", TEXT),
            note: j.text("note", 500),
            usage,
            void: j.text("status", 10) == "void",
        })
    }
}

#[derive(Clone, Debug)]
pub struct ShopItem {
    pub id: String,
    pub text: String,
    pub qty: f64,
    pub unit: String,
    pub ing: Option<String>,
    pub done: bool,
    pub at: i64,
}

impl ShopItem {
    fn to_json(&self) -> Json {
        jobj! {"id" => &self.id, "text" => &self.text, "qty" => self.qty, "unit" => &self.unit,
               "ing" => self.ing.clone(), "done" => self.done, "at" => self.at}
    }
    fn from_disk(j: &Json) -> ShopItem {
        let ing = j.text("ing", 80);
        ShopItem {
            id: j.text("id", 80),
            text: j.text("text", TEXT),
            qty: j.num("qty").unwrap_or(0.0),
            unit: j.text("unit", 10),
            ing: (!ing.is_empty()).then_some(ing),
            done: j.flag("done", false),
            at: j.num("at").unwrap_or(0.0) as i64,
        }
    }
}

#[derive(Clone, Debug)]
pub struct PrepItem {
    pub id: String,
    pub text: String,
    pub done: bool,
    pub at: i64,
}

impl PrepItem {
    fn to_json(&self) -> Json {
        jobj! {"id" => &self.id, "text" => &self.text, "done" => self.done, "at" => self.at}
    }
}

pub struct Store {
    pub path: Option<PathBuf>,
    pub rev: u64,
    pub seq: u64,
    pub sample_stock: bool,
    pub settings: Settings,
    pub menu: Vec<MenuItem>,
    pub ingredients: Vec<Ingredient>,
    pub orders: Vec<Order>,
    pub shopping: Vec<ShopItem>,
    pub prep: Vec<PrepItem>,
}

fn arr<'a>(j: &'a Json, k: &str) -> &'a [Json] {
    j.get(k).and_then(|v| v.as_arr()).map(|v| v.as_slice()).unwrap_or(&[])
}

impl Store {
    /// A fresh store with the Senso Bar menu and starter stock.
    pub fn seeded() -> Store {
        Store {
            path: None,
            rev: 1,
            seq: 0,
            sample_stock: true,
            settings: Settings::default(),
            menu: seed::menu(),
            ingredients: seed::ingredients(),
            orders: Vec::new(),
            shopping: Vec::new(),
            prep: Vec::new(),
        }
    }

    pub fn load_or_seed(path: PathBuf) -> io::Result<Store> {
        if path.exists() {
            let text = fs::read_to_string(&path)?;
            let j = Json::parse(&text).map_err(|e| {
                io::Error::new(io::ErrorKind::InvalidData, format!("{}: {}", path.display(), e))
            })?;
            let mut s = Store::from_disk(&j);
            s.path = Some(path);
            Ok(s)
        } else {
            let mut s = Store::seeded();
            s.path = Some(path);
            s.save()?;
            Ok(s)
        }
    }

    fn from_disk(j: &Json) -> Store {
        Store {
            path: None,
            rev: j.num("rev").unwrap_or(1.0) as u64,
            seq: j.num("seq").unwrap_or(0.0) as u64,
            sample_stock: j.flag("sample_stock", false),
            settings: Settings::default().merged(j.get("settings").unwrap_or(&Json::Null)),
            menu: arr(j, "menu").iter().filter_map(|m| MenuItem::from_json(&m.text("id", 80), m).ok()).collect(),
            ingredients: arr(j, "ingredients")
                .iter()
                .filter_map(|i| Ingredient::from_json(&i.text("id", 80), i).ok())
                .collect(),
            orders: arr(j, "orders").iter().filter_map(Order::from_disk).collect(),
            shopping: arr(j, "shopping").iter().map(ShopItem::from_disk).collect(),
            prep: arr(j, "prep")
                .iter()
                .map(|p| PrepItem {
                    id: p.text("id", 80),
                    text: p.text("text", TEXT),
                    done: p.flag("done", false),
                    at: p.num("at").unwrap_or(0.0) as i64,
                })
                .collect(),
        }
    }

    fn to_disk(&self) -> Json {
        jobj! {
            "format" => "senso/1", "rev" => self.rev, "seq" => self.seq, "sample_stock" => self.sample_stock,
            "settings" => self.settings.to_json(),
            "menu" => Json::Arr(self.menu.iter().map(MenuItem::to_json).collect()),
            "ingredients" => Json::Arr(self.ingredients.iter().map(Ingredient::to_json).collect()),
            "orders" => Json::Arr(self.orders.iter().map(Order::to_json).collect()),
            "shopping" => Json::Arr(self.shopping.iter().map(ShopItem::to_json).collect()),
            "prep" => Json::Arr(self.prep.iter().map(PrepItem::to_json).collect()),
        }
    }

    /// Write atomically: a temp file next to the data file, then rename.
    pub fn save(&self) -> io::Result<()> {
        let Some(path) = &self.path else { return Ok(()) };
        if let Some(dir) = path.parent() {
            if !dir.as_os_str().is_empty() {
                fs::create_dir_all(dir)?;
            }
        }
        let tmp = path.with_extension("json.tmp");
        fs::write(&tmp, self.to_disk().to_string())?;
        fs::rename(&tmp, path)
    }

    pub fn new_id(&mut self, prefix: &str) -> String {
        self.seq += 1;
        format!("{}-{}", prefix, self.seq)
    }

    pub fn today(&self, now: i64) -> String {
        clock::day_key(now, self.settings.utc_offset_min)
    }

    /// Everything the app needs, with the last 31 days of orders.
    pub fn state_json(&self, now: i64) -> Json {
        let cutoff = clock::day_key(now - 31 * 86_400, self.settings.utc_offset_min);
        let mut days: Vec<&str> = self.orders.iter().map(|o| o.day.as_str()).collect();
        days.sort_unstable_by(|a, b| b.cmp(a));
        days.dedup();
        days.truncate(90);
        jobj! {
            "rev" => self.rev,
            "today" => self.today(now),
            "sample_stock" => self.sample_stock,
            "settings" => self.settings.to_json(),
            "menu" => Json::Arr(self.menu.iter().map(MenuItem::to_json).collect()),
            "ingredients" => Json::Arr(self.ingredients.iter().map(Ingredient::to_json).collect()),
            "orders" => Json::Arr(self.orders.iter().rev().filter(|o| o.day >= cutoff).map(Order::to_json).collect()),
            "days" => Json::Arr(days.into_iter().map(Json::from).collect()),
            "shopping" => Json::Arr(self.shopping.iter().map(ShopItem::to_json).collect()),
            "prep" => Json::Arr(self.prep.iter().map(PrepItem::to_json).collect()),
            "units" => Json::Arr(UNITS.iter().map(|u| Json::from(*u)).collect()),
        }
    }

    pub fn orders_on(&self, day: &str) -> Json {
        Json::Arr(self.orders.iter().rev().filter(|o| o.day == day).map(Order::to_json).collect())
    }

    fn ing_mut(&mut self, id: &str) -> Option<&mut Ingredient> {
        self.ingredients.iter_mut().find(|i| i.id == id)
    }

    fn apply_usage(&mut self, usage: &[RecipeLine], sign: f64) {
        for u in usage {
            if let Some(i) = self.ing_mut(&u.ing) {
                i.qty = r3((i.qty + sign * u.qty).max(0.0));
            }
        }
    }

    /// Ring up an order: price it from the menu, number it for the day,
    /// and take its recipe ingredients out of stock.
    pub fn create_order(&mut self, req: &Json, now: i64) -> Result<Order, String> {
        let wanted = req.get("items").and_then(|v| v.as_arr()).ok_or("The order has no items.")?;
        let mut lines: Vec<OrderLine> = Vec::new();
        let mut usage: BTreeMap<String, f64> = BTreeMap::new();
        for w in wanted.iter().take(200) {
            let id = w.text("id", 80);
            let qty = w.num("qty").unwrap_or(0.0).floor();
            if qty < 1.0 {
                continue;
            }
            let qty = qty.min(999.0) as u32;
            let m = self
                .menu
                .iter()
                .find(|m| m.id == id)
                .ok_or_else(|| "An item in this order is no longer on the menu.".to_string())?;
            for l in &m.recipe {
                *usage.entry(l.ing.clone()).or_default() += l.qty * qty as f64;
            }
            match lines.iter_mut().find(|l| l.id == id) {
                Some(l) => l.qty += qty,
                None => lines.push(OrderLine { id, fa: m.fa.clone(), en: m.en.clone(), price: m.price, qty }),
            }
        }
        if lines.is_empty() {
            return Err("The order has no items.".into());
        }
        let subtotal: f64 = lines.iter().map(|l| l.price * l.qty as f64).sum();
        let discount = req.num("discount").unwrap_or(0.0).round().clamp(0.0, subtotal);
        let day = self.today(now);
        let no = self.orders.iter().filter(|o| o.day == day).map(|o| o.no).max().unwrap_or(0) + 1;
        let usage: Vec<RecipeLine> = usage.into_iter().map(|(ing, qty)| RecipeLine { ing, qty: r3(qty) }).collect();
        let order = Order {
            id: self.new_id("o"),
            no,
            at: now,
            day,
            items: lines,
            subtotal,
            discount,
            total: subtotal - discount,
            table: req.text("table", 60),
            note: req.text("note", 300),
            usage: usage.clone(),
            void: false,
        };
        self.apply_usage(&usage, -1.0);
        self.orders.push(order.clone());
        Ok(order)
    }

    /// Void an order and put its ingredients back.
    pub fn void_order(&mut self, id: &str) -> Result<Order, String> {
        let o = self.orders.iter_mut().find(|o| o.id == id).ok_or("That order wasn't found.")?;
        if o.void {
            return Err("That order is already voided.".into());
        }
        o.void = true;
        let o = o.clone();
        self.apply_usage(&o.usage, 1.0);
        Ok(o)
    }

    pub fn put_menu(&mut self, id: &str, j: &Json) -> Result<(), String> {
        let m = MenuItem::from_json(id, j)?;
        match self.menu.iter_mut().find(|x| x.id == id) {
            Some(x) => *x = m,
            None => self.menu.push(m),
        }
        Ok(())
    }

    pub fn delete_menu(&mut self, id: &str) -> Result<(), String> {
        let n = self.menu.len();
        self.menu.retain(|m| m.id != id);
        if n == self.menu.len() { Err("That item wasn't found.".into()) } else { Ok(()) }
    }

    pub fn put_ingredient(&mut self, id: &str, j: &Json) -> Result<(), String> {
        let i = Ingredient::from_json(id, j)?;
        match self.ingredients.iter_mut().find(|x| x.id == id) {
            Some(x) => *x = i,
            None => self.ingredients.push(i),
        }
        Ok(())
    }

    pub fn delete_ingredient(&mut self, id: &str) -> Result<(), String> {
        let n = self.ingredients.len();
        self.ingredients.retain(|i| i.id != id);
        if n == self.ingredients.len() {
            return Err("That ingredient wasn't found.".into());
        }
        for m in &mut self.menu {
            m.recipe.retain(|l| l.ing != id);
        }
        Ok(())
    }

    pub fn adjust_ingredient(&mut self, id: &str, delta: f64) -> Result<(), String> {
        let i = self.ing_mut(id).ok_or("That ingredient wasn't found.")?;
        i.qty = r3((i.qty + delta).max(0.0));
        Ok(())
    }

    pub fn add_shopping(&mut self, j: &Json, now: i64) -> Result<(), String> {
        let text = j.text("text", TEXT);
        if text.is_empty() {
            return Err("Write what to buy.".into());
        }
        let ing = Some(j.text("ing", 80)).filter(|s| self.ingredients.iter().any(|i| &i.id == s));
        let qty = j.num("qty").unwrap_or(0.0).max(0.0);
        // Raise an existing open line for the same ingredient instead of duplicating it.
        if let Some(ing_id) = &ing {
            if let Some(s) = self.shopping.iter_mut().find(|s| !s.done && s.ing.as_ref() == Some(ing_id)) {
                s.qty = s.qty.max(qty);
                return Ok(());
            }
        }
        let unit = ing
            .as_ref()
            .and_then(|id| self.ingredients.iter().find(|i| &i.id == id))
            .map(|i| i.unit.clone())
            .unwrap_or_else(|| j.text("unit", 10));
        let id = self.new_id("s");
        self.shopping.push(ShopItem { id, text, qty: r3(qty), unit, ing, done: false, at: now });
        Ok(())
    }

    /// Tick or untick a shopping line. A linked ingredient goes into stock
    /// when ticked and back out when unticked.
    pub fn toggle_shopping(&mut self, id: &str) -> Result<(), String> {
        let s = self.shopping.iter_mut().find(|s| s.id == id).ok_or("That item wasn't found.")?;
        s.done = !s.done;
        let (ing, qty, done) = (s.ing.clone(), s.qty, s.done);
        if let Some(ing) = ing {
            if qty > 0.0 {
                let _ = self.adjust_ingredient(&ing, if done { qty } else { -qty });
            }
        }
        Ok(())
    }

    pub fn add_prep(&mut self, j: &Json, now: i64) -> Result<(), String> {
        let text = j.text("text", TEXT);
        if text.is_empty() {
            return Err("Write the prep job.".into());
        }
        let id = self.new_id("p");
        self.prep.push(PrepItem { id, text, done: false, at: now });
        Ok(())
    }

    pub fn toggle_prep(&mut self, id: &str) -> Result<(), String> {
        let p = self.prep.iter_mut().find(|p| p.id == id).ok_or("That job wasn't found.")?;
        p.done = !p.done;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn milk(s: &Store) -> f64 {
        s.ingredients.iter().find(|i| i.id == "i-milk").unwrap().qty
    }

    #[test]
    fn order_takes_stock_and_void_returns_it() {
        let mut s = Store::seeded();
        let before = milk(&s);
        let req = Json::parse(r#"{"items":[{"id":"m-shake-vanilla","qty":2},{"id":"m-mojito","qty":1}],"discount":10,"table":"T4"}"#).unwrap();
        let o = s.create_order(&req, 1_795_680_960).unwrap();
        assert_eq!(o.no, 1);
        assert_eq!(o.subtotal, 240.0);
        assert_eq!(o.total, 230.0);
        assert!((milk(&s) - (before - 0.3)).abs() < 1e-9);
        let o2 = s.create_order(&req, 1_795_681_000).unwrap();
        assert_eq!(o2.no, 2);
        s.void_order(&o.id).unwrap();
        assert!((milk(&s) - (before - 0.3)).abs() < 1e-9);
        assert!(s.void_order(&o.id).is_err());
    }

    #[test]
    fn rejects_empty_and_unknown_items() {
        let mut s = Store::seeded();
        assert!(s.create_order(&Json::parse(r#"{"items":[]}"#).unwrap(), 0).is_err());
        assert!(s.create_order(&Json::parse(r#"{"items":[{"id":"nope","qty":1}]}"#).unwrap(), 0).is_err());
    }

    #[test]
    fn shopping_tick_adds_to_stock() {
        let mut s = Store::seeded();
        let before = milk(&s);
        s.add_shopping(&Json::parse(r#"{"text":"Fresh milk","qty":5,"ing":"i-milk"}"#).unwrap(), 0).unwrap();
        let id = s.shopping[0].id.clone();
        s.toggle_shopping(&id).unwrap();
        assert!((milk(&s) - (before + 5.0)).abs() < 1e-9);
        s.toggle_shopping(&id).unwrap();
        assert!((milk(&s) - before).abs() < 1e-9);
    }

    #[test]
    fn saves_and_loads() {
        let dir = std::env::temp_dir().join(format!("senso-test-{}", std::process::id()));
        let path = dir.join("data.json");
        let _ = fs::remove_dir_all(&dir);
        let mut s = Store::load_or_seed(path.clone()).unwrap();
        s.create_order(&Json::parse(r#"{"items":[{"id":"m-crepe","qty":1}]}"#).unwrap(), 100).unwrap();
        s.save().unwrap();
        let t = Store::load_or_seed(path).unwrap();
        assert_eq!(t.orders.len(), 1);
        assert_eq!(t.menu.len(), s.menu.len());
        assert_eq!(t.orders[0].items[0].fa, "کرپ");
        let _ = fs::remove_dir_all(&dir);
    }
}
