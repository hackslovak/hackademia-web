import React, { useEffect, useState } from 'react';
import HelpModal from './HelpModal';
import { supabase } from './supabase';
import { Reorder } from 'framer-motion';
import AdminPanel from './AdminPanel';

// --- ЗВУКОВИЙ ДВИЖОК ---
let audioCtx = null;
function playUiSound(type, isEnabled) {
  if (!isEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    
    if (type === 'ding') {
      // Райські дзвіночки (Арфа)
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const delay = i * 0.06;
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.2);
        osc.start(now + delay);
        osc.stop(now + delay + 1.2);
      });
    } else if (type === 'buzz') {
      // М'який глухий "буп" для помилки
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'whoosh') {
      // Легкий вітерець для перегортання
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle'; 
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (e) { console.error(e); }
}

// --- ПАЛІТРА ДЛЯ КАРТОК (Генератор унікальних кольорів) ---
function getCardStyle(index, isDark, isBack = false) {
  const gradientsLight = [
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    'linear-gradient(135deg, #cd9cf2 0%, #f6f3ff 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  ];
  
  const gradientsDark = [
    'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
    'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    'linear-gradient(135deg, #114357 0%, #f29492 100%)',
    'linear-gradient(135deg, #4b1248 0%, #f0c27b 100%)',
    'linear-gradient(135deg, #0f2027 0%, #203a43 100%)',
    'linear-gradient(135deg, #3a1c71 0%, #d76d77 100%)',
    'linear-gradient(135deg, #232526 0%, #414345 100%)',
    'linear-gradient(135deg, #141e30 0%, #243b55 100%)'
  ];

  const palette = isDark ? gradientsDark : gradientsLight;
  // Зворотна сторона використовує колір зі зсувом, щоб візуально відрізнятися
  const colorIndex = (index + (isBack ? 3 : 0)) % palette.length; 
  
  return {
    background: palette[colorIndex],
    color: isDark ? '#ffffff' : '#1a202c',
    border: 'none',
    boxShadow: isDark ? '0 4px 15px rgba(0,0,0,0.4)' : '0 4px 15px rgba(0,0,0,0.1)'
  };
}

// --- ЛОГІКА МІНІ-ГРИ "ДІАКРИТИЧНИЙ СНАЙПЕР" ---
 // --- БАЗОВИЙ СПИСОК ТОП-100 СЛІВ З ДІАКРИТИКОЮ ТА СВОЇ СЛОВА ДЛЯ СНАЙПЕРА ---
  // --- РОЗШИРЕНА БАЗА СЛІВ ДЛЯ СНАЙПЕРА (80+ слів) ---
  const defaultSniperWords = [
    { id: 's1', content: 'Людина', correct_answer: 'človek' },
    { id: 's2', content: 'Дякую', correct_answer: 'ďakujem' },
    { id: 's3', content: 'Жити', correct_answer: 'žiť' },
    { id: 's4', content: 'Можу', correct_answer: 'môžem' },
    { id: 's5', content: 'Щастя', correct_answer: 'šťastie' },
    { id: 's6', content: 'Важкий', correct_answer: 'ťažký' },
    { id: 's7', content: 'Всюди', correct_answer: 'všade' },
    { id: 's8', content: 'Чотири', correct_answer: 'štyri' },
    { id: 's9', content: 'Читати', correct_answer: 'čítať' },
    { id: 's10', content: 'Вчитися', correct_answer: 'učiť sa' },
    { id: 's11', content: 'Більше', correct_answer: 'viac' },
    { id: 's12', content: 'Менше', correct_answer: 'menej' },
    { id: 's13', content: 'Часто', correct_answer: 'často' },
    { id: 's14', content: 'Вчора', correct_answer: 'včera' },
    { id: 's15', content: 'Школа', correct_answer: 'škola' },
    { id: 's16', content: 'Щось', correct_answer: 'niečo' },
    { id: 's17', content: 'Все', correct_answer: 'všetko' },
    { id: 's18', content: 'Завжди', correct_answer: 'vždy' },
    { id: 's19', content: 'Пташка', correct_answer: 'vtáčik' },
    { id: 's20', content: 'Чашка', correct_answer: 'šálka' },
    { id: 's21', content: 'Ложка', correct_answer: 'lyžica' },
    { id: 's22', content: 'Ніж', correct_answer: 'nôž' },
    { id: 's23', content: 'Стіл', correct_answer: 'stôl' },
    { id: 's24', content: 'Кінь', correct_answer: 'kôň' },
    { id: 's25', content: 'Дощ', correct_answer: 'dážď' },
    { id: 's26', content: 'Кішка', correct_answer: 'mačka' },
    { id: 's27', content: 'Миша', correct_answer: 'myš' },
    { id: 's28', content: 'Жаба', correct_answer: 'žaba' },
    { id: 's29', content: 'Пляшка', correct_answer: 'fľaša' },
    { id: 's30', content: 'Ключ', correct_answer: 'kľúč' },
    { id: 's31', content: 'Кулак', correct_answer: 'päsť' },
    { id: 's32', content: 'П\'ять', correct_answer: 'päť' },
    { id: 's33', content: 'М\'ясо', correct_answer: 'mäso' },
    { id: 's34', content: 'Пам\'ять', correct_answer: 'pamäť' },
    { id: 's35', content: 'Кора', correct_answer: 'kôra' },
    { id: 's36', content: 'Біль', correct_answer: 'bolesť' },
    { id: 's37', content: 'Ліжко', correct_answer: 'posteľ' },
    { id: 's38', content: 'Сорочка', correct_answer: 'košeľa' },
    { id: 's39', content: 'Склянка', correct_answer: 'pohár' },
    { id: 's40', content: 'Довжина', correct_answer: 'dĺžka' },
    { id: 's41', content: 'Ширина', correct_answer: 'šírka' },
    { id: 's42', content: 'Висота', correct_answer: 'výška' },
    { id: 's43', content: 'Глибина', correct_answer: 'hĺbka' },
    { id: 's44', content: 'Черешня', correct_answer: 'čerešňa' },
    { id: 's45', content: 'Вишня', correct_answer: 'višňa' },
    { id: 's46', content: 'Верба', correct_answer: 'vŕba' },
    { id: 's47', content: 'Годувати', correct_answer: 'kŕmiť' },
    { id: 's48', content: 'Колючка', correct_answer: 'tŕň' },
    { id: 's49', content: 'Стовп', correct_answer: 'stĺp' },
    { id: 's50', content: 'Жовтий', correct_answer: 'žltý' },
    { id: 's51', content: 'Чорний', correct_answer: 'čierny' },
    { id: 's52', content: 'Важливий', correct_answer: 'dôležitý' },
    { id: 's53', content: 'Особливий', correct_answer: 'zvláštny' },
    { id: 's54', content: 'Більший', correct_answer: 'väčší' },
    { id: 's55', content: 'Менший', correct_answer: 'menší' },
    { id: 's56', content: 'Надія', correct_answer: 'nádej' },
    { id: 's57', content: 'Кохання', correct_answer: 'láska' },
    { id: 's58', content: 'Радість', correct_answer: 'radosť' },
    { id: 's59', content: 'Смуток', correct_answer: 'smútok' },
    { id: 's60', content: 'Ворог', correct_answer: 'nepriateľ' },
    { id: 's61', content: 'Початок', correct_answer: 'začiatok' },
    { id: 's62', content: 'М\'який', correct_answer: 'mäkký' },
    { id: 's63', content: 'Чистий', correct_answer: 'čistý' },
    { id: 's64', content: 'Шукати', correct_answer: 'hľadať' },
    { id: 's65', content: 'Питати', correct_answer: 'pýtať sa' },
    { id: 's66', content: 'Площа', correct_answer: 'námestie' },
    { id: 's67', content: 'Кав\'ярня', correct_answer: 'kaviareň' },
    { id: 's68', content: 'Пошта', correct_answer: 'pošta' },
    { id: 's69', content: 'Пекарня', correct_answer: 'pekáreň' },
    { id: 's70', content: 'Тиждень', correct_answer: 'týždeň' },
    { id: 's71', content: 'Місяць', correct_answer: 'mesiac' }
  ];
  
  const falseFriendsDatabase = [
  { 
    id: "ff_1", 
    slovak_phrase: "Kúpil som si čerstvý chlieb.", 
    trap_word: "čerstvý", 
    option_correct: "свіжий", 
    option_wrong: "черствий", 
    explanation: "Словацькою «čerstvý» означає «свіжий»[cite: 5].",
    full_translation: "Я купив собі свіжий хліб."
  },
  { 
    id: "ff_2", 
    slovak_phrase: "Na stole leží sladké ovocie.", 
    trap_word: "ovocie", 
    option_correct: "фрукти", 
    option_wrong: "овочі", 
    explanation: "Словацькою «ovocie» означає «фрукти»[cite: 5].",
    full_translation: "На столі лежать солодкі фрукти."
  },
  { 
    id: "ff_3", 
    slovak_phrase: "Idem do lekárne kúpiť lieky.", 
    trap_word: "lekáreň", 
    option_correct: "аптека", 
    option_wrong: "лікарня", 
    explanation: "«Lekáreň» — це аптека. Лікарня словацькою буде «nemocnica»[cite: 5].",
    full_translation: "Йду в аптеку купити ліки."
  },
  { 
    id: "ff_4", 
    slovak_phrase: "Náš zákazník bol veľmi spokojný.", 
    trap_word: "spokojný", 
    option_correct: "задоволений", 
    option_wrong: "спокійний", 
    explanation: "«Spokojný» означає «задоволений». Спокійний буде «pokojný»[cite: 5].",
    full_translation: "Наш клієнт був дуже задоволений."
  },
  { 
    id: "ff_5", 
    slovak_phrase: "To bol úžasný film!", 
    trap_word: "úžasný", 
    option_correct: "прекрасний", 
    option_wrong: "жахливий", 
    explanation: "«Úžasný» перекладається як «прекрасний» або «чудовий»[cite: 5].",
    full_translation: "Це був чудовий фільм!"
  },
  { 
    id: "ff_6", 
    slovak_phrase: "Z kuchyne ide úžasná vôňa.", 
    trap_word: "vôňa", 
    option_correct: "аромат", 
    option_wrong: "сморід", 
    explanation: "«Vôňa» означає приємний «аромат»[cite: 5].",
    full_translation: "З кухні йде прекрасний аромат."
  },
  { 
    id: "ff_7", 
    slovak_phrase: "V pivnici bol hrozný zápach.", 
    trap_word: "zápach", 
    option_correct: "сморід", 
    option_wrong: "запах (приємний)", 
    explanation: "«Zápach» — це дурний запах або «сморід»[cite: 5].",
    full_translation: "У підвалі був жахливий сморід."
  },
  { 
    id: "ff_8", 
    slovak_phrase: "Doma je ticho a pohoda.", 
    trap_word: "pohoda", 
    option_correct: "затишок", 
    option_wrong: "погода", 
    explanation: "«Pohoda» означає «затишок» або «душевний спокій». Погода буде «počasie»[cite: 5].",
    full_translation: "Вдома тихо і затишно."
  },
  { 
    id: "ff_9", 
    slovak_phrase: "V zime musíme veľa kúriť.", 
    trap_word: "kúriť", 
    option_correct: "топити", 
    option_wrong: "курити", 
    explanation: "«Kúriť» означає «топити» або «обігрівати». Курити буде «fajčiť»[cite: 5].",
    full_translation: "Взимку ми мусимо багато топити (обігрівати)."
  },
  { 
    id: "ff_10", 
    slovak_phrase: "Buď chytrý a bež tam!", 
    trap_word: "chytrý", 
    option_correct: "швидкий", 
    option_wrong: "хитрий", 
    explanation: "«Chytrý» означає «швидкий» або «розумний»[cite: 5].",
    full_translation: "Будь швидким і біжи туди!"
  },
  { 
    id: "ff_11", 
    slovak_phrase: "Lietadlo má veľký trup.", 
    trap_word: "trup", 
    option_correct: "тулуб/корпус", 
    option_wrong: "труп", 
    explanation: "«Trup» — це «тулуб» або «корпус» (наприклад, літака)[cite: 5].",
    full_translation: "Літак має великий фюзеляж (корпус)."
  },
  { 
    id: "ff_12", 
    slovak_phrase: "Banka mi dala vysoký úrok.", 
    trap_word: "úrok", 
    option_correct: "відсоток", 
    option_wrong: "урок", 
    explanation: "«Úrok» — це банківський «відсоток». Урок буде «hodina» або «lekcia»[cite: 5].",
    full_translation: "Банк дав мені високий відсоток."
  },
  { 
    id: "ff_13", 
    slovak_phrase: "Polícia chytila vraha.", 
    trap_word: "vrah", 
    option_correct: "вбивця", 
    option_wrong: "ворог", 
    explanation: "«Vrah» означає «вбивця». Ворог буде «nepriateľ»[cite: 5].",
    full_translation: "Поліція спіймала вбивцю."
  },
  { 
    id: "ff_14", 
    slovak_phrase: "Toto je môj najlepší život.", 
    trap_word: "život", 
    option_correct: "життя", 
    option_wrong: "живіт", 
    explanation: "«Život» — це «життя». Живіт словацькою буде «brucho»[cite: 5].",
    full_translation: "Це моє найкраще життя."
  },
  { 
    id: "ff_15", 
    slovak_phrase: "Každé ráno pijem kávu.", 
    trap_word: "ráno", 
    option_correct: "ранок", 
    option_wrong: "рано", 
    explanation: "«Ráno» перекладається як «ранок» або «вранці»[cite: 5].",
    full_translation: "Щоранку я п'ю каву."
  },
  { 
    id: "ff_16", 
    slovak_phrase: "Pacient mal tvrdú stolicu.", 
    trap_word: "stolica", 
    option_correct: "стілець (медичний)", 
    option_wrong: "столиця", 
    explanation: "«Stolica» в цьому контексті — це медичний «стілець». Столиця буде «hlavné mesto»[cite: 5].",
    full_translation: "У пацієнта був твердий стілець (кал)."
  },
  { 
    id: "ff_17", 
    slovak_phrase: "Som skoro hotový.", 
    trap_word: "skoro", 
    option_correct: "майже", 
    option_wrong: "швидко", 
    explanation: "«Skoro» означає «майже»[cite: 5].",
    full_translation: "Я майже готовий."
  },
  { 
    id: "ff_18", 
    slovak_phrase: "Musím umyť riad.", 
    trap_word: "riad", 
    option_correct: "посуд", 
    option_wrong: "ряд", 
    explanation: "«Riad» — це «посуд»[cite: 5].",
    full_translation: "Я мушу помити посуд."
  },
  { 
    id: "ff_19", 
    slovak_phrase: "To je môj nový frajer.", 
    trap_word: "frajer", 
    option_correct: "коханий", 
    option_wrong: "випендрювач", 
    explanation: "«Frajer» словацькою — це «коханий» або «кавалер»[cite: 5].",
    full_translation: "Це мій новий хлопець (коханий)."
  },
  { 
    id: "ff_20", 
    slovak_phrase: "Pobozkal ju na líce.", 
    trap_word: "líce", 
    option_correct: "щока", 
    option_wrong: "лице", 
    explanation: "«Líce» означає «щока». Обличчя буде «tvár»[cite: 5].",
    full_translation: "Він поцілував її в щоку."
  },
  { 
    id: "ff_21", 
    slovak_phrase: "V lese sme si postavili stan.", 
    trap_word: "stan", 
    option_correct: "намет", 
    option_wrong: "стан", 
    explanation: "«Stan» — це «намет». Стан словацькою буде «stav»[cite: 5].",
    full_translation: "У лісі ми поставили намет."
  },
  { 
    id: "ff_22", 
    slovak_phrase: "Dostal som pokutu za rýchlosť.", 
    trap_word: "pokuta", 
    option_correct: "штраф", 
    option_wrong: "покута", 
    explanation: "«Pokuta» — це «штраф»[cite: 5].",
    full_translation: "Я отримав штраф за швидкість."
  },
  { 
    id: "ff_23", 
    slovak_phrase: "Tento rok bol veľmi úrodný.", 
    trap_word: "úrodný", 
    option_correct: "урожайний", 
    option_wrong: "уродливий", 
    explanation: "«Úrodný» означає «урожайний»[cite: 5].",
    full_translation: "Цей рік був дуже врожайним."
  },
  { 
    id: "ff_24", 
    slovak_phrase: "Dnes večer pozerám zápas.", 
    trap_word: "zápas", 
    option_correct: "матч", 
    option_wrong: "запас", 
    explanation: "«Zápas» — це «матч» або «змагання». Запас буде «zásoba»[cite: 5].",
    full_translation: "Сьогодні ввечері я дивлюся матч."
  },
  { 
    id: "ff_25", 
    slovak_phrase: "Náš zákazník je náš pán.", 
    trap_word: "zákazník", 
    option_correct: "покупець", 
    option_wrong: "заказник", 
    explanation: "«Zákazník» означає «покупець» або «клієнт»[cite: 5].",
    full_translation: "Наш клієнт – наш пан."
  },
  { 
    id: "ff_26", 
    slovak_phrase: "Včera sme boli na pohrebe.", 
    trap_word: "pohreb", 
    option_correct: "похорон", 
    option_wrong: "погріб", 
    explanation: "«Pohreb» — це «похорон». Погріб словацькою буде «pivnica»[cite: 5].",
    full_translation: "Вчора ми були на похороні."
  },
  { 
    id: "ff_27", 
    slovak_phrase: "Napísal ponosu na riaditeľa.", 
    trap_word: "ponosa", 
    option_correct: "скарга", 
    option_wrong: "понос", 
    explanation: "«Ponosa» означає «скарга»[cite: 5].",
    full_translation: "Він написав скаргу на директора."
  },
  { 
    id: "ff_28", 
    slovak_phrase: "Poprava sa konala na námestí.", 
    trap_word: "poprava", 
    option_correct: "страта", 
    option_wrong: "поправа", 
    explanation: "«Poprava» перекладається як смертна «страта»[cite: 5].",
    full_translation: "Страта відбулася на площі."
  },
  { 
    id: "ff_29", 
    slovak_phrase: "Má dobré vedomosti z histórie.", 
    trap_word: "vedomosť", 
    option_correct: "знання", 
    option_wrong: "відомість", 
    explanation: "«Vedomosť» означає «знання»[cite: 5].",
    full_translation: "Він має хороші знання з історії."
  },
  { 
    id: "ff_30", 
    slovak_phrase: "Pracuje vo výskumnom ústave.", 
    trap_word: "ústav", 
    option_correct: "інститут/установа", 
    option_wrong: "устав", 
    explanation: "«Ústav» — це наукова «установа» або «інститут»[cite: 5].",
    full_translation: "Він працює в дослідному інституті."
  },
  { 
    id: "ff_31", 
    slovak_phrase: "V tej krajine je veľká bieda.", 
    trap_word: "bieda", 
    option_correct: "бідність", 
    option_wrong: "біда (горе)", 
    explanation: "«Bieda» означає «бідність»[cite: 5].",
    full_translation: "У тій країні велика бідність."
  },
  { 
    id: "ff_32", 
    slovak_phrase: "Konečne sme sa dohádali.", 
    trap_word: "dohádať sa", 
    option_correct: "закінчити суперечку", 
    option_wrong: "догадатися", 
    explanation: "«Dohádať sa» означає «закінчити суперечку». Догадатися буде «domyslieť si»[cite: 5].",
    full_translation: "Нарешті ми закінчили суперечку."
  },
  { 
    id: "ff_33", 
    slovak_phrase: "Bolí ho slepé črevo.", 
    trap_word: "črevo", 
    option_correct: "кишка", 
    option_wrong: "черево", 
    explanation: "«Črevo» — це «кишка»[cite: 5].",
    full_translation: "У нього болить сліпа кишка (апендикс)."
  },
  { 
    id: "ff_34", 
    slovak_phrase: "Porazil svojho soka.", 
    trap_word: "sok", 
    option_correct: "суперник", 
    option_wrong: "сік", 
    explanation: "«Sok» означає «суперник». Сік словацькою буде «džús» або «šťava»[cite: 5].",
    full_translation: "Він переміг свого суперника."
  },
  { 
    id: "ff_35", 
    slovak_phrase: "Tento stroj je veľmi drahý.", 
    trap_word: "stroj", 
    option_correct: "машина", 
    option_wrong: "стрій", 
    explanation: "«Stroj» — це «машина» або «механізм»[cite: 5].",
    full_translation: "Ця машина (механізм) дуже дорога."
  },
  { 
    id: "ff_36", 
    slovak_phrase: "Kúpil som sladké jahody.", 
    trap_word: "jahoda", 
    option_correct: "полуниця", 
    option_wrong: "ягода (будь-яка)", 
    explanation: "«Jahoda» означає саме «полуниця» або «суниця»[cite: 5].",
    full_translation: "Я купив солодку полуницю."
  },
  { 
    id: "ff_37", 
    slovak_phrase: "Dnes mám naozaj smolu.", 
    trap_word: "smola", 
    option_correct: "невезіння", 
    option_wrong: "смола", 
    explanation: "«Smola» в цьому контексті означає «невезіння»[cite: 5].",
    full_translation: "Сьогодні мені справді не щастить."
  },
  { 
    id: "ff_38", 
    slovak_phrase: "Do kávy si dávam smotanu.", 
    trap_word: "smotana", 
    option_correct: "вершки", 
    option_wrong: "сметана", 
    explanation: "«Smotana» (sladká) — це «вершки». Кисла сметана буде «kyslá smotana»[cite: 5].",
    full_translation: "У каву я додаю вершки."
  },
  { 
    id: "ff_39", 
    slovak_phrase: "Idem si vložiť peniaze do banky.", 
    trap_word: "banka", 
    option_correct: "банк", 
    option_wrong: "банка (скляна)", 
    explanation: "«Banka» — це фінансова установа («банк»). Скляна банка буде «pohár»[cite: 4].",
    full_translation: "Йду покласти гроші в банк."
  },
  { 
    id: "ff_40", 
    slovak_phrase: "Kúpil som dcére novú bábku.", 
    trap_word: "bábka", 
    option_correct: "лялька", 
    option_wrong: "бабка", 
    explanation: "«Bábka» означає «лялька» або «маріонетка»[cite: 4].",
    full_translation: "Я купив доньці нову ляльку."
  },
  { 
    id: "ff_41", 
    slovak_phrase: "Zasadil som kvetinu do črepu.", 
    trap_word: "črep", 
    option_correct: "горщик", 
    option_wrong: "череп", 
    explanation: "«Črep» — це квітковий «горщик» або «уламок»[cite: 4].",
    full_translation: "Я посадив квітку в горщик."
  },
  { 
    id: "ff_42", 
    slovak_phrase: "Lekár mi predpísal dennú dávku.", 
    trap_word: "dávka", 
    option_correct: "порція/доза", 
    option_wrong: "давка (натовп)", 
    explanation: "«Dávka» означає «порція» або «доза»[cite: 4].",
    full_translation: "Лікар приписав мені денну дозу."
  },
  { 
    id: "ff_43", 
    slovak_phrase: "Na stole leží veľmi sladké hrozno.", 
    trap_word: "hrozno", 
    option_correct: "виноград", 
    option_wrong: "грізно", 
    explanation: "«Hrozno» перекладається як «виноград»[cite: 4].",
    full_translation: "На столі лежить дуже солодкий виноград."
  },
  { 
    id: "ff_44", 
    slovak_phrase: "Čakám na teba na chodbe.", 
    trap_word: "chodba", 
    option_correct: "коридор", 
    option_wrong: "ходьба", 
    explanation: "«Chodba» — це «коридор»[cite: 4].",
    full_translation: "Я чекаю на тебе в коридорі."
  },
  { 
    id: "ff_45", 
    slovak_phrase: "Hľadám za neho dobrú náhradu.", 
    trap_word: "náhrada", 
    option_correct: "заміна", 
    option_wrong: "нагорода", 
    explanation: "«Náhrada» означає «заміна» або «відшкодування». Нагорода буде «odmena»[cite: 4].",
    full_translation: "Шукаю йому хорошу заміну."
  },
  { 
    id: "ff_46", 
    slovak_phrase: "Hudobník ladí svoj nástroj.", 
    trap_word: "nástroj", 
    option_correct: "інструмент", 
    option_wrong: "настрій", 
    explanation: "«Nástroj» — це «інструмент». Настрій словацькою буде «nálada»[cite: 4].",
    full_translation: "Музикант налаштовує свій інструмент."
  },
  { 
    id: "ff_47", 
    slovak_phrase: "Idem nakupovať do obchodu.", 
    trap_word: "obchod", 
    option_correct: "магазин", 
    option_wrong: "обхід", 
    explanation: "«Obchod» означає «магазин» або «торгівля»[cite: 4].",
    full_translation: "Йду робити покупки в магазин."
  },
  { 
    id: "ff_48", 
    slovak_phrase: "Nechal som ti na stole odkaz.", 
    trap_word: "odkaz", 
    option_correct: "повідомлення", 
    option_wrong: "відмова", 
    explanation: "«Odkaz» — це «повідомлення» або «посилання»[cite: 4].",
    full_translation: "Я залишив тобі на столі повідомлення."
  },
  { 
    id: "ff_49", 
    slovak_phrase: "Za svoju prácu dostal veľkú odmenu.", 
    trap_word: "odmena", 
    option_correct: "нагорода", 
    option_wrong: "відміна", 
    explanation: "«Odmena» означає «нагорода»[cite: 4].",
    full_translation: "За свою роботу він отримав велику нагороду."
  },
  { 
    id: "ff_50", 
    slovak_phrase: "Udrel do stola päsťou.", 
    trap_word: "päsť", 
    option_correct: "кулак", 
    option_wrong: "паща", 
    explanation: "«Päsť» — це «кулак»[cite: 4].",
    full_translation: "Він вдарив кулаком по столу."
  },
  { 
    id: "ff_51", 
    slovak_phrase: "Aký je presný počet študentov?", 
    trap_word: "počet", 
    option_correct: "кількість", 
    option_wrong: "почесть", 
    explanation: "«Počet» означає «кількість» або «число»[cite: 4].",
    full_translation: "Яка точна кількість студентів?"
  },
  { 
    id: "ff_52", 
    slovak_phrase: "Vzdali mu veľkú poctu.", 
    trap_word: "pocta", 
    option_correct: "пошана", 
    option_wrong: "пошта", 
    explanation: "«Pocta» — це «пошана» або «почесть». Пошта буде «pošta»[cite: 4].",
    full_translation: "Йому віддали велику шану."
  },
  { 
    id: "ff_53", 
    slovak_phrase: "Máme v pivnici plný sud vína.", 
    trap_word: "sud", 
    option_correct: "бочка", 
    option_wrong: "суд", 
    explanation: "«Sud» означає «бочка»[cite: 4].",
    full_translation: "У нас у підвалі повна бочка вина."
  },
  { 
    id: "ff_54", 
    slovak_phrase: "Tento koláč má pekný tvar.", 
    trap_word: "tvar", 
    option_correct: "форма", 
    option_wrong: "твар (пика)", 
    explanation: "«Tvar» перекладається як «форма»[cite: 4].",
    full_translation: "Цей пиріг має гарну форму."
  },
  { 
    id: "ff_55", 
    slovak_phrase: "Prepáčte, kde je tu záchod?", 
    trap_word: "záchod", 
    option_correct: "туалет", 
    option_wrong: "захід", 
    explanation: "«Záchod» — це «туалет». Захід (сонця) буде «západ»[cite: 4].",
    full_translation: "Вибачте, де тут туалет?"
  },
  { 
    id: "ff_56", 
    slovak_phrase: "Je tu prísny zákaz fajčiť.", 
    trap_word: "zákaz", 
    option_correct: "заборона", 
    option_wrong: "заказ (замовлення)", 
    explanation: "«Zákaz» означає «заборона». Замовлення буде «objednávka»[cite: 4].",
    full_translation: "Тут сувора заборона курити."
  },
  { 
    id: "ff_57", 
    slovak_phrase: "Na budove veje naša zástava.", 
    trap_word: "zástava", 
    option_correct: "прапор", 
    option_wrong: "застава", 
    explanation: "«Zástava» — це «прапор» або «стяг»[cite: 4].",
    full_translation: "На будівлі майорить наш прапор."
  },
  { 
    id: "ff_58", 
    slovak_phrase: "Včera som vyhral bežecký závod.", 
    trap_word: "závod", 
    option_correct: "перегони", 
    option_wrong: "завод", 
    explanation: "«Závod» означає «перегони» або «змагання». Завод (фабрика) буде «továreň»[cite: 4].",
    full_translation: "Вчора я виграв бігові перегони."
  },
  { 
    id: "ff_59", 
    slovak_phrase: "Učíme sa novú báseň naspamäť.", 
    trap_word: "báseň", 
    option_correct: "вірш", 
    option_wrong: "байка", 
    explanation: "«Báseň» означає «вірш»[cite: 3].",
    full_translation: "Ми вчимо новий вірш напам'ять."
  },
  { 
    id: "ff_60", 
    slovak_phrase: "Musíme brániť naše mesto.", 
    trap_word: "brániť", 
    option_correct: "захищати", 
    option_wrong: "бранити (сварити)", 
    explanation: "«Brániť» — це «захищати». Сварити буде «hrešiť»[cite: 3].",
    full_translation: "Ми мусимо захищати наше місто."
  },
  { 
    id: "ff_61", 
    slovak_phrase: "Kúpil som si sladkú buchtu.", 
    trap_word: "buchta", 
    option_correct: "булочка", 
    option_wrong: "бухта (морська)", 
    explanation: "«Buchta» — це «булочка» або «пиріжок»[cite: 3].",
    full_translation: "Я купив собі солодку булочку."
  },
  { 
    id: "ff_62", 
    slovak_phrase: "Boli sme na prehliadke hradu.", 
    trap_word: "hrad", 
    option_correct: "замок/фортеця", 
    option_wrong: "град", 
    explanation: "«Hrad» означає «замок» або «фортеця»[cite: 3].",
    full_translation: "Ми були на екскурсії в замку."
  },
  { 
    id: "ff_63", 
    slovak_phrase: "Našiel som v lese veľkú hubu.", 
    trap_word: "huba", 
    option_correct: "гриб", 
    option_wrong: "губа", 
    explanation: "«Huba» — це «гриб». Губа словацькою буде «pera»[cite: 3].",
    full_translation: "Я знайшов у лісі великий гриб."
  },
  { 
    id: "ff_64", 
    slovak_phrase: "Ja túto úlohu vôbec nechápem.", 
    trap_word: "chápať", 
    option_correct: "розуміти", 
    option_wrong: "хапати", 
    explanation: "«Chápať» означає «розуміти». Хапати буде «chytať»[cite: 3].",
    full_translation: "Я це завдання взагалі не розумію."
  },
  { 
    id: "ff_65", 
    slovak_phrase: "Dnes som v práci makal celý deň.", 
    trap_word: "makať", 
    option_correct: "важко працювати", 
    option_wrong: "макати (вмочати)", 
    explanation: "«Makať» — це «важко працювати» (гарувати). Вмочати буде «namáčať»[cite: 3].",
    full_translation: "Сьогодні на роботі я гарував (важко працював) цілий день."
  },
  { 
    id: "ff_66", 
    slovak_phrase: "Som na teba veľmi pyšný.", 
    trap_word: "pyšný", 
    option_correct: "гордий", 
    option_wrong: "пишний", 
    explanation: "«Pyšný» означає «гордий»[cite: 3].",
    full_translation: "Я дуже пишаюся тобою."
  },
  { 
    id: "ff_67", 
    slovak_phrase: "Podpísal som ten dôležitý spis.", 
    trap_word: "spis", 
    option_correct: "документ", 
    option_wrong: "спис/список", 
    explanation: "«Spis» — це «документ»[cite: 3].",
    full_translation: "Я підписав цей важливий документ."
  },
  { 
    id: "ff_68", 
    slovak_phrase: "Veľmi ma zaujíma moderné umenie.", 
    trap_word: "umenie", 
    option_correct: "мистецтво", 
    option_wrong: "уміння", 
    explanation: "«Umenie» перекладається як «мистецтво»[cite: 3].",
    full_translation: "Мене дуже цікавить сучасне мистецтво."
  },
  { 
    id: "ff_69", 
    slovak_phrase: "Slovensko je moja nová vlasť.", 
    trap_word: "vlasť", 
    option_correct: "батьківщина", 
    option_wrong: "влада", 
    explanation: "«Vlasť» — це «батьківщина». Влада буде «vláda» або «moc»[cite: 3].",
    full_translation: "Словаччина — моя нова батьківщина."
  },
  { 
    id: "ff_70", 
    slovak_phrase: "Zasadil som kvety na záhon.", 
    trap_word: "záhon", 
    option_correct: "грядка", 
    option_wrong: "загін (військовий)", 
    explanation: "«Záhon» означає «грядка»[cite: 3].",
    full_translation: "Я посадив квіти на грядку."
  },
  { 
    id: "ff_71", 
    slovak_phrase: "Pacient dostal záchvat kašľa.", 
    trap_word: "záchvat", 
    option_correct: "напад/приступ", 
    option_wrong: "захват (захоплення)", 
    explanation: "«Záchvat» — це медичний «напад» або «приступ»[cite: 3].",
    full_translation: "У пацієнта стався напад кашлю."
  },
  { 
    id: "ff_72", 
    slovak_phrase: "Lekár povedal, že mám zápal pľúc.", 
    trap_word: "zápal", 
    option_correct: "запалення", 
    option_wrong: "запал", 
    explanation: "«Zápal» означає медичне «запалення» (наприклад, легенів)[cite: 3].",
    full_translation: "Лікар сказав, що в мене запалення легень."
  },
  { 
    id: "ff_combo_1", 
    slovak_phrase: "V obchode je zákaz fotenia.", 
    trap_word: "Комбо-пастка!", 
    option_correct: "У магазині є заборона на фотографування", 
    option_wrong: "В обході є заказ фотографування", 
    explanation: "«Obchod» = магазин, «zákaz» = заборона[cite: 4].",
    full_translation: "У магазині є заборона на фотографування."
  },
  { 
    id: "ff_combo_2", 
    slovak_phrase: "Nechal mi odkaz, že potrebuje nový nástroj.", 
    trap_word: "Комбо-пастка!", 
    option_correct: "Залишив мені повідомлення, що йому потрібен новий інструмент", 
    option_wrong: "Лишив мені відмову, що потребує новий настрій", 
    explanation: "«Odkaz» = повідомлення, «nástroj» = інструмент[cite: 4].",
    full_translation: "Залишив мені повідомлення, що йому потрібен новий інструмент."
  },
  { 
    id: "ff_combo_3", 
    slovak_phrase: "Na chodbe stojí obrovský sud.", 
    trap_word: "Комбо-пастка!", 
    option_correct: "У коридорі стоїть величезна бочка", 
    option_wrong: "На ходьбі стоїть величезний суд", 
    explanation: "«Chodba» = коридор, «sud» = бочка[cite: 4].",
    full_translation: "У коридорі стоїть величезна бочка."
  },
  { 
    id: "ff_combo_4", 
    slovak_phrase: "Vôbec nechápem moderné umenie.", 
    trap_word: "Комбо-пастка!", 
    option_correct: "Взагалі не розумію сучасного мистецтва", 
    option_wrong: "Взагалі не хапаю сучасне уміння", 
    explanation: "«Chápať» = розуміти, «umenie» = мистецтво[cite: 3].",
    full_translation: "Взагалі не розумію сучасного мистецтва."
  },
  { 
    id: "ff_combo_5", 
    slovak_phrase: "Každý vojak musí brániť svoju vlasť.", 
    trap_word: "Комбо-пастка!", 
    option_correct: "Кожен солдат мусить захищати свою батьківщину", 
    option_wrong: "Кожен солдат мусить сварити свою владу", 
    explanation: "«Brániť» = захищати, «vlasť» = батьківщина[cite: 3].",
    full_translation: "Кожен солдат мусить захищати свою батьківщину."
  },
  { 
    id: "ff_combo_6", 
    slovak_phrase: "Mám silný zápal, musím ísť do lekárne.", 
    trap_word: "Комбо-пастка!", 
    option_correct: "Маю сильне запалення, мушу йти в аптеку", 
    option_wrong: "Маю сильний запал, мушу йти в лікарню", 
    explanation: "«Zápal» = запалення, «lekáreň» = аптека[cite: 3].",
    full_translation: "Маю сильне запалення, мушу йти в аптеку."
  },
  { 
    id: "ff_combo_7", 
    slovak_phrase: "Makal som celý deň a kúpil som si čerstvú buchtu.", 
    trap_word: "Комбо-пастка!", 
    option_correct: "Важко працював цілий день і купив собі свіжу булочку", 
    option_wrong: "Макав я цілий день і купив собі черству бухту", 
    explanation: "«Makať» = важко працювати, «čerstvý» = свіжий, «buchta» = булочка[cite: 3].",
    full_translation: "Важко працював цілий день і купив собі свіжу булочку."
  }
];

// --- АВТО-КОНВЕРТЕР ФАЛЬШИВИХ ДРУЗІВ У ФЛЕШКАРТКИ ---
const ffFlashcards = falseFriendsDatabase.map(ff => ({
  id: ff.id,
  type: 'flashcard',
  content: ff.slovak_phrase,
  correct_answer: ff.full_translation || ff.option_correct,
  difficulty: 'medium',
  isFfConverted: true
}));

// --- ГОЛОСОВИЙ ДВИЖОК (Telegram-Safe Гібрид + Magic Link) ---
const globalAudioPlayer = new Audio();

function speakSlovak(text) {
  const audioUrl = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=sk&q=${encodeURIComponent(text)}`;
  globalAudioPlayer.src = audioUrl;
  
  globalAudioPlayer.play().catch(err => {
    console.warn("Мережеве аудіо не спрацювало:", err);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'sk-SK';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } else {
      // Викликаємо нативний Popup Телеграму з кнопкою "Відкрити в браузері"
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showPopup({
          title: "Блокування звуку 🔇",
          message: "Ваш пристрій жорстко блокує аудіо всередині Telegram.\n\nВідкрийте платформу у звичайному браузері (Chrome/Safari), щоб звук працював ідеально. Ваш прогрес буде автоматично збережено!",
          buttons: [
            { id: "open_web", type: "default", text: "🌐 Відкрити в браузері" },
            { type: "cancel", text: "Закрити" }
          ]
        }, (btnId) => {
          if (btnId === "open_web") {
            const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
            let url = "https://hackademia-web.vercel.app/";
            if (tgUser) {
              // Шифруємо дані юзера у Base64 для тимчасової передачі сесії (Magic Link)
              const authData = JSON.stringify({ id: tgUser.id, first_name: tgUser.first_name });
              const authStr = btoa(encodeURIComponent(authData));
              url += "?auth=" + authStr;
            }
            window.Telegram.WebApp.openLink(url);
          }
        });
      }
    }
  });
}

function App() {
  // --- БАЗОВІ СТАНИ ---
  const [userName, setUserName] = useState(null);
  const [dbUserId, setDbUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessStatus, setAccessStatus] = useState('loading'); // 'loading', 'pending', 'approved', 'rejected', 'no_auth' 
  const [telegramId, setTelegramId] = useState(null);
  const [allowedCourses, setAllowedCourses] = useState([]);
  
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const effectiveIsAdmin = isAdmin && !isPreviewMode;
  
  // --- ПЕРЕВІРКА ДОСТУПУ ДО ОКРЕМИХ КУРСІВ ---
  useEffect(() => {
    if (!telegramId || effectiveIsAdmin) return; // Адміни бачать усе
    
    async function fetchAllowedCourses() {
      const { data } = await supabase
        .from('user_courses')
        .select('course_id')
        .eq('user_telegram_id', telegramId);
        
      if (data) {
        setAllowedCourses(data.map(d => d.course_id));
      }
    }
    
    fetchAllowedCourses();
    const interval = setInterval(fetchAllowedCourses, 10000); // Оновлюємо кожні 10 сек (на випадок, якщо адмін дав доступ)
    return () => clearInterval(interval);
  }, [telegramId, effectiveIsAdmin]);
  
  // --- НОВІ СТАНИ ДЛЯ ІНТЕРВАЛЬНОГО ПОВТОРЕННЯ ТА СНАЙПЕРА ---
  const [globalView, setGlobalView] = useState(null); // 'spaced' або 'sniper'
  
  // Стани для Інтервального повторення
  const [spacedCards, setSpacedCards] = useState([]);
  const [spacedIndex, setSpacedIndex] = useState(0);
  const [isSpacedFlipped, setIsSpacedFlipped] = useState(false);

  // Стани для міні-гри "Діакритичний снайпер"
  const [sniperCards, setSniperCards] = useState([]);
  const [sniperIndex, setSniperIndex] = useState(0);
  const [sniperInput, setSniperInput] = useState('');
  const [sniperScore, setSniperScore] = useState(0);
  const [sniperTimeLeft, setSniperTimeLeft] = useState(5);
  
  // НОВІ СТАНИ: Статус гри (меню, гра, кінець) та Життя (ХП)
  const [sniperStatus, setSniperStatus] = useState('menu'); 
  const [sniperHp, setSniperHp] = useState(5);
  
  
  // Стани для міні-гри "Фальшиві друзі"
  const [ffCards, setFfCards] = useState([]);
  const [ffIndex, setFfIndex] = useState(0);
  const [ffScore, setFfScore] = useState(0);
  const [ffSelected, setFfSelected] = useState(null);
  const [ffCurrentOptions, setFfCurrentOptions] = useState([]);
  const [isFfOver, setIsFfOver] = useState(false);
  const [ffShowTranslation, setFfShowTranslation] = useState(false); // НОВИЙ СТАН ДЛЯ СПОЙЛЕРА

  // --- ТЕМА ТА ЗВУК ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Об'єкт із кольорами для швидкого перемикання теми
  const theme = {
    bg: isDarkMode ? '#1a202c' : '#f0f4f8',
    cardBg: isDarkMode ? '#2d3748' : 'white',
    text: isDarkMode ? '#f7fafc' : '#333',
    textSecondary: isDarkMode ? '#a0aec0' : '#555',
    inputBg: isDarkMode ? '#4a5568' : 'white',
    inputBorder: isDarkMode ? '#718096' : '#ccc',
    adminBg: isDarkMode ? '#4a1c38' : '#ffe6f2',
    adminBorder: isDarkMode ? '#d53f8c' : '#FF007F'
  };

  const [newAdminTelegramId, setNewAdminTelegramId] = useState('');

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  const [isEditingCourseTitle, setIsEditingCourseTitle] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");

  const [modules, setModules] = useState([]);
  const [activeModule, setActiveModule] = useState(null);
  
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editModuleTitleText, setEditModuleTitleText] = useState('');

  const [newTaskType, setNewTaskType] = useState('text');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState('medium');
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskCorrectAnswer, setNewTaskCorrectAnswer] = useState('');

  const [userAnswers, setUserAnswers] = useState({});
  const [completedTasks, setCompletedTasks] = useState([]);
  const [courseProgress, setCourseProgress] = useState({ completed: 0, total: 0 });
  const [myCards, setMyCards] = useState([]);
  
  useEffect(() => {
    const savedCards = localStorage.getItem('hack_my_cards');
    if (savedCards) {
      try { setMyCards(JSON.parse(savedCards)); } catch(e){}
    }
  }, []);
  
  const [pendingCount, setPendingCount] = useState(0);
  const [studentsNeedingCourses, setStudentsNeedingCourses] = useState([]);

  // Додаємо цей useEffect для дзвіночка, щоб він сам перевіряв заявки
  useEffect(() => {
    if (effectiveIsAdmin) {
      const fetchPending = async () => {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('access_status', 'pending');
        setPendingCount(count || 0);
      };
      fetchPending();
      const interval = setInterval(fetchPending, 15000); // Оновлює цифру кожні 15 сек
      return () => clearInterval(interval);
    }
  }, [effectiveIsAdmin]);
  
 // --- ЛОГІКА ПЛАВАЮЧОГО НАГАДУВАННЯ ПРО КУРСИ ---
  useEffect(() => {
    if (effectiveIsAdmin) {
      const fetchNeedingCourses = async () => {
        const { data } = await supabase
          .from('users')
          .select('telegram_id, first_name')
          .eq('needs_course_assignment', true)
          .eq('access_status', 'approved');
        if (data) setStudentsNeedingCourses(data);
      };
      fetchNeedingCourses();
      const interval = setInterval(fetchNeedingCourses, 15000); // Перевіряємо кожні 15 сек
      return () => clearInterval(interval);
    }
  }, [effectiveIsAdmin]);

  const dismissCourseAlert = async () => {
    const ids = studentsNeedingCourses.map(s => s.telegram_id);
    await supabase
      .from('users')
      .update({ needs_course_assignment: false })
      .in('telegram_id', ids);
    setStudentsNeedingCourses([]);
  };

  // --- СТАНИ ДЛЯ ФЛЕШ-КАРТОК ТА РЕЖИМІВ ТРЕНУВАННЯ ---
  const [flippedCards, setFlippedCards] = useState({});
  
  const [isTrainingMode, setIsTrainingMode] = useState(false);
  const [isTestView, setIsTestView] = useState(false); // false = просто гортати, true = тест з варіантами
  const [trainingIndex, setTrainingIndex] = useState(0);
  const [isTrainingFlipped, setIsTrainingFlipped] = useState(false);
  const [quizOptions, setQuizOptions] = useState([]);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('medium');

  const difficultyConfig = {
    easy: { color: '#00C853', label: '🟢 Легко', points: 10 },
    medium: { color: '#FFB300', label: '🟡 Середньо', points: 20 },
    hard: { color: '#F44336', label: '🔴 Складно', points: 30 }
  };

  useEffect(() => {
    // Таймер працює ТІЛЬКИ коли статус 'playing'
    if (globalView !== 'sniper' || sniperStatus !== 'playing') return;
    
    const timer = setInterval(() => {
      setSniperTimeLeft(prev => {
        if (prev <= 1) {
          playUiSound('buzz', isSoundEnabled);
          setSniperHp(hp => {
            const newHp = hp - 1;
            if (newHp <= 0) setSniperStatus('over'); // ХП закінчились = кінець
            else setSniperIndex(idx => idx + 1); // Йдемо далі, якщо ще є ХП
            return newHp;
          });
          return 5; // Відновлюємо час для наступного слова
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [globalView, sniperStatus, isSoundEnabled]);
 
  
  useEffect(() => {
    // Функція реєстрації/перевірки юзера в базі
    async function registerUser(user) {
      setTelegramId(user.id);
	  const savedAdmin = localStorage.getItem('hack_is_admin');
      if (savedAdmin === 'true') setIsAdmin(true);

      const { data } = await supabase
        .from('users')
        .upsert({ telegram_id: user.id, first_name: user.first_name }, { onConflict: 'telegram_id' })
        .select()
        .single();
        
      if (data) {
        setDbUserId(data.id);
        
        // Читаємо статус із бази.
        if (data.role === 'admin') {
          setIsAdmin(true);
          setAccessStatus('approved');
          localStorage.setItem('hack_is_admin', 'true');
        } else {
          // ЗАЛІЗОБЕТОННИЙ БЛОК: Видаляємо кеш, якщо юзер НЕ адмін
          if (savedAdmin === 'true') {
            localStorage.removeItem('hack_is_admin');
            setIsAdmin(false);
          }
          // Призначаємо реальний статус (якщо rejected - сайт видасть екран блокування)
          setAccessStatus(data.access_status || 'pending');
        }
      }
    }

    // --- 1. ПЕРЕВІРКА MAGIC LINK (ПЕРЕХІД ІЗ TELEGRAM В БРАУЗЕР) ---
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');
    
    if (authParam) {
      try {
        const decodedStr = decodeURIComponent(atob(authParam));
        const user = JSON.parse(decodedStr);
        
        localStorage.setItem('hack_browser_user', user.first_name);
        localStorage.setItem('hack_browser_id', user.id); 
        
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setUserName(user.first_name);
        registerUser(user);
        
        const savedTheme = localStorage.getItem('hack_theme');
        if (savedTheme === 'dark') setIsDarkMode(true);
        const savedSound = localStorage.getItem('hack_sound');
        if (savedSound === 'false') setIsSoundEnabled(false);
        
        fetchCourses();
        return; 
      } catch (e) { console.error("Помилка Magic Link", e); }
    }

    // --- 2. ЗВИЧАЙНА ІНІЦІАЛІЗАЦІЯ (TELEGRAM АБО СТАРА БРАУЗЕРНА СЕСІЯ) ---
    try {
      const tg = window.Telegram?.WebApp;
      if (tg) { 
        tg.ready(); 
        tg.expand();
        if (tg.colorScheme === 'dark') setIsDarkMode(true);
      } else {
        const savedTheme = localStorage.getItem('hack_theme');
        if (savedTheme === 'dark') setIsDarkMode(true);
      }

      const savedSound = localStorage.getItem('hack_sound');
      if (savedSound === 'false') setIsSoundEnabled(false);

      if (tg?.initDataUnsafe?.user) {
        setUserName(tg.initDataUnsafe.user.first_name);
        registerUser(tg.initDataUnsafe.user);
      } else {
        const browserId = localStorage.getItem('hack_browser_id');
        const browserUser = localStorage.getItem('hack_browser_user');
        
        if (browserId && browserUser) {
          // Якщо юзер колись зайшов через Magic Link, логінимо його
          setUserName(browserUser);
          registerUser({ id: browserId, first_name: browserUser });
        } else {
          // Якщо це рандомна людина з прямим посиланням — блокуємо
          setAccessStatus('no_auth');
        }
      }
    } catch (e) { console.error(e); }

    fetchCourses();
  }, []);

  useEffect(() => {
    if (!dbUserId) return;
    async function fetchProgress() {
      const { data } = await supabase
        .from('progress')
        .select('task_id')
        .eq('user_id', dbUserId)
        .eq('status', 'completed');

      if (data) {
        setCompletedTasks(data.map(p => p.task_id));
      }
    }
    fetchProgress();
  }, [dbUserId]);

  useEffect(() => {
    if (!selectedCourse) return;
    async function fetchModulesAndProgress() {
      const { data: mods } = await supabase.from('modules').select('*').eq('course_id', selectedCourse.id).order('id', { ascending: true });
      if (mods) {
        setModules(mods);

        const modIds = mods.map(m => m.id);
        if (modIds.length > 0) {
          const { data: tks } = await supabase.from('tasks').select('id').in('module_id', modIds);
          if (tks && tks.length > 0) {
            const totalTasks = tks.length;
            const taskIds = tks.map(t => t.id);
            const completedCount = taskIds.filter(id => completedTasks.includes(id)).length;
            setCourseProgress({ completed: completedCount, total: totalTasks });
          } else {
            setCourseProgress({ completed: 0, total: 0 });
          }
        } else {
          setCourseProgress({ completed: 0, total: 0 });
        }
      }
    }
    fetchModulesAndProgress();
  }, [selectedCourse, completedTasks]);

  useEffect(() => {
    if (!activeModule) return;
    async function fetchTasks() {
      setIsLoadingTasks(true);
      const { data } = await supabase.from('tasks').select('*').eq('module_id', activeModule.id).order('id', { ascending: true });
      if (data) setTasks(data);
      setIsLoadingTasks(false);
    }
    fetchTasks();
    setIsTrainingMode(false); // скидаємо режим тренування при зміні модуля
  }, [activeModule]);
  
  // --- ЛОГІКА ІНТЕРВАЛЬНОГО ПОВТОРЕННЯ ---
  async function startSpacedRepetition() {
    const { data: allTasks } = await supabase.from('tasks').select('*').eq('type', 'flashcard');
    const { data: progressData } = await supabase.from('progress').select('*').eq('user_id', dbUserId);
    
    // Об'єднуємо: картки з бази + власні картки учня + фальшиві друзі
    const combinedAllTasks = [...(allTasks || []), ...myCards, ...ffFlashcards];
    
    if (combinedAllTasks.length === 0) {
      alert("Немає карток для повторення!");
      return;
    }

    const now = new Date();
    // Локальний прогрес для фальшивих друзів та власних карток
    let localFfProgress = {};
    try { localFfProgress = JSON.parse(localStorage.getItem('hack_ff_progress')) || {}; } catch(e){}

    const dueCards = combinedAllTasks.filter(task => {
      let isCompleted = false;
      let completedDate = null;

      if (task.isFfConverted || task.isCustom) {
        const prog = localFfProgress[task.id];
        if (prog && prog.status === 'completed') {
          isCompleted = true;
          completedDate = new Date(prog.updated_at);
        }
      } else {
        const prog = progressData?.find(p => p.task_id === task.id);
        if (prog && prog.status === 'completed') {
          isCompleted = true;
          completedDate = new Date(prog.updated_at || prog.created_at);
        }
      }
      
      if (!isCompleted) return false;
      const diffDays = (now - completedDate) / (1000 * 60 * 60 * 24);
      return diffDays >= 1; // Все, що вивчено день тому і більше
    });

    // Якщо старих слів для повторення немає, беремо всі (щоб завжди було що тренувати)
    const targetCards = dueCards.length > 0 ? dueCards : combinedAllTasks;
    
    setSpacedCards(targetCards.sort(() => 0.5 - Math.random()));
    setSpacedIndex(0);
    setIsSpacedFlipped(false);
    setGlobalView('spaced');
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
  }

  function handleSpacedNext(card) {
    // Зберігаємо прогрес, щоб інтервал відліковувався заново
    if (card.isFfConverted || card.isCustom) {
      let localFfProgress = JSON.parse(localStorage.getItem('hack_ff_progress')) || {};
      localFfProgress[card.id] = { status: 'completed', updated_at: new Date().toISOString() };
      localStorage.setItem('hack_ff_progress', JSON.stringify(localFfProgress));
    } else {
      supabase.from('progress').upsert({ user_id: dbUserId, task_id: card.id, status: 'completed', updated_at: new Date().toISOString() }, { onConflict: 'user_id, task_id' }).then();
    }

    setIsSpacedFlipped(false);
    if (spacedIndex + 1 < spacedCards.length) setSpacedIndex(prev => prev + 1);
    else { alert("🎉 Повторення завершено!"); setGlobalView(null); }
  }

// --- ЛОГІКА МІНІ-ГРИ "ДІАКРИТИЧНИЙ СНАЙПЕР" ---
  async function startDiacriticalSniperGame() {
    let customSniper = [];
    try {
      const saved = localStorage.getItem('hack_sniper_custom');
      if (saved) customSniper = JSON.parse(saved);
    } catch(e) {}

    let dbCards = [];
    try {
      const response = await supabase.from('tasks').select('*').eq('type', 'flashcard');
      if (response && response.data) {
        dbCards = response.data.filter(c => c && c.content && c.correct_answer);
      }
    } catch(e) {}

    const combinedPool = [...defaultSniperWords, ...customSniper, ...dbCards];

    if (combinedPool.length === 0) return;
    
    // ПРОГРЕСІЯ СКЛАДНОСТІ: Сортуємо слова за довжиною і перемішуємо всередині груп
    const short = combinedPool.filter(c => c.correct_answer.length <= 5).sort(() => 0.5 - Math.random());
    const med = combinedPool.filter(c => c.correct_answer.length > 5 && c.correct_answer.length <= 7).sort(() => 0.5 - Math.random());
    const long = combinedPool.filter(c => c.correct_answer.length > 7).sort(() => 0.5 - Math.random());
    
    // Спочатку легкі, потім середні, потім складні
    setSniperCards([...short, ...med, ...long]);
    setSniperIndex(0);
    setSniperScore(0);
    setSniperHp(5); // 5 життів
    setSniperInput('');
    setSniperTimeLeft(5);
    setSniperStatus('playing');
  }

  // Функція для адміна: додати нове слово у снайпер
  function handleAddSniperWord() {
    const wordUA = prompt("Введи значення українською (наприклад: 'Дівчина'):");
    if (!wordUA) return;
    const wordSK = prompt("Введи слово словацькою з діакритикою (наприклад: 'dievča'):");
    if (!wordSK) return;

    const newItem = {
      id: 'custom_snp_' + Date.now(),
      content: wordUA.trim(),
      correct_answer: wordSK.trim()
    };

    try {
      let customSniper = [];
      const saved = localStorage.getItem('hack_sniper_custom');
      if (saved) customSniper = JSON.parse(saved);
      
      customSniper.push(newItem);
      localStorage.setItem('hack_sniper_custom', JSON.stringify(customSniper));
      alert("✅ Слово успішно додано до бази снайпера!");
    } catch(err) {
      alert("Помилка збереження: " + err.message);
    }
  }
  
  // МАПА ДЛЯ АВТО-ДІАКРИТИКИ
  function addDiacritics(text) {
    return String(text || '')
      .replace(/c/g, 'č').replace(/s/g, 'š').replace(/z/g, 'ž')
      .replace(/a/g, 'á').replace(/e/g, 'é').replace(/i/g, 'í')
      .replace(/o/g, 'ó').replace(/u/g, 'ú').replace(/y/g, 'ý')
      .replace(/l/g, 'ľ').replace(/t/g, 'ť').replace(/d/g, 'ď').replace(/n/g, 'ň');
  }

  function handleSniperSubmit(e) {
    e.preventDefault();
    // БЕЗКІНЕЧНИЙ ЦИКЛ: коли слова закінчуються, індекс йде по колу!
    const currentCard = sniperCards[sniperIndex % sniperCards.length]; 
    if (!currentCard || !currentCard.correct_answer) return;

    const isCorrect = sniperInput.trim().toLowerCase() === currentCard.correct_answer.trim().toLowerCase();
    
    if (isCorrect) {
      playUiSound('ding', isSoundEnabled);
      setSniperScore(prev => prev + 10);
      setSniperTimeLeft(prev => Math.min(prev + 3, 10)); // ДАЄМО +3 сек (макс 10)
      setSniperIndex(prev => prev + 1); // Наступне слово
      setSniperInput('');
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } else {
      playUiSound('buzz', isSoundEnabled);
      setSniperInput(''); // Очищаємо поле для нової спроби
      setSniperHp(hp => {
        const newHp = hp - 1;
        if (newHp <= 0) setSniperStatus('over'); // Якщо 0 ХП - кінець
        return newHp;
      });
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
  }

  function handleSniperNext(wasCorrect) {
    if (sniperIndex + 1 < sniperCards.length) {
      setSniperIndex(prev => prev + 1);
      setSniperInput('');
      setSniperTimeLeft(5);
    } else {
      setIsSniperOver(true);
    }
  }
  
  // --- ЛОГІКА МІНІ-ГРИ "ФАЛЬШИВІ ДРУЗІ" ---
  function startFalseFriends() {
    const shuffled = [...falseFriendsDatabase].sort(() => 0.5 - Math.random()).slice(0, 10);
    setFfCards(shuffled);
    setFfIndex(0);
    setFfScore(0);
    setFfSelected(null);
    
    const firstCard = shuffled[0];
    setFfCurrentOptions([firstCard.option_correct, firstCard.option_wrong].sort(() => Math.random() - 0.5));
    
    setIsFfOver(false);
    setGlobalView('false_friends');
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
  }

  function handleFfAnswer(selectedOption, isCorrectOption) {
    if (ffSelected !== null) return; 
    setFfSelected(selectedOption);
    
    if (isCorrectOption) {
      playUiSound('ding', isSoundEnabled);
      setFfScore(prev => prev + 10);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } else {
      playUiSound('buzz', isSoundEnabled);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
  }

  function handleFfNext() {
    setFfShowTranslation(false); // ХОВАЄМО ПЕРЕКЛАД НА НОВОМУ РЕЧЕННІ
    if (ffIndex + 1 < ffCards.length) {
      const nextIndex = ffIndex + 1;
      const nextCard = ffCards[nextIndex];
      setFfIndex(nextIndex);
      setFfSelected(null);
      setFfCurrentOptions([nextCard.option_correct, nextCard.option_wrong].sort(() => Math.random() - 0.5));
    } else {
      setIsFfOver(true);
    }
  }


  // Функції перемикання теми та звуку
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('hack_theme', newTheme ? 'dark' : 'light');
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const toggleSound = () => {
    const newSound = !isSoundEnabled;
    setIsSoundEnabled(newSound);
    localStorage.setItem('hack_sound', newSound ? 'true' : 'false');
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    if (newSound) playUiSound('ding', true); // Підтвердження увімкнення звуку
  };

  async function fetchCourses() {
    const { data } = await supabase.from('courses').select('*').order('order_index', { ascending: true });
    if (data) setCourses(data);
  }

  async function handleMakeAdmin() {
    if (!newAdminTelegramId.trim()) return;
    const { error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('telegram_id', parseInt(newAdminTelegramId.trim()));

    if (error) {
      alert("Помилка: " + error.message);
    } else {
      alert(`Користувача з ID ${newAdminTelegramId} успішно призначено адміном!`);
      setNewAdminTelegramId('');
    }
  }

  async function handleAddCourse() {
    const title = prompt("Введи назву нового курсу:");
    if (!title) return;
    const newId = title.toLowerCase().replace(/\s+/g, '-');
    const newOrderIndex = courses.length; 
    
    const { data, error } = await supabase.from('courses').insert({ id: newId, title, order_index: newOrderIndex }).select();
    if (error) { alert("Помилка створення: " + error.message); return; }
    if (data) setCourses([...courses, data[0]]);
  }

  async function handleDeleteCourse(courseId) {
    if (!window.confirm("⚠️ Ви точно хочете видалити цей курс?")) return;
    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    if (error) { alert("Помилка: " + error.message); return; }
    setCourses(courses.filter(c => c.id !== courseId));
    if (selectedCourse?.id === courseId) setSelectedCourse(null);
  }

  async function handleSaveCourseTitle() {
    if (!newCourseTitle.trim()) return;
    
    const { error } = await supabase.from('courses').update({ title: newCourseTitle }).eq('id', selectedCourse.id);
    if (error) { 
      alert("Помилка перейменування: " + error.message); 
      return; 
    }
    
    setCourses(courses.map(c => c.id === selectedCourse.id ? { ...c, title: newCourseTitle } : c));
    setSelectedCourse({ ...selectedCourse, title: newCourseTitle });
    setIsEditingCourseTitle(false);
    
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  }

  function handleReorderCourses(newOrder) {
    setCourses(newOrder);
    
    const updates = newOrder.map((c, i) => ({ id: c.id, title: c.title, order_index: i }));
    supabase.from('courses').upsert(updates).then(({error}) => {
      if (error) console.error("Помилка збереження порядку:", error);
    });
  }
  
  async function handleAddModule() {
    if (!newModuleTitle.trim() || !selectedCourse) return;
    const { data, error } = await supabase.from('modules').insert({ 
      title: newModuleTitle, 
      course_id: selectedCourse.id, 
      is_unlocked: true 
    }).select();
    if (error) { alert("Помилка: " + error.message); return; }
    if (data) {
      setModules([...modules, data[0]]);
      setNewModuleTitle('');
    }
  }

  async function handleSaveModuleTitle(modId) {
    const { error } = await supabase.from('modules').update({ title: editModuleTitleText }).eq('id', modId);
    if (error) { alert("Помилка: " + error.message); return; }
    setModules(modules.map(m => m.id === modId ? { ...m, title: editModuleTitleText } : m));
    setEditingModuleId(null);
  }

  async function handleDeleteModule(modId) {
    if (!window.confirm("⚠️ Ви точно хочете видалити цей розділ (тиждень)?")) return;
    const { error } = await supabase.from('modules').delete().eq('id', modId);
    if (error) { alert("Помилка: " + error.message); return; }
    setModules(modules.filter(m => m.id !== modId));
  }

  async function handleDeleteTask(taskId) {
    if (!window.confirm("⚠️ Ви точно хочете видалити це завдання?")) return;
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) { alert("Помилка: " + error.message); return; }
    setTasks(tasks.filter(t => t.id !== taskId));
  }

  async function handleAddTask() {
    if (!newTaskContent.trim()) return;

    // Для флешкартки правильна відповідь обов'язкова і не приводиться до lowerCase
    const answer = newTaskType === 'quiz' 
      ? newTaskCorrectAnswer.trim().toLowerCase() 
      : (newTaskType === 'flashcard' ? newTaskCorrectAnswer.trim() : null);

    const { data, error } = await supabase
      .from('tasks')
      .insert({ 
        module_id: activeModule.id, 
        type: newTaskType, 
        content: newTaskContent,
        difficulty: newTaskDifficulty,
        correct_answer: answer
      })
      .select();
      
    if (error) { alert("Помилка: " + error.message); return; }
    if (data) {
      setTasks([...tasks, data[0]]);
      setNewTaskContent('');
      setNewTaskCorrectAnswer('');
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;
      setNewTaskContent(prev => prev + (prev ? '\n' : '') + publicUrl);
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (err) {
      alert("❌ Помилка завантаження фото: " + err.message);
    }
  }

  async function handleAudioUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `audio_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('audio')
        .getPublicUrl(fileName);

      const publicUrl = data.publicUrl;
      setNewTaskContent(prev => prev + (prev ? '\n' : '') + publicUrl);
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (err) {
      alert("❌ Помилка завантаження аудіо: " + err.message);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      let chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        await uploadAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert("❌ Не вдалося отримати доступ до мікрофона: " + err.message);
    }
  }

  function stopRecording() {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  }

  async function uploadAudioBlob(blob) {
    try {
      const fileName = `voice_${Date.now()}.mp3`;
      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, blob, { contentType: 'audio/mp3' });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('audio')
        .getPublicUrl(fileName);

      const publicUrl = data.publicUrl;
      setNewTaskContent(prev => prev + (prev ? '\n' : '') + publicUrl);
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (err) {
      alert("❌ Помилка збереження голосового запису: " + err.message);
    }
  }

  async function handleCloudBackup() {
    try {
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      
      const { data: allCourses } = await supabase.from('courses').select('*');
      const { data: allModules } = await supabase.from('modules').select('*');
      const { data: allTasks } = await supabase.from('tasks').select('*');
      
      const backupData = {
        type: 'Full Cloud Backup',
        export_date: new Date().toISOString(),
        courses: allCourses,
        modules: allModules,
        tasks: allTasks
      };

      const fileData = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
      const fileName = `backup_${dateStr}.json`;

      const { error } = await supabase.storage.from('Backups').upload(fileName, fileData);
      if (error) throw error;

      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("☁️ Бекап успішно збережено у хмару Supabase!");
      } else {
        alert("☁️ Бекап успішно збережено у хмару!");
      }
    } catch (err) {
      console.error(err);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("❌ Помилка збереження у хмару: " + err.message);
      } else {
        alert("❌ Помилка збереження у хмару: " + err.message);
      }
    }
  }

  async function handleCloudRestore() {
    if (!window.confirm("⚠️ УВАГА! Це відновить базу з ОСТАННЬОГО хмарного бекапу. Поточні дані будуть перезаписані. Продовжити?")) return;
    
    try {
      const { data: files, error: listError } = await supabase.storage.from('Backups').list();
      if (listError) throw listError;
      
      if (!files || files.length === 0) {
        if (window.Telegram?.WebApp) window.Telegram.WebApp.showAlert("У хмарі ще немає жодного бекапу!");
        else alert("У хмарі ще немає жодного бекапу!");
        return;
      }

      const latestFile = files.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      
      const { data: fileData, error: downloadError } = await supabase.storage.from('Backups').download(latestFile.name);
      if (downloadError) throw downloadError;

      const text = await fileData.text();
      const data = JSON.parse(text);

      if (data.courses && data.courses.length > 0) await supabase.from('courses').upsert(data.courses);
      if (data.modules && data.modules.length > 0) await supabase.from('modules').upsert(data.modules);
      if (data.tasks && data.tasks.length > 0) await supabase.from('tasks').upsert(data.tasks);

      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        window.Telegram.WebApp.showAlert(`✅ Успішно відновлено з файлу: ${latestFile.name}`);
      } else {
        alert(`✅ Успішно відновлено з файлу: ${latestFile.name}`);
      }
      
      fetchCourses();
      setSelectedCourse(null);
      setActiveModule(null);
      
    } catch (err) {
      console.error(err);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("❌ Помилка відновлення: " + err.message);
      } else {
        alert("❌ Помилка відновлення: " + err.message);
      }
    }
  }

  async function handleSaveEdit(taskId) {
    const taskToEdit = tasks.find(t => t.id === taskId);
    const parsedAnswer = taskToEdit.type === 'quiz' 
      ? editAnswer.trim().toLowerCase() 
      : (taskToEdit.type === 'flashcard' ? editAnswer.trim() : null);

    const { error } = await supabase
      .from('tasks')
      .update({ content: editContent, correct_answer: parsedAnswer, difficulty: editDifficulty })
      .eq('id', taskId);

    if (error) { alert("Помилка: " + error.message); return; }
    setTasks(tasks.map(t => t.id === taskId ? { ...t, content: editContent, correct_answer: parsedAnswer, difficulty: editDifficulty } : t));
    setEditingTaskId(null);
  }

  // Обробка звичайного текстового тесту (quiz)
  async function handleAnswerSubmit(task) {
    const studentAnswer = (userAnswers[task.id] || '').trim().toLowerCase();
    const correctAnswer = (task.correct_answer || '').trim().toLowerCase();

    if (!correctAnswer) {
      alert("⚠️ У цього завдання ще немає правильної відповіді.");
      return;
    }

    if (studentAnswer === correctAnswer) {
      playUiSound('ding', isSoundEnabled);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      
      const diff = difficultyConfig[task.difficulty || 'medium'];
      await supabase.from('progress').upsert({
        user_id: dbUserId,
        task_id: task.id,
        status: 'completed',
        points: diff.points
      }, { onConflict: 'user_id, task_id' });

      setCompletedTasks([...new Set([...completedTasks, task.id])]); 
      alert(`Правильно! 🎉 +${diff.points} балів.`);
    } else {
      playUiSound('buzz', isSoundEnabled);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      alert("Неправильно ❌ Спробуй ще раз!");
    }
  }

// --- ЛОГІКА ТРЕНУВАННЯ / ТЕСТІВ ФЛЕШКАРТОК ---
  const allTasksToRender = [...tasks, ...myCards];
  const flashcards = allTasksToRender.filter(t => t.type === 'flashcard');

  function handleAddMyCard() {
    const word = prompt("Введи слово (лицьова сторона):");
    if (!word) return;
    const translation = prompt("Введи переклад (зворотна сторона):");
    if (!translation) return;

    const newCard = {
      id: 'custom_' + Date.now(),
      type: 'flashcard',
      content: word.trim(),
      correct_answer: translation.trim(),
      difficulty: 'medium',
      isCustom: true
    };

    const updated = [...myCards, newCard];
    setMyCards(updated);
    localStorage.setItem('hack_my_cards', JSON.stringify(updated));
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  }

  function handleDeleteMyCard(cardId) {
    if (!window.confirm("🗑 Точно видалити цю власну картку?")) return;
    const updated = myCards.filter(c => c.id !== cardId);
    setMyCards(updated);
    localStorage.setItem('hack_my_cards', JSON.stringify(updated));
  }
  
  function startTraining(testMode = false) {
    if (flashcards.length === 0) return;
    setIsTestView(testMode);
    setTrainingIndex(0);
    setIsTrainingFlipped(false);
    setSelectedQuizAnswer(null);
    setQuizScore(0);
    setIsQuizFinished(false);
    setIsTrainingMode(true);
    prepareQuizOptions(0, flashcards);
  }

  function prepareQuizOptions(currentIndex, cards) {
    const currentCard = cards[currentIndex];
    const otherCards = cards.filter((_, idx) => idx !== currentIndex);
    const shuffledOthers = [...otherCards].sort(() => 0.5 - Math.random());
    const wrongAnswers = shuffledOthers.slice(0, 3).map(c => c.correct_answer);
    const options = [currentCard.correct_answer, ...wrongAnswers].sort(() => 0.5 - Math.random());
    setQuizOptions(options);
  }

  function handleQuizAnswer(option) {
    if (selectedQuizAnswer !== null) return; 
    setSelectedQuizAnswer(option);
    
    const currentCard = flashcards[trainingIndex];
    const isCorrect = option === currentCard.correct_answer;
    
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      playUiSound('ding', isSoundEnabled);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } else {
      playUiSound('buzz', isSoundEnabled);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
  }

  function nextTrainingCard() {
    if (trainingIndex + 1 < flashcards.length) {
      const nextIdx = trainingIndex + 1;
      setTrainingIndex(nextIdx);
      setIsTrainingFlipped(false);
      setSelectedQuizAnswer(null);
      prepareQuizOptions(nextIdx, flashcards);
    } else {
      setIsQuizFinished(true);
    }
  }

  function toggleFlashcard(id) {
    playUiSound('whoosh', isSoundEnabled);
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  }

  function toggleTrainingFlashcard() {
    playUiSound('whoosh', isSoundEnabled);
    setIsTrainingFlipped(!isTrainingFlipped);
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  }

  async function handleCompleteFlashcard(task) {
    playUiSound('ding', isSoundEnabled);
    const diff = difficultyConfig[task.difficulty || 'medium'];
    await supabase.from('progress').upsert({ user_id: dbUserId, task_id: task.id, status: 'completed', points: diff.points }, { onConflict: 'user_id, task_id' });
    setCompletedTasks([...new Set([...completedTasks, task.id])]); 
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  }

  function renderContent(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        const ytMatch = part.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (ytMatch && ytMatch[1]) {
          const videoId = ytMatch[1];
          return (
            <div key={i} style={{ margin: '15px 0', position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }

        if (part.match(/\.(mp3|wav|ogg|m4a)$/i) || part.includes("/audio/")) {
          return (
            <div key={i} style={{ margin: '15px 0', background: theme.inputBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}`, boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: theme.textSecondary }}>🎧 Аудіозапис / Аудіювання:</p>
              <audio controls style={{ width: '100%' }}>
                <source src={part} type="audio/mpeg" />
                Ваш браузер не підтримує аудіо елемент.
              </audio>
              <div style={{ marginTop: '8px', textAlign: 'right' }}>
                <a href={part} target="_blank" rel="noreferrer" style={{ color: '#FF007F', fontSize: '12px', textDecoration: 'none' }}>🔗 Відкрити у новому вікні</a>
              </div>
            </div>
          );
        }

        if (part.match(/\.(jpeg|jpg|gif|png)$/i) || part.includes("t.me") || part.includes("telegram")) {
          return (
            <div key={i} style={{ margin: '10px 0' }}>
              <img src={part} alt="attachment" style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '300px', objectFit: 'cover' }} onError={(e)=>{e.target.style.display='none'}} />
              <br/>
              <a href={part} target="_blank" rel="noreferrer" style={{ color: '#FF007F', fontSize: '14px' }}>🔗 Відкрити посилання</a>
            </div>
          );
        }
        return <a key={i} href={part} target="_blank" rel="noreferrer" style={{ color: '#FF007F' }}>{part}</a>;
      }
      return part;
    });
  }

  let clickTimeout = null;
  function handleBadgeClick() {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      clickTimeout = null;
    } else {
      clickTimeout = setTimeout(() => {
        clickTimeout = null;
        alert("ℹ️ Ці інструменти редагування бачите лише ви (адмін).\n\n💡 Хочете побачити, як платформа виглядає для учня? Клікніть на цей значок двічі швидко!");
      }, 300);
    }
  }

  function handleBadgeDoubleClick() {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      clickTimeout = null;
    }
    setIsPreviewMode(prev => !prev);
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  }

  function handleProgressClick() {
    const percent = courseProgress.total > 0 ? Math.round((courseProgress.completed / courseProgress.total) * 100) : 0;
    alert(
      `📊 Інформація про прогрес курсу:\n\n` +
      `• Що це означає: Показник демонструє ваш загальний ступінь проходження всіх навчальних матеріалів і тестів у цьому курсі.\n` +
      `• Як рахується: Формула вираховує відсоток успішно виконаних завдань від загальної кількості опублікованих завдань у всіх модулях цього курсу.\n\n` +
      `Поточний статус: ${percent}% (${courseProgress.completed} з ${courseProgress.total} завдань виконано).`
    );
  }

  const GlobalStyles = () => (
    <style>{`
      body { background-color: ${theme.bg}; color: ${theme.text}; transition: all 0.3s ease; }
      input, textarea, select { background-color: ${theme.inputBg}; color: ${theme.text}; border: 1px solid ${theme.inputBorder}; }
      input::placeholder, textarea::placeholder { color: ${theme.textSecondary}; }

      /* 3D Flip Card Styles */
      .card-3d-container { perspective: 1000px; width: 100%; cursor: pointer; }
      .card-3d-inner { position: relative; width: 100%; min-height: 160px; text-align: center; transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1); transform-style: preserve-3d; }
      .card-3d-inner.flipped { transform: rotateY(180deg); }
      .card-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 12px; padding: 25px; box-sizing: border-box; }
      .card-front { }
      .card-back { transform: rotateY(180deg); }

      /* АНІМАЦІЯ ДЛЯ СПОЙЛЕРА (МИГОТІННЯ) */
      @keyframes ffPulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; color: #FF007F; }
        100% { opacity: 1; }
      }
    `}</style>
  );

  // --- ЕКРАН АДМІН-ПАНЕЛІ (НОВІ ЗАЯВКИ) ---
  if (globalView === 'admin_panel') {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', background: theme.bg }}>
        <GlobalStyles />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => setGlobalView(null)} style={{ background: 'transparent', border: 'none', color: '#FF007F', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            ← Назад на головну
          </button>
        </div>
        <AdminPanel />
      </div>
    );
  }
  
  // --- ЕКРАН ІНТЕРВАЛЬНОГО ПОВТОРЕННЯ ---
  if (globalView === 'spaced') {
    const currentCard = spacedCards[spacedIndex];
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', textAlign: 'center' }}>
        <GlobalStyles />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => setGlobalView(null)} style={{ background: 'transparent', border: 'none', color: '#FF007F', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            ← Назад на головну
          </button>
        </div>
        <h2 style={{ color: theme.text }}>🔄 Інтервальне повторення</h2>
        <p style={{ color: theme.textSecondary, fontSize: '13px', marginBottom: '20px' }}>Картка {spacedIndex + 1} із {spacedCards.length}</p>

        {spacedCards.length > 0 && currentCard ? (
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div className="card-3d-container" onClick={() => { playUiSound('whoosh', isSoundEnabled); setIsSpacedFlipped(!isSpacedFlipped); }}>
              <div className={`card-3d-inner ${isSpacedFlipped ? 'flipped' : ''}`}>
                <div className="card-face card-front" style={{ background: isDarkMode ? theme.cardBg : '#ffffff', color: theme.text, border: `1px solid ${theme.inputBorder}` }}>
                  <span style={{ fontSize: '11px', opacity: 0.6, marginBottom: '8px' }}>Натисни для перевороту</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{currentCard.content}</span>
                  {/* КНОПКА ОЗВУЧКИ */}
                  <button onClick={(e) => { e.stopPropagation(); speakSlovak(currentCard.content); }} style={{ background: 'transparent', border: 'none', fontSize: '32px', marginTop: '15px', cursor: 'pointer' }}>🔊</button>
                </div>
                <div className="card-face card-back" style={getCardStyle(spacedIndex, isDarkMode, true)}>
                  <span style={{ fontSize: '11px', opacity: 0.8, marginBottom: '8px' }}>Переклад</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{currentCard.correct_answer}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => handleSpacedNext(currentCard)} 
              style={{ width: '100%', marginTop: '20px', background: '#00C853', color: 'white', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Далі →
            </button>
          </div>
        ) : (
          <p style={{ color: theme.text }}>Немає карток для повторення.</p>
        )}
      </div>
    );
  }

  // --- ЕКРАН МІНІ-ГРИ "ДІАКРИТИЧНИЙ СНАЙПЕР" ---
  if (globalView === 'sniper') {
    const currentCard = sniperCards[sniperIndex % sniperCards.length]; 
    
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', textAlign: 'center' }}>
        <GlobalStyles />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => setGlobalView(null)} style={{ background: 'transparent', border: 'none', color: '#FF007F', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            ← Назад на головну
          </button>
          {sniperStatus === 'playing' && (
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 'bold', color: theme.text, display: 'block' }}>🏆 Бали: {sniperScore}</span>
              <span style={{ fontSize: '14px', letterSpacing: '2px' }}>
                {"❤️".repeat(sniperHp)}{"🖤".repeat(5 - sniperHp)}
              </span>
            </div>
          )}
        </div>

        {/* СТАРТОВЕ МЕНЮ */}
        {sniperStatus === 'menu' && (
          <div style={{ background: theme.cardBg, padding: '30px', borderRadius: '16px', maxWidth: '400px', margin: '40px auto', border: `1px solid ${theme.inputBorder}`, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '28px', margin: '0 0 15px 0' }}>🎯<br/>Діакритичний снайпер</h2>
            <p style={{ color: theme.textSecondary, fontSize: '15px', lineHeight: '1.5', textAlign: 'left', marginBottom: '25px' }}>
              <b>Правила гри:</b><br/><br/>
              ⏱ Тобі дається <b>5 секунд</b> на слово.<br/>
              ✅ Кожна правильна відповідь дає <b>+3 сек</b> до часу.<br/>
              ❤️ Ти маєш <b>5 життів</b>. Помилка або кінець часу забирають 1 життя.<br/>
              🔥 Чим далі, тим довші слова. Гра триває, поки ти виживаєш!
            </p>
            
            {isAdmin && (
              <button onClick={handleAddSniperWord} style={{ width: '100%', marginBottom: '15px', background: theme.adminBg, color: theme.adminBorder, border: `1px dashed ${theme.adminBorder}`, padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ➕ Адмін: Додати нове слово
              </button>
            )}

            <button onClick={startDiacriticalSniperGame} style={{ width: '100%', background: '#00C853', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,200,83,0.4)' }}>
              СТАРТ! 🚀
            </button>
          </div>
        )}

        {/* ЕКРАН ПРОГРАШУ */}
        {sniperStatus === 'over' && (
          <div style={{ background: theme.cardBg, padding: '30px', borderRadius: '16px', maxWidth: '400px', margin: '40px auto', border: `1px solid ${theme.inputBorder}`, boxShadow: '0 8px 25px rgba(244,67,54,0.2)' }}>
            <h3 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>💀 Гра завершена!</h3>
            <p style={{ fontSize: '20px', margin: '20px 0', color: theme.text }}>Твій рахунок: <b style={{ color: '#00C853', fontSize: '28px' }}>{sniperScore}</b></p>
            <button onClick={startDiacriticalSniperGame} style={{ width: '100%', background: '#3182ce', color: 'white', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginBottom: '10px' }}>Спробувати ще раз 🔄</button>
            <button onClick={() => setGlobalView(null)} style={{ width: '100%', background: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>На головну</button>
          </div>
        )}

        {/* АКТИВНА ГРА */}
        {sniperStatus === 'playing' && currentCard && (
          <div style={{ maxWidth: '400px', margin: '30px auto', background: theme.cardBg, padding: '25px', borderRadius: '16px', border: `1px solid ${theme.inputBorder}`, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px', color: theme.textSecondary }}>
              <span>Слово {sniperIndex + 1}</span>
              <span style={{ color: sniperTimeLeft <= 2 ? '#F44336' : theme.text, fontWeight: 'bold', fontSize: '18px' }}>⏱ {sniperTimeLeft} сек</span>
            </div>

            <p style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '5px' }}>Введи словацькою:</p>
            <h3 style={{ fontSize: '24px', color: theme.text, marginBottom: '20px' }}>{currentCard.content}</h3>

            <form onSubmit={handleSniperSubmit}>
              <input 
                type="text" 
                placeholder="Пиши сюди..." 
                value={sniperInput} 
                onChange={e => setSniperInput(e.target.value)} 
                autoFocus 
                autoComplete="off"
                style={{ width: '100%', padding: '14px', fontSize: '18px', borderRadius: '10px', marginBottom: '10px', boxSizing: 'border-box', textAlign: 'center' }} 
              />
              <button type="button" onClick={() => setSniperInput(addDiacritics(sniperInput))} style={{ width: '100%', background: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
                🪄 Авто-діакритика
              </button>
              <button type="submit" style={{ width: '100%', background: '#00C853', color: 'white', padding: '16px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>Постріл! 🎯</button>
            </form>
          </div>
        )}
      </div>
    );
  }
  
  // --- ЕКРАН "ФАЛЬШИВІ ДРУЗІ" ---
  if (globalView === 'false_friends') {
    const currentCard = ffCards[ffIndex];
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', textAlign: 'center' }}>
        <GlobalStyles />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => setGlobalView(null)} style={{ background: 'transparent', border: 'none', color: '#FF007F', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            ← Назад на головну
          </button>
          <span style={{ fontWeight: 'bold', color: theme.text }}>🏆 Бали: {ffScore}</span>
        </div>

        <h2 style={{ color: theme.text }}>🎭 Фальшиві друзі</h2>

        {isFfOver ? (
          <div style={{ background: theme.cardBg, padding: '30px', borderRadius: '16px', maxWidth: '400px', margin: '40px auto', border: `1px solid ${theme.inputBorder}` }}>
            <h3>🏁 Гра завершена!</h3>
            <p style={{ fontSize: '20px', margin: '20px 0', color: theme.text }}>Твій результат: <b>{ffScore} балів</b></p>
            <button onClick={() => setGlobalView(null)} style={{ background: '#FF007F', color: 'white', padding: '12px 25px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>На головну</button>
          </div>
        ) : currentCard && (
          <div style={{ maxWidth: '400px', margin: '30px auto', background: theme.cardBg, padding: '25px', borderRadius: '16px', border: `1px solid ${theme.inputBorder}`, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px', color: theme.textSecondary }}>
              <span>Фраза {ffIndex + 1} з {ffCards.length}</span>
            </div>

            <p style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '10px' }}>Як перекласти виділене слово?</p>
            
            {/* 1. ВИДІЛЕННЯ СЛОВА-ПАСТКИ КОЛЬОРОМ ТА ПІДКРЕСЛЕННЯМ + ОЗВУЧКА */}
            <h3 style={{ fontSize: '22px', color: theme.text, marginBottom: '25px', lineHeight: '1.4' }}>
              <button onClick={(e) => { e.stopPropagation(); speakSlovak(currentCard.slovak_phrase); }} style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', verticalAlign: 'middle', marginRight: '10px' }}>🔊</button>
              {currentCard.trap_word === "Комбо-пастка!" ? (
                <span>{currentCard.slovak_phrase} <span style={{fontSize: '14px', color: '#FF007F'}}><br/>(🔥 Комбо-пастка!)</span></span>
              ) : (
                currentCard.slovak_phrase.split(new RegExp(`(${currentCard.trap_word})`, 'gi')).map((part, i) => 
                  part.toLowerCase() === currentCard.trap_word.toLowerCase() 
                    ? <span key={i} style={{ color: '#FF007F', textDecoration: 'underline', padding: '0 2px' }}>{part}</span> 
                    : part
                )
              )}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {ffCurrentOptions.map((opt, idx) => {
                const isCorrectOption = opt === currentCard.option_correct;
                const isSelected = ffSelected === opt;
                
                let bg = theme.inputBg;
                let borderColor = theme.inputBorder;
                let color = theme.text;
                
                if (ffSelected !== null) {
                  if (isCorrectOption) {
                    bg = '#00C853'; borderColor = '#00C853'; color = 'white';
                  } else if (isSelected) {
                    bg = '#F44336'; borderColor = '#F44336'; color = 'white';
                  } else {
                    bg = isDarkMode ? '#2d3748' : '#f8fafc';
                    borderColor = isDarkMode ? '#4a5568' : '#e2e8f0';
                    color = isDarkMode ? '#718096' : '#a0aec0';
                  }
                }

                return (
                  <button 
                    key={idx}
                    onClick={() => handleFfAnswer(opt, isCorrectOption)}
                    disabled={ffSelected !== null}
                    style={{ padding: '15px', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: ffSelected === null ? 'pointer' : 'default', border: `2px solid ${borderColor}`, background: bg, color: color, transition: '0.2s', opacity: (ffSelected !== null && !isCorrectOption && !isSelected) ? 0.6 : 1 }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>

            {ffSelected !== null && (
              <div style={{ padding: '15px', borderRadius: '10px', background: ffSelected === currentCard.option_correct ? (isDarkMode ? '#22543D' : '#E8F5E9') : (isDarkMode ? '#742A2A' : '#FFEBEE'), textAlign: 'left', marginTop: '20px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: ffSelected === currentCard.option_correct ? (isDarkMode ? '#9AE6B4' : '#2E7D32') : (isDarkMode ? '#FEB2B2' : '#C62828') }}>
                  {ffSelected === currentCard.option_correct ? '✅ Точно!' : '❌ Обережно, пастка!'}
                </p>
                <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: theme.text, lineHeight: '1.4' }}>
                  {currentCard.explanation}
                </p>

                {/* 2. КНОПКА-СПОЙЛЕР (НАТИСНИ І ТРИМАЙ) */}
                <div 
                  onPointerDown={() => setFfShowTranslation(true)}
                  onPointerUp={() => setFfShowTranslation(false)}
                  onPointerLeave={() => setFfShowTranslation(false)}
                  onMouseDown={() => setFfShowTranslation(true)}
                  onMouseUp={() => setFfShowTranslation(false)}
                  onMouseLeave={() => setFfShowTranslation(false)}
                  style={{ 
                    background: isDarkMode ? '#1a202c' : '#ffffff', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    textAlign: 'center', 
                    cursor: 'pointer', 
                    userSelect: 'none',
                    border: `1px dashed ${theme.inputBorder}`,
                    animation: !ffShowTranslation ? 'ffPulse 1.5s infinite' : 'none'
                  }}
                >
                  {ffShowTranslation 
                    ? <span style={{ fontWeight: 'bold', color: theme.text }}>{currentCard.full_translation || "Повний переклад у розробці..."}</span> 
                    : <span style={{ color: theme.textSecondary, fontSize: '13px' }}>🫣 Натисни і тримай для перекладу речення</span>
                  }
                </div>

                <button onClick={handleFfNext} style={{ width: '100%', background: '#3182ce', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', marginTop: '15px', cursor: 'pointer' }}>Далі →</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  
  // ЕКРАН 3: Завдання розділу
  if (activeModule) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', paddingBottom: '100px' }}>
        <GlobalStyles />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => { if (isTrainingMode) setIsTrainingMode(false); else setActiveModule(null); }} style={{ background: 'transparent', border: 'none', color: '#FF007F', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', padding: '0' }}>
            ← Назад 
          </button>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={toggleSound} style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer' }}>
              {isSoundEnabled ? '🔊' : '🔇'}
            </button>
            <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer' }}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        
        <h2 style={{ color: theme.text }}>{activeModule.title}</h2>

        {/* КНОПКИ ТРЕНУВАННЯ / ТЕСТУ */}
        {!isTrainingMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {flashcards.length > 0 && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => startTraining(false)} style={{ flex: 1, background: '#3182ce', color: 'white', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                  🎴 Гортати ({flashcards.length})
                </button>
                <button onClick={() => startTraining(true)} style={{ flex: 1, background: '#805ad5', color: 'white', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                  📝 Тест
                </button>
              </div>
            )}
            <button onClick={handleAddMyCard} style={{ width: '100%', background: theme.inputBg, color: theme.text, padding: '12px', borderRadius: '10px', border: `1px dashed ${theme.inputBorder}`, fontWeight: 'bold', cursor: 'pointer' }}>
              ➕ Додати свою картку
            </button>
          </div>
        )}

        {isTrainingMode ? (
          <div style={{ background: theme.cardBg, padding: '25px', borderRadius: '16px', boxShadow: '0 8px 25px rgba(0,0,0,0.08)', textAlign: 'center', border: `1px solid ${theme.inputBorder}` }}>
            {isQuizFinished ? (
              <div>
                <h3 style={{ color: theme.text }}>🎉 Тренування завершено!</h3>
                <p style={{ fontSize: '18px', margin: '20px 0', color: theme.textSecondary }}>Твій результат: <b style={{ color: theme.text }}>{quizScore}</b> з <b style={{ color: theme.text }}>{flashcards.length}</b></p>
                <button onClick={() => setIsTrainingMode(false)} style={{ background: '#FF007F', color: 'white', padding: '12px 25px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Повернутися до завдань</button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '15px' }}>Картка {trainingIndex + 1} із {flashcards.length}</p>
                
                {!isTestView ? (
                  <div>
                    <div className="card-3d-container" onClick={toggleTrainingFlashcard}>
                      <div className={`card-3d-inner ${isTrainingFlipped ? 'flipped' : ''}`}>
                        <div className="card-face card-front" style={getCardStyle(trainingIndex, isDarkMode, false)}>
                          <span style={{ fontSize: '11px', opacity: 0.6, marginBottom: '8px', color: theme.textSecondary }}>Лицьова сторона (натисни для оберту)</span>
                          <span style={{ fontSize: '26px', fontWeight: 'bold', textShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.5)' : 'none' }}>{flashcards[trainingIndex].content}</span>
                        </div>
                        <div className="card-face card-front" style={getCardStyle(trainingIndex, isDarkMode, false)}>
                          <span style={{ fontSize: '11px', opacity: 0.6, marginBottom: '8px', color: theme.textSecondary }}>Лицьова (натисни)</span>
                          <span style={{ fontSize: '26px', fontWeight: 'bold' }}>{flashcards[trainingIndex].content}</span>
                          {/* КНОПКА ОЗВУЧКИ */}
                          <button onClick={(e) => { e.stopPropagation(); speakSlovak(flashcards[trainingIndex].content); }} style={{ background: 'transparent', border: 'none', fontSize: '30px', marginTop: '15px', cursor: 'pointer' }}>🔊</button>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button onClick={() => { setIsTrainingFlipped(false); setTrainingIndex(prev => Math.max(0, prev - 1)); }} disabled={trainingIndex === 0} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, cursor: 'pointer' }}>← Попередня</button>
                      <button onClick={() => { setIsTrainingFlipped(false); if (trainingIndex + 1 < flashcards.length) setTrainingIndex(prev => prev + 1); else setIsQuizFinished(true); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#3182ce', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Наступна →</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ background: theme.inputBg, padding: '20px', borderRadius: '12px', marginBottom: '20px', border: `1px solid ${theme.inputBorder}` }}>
                      <h3 style={{ fontSize: '24px', margin: '0', color: theme.text }}>
                        {/* КНОПКА ОЗВУЧКИ */}
                        <button onClick={(e) => { e.stopPropagation(); speakSlovak(flashcards[trainingIndex].content); }} style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', verticalAlign: 'middle', marginRight: '10px' }}>🔊</button>
                        {flashcards[trainingIndex].content}
                      </h3>
                    </div>

                    {selectedQuizAnswer !== null && (
                      <div style={{ padding: '15px', borderRadius: '10px', marginBottom: '15px', background: selectedQuizAnswer === flashcards[trainingIndex].correct_answer ? (isDarkMode ? '#22543D' : '#E8F5E9') : (isDarkMode ? '#742A2A' : '#FFEBEE') }}>
                        {selectedQuizAnswer === flashcards[trainingIndex].correct_answer ? (
                          <span style={{ color: isDarkMode ? '#9AE6B4' : '#2E7D32', fontWeight: 'bold', fontSize: '16px' }}>✅ Правильно!</span>
                        ) : (
                          <span style={{ color: isDarkMode ? '#FEB2B2' : '#C62828', fontWeight: 'bold', fontSize: '16px' }}>❌ Невірно!<br/><span style={{ fontSize: '14px', fontWeight: 'normal' }}>Правильна відповідь: <b>{flashcards[trainingIndex].correct_answer}</b></span></span>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                      {quizOptions.map((opt, idx) => {
                        const isCorrect = opt === flashcards[trainingIndex].correct_answer;
                        const isSelected = selectedQuizAnswer === opt;
                        
                        let btnBg = theme.inputBg;
                        let btnColor = theme.text;
                        let borderColor = theme.inputBorder;

                        if (selectedQuizAnswer !== null) {
                          if (isCorrect) { 
                            btnBg = '#00C853'; btnColor = 'white'; borderColor = '#00C853'; 
                          } else if (isSelected) { 
                            btnBg = '#F44336'; btnColor = 'white'; borderColor = '#F44336'; 
                          } else {
                            btnBg = isDarkMode ? '#2d3748' : '#f8fafc';
                            btnColor = isDarkMode ? '#718096' : '#a0aec0';
                          }
                        }

                        return (
                          <button key={idx} onClick={() => handleQuizAnswer(opt)} disabled={selectedQuizAnswer !== null} style={{ background: btnBg, color: btnColor, border: `2px solid ${borderColor}`, padding: '15px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: selectedQuizAnswer === null ? 'pointer' : 'default', transition: 'all 0.2s' }}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {selectedQuizAnswer !== null && (
                      <button onClick={nextTrainingCard} style={{ width: '100%', background: '#3182ce', color: 'white', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>Далі →</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {effectiveIsAdmin && (
              <div style={{ background: theme.adminBg, padding: '20px', borderRadius: '12px', marginBottom: '20px', border: `2px dashed ${theme.adminBorder}` }}>
                <h4 style={{ margin: '0 0 15px 0', color: theme.adminBorder }}>🛠 Додати завдання</h4>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <select value={newTaskType} onChange={e => setNewTaskType(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px' }}>
                    <option value="text">📖 Текст / Фото / Аудіо</option>
                    <option value="video">📺 Відео</option>
                    <option value="quiz">📝 Тест</option>
                    <option value="flashcard">🎴 Флеш-картка (Словник)</option>
                  </select>
                  <select value={newTaskDifficulty} onChange={e => setNewTaskDifficulty(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px' }}>
                    <option value="easy">🟢 Легко</option>
                    <option value="medium">🟡 Середньо</option>
                    <option value="hard">🔴 Складно</option>
                  </select>
                </div>
                
                <textarea 
                  placeholder={newTaskType === 'flashcard' ? "Лицьова сторона (наприклад: слово українською)..." : "Текст завдання або посилання на медіа..."}
                  value={newTaskContent} 
                  onChange={e => setNewTaskContent(e.target.value)} 
                  autoComplete="off"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', minHeight: '80px', marginBottom: '10px', boxSizing: 'border-box' }} 
                />

                {(newTaskType === 'quiz' || newTaskType === 'flashcard') && (
                  <input 
                    type="text" 
                    placeholder={newTaskType === 'flashcard' ? "Зворотна сторона (Переклад або пояснення)..." : "Правильна відповідь..."}
                    value={newTaskCorrectAnswer} 
                    onChange={e => setNewTaskCorrectAnswer(e.target.value)} 
                    autoComplete="off"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', marginBottom: '10px', boxSizing: 'border-box' }} 
                  />
                )}

                {newTaskType !== 'flashcard' && (
                  <div style={{ background: theme.cardBg, padding: '12px', borderRadius: '8px', marginBottom: '15px', border: `1px solid ${theme.inputBorder}`, textAlign: 'left' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', color: theme.textSecondary, display: 'block', marginBottom: '4px' }}>📎 Додати зображення:</label>
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: '12px', color: theme.text }} />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', color: theme.textSecondary, display: 'block', marginBottom: '4px' }}>🎧 Завантажити аудіофайл (MP3/WAV):</label>
                      <input type="file" accept="audio/*" onChange={handleAudioUpload} style={{ fontSize: '12px', color: theme.text }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: theme.textSecondary, display: 'block', marginBottom: '4px' }}>🎙 Записати голос з мікрофона:</label>
                      {isRecording ? (
                        <button onClick={stopRecording} style={{ background: '#F44336', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>⏹ Зупинити запис</button>
                      ) : (
                        <button onClick={startRecording} style={{ background: '#3182ce', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>🔴 Почати запис голосу</button>
                      )}
                    </div>
                  </div>
                )}
                
                <button onClick={handleAddTask} style={{ width: '100%', background: '#FF007F', color: 'white', padding: '15px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>+ Опублікувати</button>
              </div>
            )}

            {isLoadingTasks ? (
              <p style={{ color: theme.text }}>Завантаження...</p>
            ) : tasks.length === 0 ? (
              <div style={{ color: theme.textSecondary, fontSize: '13px', fontStyle: 'italic', textAlign: 'center', margin: '30px auto', padding: '20px', background: theme.cardBg, borderRadius: '12px', lineHeight: '1.6', maxWidth: '400px', border: `1px dashed ${theme.inputBorder}` }}>
                📂 У цьому розділі ще немає завдань.<br/>Ви можете додавати текстові матеріали, YouTube-відео, аудіофайли, записувати голос напряму з мікрофона, а також створювати інтерактивні тести та флешкартки!
              </div>
            ) : (
              allTasksToRender.map((task, index) => {
                const diff = difficultyConfig[task.difficulty || 'medium'];
                const isCompleted = completedTasks.includes(task.id);
                const isEditing = editingTaskId === task.id;
                const isFlipped = flippedCards[task.id];

                return (
                  <div key={task.id} style={{ background: theme.cardBg, padding: '20px', borderRadius: '12px', marginTop: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: isDarkMode ? `1px solid ${theme.inputBorder}` : 'none' }}>
                    {effectiveIsAdmin && isEditing ? (
                      <div>
                        <select value={editDifficulty} onChange={e => setEditDifficulty(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }}>
                          <option value="easy">🟢 Легко</option>
                          <option value="medium">🟡 Середньо</option>
                          <option value="hard">🔴 Складно</option>
                        </select>
                        <textarea value={editContent} onChange={e => setEditContent(e.target.value)} style={{ width: '100%', padding: '10px', minHeight: '80px', marginBottom: '10px' }} />
                        {(task.type === 'quiz' || task.type === 'flashcard') && <input type="text" value={editAnswer} onChange={e => setEditAnswer(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />}
                        <button onClick={() => handleSaveEdit(task.id)} style={{ background: '#00C853', color: 'white', padding: '10px', border: 'none', marginRight: '5px' }}>Зберегти</button>
                        <button onClick={() => setEditingTaskId(null)} style={{ background: '#ccc', padding: '10px', border: 'none' }}>Скасувати</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <h4 style={{ margin: 0, color: theme.text }}>
                            {task.type === 'video' ? '📺 Відео' : task.type === 'quiz' ? '📝 Тест' : task.type === 'flashcard' ? '🎴 Словник' : '📖 Матеріал'} {index + 1}
                          </h4>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ background: diff.color, color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>{diff.label}</span>
                            {effectiveIsAdmin && (
                              <>
                                <button onClick={() => { setEditingTaskId(task.id); setEditContent(task.content); setEditAnswer(task.correct_answer || ''); setEditDifficulty(task.difficulty || 'medium'); }} style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '6px', padding: '5px', color: theme.text }}>✏️</button>
                                <button onClick={() => handleDeleteTask(task.id)} style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', padding: '5px' }}>🗑</button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {task.type === 'flashcard' ? (
                          <div>
                            <div className="card-3d-container" onClick={() => toggleFlashcard(task.id)}>
                              <div className={`card-3d-inner ${isFlipped ? 'flipped' : ''}`}>
                                {/* БІЛА ЛИЦЬОВА СТОРОНА */}
                                <div className="card-face card-front" style={{ background: isDarkMode ? theme.cardBg : '#ffffff', color: theme.text, border: `1px solid ${theme.inputBorder}` }}>
                                  <span style={{ fontSize: '11px', opacity: 0.6, marginBottom: '8px' }}>🔄 Натисни</span>
                                  <span style={{ fontSize: '22px', fontWeight: 'bold' }}>{task.content}</span>
                                  {/* КНОПКА ОЗВУЧКИ */}
                                  <button onClick={(e) => { e.stopPropagation(); speakSlovak(task.content); }} style={{ background: 'transparent', border: 'none', fontSize: '26px', marginTop: '10px', cursor: 'pointer' }}>🔊</button>
                                </div>
                                {/* КОЛЬОРОВИЙ ГРАДІЄНТ НА ЗВОРОТІ */}
                                <div className="card-face card-back" style={getCardStyle(index, isDarkMode, true)}>
                                  <span style={{ fontSize: '11px', opacity: 0.8, marginBottom: '8px', color: isDarkMode ? '#e2e8f0' : '#4a5568' }}>Переклад</span>
                                  <span style={{ fontSize: '22px', fontWeight: 'bold', textShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.5)' : 'none' }}>{task.correct_answer}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                              {isCompleted ? (
                                <div style={{ flex: 1, background: isDarkMode ? '#22543D' : '#E8F5E9', color: isDarkMode ? '#9AE6B4' : '#2E7D32', padding: '10px', textAlign: 'center', fontWeight: 'bold', borderRadius: '8px' }}>✅ Вивчено (+{diff.points} балів)</div>
                              ) : (
                                <button onClick={() => handleCompleteFlashcard(task)} style={{ flex: 1, background: '#00C853', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>✅ Я вивчив(ла) це слово</button>
                              )}
                              
                              {/* КНОПКА ВИДАЛЕННЯ ДЛЯ ВЛАСНОЇ КАРТКИ УЧНЯ */}
                              {task.isCustom && (
                                <button onClick={() => handleDeleteMyCard(task.id)} style={{ background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                                  🗑 Видалити
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ color: theme.text }}>{renderContent(task.content)}</div>
                            {task.type === 'quiz' && (
                              <div style={{ marginTop: '15px' }}>
                                {isCompleted ? <div style={{ background: isDarkMode ? '#22543D' : '#E8F5E9', color: isDarkMode ? '#9AE6B4' : '#2E7D32', padding: '10px', textAlign: 'center', fontWeight: 'bold', borderRadius: '8px' }}>✅ Виконано (+{diff.points} балів)</div> : (
                                  <>
                                    <input type="text" placeholder="Твоя відповідь..." value={userAnswers[task.id] || ''} onChange={e => setUserAnswers({ ...userAnswers, [task.id]: e.target.value })} autoComplete="off" style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box', borderRadius: '8px' }} />
                                    <button onClick={() => handleAnswerSubmit(task)} style={{ width: '100%', background: '#00C853', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Перевірити</button>
                                  </>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    );
  }

  // ЕКРАН 2: Список розділів вибраного курсу
  if (selectedCourse) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', fontFamily: 'sans-serif', minHeight: '100vh' }}>
        <GlobalStyles />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => setSelectedCourse(null)} style={{ background: 'transparent', border: 'none', color: '#FF007F', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', padding: '0' }}>
            ← Всі курси
          </button>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={toggleSound} style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer' }}>
              {isSoundEnabled ? '🔊' : '🔇'}
            </button>
            <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer' }}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {effectiveIsAdmin && isEditingCourseTitle ? (
          <div style={{ marginBottom: '20px' }}>
            <input type="text" value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} style={{ fontSize: '20px', padding: '8px', textAlign: 'center', borderRadius: '6px', border: `1px solid ${theme.adminBorder}`, width: '80%' }} />
            <br/><br/>
            <button onClick={handleSaveCourseTitle} style={{ background: '#00C853', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginRight: '5px' }}>Зберегти</button>
            <button onClick={() => setIsEditingCourseTitle(false)} style={{ background: '#ccc', padding: '8px 15px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Скасувати</button>
          </div>
        ) : (
          <h2 style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', color: theme.text }}>
            {selectedCourse.title}
            {effectiveIsAdmin && <button onClick={() => { setIsEditingCourseTitle(true); setNewCourseTitle(selectedCourse.title); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✏️</button>}
          </h2>
        )}

        {userName && <p style={{ color: theme.textSecondary }}>Привіт, <b>{userName}</b>!</p>}
        
        {isAdmin && (
          <span 
            onClick={handleBadgeClick}
            onDoubleClick={handleBadgeDoubleClick}
            style={{ background: isPreviewMode ? '#4A5568' : '#FF007F', color: 'white', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', userSelect: 'none', display: 'inline-block', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
            title="Клікніть для довідки, двічі клікніть для перемикання превью"
          >
            {isPreviewMode ? '👤 Учень (Превью)' : 'ADMIN'}
          </span>
        )}

        {courseProgress.total > 0 && (
          <div 
            onClick={handleProgressClick}
            style={{ maxWidth: '400px', margin: '20px auto 10px auto', background: theme.cardBg, padding: '15px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', textAlign: 'left', cursor: 'pointer', transition: 'transform 0.1s ease', border: `1px solid ${theme.inputBorder}` }}
            title="Клікніть, щоб дізнатися деталі про розрахунок прогресу"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: theme.text }}>
              <span>📊 Прогрес курсу ℹ️</span>
              <span>{Math.round((courseProgress.completed / courseProgress.total) * 100)}% ({courseProgress.completed}/{courseProgress.total})</span>
            </div>
            <div style={{ width: '100%', background: theme.inputBg, borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${(courseProgress.completed / courseProgress.total) * 100}%`, background: '#00C853', height: '100%', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {effectiveIsAdmin && (
          <div style={{ background: theme.adminBg, padding: '15px', borderRadius: '12px', maxWidth: '400px', margin: '20px auto', border: `2px dashed ${theme.adminBorder}`, textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 10px 0', color: theme.adminBorder }}>➕ Додати новий розділ / тиждень</h4>
            <input type="text" placeholder="Назва (напр., Тиждень 1)" value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box', borderRadius: '8px' }} />
            <button onClick={handleAddModule} style={{ width: '100%', background: '#FF007F', color: 'white', padding: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px' }}>Створити розділ</button>
          </div>
        )}

        <div style={{ marginTop: '20px', maxWidth: '400px', margin: '20px auto', textAlign: 'left' }}>
          <h3 style={{ color: theme.text }}>Програма курсу:</h3>
          
          {modules.length === 0 ? (
            <p style={{ color: theme.textSecondary, fontSize: '13px', fontStyle: 'italic', lineHeight: '1.5', padding: '10px 0' }}>
              💡 Тут поки немає розділів. Створіть перший тиждень або модуль вище. У розділах ви зможете структурувати навчальні матеріали, відео, аудіо та тести для студентів.
            </p>
          ) : (
            modules.map((mod) => (
              <div key={mod.id} style={{ background: theme.cardBg, padding: '15px', borderRadius: '10px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${theme.inputBorder}` }}>
                {effectiveIsAdmin && editingModuleId === mod.id ? (
                  <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                    <input type="text" value={editModuleTitleText} onChange={e => setEditModuleTitleText(e.target.value)} style={{ flex: 1, padding: '5px' }} />
                    <button onClick={() => handleSaveModuleTitle(mod.id)} style={{ background: '#00C853', color: 'white', border: 'none', padding: '5px 10px' }}>💾</button>
                  </div>
                ) : (
                  <>
                    <b onClick={() => setActiveModule(mod)} style={{ cursor: 'pointer', flex: 1, color: theme.text }}>{mod.title}</b>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {effectiveIsAdmin && (
                        <>
                          <button onClick={() => { setEditingModuleId(mod.id); setEditModuleTitleText(mod.title); }} style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '4px', padding: '4px', cursor: 'pointer', color: theme.text }}>✏️</button>
                          <button onClick={() => handleDeleteModule(mod.id)} style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}>🗑</button>
                        </>
                      )}
                      <span>🔓</span>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Функція для повторного запиту прямо з Web App
  const handleReapplyWeb = async () => {
    if (!telegramId) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({ access_status: 'pending' })
        .eq('telegram_id', telegramId);
        
      if (error) throw error;
      
      setAccessStatus('pending'); // Миттєво міняємо екран на "Заявка на розгляді"
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } catch (err) {
      alert("❌ Сталася помилка: " + err.message);
    }
  };
  
  // --- ЕКРАНИ ФЕЙСКОНТРОЛЮ ---
  if (accessStatus === 'loading') {
    return <div style={{ textAlign: 'center', padding: '50px', color: theme.text, background: theme.bg, minHeight: '100vh' }}>Завантаження...</div>;
  }

  if (accessStatus === 'no_auth') {
    return (
      <div style={{ textAlign: 'center', padding: '50px', background: theme.bg, color: theme.text, minHeight: '100vh' }}>
        <h2 style={{ fontSize: '30px', marginBottom: '20px' }}>🛑 Доступ закрито</h2>
        <p style={{ fontSize: '16px', color: theme.textSecondary, marginBottom: '30px' }}>
          Hackademia — це закрита платформа. Увійти можна виключно через нашого офіційного Telegram-бота.
        </p>
        <a href="https://t.me/hackademiapp_bot" target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#3182ce', color: 'white', padding: '15px 30px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(49,130,206,0.3)' }}>
          Перейти в Telegram-бота 🚀
        </a>
      </div>
    );
  }

  if (accessStatus === 'pending') {
    return (
      <div style={{ textAlign: 'center', padding: '50px', background: theme.bg, color: theme.text, minHeight: '100vh' }}>
        <h2 style={{ fontSize: '30px', marginBottom: '20px' }}>⏳ Заявка на розгляді</h2>
        <p style={{ fontSize: '16px', color: theme.textSecondary, marginBottom: '30px' }}>
          Ваш запит на доступ надіслано головному адміністратору.
          <br /><br />
          Щойно адміністратор підтвердить вашу заявку, оновіть цю сторінку!
        </p>
        <button onClick={() => window.location.reload()} style={{ background: '#00C853', color: 'white', padding: '15px 30px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
          🔄 Оновити сторінку
        </button>
      </div>
    );
  }

  if (accessStatus === 'rejected') {
    return (
      <div style={{ textAlign: 'center', padding: '50px', background: theme.bg, color: theme.text, minHeight: '100vh' }}>
        <h2 style={{ fontSize: '30px', marginBottom: '20px', color: '#F44336' }}>❌ У доступі відмовлено</h2>
        <p style={{ fontSize: '16px', color: theme.textSecondary, marginBottom: '30px', lineHeight: '1.5' }}>
          Ваш доступ до платформи скасовано. <br/><br/>
          Щоб відновити доступ, придбайте новий курс або лекцію. Після оплати натисніть кнопку нижче, щоб надіслати запит адміністратору.
        </p>
        <button 
          onClick={handleReapplyWeb} 
          style={{ background: '#3182ce', color: 'white', padding: '15px 30px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 10px rgba(49,130,206,0.3)' }}
        >
          🔄 Надіслати запит повторно
        </button>
      </div>
    );
  }

  // Якщо accessStatus === 'approved', код піде далі і покаже Головну сторінку
  
// ЕКРАН 1: Головна сторінка вибору курсів
  return (
    <div style={{ textAlign: 'center', padding: '30px', fontFamily: 'sans-serif', minHeight: '100vh', background: theme.bg }}>
      <GlobalStyles />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div></div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          
          {/* НОВИЙ ДЗВІНОЧОК АДМІНА */}
          {effectiveIsAdmin && (
            <div 
              onClick={() => setGlobalView('admin_panel')} 
              style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%', background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, transition: '0.2s' }}
              title="Адмін-панель (Заявки)"
            >
              <span style={{ fontSize: '20px', animation: pendingCount > 0 ? 'ffPulse 1.5s infinite' : 'none' }}>🔔</span>
              {pendingCount > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#FF007F', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '12px', border: '2px solid ' + theme.bg }}>
                  {pendingCount}
                </span>
              )}
            </div>
          )}

          <button onClick={toggleSound} style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer' }}>
            {isSoundEnabled ? '🔊' : '🔇'}
          </button>
          <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer' }}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <h1 style={{ color: theme.text }}>🎓 Hackademia Курси</h1>
      {userName && <p style={{ color: theme.textSecondary }}>Привіт, <b>{userName}</b>!</p>}
      
      {isAdmin && (
        <span 
          onClick={handleBadgeClick}
          onDoubleClick={handleBadgeDoubleClick}
          style={{ background: isPreviewMode ? '#4A5568' : '#FF007F', color: 'white', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', userSelect: 'none', display: 'inline-block', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
          title="Клікніть для довідки, двічі клікніть для перемикання превью"
        >
          {isPreviewMode ? '👤 Учень (Превью)' : 'ADMIN'}
        </span>
      )}

      {!window.Telegram?.WebApp?.initDataUnsafe?.user && (
        <div style={{ margin: '15px auto', maxWidth: '300px' }}>
          <input 
            type="text" 
            placeholder="Твоє ім'я для веб-версії" 
            defaultValue={localStorage.getItem('hack_browser_user') || ''} 
            onBlur={e => { localStorage.setItem('hack_browser_user', e.target.value); window.location.reload(); }}
            style={{ padding: '8px', width: '100%', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, boxSizing: 'border-box' }}
          />
        </div>
      )}

      {effectiveIsAdmin && (
        <div style={{ margin: '20px 0' }}>
          <button onClick={handleAddCourse} style={{ background: '#FF007F', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Створити новий курс</button>
        </div>
      )}

      <div style={{ marginTop: '30px', maxWidth: '400px', margin: '30px auto' }}>
        <h3 style={{ color: theme.text }}>Обери курс:</h3>
        
        {effectiveIsAdmin && courses.length > 1 && (
          <p style={{ fontSize: '13px', color: theme.textSecondary, fontStyle: 'italic', marginBottom: '15px' }}>
            💡 Затисни і потягни блок курсу, щоб змінити його позицію
          </p>
        )}

        {effectiveIsAdmin ? (
          <Reorder.Group axis="y" values={courses} onReorder={handleReorderCourses} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {courses.map(course => (
              <Reorder.Item
                key={course.id}
                value={course}
                whileDrag={{ scale: 1.05, boxShadow: "0px 15px 25px rgba(255, 0, 127, 0.25)" }} 
                style={{ background: theme.cardBg, padding: '20px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab', position: 'relative', border: `1px solid ${theme.inputBorder}` }}
              >
                <span onClick={() => setSelectedCourse(course)} style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', color: theme.text, flex: 1, textAlign: 'left' }}>
                  🔓 {course.title}
                </span>
                
                {courses.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }} style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer', zIndex: 10 }}>🗑</button>
                )}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          courses.map(course => {
            const hasAccess = allowedCourses.includes(course.id);
            return (
              <div key={course.id} style={{ 
                background: theme.cardBg, padding: '20px', borderRadius: '12px', marginBottom: '15px', 
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', 
                alignItems: 'center', border: `1px solid ${theme.inputBorder}`,
                opacity: hasAccess ? 1 : 0.5, // Закриті курси напівпрозорі
                transition: 'opacity 0.3s'
              }}>
                <span 
                  onClick={() => {
                    if (hasAccess) {
                      setSelectedCourse(course);
                    } else {
                      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
                      alert("🔒 Цей курс наразі закритий для вас.\nЯкщо ви його вже оплатили, будь ласка, зачекайте на схвалення або напишіть адміністратору.");
                    }
                  }} 
                  style={{ cursor: hasAccess ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '18px', color: theme.text, flex: 1, textAlign: 'left' }}
                >
                  {hasAccess ? '🔓' : '🔒'} {course.title}
                </span>
              </div>
            );
          })
        )}
      </div>
	  
	  
      {/* ГЛОБАЛЬНІ ІНТЕРАКТИВНІ БЛОКИ (НЕЗАЛЕЖНО ВІД КУРСІВ) */}
      <div style={{ maxWidth: '400px', margin: '25px auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button 
          onClick={startSpacedRepetition}
          style={{ background: 'linear-gradient(135deg, #3182ce 0%, #63b3ed 100%)', color: 'white', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(49,130,206,0.3)' }}
        >
          <span>🔄 Повторити сьогодні (Інтервальне)</span>
        </button>

        <button 
          onClick={() => { setGlobalView('sniper'); setSniperStatus('menu'); }}
          style={{ background: 'linear-gradient(135deg, #805ad5 0%, #d6bcfa 100%)', color: 'white', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(128,90,213,0.3)' }}
        >
          <span>🎯 Міні-гра: Діакритичний снайпер</span>
        </button>
        <button 
          onClick={startFalseFriends} 
          style={{ background: 'linear-gradient(135deg, #ed8936 0%, #f6ad55 100%)', color: 'white', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(237,137,54,0.3)' }}
        >
          <span>🎭 Міні-гра: Фальшиві слова</span>
        </button>
      </div>

      {isAdmin && (
        <div style={{ marginTop: '60px', opacity: 0.6, fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          {effectiveIsAdmin && (
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center', color: theme.textSecondary }}>
              <span>Додати адміна:</span>
              <input 
                type="number" 
                placeholder="Telegram ID" 
                value={newAdminTelegramId} 
                onChange={e => setNewAdminTelegramId(e.target.value)} 
                style={{ padding: '4px 8px', borderRadius: '4px', border: `1px solid ${theme.inputBorder}`, fontSize: '12px', width: '100px' }} 
              />
              <button onClick={handleMakeAdmin} style={{ background: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>OK</button>
            </div>
          )}
          
          <button onClick={handleCloudBackup} style={{ background: 'transparent', border: '1px solid #00C853', color: '#00C853', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
            ☁️ Зробити бекап у хмару
          </button>
          
          <button onClick={() => setIsHelpOpen(true)} style={{ background: 'transparent', border: '1px solid #3182ce', color: '#3182ce', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
            ❓ Довідка
          </button>
          
          <button onClick={handleCloudRestore} style={{ background: 'transparent', border: '1px solid #d32f2f', color: '#d32f2f', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginTop: '-5px' }}>
            🔄 Відновити останній бекап
          </button>
        </div>
      )}
    
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
	  {/* ПЛАВАЮЧЕ СПОВІЩЕННЯ ДЛЯ АДМІНА */}
      {effectiveIsAdmin && studentsNeedingCourses.length > 0 && (
        <div style={{
          position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999,
          background: theme.cardBg, padding: '20px', borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)', border: `2px solid #FF007F`,
          maxWidth: '320px', textAlign: 'left', animation: 'ffPulse 2s infinite'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: theme.text, fontSize: '18px' }}>🚨 Увага!</h4>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: theme.textSecondary, lineHeight: '1.4' }}>
            Нещодавно ви додали учн{studentsNeedingCourses.length > 1 ? 'ів' : 'я'}: 
            <b style={{ color: theme.text }}> {studentsNeedingCourses.map(s => s.first_name || 'Без імені').join(', ')}</b>. <br/><br/>
            Який курс та групу бажаєте їм призначити?
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setGlobalView('admin_panel')} 
              style={{ flex: 1, background: '#FF007F', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ⚙️ Налаштувати
            </button>
            <button 
              onClick={dismissCourseAlert}
              style={{ background: theme.inputBg, color: theme.textSecondary, border: `1px solid ${theme.inputBorder}`, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Пізніше
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;