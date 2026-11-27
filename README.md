# Senso Bar · سنسو بار

Offline point of sale and back office for Senso Bar, in **Dari and English**. It runs on a Windows computer as a normal program, and on Android phones and tablets as an installed app. It needs no internet and no server: everything is saved on the device.

## Try it

Open on any phone or computer, no install or sign-in needed:

| Link | |
|---|---|
| **[Example in Dari](https://puberty-ux.github.io/senso/?demo)** | The full app filled with made-up sales, customers, expenses and withdrawals from the last 75 days, so every screen has something to show. |
| **[Example in English](https://puberty-ux.github.io/senso/?demo&lang=en)** | The same example in English. |
| [Example reports](https://puberty-ux.github.io/senso/?demo&lang=en#reports) | Opens straight on the daily, monthly and yearly reports. |
| [The real app](https://puberty-ux.github.io/senso/) | Starts empty with the Senso Bar menu, for real use. |

Everything stays in the visitor's own browser. The example is kept separate from real data, and **Start the example over** resets it.

## Download

- **Windows:** open [Releases](../../releases/latest) and download
  - `Senso-Bar-Setup-….exe` to install it with a desktop shortcut (Windows 10/11, 64-bit or 32-bit), or
  - `Senso-Bar-Portable-….exe` to run it without installing.
- **Android:** download `Senso-Bar.apk` from the same page, open it, and allow installing from your browser or file manager when asked. Installing a newer APK over the old one keeps your data.
- **Android without the APK:** open the web address in Chrome (see *Phone app* below), tap ⋮ → **Install app**.

Every push to `main` builds new Windows and Android downloads automatically (GitHub Actions → *Build apps*).

## What it does

| Section | |
|---|---|
| **Sell** · فروش | Tap items to build an order. Dine in, takeaway or delivery; table; discount in ؋ or %; customer; cash, card, mobile money or credit (قرض); change calculator; hold an order and come back to it; print the receipt. |
| **Orders** · سفارش‌ها | Every order by day, search, reprint, void with a reason (stock goes back). |
| **Reports** · گزارش | Daily, monthly and yearly sales in the Solar Hijri or Gregorian calendar, compared with the period before. Sales by hour, day or month; best sellers; payment methods; categories; dine-in vs takeaway; expenses; ingredient cost; profit. Export CSV, print a summary. |
| **Money** · حساب | Expenses (مصارف) by category, withdrawals (برداشتی‌ها) by person, and closing the day: what should be in the cash drawer vs what you counted. |
| **Customers** · مشتریان | Regulars, what they owe on credit, payments received, loyalty points, full history. |
| **Menu** · منو | Dari and English names, prices, a drawing colour, and a recipe per item. Shows cost and margin when ingredient costs are set. |
| **Stock** · گدام | Ingredient amounts that sales draw down. Receive stock (optionally recorded as an expense), log waste, count. |
| **Buy** · خرید | What's running low, plus a shopping list to copy and send. |
| **Make** · تهیه | Check whether there's enough to make a batch, and the day's prep list. |
| **Backup** · پشتیبان | Save a backup now, automatic daily backups, the list of saved backups to restore or send, restore from a file, and Excel (CSV) exports: orders, items sold, daily totals, expenses, withdrawals, customers, stock, menu. |
| **Settings** · تنظیمات | Language, calendar, Persian or Western digits, light/dark, shop and receipt details, 58/80 mm paper, tax, loyalty, owner PIN, backup and restore. |

An **owner PIN** (optional) locks Reports, Money, Settings and voiding orders.

## Before using it in the shop

1. **Check the hot drinks and teas.** They came from a blurry photo of the handwritten board and are marked *Check* on the Menu.
2. **Count your stock** and set each amount; the starting amounts are examples.
3. **Set ingredient costs** on Stock so reports show real profit.
4. **Adjust recipes** to match how you make each item.

## Your data

Data lives only on the device where it was entered (Windows and each phone keep separate records). The Windows and Android apps save a backup every day and keep the last 30:

- Windows: `Documents › Senso Bar › Backups` (exports in `Documents › Senso Bar › Exports`)
- Android: `Documents › SensoBar › Backups` (exports in `Documents › SensoBar › Exports`)

On Android, **Send backup** shares the file to WhatsApp, Telegram, Google Drive or a computer. Restore any backup from the Backup screen.

Item photos come from the shop's printed menus (`app/img/items`). To change one, open the item on the Menu screen and choose a photo.

## Phone app

The *Publish phone app* workflow puts the app on GitHub Pages. Turn it on once: repository **Settings → Pages → Source: GitHub Actions**, then re-run the workflow. The address will be `https://<your-username>.github.io/senso/`.

## Development

```sh
npm install
npm test          # core rules: Hijri dates, orders, credit, stock, money, reports
npm start         # run the Windows app (Electron)
npm run dist      # build the .exe files into dist/
```

Or open `app/index.html` directly in Chrome or Edge.

| Path | What's in it |
|---|---|
| `app/js/core.js` | Dates (Solar Hijri and Gregorian), storage (IndexedDB), and the rules: checkout, voids, credit, stock, cash summary, reports |
| `app/js/app.js` | Screens and actions |
| `app/js/i18n.js` | Dari and English wording |
| `app/js/seed.js` | The starting menu and ingredients |
| `app/css/app.css` | Look and layout (right-to-left aware) |
| `app/js/files.js` | Saving backups and exports on Windows, Android and in the browser |
| `electron/` | Windows wrapper: printing, file saving, daily backups |
| `mobile/` | Android app (Capacitor): `build.sh` makes the APK; `senso-release.p12` signs it so updates install over each other |
| `.github/workflows/` | Builds the Windows `.exe` and the phone app |
