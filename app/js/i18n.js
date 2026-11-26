/* English and Dari wording. Keys are grouped by screen. */
(function (root) {
  'use strict';
  const S = {
    // navigation
    nav_sell: ['Sell', 'فروش'], nav_orders: ['Orders', 'سفارش‌ها'], nav_reports: ['Reports', 'گزارش'],
    nav_money: ['Money', 'حساب'], nav_customers: ['Customers', 'مشتریان'], nav_menu: ['Menu', 'منو'],
    nav_stock: ['Stock', 'گدام'], nav_buy: ['Buy', 'خرید'], nav_make: ['Make', 'تهیه'], nav_settings: ['Settings', 'تنظیمات'],
    nav_more: ['More', 'بیشتر'],
    // common
    save: ['Save', 'ذخیره'], cancel: ['Cancel', 'لغو'], close: ['Close', 'بستن'], delete: ['Delete', 'حذف'], add: ['Add', 'افزودن'],
    edit: ['Edit', 'ویرایش'], search: ['Search', 'جستجو'], confirm_again: ['Press again to confirm', 'برای تایید دوباره بزنید'],
    today: ['Today', 'امروز'], yesterday: ['Yesterday', 'دیروز'], all: ['All', 'همه'], note: ['Note', 'یادداشت'], amount: ['Amount', 'مقدار پول'],
    date: ['Date', 'تاریخ'], name: ['Name', 'نام'], phone: ['Phone', 'شماره تماس'], optional: ['Optional', 'اختیاری'],
    saved: ['Saved', 'ذخیره شد'], deleted: ['Deleted', 'حذف شد'], copied: ['Copied', 'کاپی شد'], none_yet: ['Nothing yet', 'هنوز چیزی نیست'],
    items_n: ['{n} item|{n} items', '{n} قلم'], orders_n: ['{n} order|{n} orders', '{n} سفارش'], each: ['each', 'هر دانه'],
    // sell
    find_item: ['Find an item', 'جستجوی جنس'], everything: ['Everything', 'همه'], new_order: ['New order', 'سفارش جدید'],
    no_items: ['No items yet', 'هنوز چیزی انتخاب نشده'], tap_to_start: ['Tap a drink or dessert to start an order.', 'برای شروع سفارش روی یک نوشیدنی یا دسر بزنید.'],
    dine: ['Dine in', 'داخل کافه'], take: ['Takeaway', 'بیرون‌بر'], delivery: ['Delivery', 'تحویل به خانه'],
    table: ['Table or name', 'میز یا نام'], discount: ['Discount', 'تخفیف'], customer: ['Customer', 'مشتری'], no_customer: ['No customer', 'بدون مشتری'],
    pick_customer: ['Choose customer', 'انتخاب مشتری'], points_use: ['Use points', 'استفاده از امتیاز'], has_points: ['{n} points', '{n} امتیاز'],
    subtotal: ['Subtotal', 'جمع'], tax: ['Tax', 'مالیات'], total: ['Total', 'مجموع'], points_disc: ['Points', 'امتیاز'],
    pay_by: ['Payment', 'نوع پرداخت'], credit: ['Credit (pay later)', 'قرض (بعداً پرداخت)'], credit_short: ['Credit', 'قرض'],
    received: ['Cash received', 'پول دریافتی'], change: ['Change', 'باقی پول'], complete: ['Complete order', 'تکمیل سفارش'],
    hold: ['Hold', 'نگه‌داشتن'], held_orders: ['Held orders', 'سفارش‌های نگه‌داشته'], resume: ['Resume', 'ادامه'],
    clear_order: ['Clear order', 'پاک کردن سفارش'], review_order: ['Review order', 'دیدن سفارش'], order_held: ['Order held', 'سفارش نگه داشته شد'],
    today_so_far: ['Today so far', 'تا حالا امروز'], out: ['Out', 'تمام'], left: ['{n} left', '{n} باقی'], check: ['Check', 'بررسی'],
    nothing_matches: ['Nothing matches', 'چیزی پیدا نشد'], err_credit_needs_customer: ['Choose a customer to sell on credit.', 'برای فروش قرضی، مشتری را انتخاب کنید.'],
    err_empty: ['Add at least one item.', 'حداقل یک جنس اضافه کنید.'], err_item_gone: ['An item in this order is no longer on the menu.', 'یکی از جنس‌ها دیگر در منو نیست.'],
    order_done: ['Order {n} done', 'سفارش {n} تکمیل شد'], next_order: ['Next order', 'سفارش بعدی'],
    print_receipt: ['Print receipt', 'چاپ رسید'], copy_text: ['Copy as text', 'کاپی متن'],
    // orders
    orders_title: ['Orders', 'سفارش‌ها'], no_orders_day: ['No orders on this day', 'در این روز سفارشی نیست'],
    no_orders_hint: ['Orders you complete on the Sell screen show up here.', 'سفارش‌هایی که در بخش فروش تکمیل می‌کنید اینجا نمایش داده می‌شوند.'],
    void_order: ['Void order', 'باطل کردن سفارش'], void_reason: ['Why is it voided?', 'دلیل باطل کردن؟'], voided: ['Voided', 'باطل شد'],
    order_voided: ['Order voided. Stock went back.', 'سفارش باطل شد. مواد دوباره به گدام برگشت.'], find_order: ['Find order number, table or item', 'جستجوی شماره سفارش، میز یا جنس'],
    // reports
    reports_title: ['Sales reports', 'گزارش فروش'], r_day: ['Day', 'روز'], r_month: ['Month', 'ماه'], r_year: ['Year', 'سال'],
    net_sales: ['Sales', 'فروش'], orders: ['Orders', 'سفارش‌ها'], avg_order: ['Average order', 'اوسط سفارش'], items_sold: ['Items sold', 'جنس فروخته شده'],
    profit: ['Profit', 'مفاد'], expenses: ['Expenses', 'مصارف'], withdrawals: ['Withdrawals', 'برداشتی‌ها'], cogs: ['Ingredient cost', 'قیمت مواد'],
    discounts: ['Discounts', 'تخفیف‌ها'], voids: ['Voided', 'باطل‌شده'], waste: ['Waste', 'ضایعات'], gross_sales: ['Sales before discounts', 'فروش قبل از تخفیف'],
    credit_sales: ['Sold on credit', 'فروش قرضی'], credit_collected: ['Credit collected', 'قرض وصول‌شده'],
    vs_prev: ['vs previous', 'نسبت به قبلی'], sales_by_hour: ['Sales by hour', 'فروش به اساس ساعت'], sales_by_day: ['Sales by day', 'فروش روزانه'],
    sales_by_month: ['Sales by month', 'فروش ماهانه'], best_sellers: ['Best sellers', 'پرفروش‌ترین‌ها'], by_payment: ['By payment', 'به اساس پرداخت'],
    by_category: ['By category', 'به اساس دسته'], by_service: ['Dine in or takeaway', 'داخل یا بیرون‌بر'], money_summary: ['Money', 'حساب پول'],
    profit_hint: ['Profit = sales − ingredient cost − expenses − waste. Withdrawals are not expenses.', 'مفاد = فروش − قیمت مواد − مصارف − ضایعات. برداشتی‌ها مصرف حساب نمی‌شوند.'],
    cost_hint: ['Set ingredient costs on the Stock screen to see real profit.', 'برای دیدن مفاد واقعی، قیمت مواد را در بخش گدام وارد کنید.'],
    export_csv: ['Export CSV', 'خروجی CSV'], print_report: ['Print report', 'چاپ گزارش'], sold: ['sold', 'فروخته'],
    // money
    money_title: ['Money', 'حساب و کتاب'], tab_expenses: ['Expenses', 'مصارف'], tab_withdrawals: ['Withdrawals', 'برداشتی‌ها'], tab_close: ['Close the day', 'بستن روز'],
    add_expense: ['Add expense', 'ثبت مصرف'], add_withdrawal: ['Add withdrawal', 'ثبت برداشت'], category: ['Category', 'دسته'],
    paid_from: ['Paid from', 'پرداخت از'], from_cash: ['Cash drawer', 'دخل (نقد)'], from_bank: ['Bank / other', 'بانک / دیگر'],
    person: ['Who took it', 'چه کسی برداشت'], reason: ['Reason', 'دلیل'], this_month: ['This month', 'این ماه'],
    withdraw_hint: ['Money taken out of the drawer by the owner, partners or staff (advances). Not counted as an expense.', 'پولی که مالک، شریک یا کارمندان (پیش‌پرداخت) از دخل برداشته‌اند. مصرف حساب نمی‌شود.'],
    opening_cash: ['Cash at start of day', 'پول دخل در شروع روز'], cash_sales: ['Cash sales', 'فروش نقدی'], cash_in: ['Credit paid in cash', 'قرض وصول نقدی'],
    cash_exp: ['Cash expenses', 'مصارف نقدی'], expected: ['Should be in the drawer', 'باید در دخل باشد'], counted: ['Counted in the drawer', 'شمارش دخل'],
    difference: ['Difference', 'تفاوت'], close_day_btn: ['Close the day', 'بستن روز'], day_closed: ['Day closed', 'روز بسته شد'],
    closes_history: ['Past closings', 'روزهای بسته‌شده'], over: ['over', 'اضافه'], short: ['short', 'کم'], exact: ['exact', 'درست'],
    no_expenses: ['No expenses recorded', 'هیچ مصرفی ثبت نشده'], no_withdrawals: ['No withdrawals recorded', 'هیچ برداشتی ثبت نشده'],
    // customers
    customers_title: ['Customers', 'مشتریان'], add_customer: ['Add customer', 'مشتری جدید'], owes: ['Owes', 'قرضدار'], points: ['Points', 'امتیاز'],
    owed_total: ['Total owed to you', 'مجموع قرض مشتریان'], receive_payment: ['Receive payment', 'دریافت پول'], payment_saved: ['Payment saved', 'پرداخت ثبت شد'],
    no_customers: ['No customers yet', 'هنوز مشتری ثبت نشده'], no_customers_hint: ['Add regulars to track what they owe and give loyalty points.', 'مشتریان دایمی را اضافه کنید تا قرض و امتیازشان را ببینید.'],
    history: ['History', 'تاریخچه'], visits: ['Visits', 'مراجعه'], owing_only: ['Owing money', 'قرضدارها'], credit_limit_note: ['Credit purchases and payments', 'خریدهای قرضی و پرداخت‌ها'],
    paid_amount: ['Paid', 'پرداخت'],
    // menu
    menu_title: ['Menu and recipes', 'منو و دستور تهیه'], add_item: ['Add item', 'جنس جدید'], price: ['Price', 'قیمت'], cost: ['Cost', 'قیمت تمام شد'],
    margin: ['Margin', 'مفاد'], recipe: ['Recipe for one', 'دستور برای یک دانه'], no_recipe: ['No recipe', 'بدون دستور'],
    enough_for: ['enough for {n}', 'کافی برای {n}'], cant_make: ["Can't make now", 'فعلاً ممکن نیست'], hidden: ['Hidden', 'پنهان'],
    name_fa: ['Name in Dari', 'نام به دری'], name_en: ['Name in English', 'نام به انگلیسی'], show_on_sell: ['Show on the Sell screen', 'نمایش در صفحه فروش'],
    mark_check: ['Mark “Check” (name or price unsure)', 'علامت «بررسی» (نام یا قیمت مطمئن نیست)'], colour: ['Colour of the drawing', 'رنگ تصویر'],
    add_ingredient: ['Add ingredient', 'افزودن ماده'], new_category: ['New category', 'دسته جدید'], manual_cost: ['Cost (leave 0 to use recipe)', 'قیمت تمام شد (۰ = از دستور)'],
    check_banner: ['{n} items came from the handwritten hot drinks board, which was hard to read. Open each one marked Check and correct it.', '{n} جنس از تخته دست‌نویس نوشیدنی‌های گرم گرفته شده که خوانا نبود. هر کدام که علامت «بررسی» دارد را باز و درست کنید.'],
    // stock
    stock_title: ['Stock', 'گدام'], in_stock: ['In stock', 'موجودی'], reorder_at: ['Reorder at', 'سفارش دوباره در'], unit: ['Unit', 'واحد'],
    cost_per: ['Cost per {u}', 'قیمت هر {u}'], supplier: ['Supplier', 'فروشنده'], ok: ['Fine', 'خوب'], low: ['Low', 'کم'],
    low_or_out: ['Low or out', 'کم یا تمام'], receive: ['Received', 'دریافت شد'], waste_btn: ['Waste', 'ضایع'], count_btn: ['Count', 'شمارش'],
    sample_stock: ['These amounts are examples. Count your shelves and set each one.', 'این مقدارها نمونه هستند. موجودی خود را بشمارید و هر کدام را درست کنید.'],
    counted_all: ["I've counted everything", 'همه را شمردم'], record_expense: ['Also record as an expense', 'به عنوان مصرف هم ثبت شود'],
    stock_moves: ['Stock moves', 'حرکت گدام'], move_receive: ['Received', 'دریافت'], move_waste: ['Waste', 'ضایع'], move_count: ['Count', 'شمارش'],
    how_much: ['How much?', 'چقدر؟'], stock_value: ['Stock worth {v}', 'ارزش گدام {v}'], used_in: ['Used in', 'استفاده در'],
    // buy / make
    buy_title: ['Buy', 'خرید'], running_low: ['Running low', 'رو به تمام شدن'], shopping_list: ['Shopping list', 'لیست خرید'],
    to_list: ['To list', 'به لیست'], copy_list: ['Copy list', 'کاپی لیست'], clear_bought: ['Clear bought', 'پاک کردن خریده‌شده‌ها'],
    all_good: ['Everything is above its reorder level.', 'همه چیز بالاتر از حد سفارش است.'], list_empty: ['The list is empty', 'لیست خالی است'],
    make_title: ['Make', 'تهیه'], can_we_make: ['Can we make it?', 'آیا می‌توانیم بسازیم؟'], needs: ['Needs', 'لازم'], short_by: ['Short by', 'کمبود'],
    add_missing: ['Add {n} missing to shopping list', '{n} کمبود را به لیست خرید اضافه کن'], enough_all: ['You have enough of everything', 'از همه چیز کافی دارید'],
    prep_list: ['Prep list', 'لیست آماده‌سازی'], clear_done: ['Clear done', 'پاک کردن انجام‌شده‌ها'], choose_item: ['Choose an item', 'انتخاب جنس'],
    how_many: ['How many', 'چند دانه'],
    // settings
    settings_title: ['Settings', 'تنظیمات'], language: ['Language', 'زبان'], calendar: ['Calendar', 'تقویم'], hijri: ['Solar Hijri (Afghan)', 'هجری شمسی'],
    gregorian: ['Gregorian', 'میلادی'], digits: ['Numbers', 'اعداد'], digits_fa: ['Persian ۱۲۳', 'فارسی ۱۲۳'], digits_en: ['Western 123', 'انگلیسی 123'],
    theme: ['Look', 'ظاهر'], theme_auto: ['Match device', 'مطابق دستگاه'], theme_dark: ['Dark', 'تاریک'], theme_light: ['Light', 'روشن'],
    shop_info: ['Shop and receipt', 'معلومات کافه و رسید'], shop_name: ['Shop name', 'نام کافه'], tagline: ['Tagline', 'شعار'], address: ['Address', 'آدرس'],
    receipt_footer: ['Receipt footer', 'پایین رسید'], paper: ['Receipt paper', 'کاغذ رسید'], silent_print: ['Print straight to the printer (no dialog)', 'چاپ مستقیم بدون پنجره'],
    tax_rate: ['Tax %', 'فیصدی مالیات'], loyalty: ['Loyalty points', 'امتیاز مشتری'], points_per_100: ['Points per 100 spent', 'امتیاز برای هر ۱۰۰'],
    point_value: ['One point is worth', 'ارزش هر امتیاز'], owner_pin: ['Owner PIN', 'رمز مالک'],
    pin_hint: ['Locks Reports, Money, Settings and voiding orders. Leave empty for no lock.', 'گزارش، حساب، تنظیمات و باطل کردن سفارش را قفل می‌کند. خالی بگذارید تا قفل نباشد.'],
    data: ['Your data', 'معلومات شما'], backup: ['Save a backup', 'ذخیره پشتیبان'], restore: ['Restore from backup', 'بازگرداندن از پشتیبان'],
    backup_hint: ['Everything is stored on this device only. Backups, restoring and Excel exports are on the Backup screen.', 'همه معلومات فقط روی این دستگاه است. پشتیبان، بازگرداندن و خروجی اکسل در بخش پشتیبان است.'],
    auto_backup: ['The Windows app also saves a backup every day in Documents › Senso Bar Backups.', 'برنامه ویندوز هر روز یک پشتیبان در Documents › Senso Bar Backups ذخیره می‌کند.'],
    restore_warn: ['This replaces everything on this device with the backup.', 'این کار همه معلومات این دستگاه را با پشتیبان عوض می‌کند.'],
    restored: ['Backup restored', 'پشتیبان بازگردانده شد'], not_backup: ["That file isn't a Senso backup.", 'این فایل پشتیبان سنسو نیست.'],
    currency: ['Currency sign', 'نشان پول'], pay_methods: ['Payment methods', 'روش‌های پرداخت'], reset_all: ['Erase all data', 'پاک کردن همه معلومات'],
    erase_warn: ['Deletes every order, customer and record on this device and starts again with the menu.', 'همه سفارش‌ها، مشتریان و ثبت‌ها را از این دستگاه پاک کرده و از نو با منو شروع می‌کند.'],
    enter_pin: ['Enter the owner PIN', 'رمز مالک را وارد کنید'], wrong_pin: ['Wrong PIN', 'رمز اشتباه است'], unlock: ['Unlock', 'باز کردن'],
    lock_now: ['Lock', 'قفل'], storage_fail: ["This device can't save data here. Open the app from the Windows program or the installed app.", 'این دستگاه نمی‌تواند معلومات را ذخیره کند. برنامه را از نسخه ویندوز یا برنامه نصب‌شده باز کنید.'],
    install_app: ['Install app', 'نصب برنامه'], about: ['About', 'درباره'],
    nav_backup: ['Backup', 'پشتیبان'], good_morning: ['Good morning', 'صبح بخیر'], good_afternoon: ['Good afternoon', 'روز بخیر'],
    good_evening: ['Good evening', 'عصر بخیر'], good_night: ['Good night', 'شب بخیر'], popular: ['Popular', 'پرطرفدار'], exact_amt: ['Exact', 'پول دقیق'],
    saved_to: ['Saved to {w}', 'ذخیره شد در {w}'], save_failed: ["Couldn't save.", 'ذخیره نشد.'],
    backup_title: ['Backup and export', 'پشتیبان و خروجی'], backup_safe: ['Your data is stored on this device', 'معلومات شما روی همین دستگاه ذخیره است'],
    last_backup: ['Last backup', 'آخرین پشتیبان'], never: ['Never', 'هرگز'], saved_in: ['Files are saved in', 'فایل‌ها ذخیره می‌شوند در'],
    backup_now: ['Save backup now', 'همین حالا پشتیبان بگیر'], share_backup: ['Send backup', 'ارسال پشتیبان'], open_folder: ['Open folder', 'باز کردن پوشه'],
    auto_daily: ['Back up automatically every day', 'هر روز خودکار پشتیبان بگیر'], saved_backups: ['Saved backups', 'پشتیبان‌های ذخیره‌شده'],
    restore_this: ['Restore', 'بازگرداندن'], share: ['Share', 'ارسال'], no_backups: ['No backups saved yet', 'هنوز پشتیبانی ذخیره نشده'],
    exports: ['Export for Excel (CSV)', 'خروجی برای اکسل (CSV)'], exports_hint: ['Open these files in Excel or Google Sheets.', 'این فایل‌ها را در اکسل یا گوگل شیت باز کنید.'],
    exp_orders_all: ['All orders', 'همه سفارش‌ها'], exp_orders_month: ['Orders this month', 'سفارش‌های این ماه'], exp_items: ['Items sold this month', 'اجناس فروخته‌شده این ماه'],
    exp_daily: ['Daily totals this year', 'جمع روزانه امسال'], exp_expenses: ['Expenses', 'مصارف'], exp_withdrawals: ['Withdrawals', 'برداشتی‌ها'],
    exp_customers: ['Customers and credit', 'مشتریان و قرض'], exp_stock: ['Stock', 'گدام'], exp_menu: ['Menu and prices', 'منو و قیمت‌ها'],
    web_backup_hint: ['In the browser, backups go to your Downloads folder. Keep a copy on a flash drive.', 'در مرورگر، پشتیبان به پوشه Downloads می‌رود. یک کاپی روی فلش نگه دارید.'],
    android_share_hint: ['Send a copy to WhatsApp, Telegram, Google Drive or your computer.', 'یک کاپی به واتس‌اپ، تلگرام، گوگل درایو یا کمپیوتر بفرستید.'],
    data_counts: ['{o} orders · {c} customers · {m} menu items', '{o} سفارش · {c} مشتری · {m} جنس'],
    choose_photo: ['Choose photo', 'انتخاب عکس'], remove_photo: ['Remove photo', 'حذف عکس'],
  };
  const I = { lang: 'fa', digits: 'fa' };
  I.t = (k, vars) => {
    const e = S[k]; let s = e ? e[I.lang === 'fa' ? 1 : 0] : k;
    if (s.includes('|')) s = s.split('|')[vars && vars.c === 1 ? 0 : 1];
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.split(`{${a}}`).join(b);
    return s;
  };
  I.pick = o => (o ? (I.lang === 'fa' ? (o.fa || o.en || o.name) : (o.en || o.fa || o.name)) : '');
  let nf = null, nf2 = null;
  I.setup = (lang, digits) => {
    I.lang = lang; I.digits = digits;
    const loc = digits === 'fa' ? 'fa-AF' : 'en-US';
    nf = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });
    nf2 = new Intl.NumberFormat(loc, { maximumFractionDigits: 2 });
  };
  I.n = v => nf.format(Math.round(+v || 0));
  I.q = v => nf2.format(Math.round((+v || 0) * 100) / 100);
  I.d = s => (I.digits === 'fa' ? String(s).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(s));
  I.setup('fa', 'fa');
  root.SensoI18n = I;
})(window);
