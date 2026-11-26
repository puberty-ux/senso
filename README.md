# Senso Bar

Point-of-sale and back office for Senso Bar (سنسو بار), written in Rust.

- **Sell:** tap drinks and desserts to build an order, add a table, note or discount, and complete it. A receipt opens ready to print.
- **Orders:** each day's orders, money taken by hour, best sellers, reprint or void an order, export to CSV.
- **Menu:** names in Dari and English, prices, a colour for each item's drawing, and a recipe per item.
- **Stock:** every sale takes its recipe ingredients out of stock; voiding an order puts them back.
- **Buy:** what's running low, plus a shopping list. Ticking a stock item adds it to stock.
- **Make:** check whether you have enough to make a batch, and keep the day's prep list.

The app is one program with no outside libraries. It runs a small web server on the shop computer, and any phone or tablet on the same Wi-Fi can use it in a browser.

## Run it

Install Rust from <https://rustup.rs>, then:

```sh
cargo run --release
```

The program prints the addresses to open:

```
  Senso Bar is running
  On this computer:   http://localhost:8080
  On phones (Wi-Fi):  http://192.168.1.20:8080
```

Data is kept in `senso-data.json` next to where you start it. The first run fills in the full Senso Bar menu.

### Settings

| Variable     | Default            | What it does                                      |
|--------------|--------------------|---------------------------------------------------|
| `SENSO_ADDR` | `0.0.0.0:8080`     | Where to listen. Use `127.0.0.1:8080` to keep it on this computer only. |
| `SENSO_DATA` | `senso-data.json`  | The data file.                                    |

Shop name, phone, Instagram, receipt footer, paper width (58 or 80 mm), currency sign and time zone are set in the app under the settings button.

## Before using it in the shop

1. **Check the hot drinks and teas.** They came from a blurry photo of the handwritten board and are marked *Check* on the Menu tab.
2. **Count your stock.** The starting amounts are examples.
3. **Adjust recipes** to match how you make each item, so stock stays accurate.
4. **Back up** now and then: Settings → backup of all data, or copy `senso-data.json`.

There is no login. Anyone on the shop Wi-Fi who opens the address can use the app, so run it with `SENSO_ADDR=127.0.0.1:8080` if the Wi-Fi is shared with customers.

## Printing receipts

**Print receipt** opens a page sized for thermal receipt paper and starts printing. Choose the receipt printer in the print window and set margins to none. Most USB and network receipt printers work this way.

## Development

```sh
cargo test       # JSON, dates, orders, stock and storage tests
cargo build --release
```

| File              | What's in it                                    |
|-------------------|-------------------------------------------------|
| `src/main.rs`     | Start-up and the connection loop                |
| `src/api.rs`      | Routes and the JSON API                         |
| `src/store.rs`    | Data model, order and stock rules, saving       |
| `src/seed.rs`     | The starting menu and ingredients               |
| `src/receipt.rs`  | Printable receipts and CSV export               |
| `src/json.rs`     | JSON parser and writer                          |
| `src/http.rs`     | Minimal HTTP handling                           |
| `src/clock.rs`    | Dates and times in shop time                    |
| `ui/index.html`   | The whole interface, built into the program     |

### API

All changes return the full app state as `{"ok":true,"state":{...}}`; errors return `{"error":"..."}`.

| Method | Path | Body |
|---|---|---|
| GET | `/api/state` | |
| GET | `/api/orders?day=YYYY-MM-DD` | |
| POST | `/api/orders` | `{items:[{id,qty}], table, note, discount}` |
| POST | `/api/orders/{id}/void` | |
| POST, PUT, DELETE | `/api/menu`, `/api/menu/{id}` | `{fa, en, cat, price, color, active, verify, recipe:[{ing,qty}]}` |
| POST, PUT, DELETE | `/api/ingredients`, `/api/ingredients/{id}` | `{name, qty, unit, min, cost, supplier}` |
| POST | `/api/ingredients/{id}/adjust` | `{delta}` |
| POST | `/api/shopping`, `/api/shopping/{id}/toggle`, `/api/shopping/clear` | `{text, qty, ing}` |
| POST | `/api/prep`, `/api/prep/{id}/toggle`, `/api/prep/clear` | `{text}` |
| PUT | `/api/settings` | any settings fields |
| GET | `/receipt/{id}` | add `?print=1` to print on open |
| GET | `/export/orders.csv`, `/export/backup.json` | |
