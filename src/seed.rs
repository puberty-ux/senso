//! Starting data: the Senso Bar menu as printed on the shop's menus.
//! Items from the handwritten hot-drinks board are marked `verify` because
//! the photo was hard to read. Stock counts and recipe amounts are estimates
//! for the shop to correct.

use crate::store::{Ingredient, MenuItem, RecipeLine};

fn r(pairs: &[(&str, f64)]) -> Vec<RecipeLine> {
    pairs.iter().map(|(i, q)| RecipeLine { ing: format!("i-{i}"), qty: *q }).collect()
}

pub fn menu() -> Vec<MenuItem> {
    #[rustfmt::skip]
    let rows: Vec<(&str, &str, i64, &str, &str, f64, &str, bool, Vec<RecipeLine>)> = vec![
        ("shake-vanilla", "shakes", 1, "شیک وانیل (ساده)", "Vanilla shake (plain)", 80.0, "#F1E3C0", false, r(&[("milk", 0.15), ("icecream", 0.15)])),
        ("shake-oreo", "shakes", 2, "شیک اورئو چیز", "Oreo cheese shake", 120.0, "#A7A3A6", false, r(&[("milk", 0.15), ("icecream", 0.15), ("oreo", 4.0), ("creamcheese", 0.04)])),
        ("shake-strawberry", "shakes", 3, "شیک توت فرنگی", "Strawberry shake", 100.0, "#F19CB4", false, r(&[("milk", 0.15), ("icecream", 0.15), ("strawberry", 0.12)])),
        ("shake-lotus", "shakes", 4, "شیک لوتوس", "Lotus shake", 90.0, "#D89A5B", false, r(&[("milk", 0.15), ("icecream", 0.15), ("lotusbisc", 3.0), ("lotusspread", 0.03)])),
        ("shake-chocbanana", "shakes", 5, "شیک شکلات موز", "Chocolate banana shake", 90.0, "#8A5636", false, r(&[("milk", 0.15), ("icecream", 0.15), ("banana", 0.12), ("chocsyrup", 0.03)])),
        ("mojito", "mocktails", 1, "موهیتو", "Mojito", 80.0, "#A6D86B", false, r(&[("lime", 1.0), ("mint", 0.2), ("sugarsyrup", 0.03), ("soda", 0.25), ("ice", 0.2)])),
        ("lemonade", "mocktails", 2, "لیموناد", "Lemonade", 90.0, "#F6D54A", false, r(&[("lemon", 2.0), ("sugarsyrup", 0.04), ("soda", 0.2), ("ice", 0.2)])),
        ("banana-milk", "energy", 1, "شیرموز", "Banana milk", 80.0, "#F0DFA0", false, r(&[("milk", 0.25), ("banana", 0.15)])),
        ("energy-bomb", "energy", 2, "بمب انرژی سنسو", "Senso energy bomb", 170.0, "#A47551", false, r(&[("milk", 0.25), ("banana", 0.12), ("nuts", 0.04), ("dates", 0.04), ("honey", 0.02), ("icecream", 0.08)])),
        ("smoothie-strawberry", "smoothies", 1, "اسموتی توت فرنگی", "Strawberry smoothie", 90.0, "#E8526B", false, r(&[("strawberry", 0.18), ("ice", 0.15), ("sugarsyrup", 0.02)])),
        ("smoothie-mango", "smoothies", 2, "اسموتی انبه", "Mango smoothie", 90.0, "#F5A623", false, r(&[("mango", 0.18), ("ice", 0.15), ("sugarsyrup", 0.02)])),
        ("smoothie-kiwi", "smoothies", 3, "اسموتی کیوی", "Kiwi smoothie", 90.0, "#8BC34A", false, r(&[("kiwi", 0.18), ("ice", 0.15), ("sugarsyrup", 0.02)])),
        ("smoothie-berry", "smoothies", 4, "اسموتی بلوبری", "Berry smoothie", 90.0, "#8E4A8F", false, r(&[("blueberry", 0.18), ("ice", 0.15), ("sugarsyrup", 0.02)])),
        ("smoothie-banana", "smoothies", 5, "اسموتی موز", "Banana smoothie", 90.0, "#E9D49B", false, r(&[("banana", 0.18), ("milk", 0.1), ("ice", 0.1)])),
        ("smoothie-mix", "smoothies", 6, "اسموتی میکس", "Mixed fruit smoothie", 90.0, "#EC7C5E", false, r(&[("ice", 0.15), ("sugarsyrup", 0.02)])),
        ("pancake-senso", "pancakes", 1, "پنکیک سنسو (میوه‌ای)", "Senso fruit pancake", 140.0, "#E2463F", false, r(&[("batter", 0.15), ("eggs", 1.0), ("milk", 0.1), ("strawberry", 0.06), ("banana", 0.06), ("kiwi", 0.04), ("nutella", 0.03)])),
        ("pancake-nutella", "pancakes", 2, "پنکیک موز نوتلا", "Banana Nutella pancake", 100.0, "#5A3420", false, r(&[("batter", 0.15), ("eggs", 1.0), ("milk", 0.1), ("banana", 0.08), ("nutella", 0.04)])),
        ("pancake-honey", "pancakes", 3, "پنکیک موز عسلی", "Honey banana pancake", 100.0, "#E8A93A", false, r(&[("batter", 0.15), ("eggs", 1.0), ("milk", 0.1), ("banana", 0.08), ("honey", 0.03)])),
        ("waffle-honey-nutella", "waffles", 1, "وافل موز عسل نوتلا", "Banana honey Nutella waffle", 120.0, "#6B3E22", false, r(&[("batter", 0.15), ("eggs", 1.0), ("milk", 0.08), ("banana", 0.08), ("honey", 0.02), ("nutella", 0.03)])),
        ("waffle-senso", "waffles", 2, "وافل ویژه سنسو (میوه‌ای)", "Senso special fruit waffle", 150.0, "#E2463F", false, r(&[("batter", 0.15), ("eggs", 1.0), ("milk", 0.08), ("strawberry", 0.06), ("banana", 0.06), ("kiwi", 0.04), ("nutella", 0.03)])),
        ("waffle-nutella", "waffles", 3, "وافل موز نوتلا", "Banana Nutella waffle", 100.0, "#5A3420", false, r(&[("batter", 0.15), ("eggs", 1.0), ("milk", 0.08), ("banana", 0.08), ("nutella", 0.04)])),
        ("crepe", "crepe", 1, "کرپ", "Crepe", 130.0, "#5A3420", false, r(&[("crepemix", 0.12), ("eggs", 1.0), ("milk", 0.12), ("banana", 0.08), ("nutella", 0.04)])),
        ("espresso-single", "hot", 1, "اسپرسو سینگل", "Single espresso", 60.0, "#5B3A26", true, r(&[("coffee", 0.009)])),
        ("espresso-double", "hot", 2, "اسپرسو دبل", "Double espresso", 80.0, "#4A2E1D", true, r(&[("coffee", 0.018)])),
        ("hot-chocolate", "hot", 3, "هات چاکلت", "Hot chocolate", 90.0, "#7A4429", true, r(&[("cocoa", 0.03), ("milk", 0.22)])),
        ("masala-chai", "hot", 4, "چای ماسالا", "Masala chai", 80.0, "#C88A4E", true, r(&[("blacktea", 0.005), ("masala", 3.0), ("milk", 0.15)])),
        ("saffron-tea", "hot", 5, "چای زعفران", "Saffron tea", 80.0, "#E59A1D", true, r(&[("blacktea", 0.005), ("saffron", 0.1)])),
        ("herbal-1", "tea", 1, "دمنوش (نام را بررسی کنید)", "Herbal tea (check name)", 80.0, "#9DBE7A", true, r(&[("herbal", 0.006)])),
        ("herbal-calm", "tea", 2, "دمنوش آرامش", "Calming herbal tea", 70.0, "#B9A3D6", true, r(&[("herbal", 0.006)])),
        ("tea-3", "tea", 3, "چای (نام را بررسی کنید)", "Tea (check name)", 90.0, "#B5653A", true, r(&[("blacktea", 0.005)])),
        ("green-tea", "tea", 4, "چای سبز", "Green tea", 40.0, "#A2C46E", true, r(&[("greentea", 0.004)])),
        ("black-tea", "tea", 5, "چای سیاه", "Black tea", 40.0, "#A2482A", true, r(&[("blacktea", 0.005)])),
    ];
    rows.into_iter()
        .map(|(id, cat, ord, fa, en, price, color, verify, recipe)| MenuItem {
            id: format!("m-{id}"),
            fa: fa.into(),
            en: en.into(),
            cat: cat.into(),
            ord,
            price,
            active: true,
            verify,
            color: color.into(),
            recipe,
        })
        .collect()
}

pub fn ingredients() -> Vec<Ingredient> {
    #[rustfmt::skip]
    let rows: [(&str, &str, f64, &str, f64); 33] = [
        ("milk", "Fresh milk", 12.0, "L", 4.0), ("icecream", "Vanilla ice cream", 6.0, "kg", 2.0),
        ("banana", "Bananas", 8.0, "kg", 3.0), ("strawberry", "Strawberries", 4.0, "kg", 1.5),
        ("mango", "Mango", 4.0, "kg", 1.5), ("kiwi", "Kiwi", 3.0, "kg", 1.0),
        ("blueberry", "Blueberries / berries (frozen)", 2.0, "kg", 1.0), ("oreo", "Oreo biscuits", 60.0, "pcs", 20.0),
        ("creamcheese", "Cream cheese", 2.0, "kg", 0.5), ("lotusbisc", "Lotus biscuits", 50.0, "pcs", 15.0),
        ("lotusspread", "Lotus spread", 1.5, "kg", 0.5), ("chocsyrup", "Chocolate syrup", 2.0, "L", 0.5),
        ("nutella", "Nutella", 3.0, "kg", 1.0), ("honey", "Honey", 2.0, "kg", 0.5),
        ("lemon", "Lemons", 40.0, "pcs", 15.0), ("lime", "Limes", 30.0, "pcs", 10.0),
        ("mint", "Fresh mint", 6.0, "bunch", 2.0), ("sugarsyrup", "Sugar syrup", 3.0, "L", 1.0),
        ("soda", "Soda water", 12.0, "L", 4.0), ("ice", "Ice", 20.0, "kg", 5.0),
        ("batter", "Pancake & waffle mix", 8.0, "kg", 2.0), ("eggs", "Eggs", 60.0, "pcs", 20.0),
        ("crepemix", "Crepe mix", 4.0, "kg", 1.0), ("nuts", "Almonds & walnuts", 2.0, "kg", 0.5),
        ("dates", "Dates", 2.0, "kg", 0.5), ("coffee", "Espresso beans", 2.0, "kg", 0.5),
        ("cocoa", "Cocoa / hot chocolate powder", 1.5, "kg", 0.5), ("blacktea", "Black tea leaves", 2.0, "kg", 0.5),
        ("greentea", "Green tea", 1.0, "kg", 0.3), ("saffron", "Saffron", 10.0, "g", 3.0),
        ("masala", "Masala chai spice", 500.0, "g", 150.0), ("cups", "Takeaway cups", 200.0, "pcs", 50.0),
        ("herbal", "Herbal tea mix", 1.0, "kg", 0.3),
    ];
    rows.iter()
        .map(|(id, name, qty, unit, min)| Ingredient {
            id: format!("i-{id}"),
            name: (*name).into(),
            qty: *qty,
            unit: (*unit).into(),
            min: *min,
            cost: None,
            supplier: String::new(),
        })
        .collect()
}
