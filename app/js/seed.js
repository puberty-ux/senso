/* Starting data: the Senso Bar menu as printed on the shop's menus.
   Hot drinks and teas come from a blurry photo of the handwritten board,
   so they are marked `verify`. Stock amounts and recipes are estimates. */
(function (root) {
  'use strict';
  const ING = [
    // id, English, Dari, qty, unit, reorder at
    ['milk', 'Fresh milk', 'شیر تازه', 12, 'L', 4], ['icecream', 'Vanilla ice cream', 'آیس‌کریم وانیلی', 6, 'kg', 2],
    ['banana', 'Bananas', 'کیله', 8, 'kg', 3], ['strawberry', 'Strawberries', 'توت فرنگی', 4, 'kg', 1.5],
    ['mango', 'Mango', 'انبه', 4, 'kg', 1.5], ['kiwi', 'Kiwi', 'کیوی', 3, 'kg', 1],
    ['blueberry', 'Berries (frozen)', 'بلوبری (یخ‌زده)', 2, 'kg', 1], ['oreo', 'Oreo biscuits', 'بیسکویت اوریو', 60, 'pcs', 20],
    ['creamcheese', 'Cream cheese', 'پنیر کریمی', 2, 'kg', 0.5], ['lotusbisc', 'Lotus biscuits', 'بیسکویت لوتوس', 50, 'pcs', 15],
    ['lotusspread', 'Lotus spread', 'کرم لوتوس', 1.5, 'kg', 0.5], ['chocsyrup', 'Chocolate syrup', 'شربت شکلات', 2, 'L', 0.5],
    ['nutella', 'Nutella', 'نوتلا', 3, 'kg', 1], ['honey', 'Honey', 'عسل', 2, 'kg', 0.5],
    ['lemon', 'Lemons', 'لیمو', 40, 'pcs', 15], ['lime', 'Limes', 'لیمو سبز', 30, 'pcs', 10],
    ['mint', 'Fresh mint', 'نعناع تازه', 6, 'bunch', 2], ['sugarsyrup', 'Sugar syrup', 'شربت قند', 3, 'L', 1],
    ['soda', 'Soda water', 'آب سودا', 12, 'L', 4], ['ice', 'Ice', 'یخ', 20, 'kg', 5],
    ['batter', 'Pancake & waffle mix', 'مواد پنکیک و وافل', 8, 'kg', 2], ['eggs', 'Eggs', 'تخم مرغ', 60, 'pcs', 20],
    ['crepemix', 'Crepe mix', 'مواد کرپ', 4, 'kg', 1], ['nuts', 'Almonds & walnuts', 'بادام و چارمغز', 2, 'kg', 0.5],
    ['dates', 'Dates', 'خرما', 2, 'kg', 0.5], ['coffee', 'Espresso beans', 'دانه قهوه', 2, 'kg', 0.5],
    ['cocoa', 'Cocoa powder', 'پودر کاکائو', 1.5, 'kg', 0.5], ['blacktea', 'Black tea', 'چای سیاه', 2, 'kg', 0.5],
    ['greentea', 'Green tea', 'چای سبز', 1, 'kg', 0.3], ['saffron', 'Saffron', 'زعفران', 10, 'g', 3],
    ['masala', 'Masala chai spice', 'ادویه چای ماسالا', 500, 'g', 150], ['cups', 'Takeaway cups', 'گیلاس یکبار مصرف', 200, 'pcs', 50],
    ['herbal', 'Herbal tea mix', 'دمنوش', 1, 'kg', 0.3],
  ];
  const R = (...p) => { const out = []; for (let i = 0; i < p.length; i += 2) out.push({ ing: 'i-' + p[i], qty: p[i + 1] }); return out; };
  const MENU = [
    // id, cat, Dari, English, price, colour, check?, recipe
    ['shake-vanilla', 'shakes', 'شیک وانیل (ساده)', 'Vanilla shake (plain)', 80, '#F1E3C0', 0, R('milk', .15, 'icecream', .15)],
    ['shake-oreo', 'shakes', 'شیک اورئو چیز', 'Oreo cheese shake', 120, '#A7A3A6', 0, R('milk', .15, 'icecream', .15, 'oreo', 4, 'creamcheese', .04)],
    ['shake-strawberry', 'shakes', 'شیک توت فرنگی', 'Strawberry shake', 100, '#F19CB4', 0, R('milk', .15, 'icecream', .15, 'strawberry', .12)],
    ['shake-lotus', 'shakes', 'شیک لوتوس', 'Lotus shake', 90, '#D89A5B', 0, R('milk', .15, 'icecream', .15, 'lotusbisc', 3, 'lotusspread', .03)],
    ['shake-chocbanana', 'shakes', 'شیک شکلات موز', 'Chocolate banana shake', 90, '#8A5636', 0, R('milk', .15, 'icecream', .15, 'banana', .12, 'chocsyrup', .03)],
    ['mojito', 'mocktails', 'موهیتو', 'Mojito', 80, '#A6D86B', 0, R('lime', 1, 'mint', .2, 'sugarsyrup', .03, 'soda', .25, 'ice', .2)],
    ['lemonade', 'mocktails', 'لیموناد', 'Lemonade', 90, '#F6D54A', 0, R('lemon', 2, 'sugarsyrup', .04, 'soda', .2, 'ice', .2)],
    ['banana-milk', 'energy', 'شیرموز', 'Banana milk', 80, '#F0DFA0', 0, R('milk', .25, 'banana', .15)],
    ['energy-bomb', 'energy', 'بمب انرژی سنسو', 'Senso energy bomb', 170, '#A47551', 0, R('milk', .25, 'banana', .12, 'nuts', .04, 'dates', .04, 'honey', .02, 'icecream', .08)],
    ['smoothie-strawberry', 'smoothies', 'اسموتی توت فرنگی', 'Strawberry smoothie', 90, '#E8526B', 0, R('strawberry', .18, 'ice', .15, 'sugarsyrup', .02)],
    ['smoothie-mango', 'smoothies', 'اسموتی انبه', 'Mango smoothie', 90, '#F5A623', 0, R('mango', .18, 'ice', .15, 'sugarsyrup', .02)],
    ['smoothie-kiwi', 'smoothies', 'اسموتی کیوی', 'Kiwi smoothie', 90, '#8BC34A', 0, R('kiwi', .18, 'ice', .15, 'sugarsyrup', .02)],
    ['smoothie-berry', 'smoothies', 'اسموتی بلوبری', 'Berry smoothie', 90, '#8E4A8F', 0, R('blueberry', .18, 'ice', .15, 'sugarsyrup', .02)],
    ['smoothie-banana', 'smoothies', 'اسموتی موز', 'Banana smoothie', 90, '#E9D49B', 0, R('banana', .18, 'milk', .1, 'ice', .1)],
    ['smoothie-mix', 'smoothies', 'اسموتی میکس', 'Mixed fruit smoothie', 90, '#EC7C5E', 0, R('ice', .15, 'sugarsyrup', .02)],
    ['pancake-senso', 'pancakes', 'پنکیک سنسو (میوه‌ای)', 'Senso fruit pancake', 140, '#E2463F', 0, R('batter', .15, 'eggs', 1, 'milk', .1, 'strawberry', .06, 'banana', .06, 'kiwi', .04, 'nutella', .03)],
    ['pancake-nutella', 'pancakes', 'پنکیک موز نوتلا', 'Banana Nutella pancake', 100, '#5A3420', 0, R('batter', .15, 'eggs', 1, 'milk', .1, 'banana', .08, 'nutella', .04)],
    ['pancake-honey', 'pancakes', 'پنکیک موز عسلی', 'Honey banana pancake', 100, '#E8A93A', 0, R('batter', .15, 'eggs', 1, 'milk', .1, 'banana', .08, 'honey', .03)],
    ['waffle-honey-nutella', 'waffles', 'وافل موز عسل نوتلا', 'Banana honey Nutella waffle', 120, '#6B3E22', 0, R('batter', .15, 'eggs', 1, 'milk', .08, 'banana', .08, 'honey', .02, 'nutella', .03)],
    ['waffle-senso', 'waffles', 'وافل ویژه سنسو (میوه‌ای)', 'Senso special fruit waffle', 150, '#E2463F', 0, R('batter', .15, 'eggs', 1, 'milk', .08, 'strawberry', .06, 'banana', .06, 'kiwi', .04, 'nutella', .03)],
    ['waffle-nutella', 'waffles', 'وافل موز نوتلا', 'Banana Nutella waffle', 100, '#5A3420', 0, R('batter', .15, 'eggs', 1, 'milk', .08, 'banana', .08, 'nutella', .04)],
    ['crepe', 'crepe', 'کرپ', 'Crepe', 130, '#5A3420', 0, R('crepemix', .12, 'eggs', 1, 'milk', .12, 'banana', .08, 'nutella', .04)],
    ['espresso-single', 'hot', 'اسپرسو سینگل', 'Single espresso', 60, '#5B3A26', 1, R('coffee', .009)],
    ['espresso-double', 'hot', 'اسپرسو دبل', 'Double espresso', 80, '#4A2E1D', 1, R('coffee', .018)],
    ['hot-chocolate', 'hot', 'هات چاکلت', 'Hot chocolate', 90, '#7A4429', 1, R('cocoa', .03, 'milk', .22)],
    ['masala-chai', 'hot', 'چای ماسالا', 'Masala chai', 80, '#C88A4E', 1, R('blacktea', .005, 'masala', 3, 'milk', .15)],
    ['saffron-tea', 'hot', 'چای زعفران', 'Saffron tea', 80, '#E59A1D', 1, R('blacktea', .005, 'saffron', .1)],
    ['herbal-1', 'tea', 'دمنوش (نام را بررسی کنید)', 'Herbal tea (check name)', 80, '#9DBE7A', 1, R('herbal', .006)],
    ['herbal-calm', 'tea', 'دمنوش آرامش', 'Calming herbal tea', 70, '#B9A3D6', 1, R('herbal', .006)],
    ['tea-3', 'tea', 'چای (نام را بررسی کنید)', 'Tea (check name)', 90, '#B5653A', 1, R('blacktea', .005)],
    ['green-tea', 'tea', 'چای سبز', 'Green tea', 40, '#A2C46E', 1, R('greentea', .004)],
    ['black-tea', 'tea', 'چای سیاه', 'Black tea', 40, '#A2482A', 1, R('blacktea', .005)],
  ];
  const PHOTOS = ['shake-vanilla', 'shake-oreo', 'shake-strawberry', 'shake-lotus', 'shake-chocbanana', 'mojito', 'lemonade', 'banana-milk', 'energy-bomb',
    'smoothie-strawberry', 'smoothie-mango', 'smoothie-kiwi', 'smoothie-berry', 'smoothie-banana', 'smoothie-mix',
    'pancake-senso', 'pancake-nutella', 'pancake-honey', 'waffle-honey-nutella', 'waffle-senso', 'waffle-nutella', 'crepe'];
  const photos = () => Object.fromEntries(PHOTOS.map(id => ['m-' + id, `img/items/${id}.webp`]));
  root.SensoSeed = {
    photos,
    ings: () => ING.map(([id, name, nameFa, qty, unit, min]) => ({ id: 'i-' + id, name, nameFa, qty, unit, min, cost: 0, supplier: '' })),
    menu: () => {
      const ordIn = {}, ph = photos();
      return MENU.map(([id, cat, fa, en, price, color, verify, recipe]) => ({
        id: 'm-' + id, cat, fa, en, price, color, verify: !!verify, active: true, cost: 0,
        recipe: recipe.map(l => ({ ...l })), ord: (ordIn[cat] = (ordIn[cat] || 0) + 1), photo: ph['m-' + id] || '',
      }));
    },
  };
  if (typeof module !== 'undefined') module.exports = root.SensoSeed;
})(typeof window !== 'undefined' ? window : globalThis);
