import React, { useEffect, useState } from 'react';
import Tesseract from 'tesseract.js'; // <--- ДОДАЛИ БІБЛІОТЕКУ OCR
import HelpModal from './HelpModal';
import { supabase } from './supabase';
import { Reorder } from 'framer-motion';
import { translations } from './i18n';
import AdminPanel from './AdminPanel';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Vocabulary from './Vocabulary';
import Landing from './Landing';
import Login from './Login';

function normalizeSlovak(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/[áäàâãå]/g, 'a')
    .replace(/[čç]/g, 'c')
    .replace(/[ď]/g, 'd')
    .replace(/[éěëêè]/g, 'e')
    .replace(/[íîïì]/g, 'i')
    .replace(/[ĺľ]/g, 'l')
    .replace(/[ňń]/g, 'n')
    .replace(/[óôöõòø]/g, 'o')
    .replace(/[ŕ]/g, 'r')
    .replace(/[šś]/g, 's')
    .replace(/[ť]/g, 't')
    .replace(/[úůüûù]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[žźż]/g, 'z')
    .trim();
}

// --- ЗВУКОВИЙ ДВИЖОК ---
let audioCtx = null;

// --- ФОНОВІ ІКОНКИ ДЛЯ ВСІЄЇ ПЛАТФОРМИ ---
const BgIconBook = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c1.66 0 3.218.51 4.5 1.38v-14.25a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" /></svg>;
const BgIconAcademic = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>;
const BgIconGlobe = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.896 1.157C8.583 4.251 7.235 5.564 6.22 7.214h4.482l-.598-3.807zM5.535 8.714C5.19 9.738 5 10.84 5 12c0 1.16.19 2.262.535 3.286h4.862l-.768-3.286-1.63 1.63a.75.75 0 01-1.06-1.06l3-3a.75.75 0 011.06 0l3 3a.75.75 0 11-1.06 1.06l-1.63-1.63.768 3.286h4.862c.345-1.024.535-2.126.535-3.286 0-1.16-.19-2.262-.535-3.286H5.535zm12.245 8.497H13.3l.598 3.807c1.521-.843 2.869-2.156 3.882-3.807zm-9.56 0H6.22a8.216 8.216 0 003.882 3.807l.598-3.807h-2.48zM13.3 3.407l-.598 3.807h4.482a8.216 8.216 0 00-3.884-3.807z" clipRule="evenodd" /></svg>;
const BgIconChat = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" /></svg>;
const BgIconTranslate = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>;

// --- НОВІ ІКОНКИ ДЛЯ ЗАТИШНОЇ ТЕМИ ---
const WarmIconCoffee = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2,21V19H20V21H2M20,8V5H18V8H20M20,3A2,2 0 0,1 22,5V8A2,2 0 0,1 20,10H18V13A4,4 0 0,1 14,17H8A4,4 0 0,1 4,13V3H20M16,5H6V13A2,2 0 0,0 8,15H14A2,2 0 0,0 16,13V5Z" /></svg>;
const WarmIconLeaf = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 7,11.5 7,11.5C7,11.5 9,8 17,8Z" /></svg>;
const WarmIconStar = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12,2L14.8,9.2L22,12L14.8,14.8L12,22L9.2,14.8L2,12L9.2,9.2L12,2Z" /></svg>;

const InteractiveWarmPngs = () => (
  <>
    <div className="interactive-png" style={{ top: '10%', left: '5%', width: '120px', height: '120px', animationDelay: '0s' }}>
       <WarmIconCoffee />
    </div>
    <div className="interactive-png" style={{ top: '55%', right: '5%', width: '180px', height: '180px', animationDelay: '2s' }}>
       <WarmIconLeaf />
    </div>
    <div className="interactive-png" style={{ bottom: '15%', left: '20%', width: '100px', height: '100px', animationDelay: '4s' }}>
       <WarmIconStar />
    </div>
  </>
);

const FloatingBackgrounds = ({ themeMode, theme }) => {
  if (themeMode === 'warm') return <InteractiveWarmPngs />;
  
  return (
    <>
      <div className="bg-element" style={{ top: '15%', left: '8%', width: '80px', animation: 'floatBg 9s ease-in-out infinite' }}><BgIconBook /></div>
      <div className="bg-element" style={{ top: '65%', right: '8%', width: '100px', animation: 'floatBg 12s ease-in-out infinite 1s' }}><BgIconAcademic /></div>
      <div className="bg-element" style={{ top: '30%', right: '12%', width: '70px', animation: 'floatBg 10s ease-in-out infinite 2s' }}><BgIconChat /></div>
      <div className="bg-element" style={{ bottom: '15%', left: '15%', width: '90px', animation: 'floatBg 11s ease-in-out infinite 0.5s' }}><BgIconGlobe /></div>
      <div className="bg-element" style={{ top: '12%', right: '28%', width: '110px', animation: 'floatBg 14s ease-in-out infinite 1.5s', opacity: theme.bgIconOpacity * 0.8 }}><BgIconTranslate /></div>
    </>
  );
};

function playUiSound(type, isEnabled) {
  if (!isEnabled) return;
  try {
    if (type === 'ding') {
      // Звук успіху / збереження
      const audio = new Audio('/success.mp3');
      audio.play().catch(e => console.log("Помилка аудіо:", e));
      
    } else if (type === 'buzz') {
      // Звук помилки
      const audio = new Audio('/error.mp3');
      audio.play().catch(e => console.log("Помилка аудіо:", e));
      
    } else if (type === 'whoosh') {
      // Залишаємо легкий синтезований звук для перегортання карток (щоб не шукати для нього mp3)
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;
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
  } catch (e) { 
    console.error(e); 
  }
}

window.hackPlaySound = (type) => { const isSoundEnabled = localStorage.getItem('hack_sound') !== 'false'; playUiSound(type, isSoundEnabled); };

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
  if (!text) return;

  // 1. Пробуємо Google API (найкраща вимова)
  const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=sk&client=tw-ob&q=${encodeURIComponent(text)}`;
  globalAudioPlayer.src = audioUrl;
  
  globalAudioPlayer.play().catch(err => {
    console.warn("Мережеве аудіо не спрацювало:", err);
    
    // 2. Якщо заблоковано, використовуємо системний голос
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'sk-SK';
      utterance.rate = 0.85;

      // Перевіряємо, чи є в системі саме словацький голос
      const voices = window.speechSynthesis.getVoices();
      const slovakVoice = voices.find(v => v.lang === 'sk-SK' || v.lang.startsWith('sk'));
      
      if (slovakVoice) {
        // Якщо є — читаємо
        utterance.voice = slovakVoice;
        window.speechSynthesis.speak(utterance);
      } else {
        // Якщо немає (щоб не читало англійським акцентом!) — виводимо Popup
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showPopup({
            title: "Блокування звуку 🔇",
            message: "Ваш пристрій блокує звук у Telegram і не має словацького голосу.\n\nВідкрийте платформу у звичайному браузері (Chrome/Safari), щоб звук працював ідеально. Прогрес збережеться!",
            buttons: [
              { id: "open_web", type: "default", text: "🌐 Відкрити в браузері" },
              { type: "cancel", text: "Закрити" }
            ]
          }, (btnId) => {
            if (btnId === "open_web") {
              const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
              let url = "https://hackademia-web.vercel.app/";
              if (tgUser) {
                const authData = JSON.stringify({ id: tgUser.id, first_name: tgUser.first_name });
                const authStr = btoa(encodeURIComponent(authData));
                url += "?auth=" + authStr;
              }
              window.Telegram.WebApp.openLink(url);
            }
          });
        }
      }
    }
  });
}

// --- КОМПОНЕНТ ВНУТРІШНЬОГО ЧАТУ (СПРИНТ 3: МАЛЮВАННЯ НА ФОТО + CANVAS) ---
function ChatView({ dbUserId, isAdmin, userProfile, theme, t, courses, onBack }) {
  const isTeacher = userProfile?.role === 'teacher';
  const showUserList = isAdmin || isTeacher;

  const [messages, setMessages] = React.useState([]);
  const [chatText, setChatText] = React.useState('');
  const [chatUsers, setChatUsers] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeChatUserId, setActiveChatUserId] = React.useState(showUserList ? null : dbUserId);
  const [unreadPerUser, setUnreadPerUser] = React.useState({});
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  
  // --- СТАНИ ДЛЯ ГОЛОСОВИХ ПОВІДОМЛЕНЬ В ЧАТІ ---
  const [isRecordingVoice, setIsRecordingVoice] = React.useState(false);
  const [voiceRecorder, setVoiceRecorder] = React.useState(null);
  const [isUploadingVoice, setIsUploadingVoice] = React.useState(false);
  const [recordedVoiceBlob, setRecordedVoiceBlob] = React.useState(null);
  const [recordedVoiceUrl, setRecordedVoiceUrl] = React.useState(null);

  const [fullscreenImg, setFullscreenImg] = React.useState(null);
  const [editingUser, setEditingUser] = React.useState(null);
  const [editFormData, setEditFormData] = React.useState({});
  
  const [editUserCourses, setEditUserCourses] = React.useState([]);

  // Функція швидкої видачі доступу до курсу
  const handleToggleCourse = async (courseId) => {
    const tgId = editingUser.telegram_id;
    if (!tgId) return alert("❌ У цього користувача немає Telegram ID");

    const hasAccess = editUserCourses.includes(courseId);
    try {
      if (hasAccess) {
        await supabase.from('user_courses').delete().match({ user_telegram_id: tgId, course_id: courseId });
        setEditUserCourses(editUserCourses.filter(id => id !== courseId));
      } else {
        await supabase.from('user_courses').upsert({ user_telegram_id: tgId, course_id: courseId }, { onConflict: 'user_telegram_id, course_id' });
        setEditUserCourses([...editUserCourses, courseId]);
      }
    } catch (err) { alert("Помилка: " + err.message); }
  };
  
  // Функція перенесення користувача в архів / з архіву
  const handleArchiveUser = async (newStatus) => {
    if (newStatus === 'archived' && !window.confirm("📦 Точно перенести цього користувача в архів? Він зникне з активних чатів та втратить доступ до платформи.")) return;
    
    try {
      await supabase.from('users').update({ access_status: newStatus }).eq('id', editingUser.id);
      fetchUsers();
      setEditingUser(null);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } catch (err) {
      alert("Помилка: " + err.message);
    }
  };
  
  const [showArchive, setShowArchive] = React.useState(false);
  
  const [replyingTo, setReplyingTo] = React.useState(null);
  const [hoveredMsgId, setHoveredMsgId] = React.useState(null);
  const [contextMenu, setContextMenu] = React.useState({ visible: false, x: 0, y: 0, msg: null });
  
  // === СТАНИ ДЛЯ МАЛЮВАННЯ (CANVAS) ===
  const [isDrawingMode, setIsDrawingMode] = React.useState(false);
  const [drawTool, setDrawTool] = React.useState('pen'); // 'pen' або 'rect'
  const [drawColor, setDrawColor] = React.useState('#FF3B30');
  const [drawSize, setDrawSize] = React.useState(4);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [isSavingCanvas, setIsSavingCanvas] = React.useState(false);
  
  const [activeBlankIndex, setActiveBlankIndex] = useState(null);
  const [inlineInputVal, setInlineInputVal] = useState('');

// Історія для Undo та перевірка змін
  const [drawHistory, setDrawHistory] = React.useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [savedImageData, setSavedImageData] = React.useState(null); // Для прев'ю прямокутника
  const [startCoords, setStartCoords] = React.useState({ x: 0, y: 0 });
  
  const canvasRef = React.useRef(null);

  const messagesEndRef = React.useRef(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  React.useEffect(() => {
    const handleClickOutside = () => setContextMenu({ visible: false, x: 0, y: 0, msg: null });
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const getGroupBadgeStyle = (groupName) => {
    if (!groupName || groupName === '(Без групи)') return { show: false };
    let hash = 0;
    for (let i = 0; i < groupName.length; i++) hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs((hash * 137) % 360); 
    return { bg: `hsl(${hue}, 80%, 92%)`, text: `hsl(${hue}, 80%, 35%)`, show: true };
  };

  const fetchUsers = async () => {
    if (!showUserList) return;
    let query = supabase.from('users').select('id, first_name, last_name, avatar_url, email, role, telegram_id, group_id, created_at, last_message_at, access_status');
    if (isTeacher && !isAdmin) {
      const safeGroup = userProfile?.group_id || 'no-group';
      query = query.or(`group_id.eq.${safeGroup},role.eq.admin`);
    }
    const { data } = await query;
    if (data) setChatUsers(data.filter(u => u.first_name || u.email));
  };

  React.useEffect(() => { fetchUsers(); }, [showUserList]);

  const fetchUnreadPerUser = async () => {
    if (!showUserList) return;
    const { data } = await supabase.from('messages').select('user_id').eq('is_read', false).neq('sender_id', dbUserId);
    if (data) {
      const counts = {};
      data.forEach(msg => { counts[msg.user_id] = (counts[msg.user_id] || 0) + 1; });
      setUnreadPerUser(counts);
    }
  };

  const fetchMessages = async () => {
    if (!activeChatUserId) return;
    const { data } = await supabase.from('messages').select('*').eq('user_id', activeChatUserId).order('created_at', { ascending: true });
    if (data) setMessages(data);
    await supabase.from('messages').update({ is_read: true }).eq('user_id', activeChatUserId).neq('sender_id', dbUserId).eq('is_read', false);
  };

  React.useEffect(() => {
    fetchMessages(); fetchUnreadPerUser();
    setTimeout(scrollToBottom, 300);
    const interval = setInterval(() => { fetchMessages(); fetchUnreadPerUser(); }, 3000);
    return () => clearInterval(interval);
  }, [activeChatUserId, showUserList, dbUserId]);

  const sendContent = async (textToSend) => {
    if (!textToSend.trim() || !activeChatUserId) return;
    const newMsg = { user_id: activeChatUserId, sender_id: dbUserId, text: textToSend.trim(), is_read: false, reply_to_id: replyingTo ? replyingTo.id : null };
    setReplyingTo(null);
    await supabase.from('messages').insert([newMsg]);
    
    // ОНОВЛЮЄМО ЧАС ДЛЯ СОРТУВАННЯ
    await supabase.from('users').update({ last_message_at: new Date().toISOString() }).eq('id', activeChatUserId);
    
    fetchMessages(); setTimeout(scrollToBottom, 100);
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  };

  const handleSendMessageSubmit = async (e) => { e.preventDefault(); await sendContent(chatText); setChatText(''); };

  const uploadAndSendImage = async (file) => {
    if (!file || !activeChatUserId) return;
    setIsUploadingImage(true);
    try {
      const fileExt = file.name ? file.name.split('.').pop() : 'png';
      const fileName = `chat_${dbUserId}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('chat-images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(fileName);
      await sendContent(publicUrl);
    } catch (err) { alert("❌ Помилка: " + err.message); } 
    finally { setIsUploadingImage(false); }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) { e.preventDefault(); uploadAndSendImage(file); }
      }
    }
  };
  
  // --- ЛОГІКА ЗАПИСУ ГОЛОСОВОГО ПОВІДОМЛЕННЯ В ЧАТІ ---
  const startVoiceRecording = async (e) => {
    e.preventDefault();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      let chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        // Замість відправки - створюємо прев'ю
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        setRecordedVoiceBlob(blob);
        setRecordedVoiceUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setVoiceRecorder(recorder);
      setIsRecordingVoice(true);
    } catch (err) { alert("❌ Не вдалося отримати доступ до мікрофона: " + err.message); }
  };

  const stopVoiceRecording = (e) => {
    if (e) e.preventDefault();
    if (voiceRecorder) {
      voiceRecorder.stop();
      setIsRecordingVoice(false);
      setVoiceRecorder(null);
    }
  };

  const cancelVoiceRecording = () => {
    setRecordedVoiceBlob(null);
    if (recordedVoiceUrl) URL.revokeObjectURL(recordedVoiceUrl);
    setRecordedVoiceUrl(null);
  };

  const sendRecordedVoice = async () => {
    if (!recordedVoiceBlob || !activeChatUserId) return;
    setIsUploadingVoice(true);
    try {
      const fileName = `chat_voice_${dbUserId}_${Date.now()}.mp3`;
      const { error: uploadError } = await supabase.storage.from('audio').upload(fileName, recordedVoiceBlob, { contentType: 'audio/mp3' });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('audio').getPublicUrl(fileName);
      await sendContent(data.publicUrl);
      cancelVoiceRecording(); // Очищаємо після відправки
    } catch (err) {
      alert("❌ Помилка відправки аудіо: " + err.message);
    } finally {
      setIsUploadingVoice(false);
    }
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    const targetEmail = editFormData.email?.trim() || null;
    const targetTg = editFormData.telegram_id || null;

    // --- ЛОГІКА ЗЛИТТЯ (MERGE) ДЛЯ АДМІНА ---
    if (targetEmail && targetEmail !== editingUser.email) {
      // Шукаємо, чи є вже такий email в іншому акаунті
      const { data: existingUser } = await supabase.from('users').select('id, telegram_id').eq('email', targetEmail).neq('id', editingUser.id).maybeSingle();
      
      if (existingUser) {
        if (!window.confirm(`⚠️ УВАГА!\nПошта ${targetEmail} вже належить іншому акаунту.\n\nОб'єднати поточний профіль (дублікат) із тим акаунтом?\n(Усі чати, прогрес і курси будуть перенесені в один спільний профіль)`)) {
          return;
        }
        
        // 1. Переносимо повідомлення в чаті
        await supabase.from('messages').update({ user_id: existingUser.id }).eq('user_id', editingUser.id);
        await supabase.from('messages').update({ sender_id: existingUser.id }).eq('sender_id', editingUser.id);
        
        // 2. Переносимо прогрес виконаних завдань
        const { data: progData } = await supabase.from('progress').select('*').eq('user_id', editingUser.id);
        if (progData && progData.length > 0) {
          for (const p of progData) {
            await supabase.from('progress').upsert({ user_id: existingUser.id, task_id: p.task_id, status: p.status, points: p.points }, { onConflict: 'user_id, task_id' });
          }
        }
        
        // 3. Об'єднуємо доступи до курсів
        if (editingUser.telegram_id) {
           const { data: ucData } = await supabase.from('user_courses').select('*').eq('user_telegram_id', editingUser.telegram_id);
           if (ucData && ucData.length > 0) {
             const targetTgId = existingUser.telegram_id || editingUser.telegram_id;
             for (const c of ucData) {
               await supabase.from('user_courses').upsert({ user_telegram_id: targetTgId, course_id: c.course_id }, { onConflict: 'user_telegram_id, course_id' });
             }
           }
        }

        // 4. Оновлюємо старий (головний) акаунт: додаємо йому Telegram та групу
        await supabase.from('users').update({ 
          telegram_id: existingUser.telegram_id || targetTg || editingUser.telegram_id,
          first_name: editFormData.first_name || editingUser.first_name,
          group_id: editFormData.group_id || editingUser.group_id || null
        }).eq('id', existingUser.id);

        // 5. Знищуємо порожній дублікат
        await supabase.from('users').delete().eq('id', editingUser.id);
        
        fetchUsers();
        setEditingUser(null);
        if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        alert("✅ Акаунти успішно злиті в один!");
        return;
      }
    }

    // --- СТАНДАРТНЕ ЗБЕРЕЖЕННЯ (якщо злиття не потрібне) ---
    const updateData = { 
      first_name: editFormData.first_name, 
      group_id: editFormData.group_id || null, 
      telegram_id: targetTg, 
      email: targetEmail, 
      role: editFormData.role || 'student' 
    };
    
    const { error } = await supabase.from('users').update(updateData).eq('id', editingUser.id);
    if (!error) { 
      fetchUsers(); 
      setEditingUser(null); 
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success'); 
    } else { 
      alert(error.message); 
    }
  };

  const handleReaction = async (msgId, currentReactions, emoji) => {
    let newReactions = { ...currentReactions };
    if (!newReactions[emoji]) newReactions[emoji] = [];
    if (newReactions[emoji].includes(dbUserId)) {
        newReactions[emoji] = newReactions[emoji].filter(id => id !== dbUserId);
        if (newReactions[emoji].length === 0) delete newReactions[emoji];
    } else { newReactions[emoji].push(dbUserId); }
    setMessages(messages.map(m => m.id === msgId ? { ...m, reactions: newReactions } : m));
    setContextMenu({ visible: false, x: 0, y: 0, msg: null });
    await supabase.from('messages').update({ reactions: newReactions }).eq('id', msgId);
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.selectionChanged();
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    const menuWidth = 250;
    const xPos = e.pageX + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 20 : e.pageX;
    setContextMenu({ visible: true, x: xPos, y: e.pageY, msg: msg });
  };

  // === ЛОГІКА МАЛЮВАННЯ ТА ІСТОРІЇ ===
  React.useEffect(() => {
    if (isDrawingMode && fullscreenImg && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const maxWidth = window.innerWidth * 0.85;
        const maxHeight = window.innerHeight * 0.75;
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Зберігаємо перше базове зображення в історію
        setDrawHistory([canvas.toDataURL()]);
        setHasUnsavedChanges(false);
      };
      img.src = fullscreenImg;
    }
  }, [isDrawingMode, fullscreenImg]);

  // Обробка клавіші Esc
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isDrawingMode) {
          handleCloseDrawingMode();
        } else if (fullscreenImg) {
          setFullscreenImg(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingMode, fullscreenImg, hasUnsavedChanges]);

  const handleCloseDrawingMode = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm("У вас є незбережені малюнки. Точно скасувати і вийти?")) return;
    }
    setIsDrawingMode(false);
    setHasUnsavedChanges(false);
    setDrawHistory([]);
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e) => {
    if (!isDrawingMode) return;
    const { x, y } = getCanvasCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    
    setStartCoords({ x, y });
    setSavedImageData(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
    setIsDrawing(true);

    if (drawTool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e) => {
    if (!isDrawing || !isDrawingMode) return;
    e.preventDefault();
    const { x, y } = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawSize;
    ctx.lineCap = drawTool === 'pen' ? 'round' : 'square';
    ctx.lineJoin = 'round';

    if (drawTool === 'pen') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (drawTool === 'rect') {
      if (savedImageData) ctx.putImageData(savedImageData, 0, 0); // Відновлюємо фон перед тим, як малювати новий кадр прямокутника
      ctx.beginPath();
      ctx.rect(startCoords.x, startCoords.y, x - startCoords.x, y - startCoords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasUnsavedChanges(true);
    setDrawHistory(prev => [...prev, canvasRef.current.toDataURL()]); // Зберігаємо новий кадр в історію
  };

  const handleUndo = () => {
    if (drawHistory.length <= 1) return; // Не можемо видалити оригінальне фото
    const newHistory = [...drawHistory];
    newHistory.pop(); // Видаляємо останню зміну
    const previousState = newHistory[newHistory.length - 1];

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = previousState;
    
    setDrawHistory(newHistory);
    if (newHistory.length === 1) setHasUnsavedChanges(false);
  };

  const saveAndSendCanvas = async () => {
    if (!canvasRef.current || !activeChatUserId) return;
    if (!hasUnsavedChanges) { alert("Ви нічого не намалювали!"); return; }
    setIsSavingCanvas(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `review_${Date.now()}.png`, { type: 'image/png' });

      const fileName = `chat_${dbUserId}_${Date.now()}.png`;
      const { error } = await supabase.storage.from('chat-images').upload(fileName, file);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(fileName);
      await sendContent(publicUrl);
      
      setFullscreenImg(null);
      setIsDrawingMode(false);
      setHasUnsavedChanges(false);
      setDrawHistory([]);
    } catch (err) { alert("❌ Помилка відправки: " + err.message); } 
    finally { setIsSavingCanvas(false); }
  };
  // ========================

  const formatTime = (iso) => new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  const getDisplayName = (u) => {
    if (!u) return 'Невідомий';
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    if (fullName && fullName !== 'undefined') return fullName;
    if (u.email) return u.email.split('@')[0];
    if (u.telegram_id) return `TG: ${u.telegram_id}`;
    return 'Невідомий учень';
  };

  const handleSelectUser = (userId) => { setActiveChatUserId(userId); setUnreadPerUser(prev => ({ ...prev, [userId]: 0 })); };
  // Сортуємо: спочатку НЕПРОЧИТАНІ, потім НАЙНОВІШІ дії
  const sortedUsers = [...chatUsers].sort((a, b) => {
    const unreadA = unreadPerUser[a.id] ? 1 : 0;
    const unreadB = unreadPerUser[b.id] ? 1 : 0;
    
    // Якщо в одного є непрочитані, а в іншого ні - непрочитаний йде вгору
    if (unreadB !== unreadA) return unreadB - unreadA;

    // Якщо статус прочитаності однаковий - сортуємо за часом
    const timeA = new Date(a.last_message_at || a.created_at || 0).getTime();
    const timeB = new Date(b.last_message_at || b.created_at || 0).getTime();
    return timeB - timeA;
  });

 // Фільтруємо список для пошуку ТА архіву
  const filteredUsers = sortedUsers.filter(u => {
    // Якщо увімкнено архів - показуємо ТІЛЬКИ архівованих
    if (showArchive) {
      if (u.access_status !== 'archived') return false;
    } else {
      // Якщо архів вимкнено - ховаємо архівованих з основної стрічки
      if (u.access_status === 'archived') return false;
    }

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return `${u.first_name} ${u.last_name} ${u.email} ${u.telegram_id} ${u.group_id} ${u.role}`.toLowerCase().includes(q);
  });

  return (
    <div style={{ flex: 1, padding: '40px 60px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      
      {/* МЕНЮ ПРАВОГО КЛІКУ */}
      {contextMenu.visible && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: theme.cardBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 100000, overflow: 'hidden', minWidth: '220px', animation: 'fadeIn 0.15s ease-out' }}>
          <div style={{ padding: '12px', borderBottom: `1px solid ${theme.inputBorder}`, display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'space-between', background: 'rgba(0,0,0,0.02)' }}>
             {['👍', '👎', '❤️', '🔥', '😂', '👏', '😢', '🎉'].map(emoji => (
                <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReaction(contextMenu.msg.id, contextMenu.msg.reactions || {}, emoji); }} style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer', padding: '4px', transition: 'transform 0.1s' }} onMouseOver={e => e.target.style.transform = 'scale(1.2)'} onMouseOut={e => e.target.style.transform = 'scale(1)'}>{emoji}</button>
             ))}
          </div>
          <div onClick={(e) => { e.stopPropagation(); setReplyingTo(contextMenu.msg); setContextMenu({visible: false, x: 0, y: 0, msg: null}); }} style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: theme.text, fontWeight: 'bold', fontSize: '15px' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
            ↩️ Відповісти
          </div>
        </div>
      )}

      {/* ФУЛСКРІН ЗУМ + МАЛЮВАННЯ */}
      {fullscreenImg && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          <button onClick={() => { isDrawingMode ? handleCloseDrawingMode() : setFullscreenImg(null); }} style={{ position: 'absolute', top: '25px', right: '35px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: '24px', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }}>✕</button>

          {!isDrawingMode ? (
            <>
              <img src={fullscreenImg} alt="Zoomed" style={{ maxWidth: '90%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
              {showUserList && (
                <button onClick={() => setIsDrawingMode(true)} style={{ marginTop: '20px', background: '#E0A345', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(224,163,69,0.3)' }}>
                  ✏️ Малювати (перевірити)
                </button>
              )}
            </>
          ) : (
            <>
              {/* ПАНЕЛЬ ІНСТРУМЕНТІВ МАЛЮВАННЯ */}
              <div style={{ display: 'flex', gap: '15px', background: theme.cardBg, padding: '10px 20px', borderRadius: '16px', marginBottom: '15px', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', flexWrap: 'wrap', justifyContent: 'center' }}>
                 
                 {/* Інструменти (Олівець / Квадрат) */}
                 <div style={{ display: 'flex', gap: '5px', background: theme.inputBg, padding: '4px', borderRadius: '10px' }}>
                    <button onClick={() => setDrawTool('pen')} title="Вільне малювання" style={{ background: drawTool === 'pen' ? theme.cardBg : 'transparent', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', boxShadow: drawTool === 'pen' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}>✏️</button>
                    <button onClick={() => setDrawTool('rect')} title="Прямокутник" style={{ background: drawTool === 'rect' ? theme.cardBg : 'transparent', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', boxShadow: drawTool === 'rect' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}>⬜️</button>
                 </div>

                 <div style={{ width: '1px', height: '24px', background: theme.inputBorder }} />

                 {/* Кольори */}
                 <div style={{ display: 'flex', gap: '8px' }}>
                    {['#FF3B30', '#34C759', '#007AFF', '#FFCC00', '#FFFFFF', '#000000'].map(color => (
                       <div key={color} onClick={() => setDrawColor(color)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: color, cursor: 'pointer', border: drawColor === color ? '3px solid #E0A345' : '1px solid rgba(0,0,0,0.2)' }} />
                    ))}
                 </div>
                 
                 <div style={{ width: '1px', height: '24px', background: theme.inputBorder }} />
                 <input type="range" min="1" max="15" value={drawSize} onChange={(e) => setDrawSize(e.target.value)} style={{ width: '80px' }} />
                 <div style={{ width: '1px', height: '24px', background: theme.inputBorder }} />
                 
                 {/* Undo */}
                 <button onClick={handleUndo} disabled={drawHistory.length <= 1} title="Крок назад" style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: drawHistory.length <= 1 ? 'not-allowed' : 'pointer', opacity: drawHistory.length <= 1 ? 0.3 : 1 }}>↩️</button>
                 
                 <div style={{ width: '1px', height: '24px', background: theme.inputBorder }} />

                 <button onClick={handleCloseDrawingMode} style={{ background: 'transparent', color: theme.textSecondary, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Скасувати</button>
                 <button onClick={saveAndSendCanvas} disabled={isSavingCanvas || !hasUnsavedChanges} style={{ background: '#38A169', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: (!hasUnsavedChanges || isSavingCanvas) ? 'not-allowed' : 'pointer', opacity: (!hasUnsavedChanges || isSavingCanvas) ? 0.5 : 1 }}>
                   {isSavingCanvas ? '⏳ Збереження...' : '📤 Відправити'}
                 </button>
              </div>

              {/* ПОЛОТНО ДЛЯ МАЛЮВАННЯ */}
              <div style={{ position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: '12px', overflow: 'hidden' }}>
                <canvas 
                   ref={canvasRef}
                   onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                   onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                   style={{ display: 'block', cursor: 'crosshair', touchAction: 'none' }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* МОДАЛКА УЧНЯ */}
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: theme.cardBg, padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '400px', border: `1px solid ${theme.inputBorder}`, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: theme.text }}>Налаштування користувача</h3>
            <form onSubmit={handleSaveUserEdit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Ім'я" value={editFormData.first_name || ''} onChange={e => setEditFormData({...editFormData, first_name: e.target.value})} style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="Група (напр. 100)" value={editFormData.group_id || ''} onChange={e => setEditFormData({...editFormData, group_id: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text }} />
                <select value={editFormData.role || 'student'} onChange={e => setEditFormData({...editFormData, role: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontWeight: 'bold' }}>
                  <option value="student">🎓 Учень</option>
                  <option value="teacher">👩‍🏫 Викладач</option>
                  <option value="admin">👑 Адмін</option>
                </select>
              </div>
              <input type="email" placeholder="Email" value={editFormData.email || ''} onChange={e => setEditFormData({...editFormData, email: e.target.value})} style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text }} />
              <input type="number" placeholder="Telegram ID" value={editFormData.telegram_id || ''} onChange={e => setEditFormData({...editFormData, telegram_id: e.target.value})} style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text }} />
              {/* БЛОК ШВИДКОЇ ВИДАЧІ ДОСТУПІВ ДО КУРСІВ */}
              <div style={{ marginTop: '15px', background: 'rgba(0,0,0,0.02)', padding: '15px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}` }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: theme.textSecondary }}>📚 Доступи до курсів:</h4>
                {courses && courses.length > 0 ? courses.map(course => {
                  const isChecked = editUserCourses.includes(course.id);
                  return (
                    <label key={course.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: theme.text, cursor: 'pointer', marginBottom: '10px', lineHeight: '1.3' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => handleToggleCourse(course.id)} 
                        style={{ cursor: 'pointer', accentColor: '#38A169', width: '18px', height: '18px', flexShrink: 0 }} 
                      />
                      <span style={{ fontWeight: isChecked ? 'bold' : 'normal', color: isChecked ? '#2E7D32' : 'inherit' }}>
                        {course.title}
                      </span>
                    </label>
                  );
                }) : <span style={{ fontSize: '13px', color: theme.textSecondary }}>Немає створених курсів.</span>}
              </div>
			  
			  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 1, background: '#38A169', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Зберегти</button>
                <button type="button" onClick={() => setEditingUser(null)} style={{ flex: 1, background: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Скасувати</button>
              </div>
            {/* КНОПКА АРХІВУВАННЯ */}
              <div style={{ marginTop: '10px' }}>
                {editingUser.access_status === 'archived' ? (
                  <button type="button" onClick={() => handleArchiveUser('approved')} className="hover-card" style={{ width: '100%', background: '#3182ce', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                    🔄 Відновити доступи з архіву
                  </button>
                ) : (
                  <button type="button" onClick={() => handleArchiveUser('archived')} className="hover-card" style={{ width: '100%', background: '#ffebee', color: '#c62828', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                    📦 Перенести в архів (Забрати доступ)
                  </button>
                )}
              </div>
			</form>
          </div>
        </div>
      )}

      {/* ШАПКА */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', flexShrink: 0 }}>
        <button onClick={onBack} className="hover-card" style={{ background: theme.cardBg, border: `1px solid ${theme.inputBorder}`, color: theme.text, padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Назад
        </button>
        <h2 style={{ color: theme.text, fontSize: '32px', margin: 0, fontWeight: '900' }}>
          <span style={{ opacity: 0.8 }}>💬</span> {t('chatBtn')} {isTeacher && !isAdmin && <span style={{fontSize: '16px', color: '#E0A345'}}>(Група {userProfile?.group_id})</span>}
        </h2>
      </div>

      <div style={{ flex: 1, background: theme.cardBg, borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: `1px solid ${theme.inputBorder}`, display: 'flex', overflow: 'hidden' }}>
        
        {/* БОКОВА ПАНЕЛЬ */}
        {showUserList && (
          <div style={{ width: '320px', borderRight: `1px solid ${theme.inputBorder}`, display: 'flex', flexDirection: 'column', background: theme.inputBg, flexShrink: 0 }}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${theme.inputBorder}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '900', color: theme.textSecondary, marginBottom: '12px' }}>
                <span>Список {isAdmin ? 'користувачів' : 'учнів'}</span>
                {isAdmin && (
                  <button onClick={() => setShowArchive(!showArchive)} style={{ background: showArchive ? '#E0A345' : theme.inputBg, color: showArchive ? '#fff' : theme.textSecondary, border: `1px solid ${theme.inputBorder}`, borderRadius: '8px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>
                    {showArchive ? '🔙 Активні' : '📦 Архів'}
                  </button>
                )}
              </div>
              <input type="text" placeholder="🔍 Пошук..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}`, background: theme.cardBg, color: theme.text, fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filteredUsers.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>Нікого не знайдено 🕵️‍♂️</div>
              ) : (
                filteredUsers.map(u => {
                  const badge = getGroupBadgeStyle(u.group_id);
                  return (
                    <div key={u.id} className="hover-card" onClick={() => handleSelectUser(u.id)} style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: String(activeChatUserId) === String(u.id) ? theme.cardBg : 'transparent', borderBottom: `1px solid ${theme.inputBorder}`, transition: '0.2s', position: 'relative' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: u.avatar_url ? 'transparent' : '#E0A345', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
                        {u.avatar_url ? <img src={u.avatar_url} alt="ava" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.first_name ? u.first_name[0].toUpperCase() : 'У')}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ color: theme.text, fontWeight: 'bold', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getDisplayName(u)}</span>
                          {u.role === 'admin' && <span style={{ background: '#E0A345', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>👑 Адмін</span>}
                          {u.role === 'teacher' && <span style={{ background: '#4A90E2', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>👩‍🏫 Викладач</span>}
                          {badge.show && <span style={{ background: badge.bg, color: badge.text, padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '900', whiteSpace: 'nowrap' }}>{u.group_id}</span>}
                        </div>
                        <div style={{ color: theme.textSecondary, fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
  {[u.email, u.telegram_id ? `TG: ${u.telegram_id}` : null].filter(Boolean).join(' | ')}
</div>
                      </div>
                      {isAdmin && ( <button onClick={async (e) => { 
    e.stopPropagation(); 
    setEditFormData(u); 
    setEditingUser(u); 
    // Підвантажуємо курси юзера при відкритті вікна
    if (u.telegram_id) {
       const { data } = await supabase.from('user_courses').select('course_id').eq('user_telegram_id', u.telegram_id);
       if (data) setEditUserCourses(data.map(d => d.course_id));
    }
}} style={{ background: 'transparent', border: 'none', color: theme.textSecondary, fontSize: '18px', cursor: 'pointer', padding: '0 5px', fontWeight: 'bold' }}>⋮</button> )}
                      {unreadPerUser[u.id] > 0 && <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#E0A345', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(224,163,69,0.3)' }}>{unreadPerUser[u.id]}</div>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ЗОНА ЧАТУ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.bg, position: 'relative' }}>
          {!activeChatUserId ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textSecondary, fontSize: '16px' }}>👈 Виберіть співрозмовника зліва</div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: theme.textSecondary, margin: 'auto', fontSize: '15px' }}>Тут поки порожньо. Напишіть першими! 👋</div>
                ) : (
                  messages.map(msg => {
                    // БРОНЕБІЙНИЙ ФІКС: Перевіряємо не лише ID, а й Email та Telegram (на випадок розсинхрону сесій)
                    const isMineRaw = String(msg.sender_id) === String(dbUserId);
                    const foundUser = chatUsers.find(u => String(u.id) === String(msg.sender_id));
                    
                    const isMine = isMineRaw || 
                      (foundUser && userProfile && foundUser.email && foundUser.email === userProfile.email) ||
                      (foundUser && userProfile && foundUser.telegram_id && foundUser.telegram_id === userProfile.telegram_id);
                    
                    const msgUser = foundUser || (isMine ? userProfile : null);
                    const msgBadge = getGroupBadgeStyle(msgUser?.group_id);
                    
                    const quotedMsg = msg.reply_to_id ? messages.find(m => String(m.id) === String(msg.reply_to_id)) : null;
                    const quotedUser = quotedMsg ? (chatUsers.find(u => String(u.id) === String(quotedMsg.sender_id)) || (String(quotedMsg.sender_id) === String(dbUserId) ? userProfile : null)) : null;

                    return (
                      <div 
                        key={msg.id} 
                        onMouseEnter={() => setHoveredMsgId(msg.id)}
                        onMouseLeave={() => setHoveredMsgId(null)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', position: 'relative' }}
                      >
                        
                        {/* ПЛАШКИ НАД ПОВІДОМЛЕННЯМ */}
                        {!isMine && msgUser && (msgUser.role === 'admin' || msgUser.role === 'teacher' || msgBadge.show) && (
                           <div style={{ marginBottom: '4px', marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                             <span style={{ fontSize: '12px', fontWeight: 'bold', color: theme.text }}>{getDisplayName(msgUser)}</span>
                             {msgUser.role === 'admin' && <span style={{ background: '#E0A345', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' }}>👑 Адмін</span>}
                             {msgUser.role === 'teacher' && <span style={{ background: '#4A90E2', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' }}>👩‍🏫 Викладач</span>}
                             {msgBadge.show && <span style={{ background: msgBadge.bg, color: msgBadge.text, padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '900' }}>{msgUser.group_id}</span>}
                           </div>
                        )}

                        {/* БАБЛ ПОВІДОМЛЕННЯ */}
                        <div 
                          onDoubleClick={() => handleReaction(msg.id, msg.reactions || {}, '❤️')}
                          onContextMenu={(e) => handleContextMenu(e, msg)}
                          style={{ 
                            position: 'relative', maxWidth: '75%', padding: '14px 20px', 
                            borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px', 
                            background: isMine ? 'linear-gradient(135deg, #FF7B54 0%, #FFB26B 100%)' : theme.cardBg, 
                            color: isMine ? '#fff' : theme.text, 
                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)', 
                            border: isMine ? 'none' : `1px solid ${theme.inputBorder}`, 
                            fontSize: '15px', lineHeight: '1.5', cursor: 'default'
                          }}
                        >
                          {quotedMsg && (
                            <div style={{ background: 'rgba(0,0,0,0.15)', borderLeft: `3px solid ${isMine ? '#fff' : '#E0A345'}`, borderRadius: '6px', padding: '8px 12px', marginBottom: '10px', fontSize: '13px', color: isMine ? 'rgba(255,255,255,0.9)' : theme.textSecondary }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{getDisplayName(quotedUser)}</div>
                              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {quotedMsg.text.match(/(https?:\/\/[^\s]+)/) ? '🖼️ Медіафайл' : quotedMsg.text}
                              </div>
                            </div>
                          )}

                          {msg.text.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
                            if (part.match(/(https?:\/\/[^\s]+)/g)) {
                              if (part.match(/\.(mp3|wav|ogg|m4a)$/i) || part.includes("/audio/") || part.includes("chat_voice_")) {
                                return (
                                  <div key={i} style={{ marginTop: '8px', minWidth: '220px' }}>
                                    <audio controls src={part} style={{ width: '100%', height: '40px', outline: 'none' }} />
                                  </div>
                                );
                              }
                              if (part.match(/\.(jpeg|jpg|gif|png|webp)$/i) || part.includes("chat-images") || part.includes("images")) {
                                return (
                                  <div key={i} style={{ marginTop: '8px' }}>
                                    <img src={part} alt="attachment" onClick={() => setFullscreenImg(part)} style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '12px', objectFit: 'cover', display: 'block', cursor: 'zoom-in', border: isMine ? '2px solid rgba(255,255,255,0.3)' : `1px solid ${theme.inputBorder}` }} />
                                  </div>
                                );
                              }
                              return <a key={i} href={part} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{part}</a>;
                            }
                            return <span key={i}>{part}</span>;
                          })}
                        </div>
                        
                        {/* РЕАКЦІЇ ТА ЧАС */}
                        <div style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          
                          <span 
                            onClick={() => setReplyingTo(msg)} 
                            style={{ 
                              fontSize: '11px', fontWeight: 'bold', color: '#E0A345', cursor: 'pointer', 
                              opacity: hoveredMsgId === msg.id ? 0.8 : 0, 
                              pointerEvents: hoveredMsgId === msg.id ? 'auto' : 'none',
                              transition: 'opacity 0.2s ease'
                            }} 
                            onMouseOver={e => e.target.style.opacity = 1} 
                            onMouseOut={e => e.target.style.opacity = 0.8}
                          >
                            ↩️ Відповісти
                          </span>

                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {Object.entries(msg.reactions).map(([emoji, usersArr]) => (
                                <div key={emoji} onClick={() => handleReaction(msg.id, msg.reactions, emoji)} style={{ background: usersArr.includes(dbUserId) ? 'rgba(224, 163, 69, 0.2)' : theme.inputBg, border: `1px solid ${usersArr.includes(dbUserId) ? '#E0A345' : theme.inputBorder}`, padding: '2px 8px', borderRadius: '12px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>{emoji}</span>
                                  <span style={{ fontWeight: 'bold', color: theme.textSecondary }}>{usersArr.length}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <span style={{ fontSize: '11px', color: theme.textSecondary }}>{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {replyingTo && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'rgba(224, 163, 69, 0.05)', borderTop: `1px solid ${theme.inputBorder}`, borderLeft: '4px solid #E0A345' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#E0A345', marginBottom: '2px' }}>Відповідь для {getDisplayName(chatUsers.find(u => String(u.id) === String(replyingTo.sender_id)) || {first_name: 'Вас'})}</div>
                    <div style={{ fontSize: '13px', color: theme.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px' }}>
                      {replyingTo.text.match(/(https?:\/\/[^\s]+)/) ? '🖼️ Медіафайл' : replyingTo.text}
                    </div>
                  </div>
                  <button onClick={() => setReplyingTo(null)} style={{ background: 'transparent', border: 'none', color: theme.textSecondary, fontSize: '20px', cursor: 'pointer' }}>✕</button>
                </div>
              )}

              <form onSubmit={handleSendMessageSubmit} style={{ padding: '20px', background: theme.cardBg, borderTop: replyingTo ? 'none' : `1px solid ${theme.inputBorder}`, display: 'flex', gap: '15px', alignItems: 'center' }}>
                
                {/* Кнопка скрепки (ховати, якщо є аудіо прев'ю) */}
                {!recordedVoiceBlob && (
                  <label className="hover-card" title="Прикріпити фото" style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textSecondary, width: '54px', height: '54px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    {isUploadingImage ? '⏳' : <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>}
                    <input type="file" accept="image/*" onChange={(e) => uploadAndSendImage(e.target.files[0])} style={{ display: 'none' }} />
                  </label>
                )}
                
                {/* ДИНАМІЧНЕ ПОЛЕ (Текст, Індикатор запису або Плеєр) */}
                {isRecordingVoice ? (
                   <div style={{ flex: 1, padding: '0 20px', height: '54px', borderRadius: '16px', background: 'rgba(229, 62, 62, 0.1)', color: '#E53E3E', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(229, 62, 62, 0.5)', boxSizing: 'border-box' }}>
                      <span style={{ animation: 'ffPulse 1.5s infinite', display: 'inline-block', width: '12px', height: '12px', background: '#E53E3E', borderRadius: '50%' }}></span>
                      Запис аудіо...
                   </div>
                ) : recordedVoiceUrl ? (
                   <div style={{ flex: 1, padding: '0 10px', height: '54px', borderRadius: '16px', background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, display: 'flex', alignItems: 'center', gap: '10px', boxSizing: 'border-box' }}>
                      <button type="button" onClick={cancelVoiceRecording} className="hover-card" title="Видалити запис" style={{ background: '#ffebee', color: '#c62828', border: 'none', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>🗑</button>
                      <audio controls src={recordedVoiceUrl} style={{ flex: 1, height: '36px', outline: 'none' }} />
                   </div>
                ) : (
                   <input type="text" value={chatText} onChange={e => setChatText(e.target.value)} onPaste={handlePaste} placeholder="Написати повідомлення або вставити фото (Ctrl+V)..." style={{ flex: 1, padding: '16px 20px', borderRadius: '16px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: '15px' }} />
                )}

                {/* ДИНАМІЧНА КНОПКА (Стоп / Відправити Аудіо / Відправити Текст / Мікрофон) */}
                {isRecordingVoice ? (
                   <button type="button" onClick={stopVoiceRecording} className="hover-card" style={{ background: '#E53E3E', color: '#fff', border: 'none', width: '54px', height: '54px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="3"/></svg>
                   </button>
                ) : recordedVoiceBlob ? (
                   <button type="button" onClick={sendRecordedVoice} disabled={isUploadingVoice} className="hover-card" style={{ background: '#00C853', color: '#fff', border: 'none', width: '54px', height: '54px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: isUploadingVoice ? 0.5 : 1 }}>
                     {isUploadingVoice ? '⏳' : <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                   </button>
                ) : chatText.trim() ? (
                   <button type="submit" className="hover-card" style={{ background: '#E0A345', color: '#fff', border: 'none', width: '54px', height: '54px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                     <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                   </button>
                ) : (
                   <button type="button" onClick={startVoiceRecording} className="hover-card" title="Голосове повідомлення" style={{ background: theme.inputBg, color: theme.textSecondary, border: `1px solid ${theme.inputBorder}`, width: '54px', height: '54px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                     {isUploadingVoice ? '⏳' : <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>}
                   </button>
                )}
				
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- ЖИВИЙ РЕДАКТОР (ВИБИТИЙ НАГОРУ ДЛЯ ЗБЕРЕЖЕННЯ ФОКУСУ) ---
const FormatToolbar = ({ theme }) => (
  <div style={{ display: 'flex', gap: '5px', background: theme?.cardBg, padding: '8px', borderRadius: '10px 10px 0 0', border: `1px solid ${theme?.inputBorder}`, borderBottom: 'none', flexWrap: 'wrap', alignItems: 'center' }}>
    <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('undo'); }} className="hover-card" title="Назад (Ctrl+Z)" style={{ background: theme?.inputBg, border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', color: theme?.text, fontSize: '14px' }}>↩️</button>
    <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold'); }} className="hover-card" title="Жирний (Ctrl+B)" style={{ background: theme?.inputBg, border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: theme?.text, fontWeight: 'bold' }}>B</button>
    <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic'); }} className="hover-card" title="Курсив (Ctrl+I)" style={{ background: theme?.inputBg, border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: theme?.text, fontStyle: 'italic' }}>I</button>
    <div style={{ width: '1px', background: theme?.inputBorder, margin: '0 5px' }}></div>
    <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('foreColor', false, '#E0A345'); }} className="hover-card" title="Фірмовий колір" style={{ background: '#E0A345', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', width: '28px', height: '28px' }}></button>
    <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('foreColor', false, '#E53E3E'); }} className="hover-card" title="Червоний колір" style={{ background: '#E53E3E', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', width: '28px', height: '28px' }}></button>
    <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('foreColor', false, '#38A169'); }} className="hover-card" title="Зелений колір" style={{ background: '#38A169', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', width: '28px', height: '28px' }}></button>
    <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('removeFormat'); }} className="hover-card" title="Очистити колір/формат" style={{ background: theme?.inputBg, border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: theme?.text }}>🧹 Очистити</button>
  </div>
);

const WYSIWYGEditor = ({ value, onChange, placeholder, style, theme }) => {
  const editorRef = React.useRef(null);
  const isInternalChange = React.useRef(false);
  const [speakers, setSpeakers] = React.useState([]);

  // Стан для контекстного меню
  const [contextMenu, setContextMenu] = React.useState({ visible: false, x: 0, y: 0, align: 'right-side' });

  // Ховаємо меню при кліку будь-де
  React.useEffect(() => {
      const hideMenu = () => setContextMenu(prev => ({ ...prev, visible: false }));
      document.addEventListener('click', hideMenu);
      return () => document.removeEventListener('click', hideMenu);
  }, []);

  React.useEffect(() => {
    document.execCommand('defaultParagraphSeparator', false, 'br');
  }, []);

  React.useEffect(() => {
    if (!isInternalChange.current && editorRef.current && document.activeElement !== editorRef.current) {
        let cleanVal = value || '';
        
        // ЛІКУВАННЯ АБРАКАДАБРИ: Перетворюємо &nbsp; та &lt; на нормальний текст
        if (cleanVal.includes('&lt;') || cleanVal.includes('&amp;')) {
            cleanVal = cleanVal.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
        }

        if (editorRef.current.innerHTML !== cleanVal) {
            editorRef.current.innerHTML = cleanVal;
        }
    }
    isInternalChange.current = false;

    // ПЛАВАЮЧА ПАНЕЛЬКА: Шукаємо імена (напр. MÁRIA:)
    if (value) {
        const textContent = value.replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ');
        const matches = textContent.match(/^([A-ZÁÉÍÓÚÝČĎĽŇŠŤŽА-ЯІЇЄҐ]+[a-záéíóúýčďľňšťžа-яіїєґ]*):/gm);
        if (matches) {
           setSpeakers([...new Set(matches.map(m => m.trim()))]);
        } else {
           setSpeakers([]);
        }
    }
  }, [value]);

  const handleInput = () => {
    isInternalChange.current = true;
    onChange(editorRef.current.innerHTML); 
  };

  const insertSpeaker = (spk) => {
     editorRef.current.focus();
     document.execCommand('insertHTML', false, `<br>${spk} `);
     handleInput();
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' || e.key === 'Z') { setTimeout(handleInput, 10); return; }
    }
    // ФІКС ENTER ТА BACKSPACE
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertHTML', false, '<br>\u200B'); 
      handleInput();
    }
  };

  // --- ЛОГІКА ТЕЛЕГРАМ-МЕНЮ ---
  const handleContextMenu = (e) => {
    e.preventDefault();
    const menuWidth = 240;
    const submenuWidth = 240;
    let x = e.clientX;
    let y = e.clientY;
    let align = 'right-side'; // Підменю відкривається вправо

    // Якщо клік занадто близько до правого краю - підменю відкриваємо вліво
    if (x + menuWidth + submenuWidth > window.innerWidth) {
        align = 'left-side';
    }
    // Щоб саме головне меню не вилізло за екран
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    if (y + 400 > window.innerHeight) y = window.innerHeight - 400;

    setContextMenu({ visible: true, x, y, align });
  };

  const execMenuCommand = async (action, e, extraVal = null) => {
    e.stopPropagation();
    setContextMenu({ visible: false, x: 0, y: 0, align: 'right-side' });
    editorRef.current.focus();

    switch(action) {
        case 'undo': document.execCommand('undo'); break;
        case 'redo': document.execCommand('redo'); break;
        case 'cut': document.execCommand('cut'); break;
        case 'copy': document.execCommand('copy'); break;
        case 'paste':
            try {
                const text = await navigator.clipboard.readText();
                document.execCommand('insertText', false, text);
            } catch(err) { alert('Браузер вимагає вставляти текст за допомогою Ctrl+V'); }
            break;
        case 'delete': document.execCommand('delete'); break;
        case 'selectAll': document.execCommand('selectAll'); break;
        
        // ФОРМАТУВАННЯ
        case 'bold': document.execCommand('bold'); break;
        case 'italic': document.execCommand('italic'); break;
        case 'underline': document.execCommand('underline'); break;
        case 'strikethrough': document.execCommand('strikeThrough'); break;
        case 'quote': document.execCommand('formatBlock', false, 'blockquote'); break;
        case 'monospace': document.execCommand('fontName', false, 'monospace'); break;
        case 'spoiler':
            const sel = window.getSelection();
            if(sel.rangeCount && !sel.isCollapsed) {
                const text = sel.toString();
                document.execCommand('insertHTML', false, `<span style="background-color: #4A5568; color: transparent; border-radius: 4px; cursor: pointer; padding: 0 4px;" title="Спойлер">${text}</span>`);
            } else { alert("Спочатку виділіть текст для створення спойлера!"); }
            break;
        case 'link':
            const url = prompt('Введіть URL посилання:');
            if(url) document.execCommand('createLink', false, url);
            break;
            
        // КОЛІР ТА ОЧИЩЕННЯ
        case 'color': 
            document.execCommand('foreColor', false, extraVal); 
            break;
        case 'clear': 
            document.execCommand('removeFormat'); 
            break;
    }
    handleInput();
  };

  return (
    <div style={{ position: 'relative' }}>
      <div 
        ref={editorRef} contentEditable onInput={handleInput} onBlur={handleInput} onKeyDown={handleKeyDown} onContextMenu={handleContextMenu}
        style={{ ...style, outline: 'none', overflowY: 'auto', minHeight: '150px' }}
        className="wysiwyg-content" data-placeholder={placeholder}
      />
      
      {/* ПЛАВАЮЧІ ПІДКАЗКИ ІМЕН */}
      {speakers.length > 0 && (
        <div style={{ position: 'absolute', bottom: '15px', right: '15px', display: 'flex', gap: '8px', opacity: 0.25, transition: 'opacity 0.2s', background: theme.cardBg, padding: '8px 12px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', zIndex: 10, border: `1px solid ${theme.inputBorder}`, alignItems: 'center' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.25}>
           <span style={{fontSize: '11px', fontWeight: 'bold', color: theme.textSecondary, textTransform: 'uppercase', cursor: 'default'}}>🗣 Хто говорить:</span>
           {speakers.map(spk => (
             <button key={spk} onClick={(e) => { e.preventDefault(); insertSpeaker(spk); }} style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.text, padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
               {spk}
             </button>
           ))}
        </div>
      )}

      {/* ТЕЛЕГРАМ-МЕНЮ ПКМ */}
      {contextMenu.visible && (
        <div className="tg-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onContextMenu={e => e.preventDefault()}>
            <div className="tg-menu-item" onClick={(e) => execMenuCommand('undo', e)}><span><span style={{width:'20px',display:'inline-block',textAlign:'center'}}>↩️</span> Скасувати останню дію</span><span className="tg-menu-hotkey">Ctrl+Z</span></div>
            <div className="tg-menu-item" onClick={(e) => execMenuCommand('redo', e)}><span><span style={{width:'20px',display:'inline-block',textAlign:'center'}}>↪️</span> Повторити</span><span className="tg-menu-hotkey">Ctrl+Y</span></div>
            <div className="tg-menu-divider"></div>
            <div className="tg-menu-item" onClick={(e) => execMenuCommand('cut', e)}><span><span style={{width:'20px',display:'inline-block',textAlign:'center'}}>✂️</span> Вирізати</span><span className="tg-menu-hotkey">Ctrl+X</span></div>
            <div className="tg-menu-item" onClick={(e) => execMenuCommand('copy', e)}><span><span style={{width:'20px',display:'inline-block',textAlign:'center'}}>📄</span> Копіювати</span><span className="tg-menu-hotkey">Ctrl+C</span></div>
            <div className="tg-menu-item" onClick={(e) => execMenuCommand('paste', e)}><span><span style={{width:'20px',display:'inline-block',textAlign:'center'}}>📋</span> Вставити</span><span className="tg-menu-hotkey">Ctrl+V</span></div>
            <div className="tg-menu-item" onClick={(e) => execMenuCommand('delete', e)}><span><span style={{width:'20px',display:'inline-block',textAlign:'center'}}>🗑</span> Видалити</span><span className="tg-menu-hotkey">Del</span></div>
            <div className="tg-menu-divider"></div>
            
            {/* Підменю "Форматування" */}
            <div className={`tg-menu-item tg-has-submenu ${contextMenu.align}`}>
                <span><span style={{width:'20px',display:'inline-block',textAlign:'center'}}>✨</span> Форматування</span><span className="tg-menu-hotkey">▶</span>
                <div className="tg-submenu">
                    <div className="tg-menu-item" onClick={(e) => execMenuCommand('bold', e)}><span style={{fontWeight: 'bold'}}>Жирний</span><span className="tg-menu-hotkey">Ctrl+B</span></div>
                    <div className="tg-menu-item" onClick={(e) => execMenuCommand('italic', e)}><span style={{fontStyle: 'italic'}}>Курсив</span><span className="tg-menu-hotkey">Ctrl+I</span></div>
                    <div className="tg-menu-item" onClick={(e) => execMenuCommand('underline', e)}><span style={{textDecoration: 'underline'}}>Підкреслений</span><span className="tg-menu-hotkey">Ctrl+U</span></div>
                    <div className="tg-menu-item" onClick={(e) => execMenuCommand('strikethrough', e)}><span style={{textDecoration: 'line-through'}}>Закреслений</span><span className="tg-menu-hotkey">Ctrl+Shift+X</span></div>
                    <div className="tg-menu-item" onClick={(e) => execMenuCommand('monospace', e)}><span style={{fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: '4px'}}>Моноширинний</span><span className="tg-menu-hotkey">Ctrl+Shift+M</span></div>
                    <div className="tg-menu-item" onClick={(e) => execMenuCommand('spoiler', e)}><span><span style={{background: '#4A5568', color: 'transparent', borderRadius: '3px', padding: '0 4px'}}>Спойлер</span></span><span className="tg-menu-hotkey">Ctrl+Shift+P</span></div>
                    <div className="tg-menu-divider"></div>
                    <div className="tg-menu-item" onClick={(e) => execMenuCommand('quote', e)}><span>💬 Блок цитати</span></div>
                    <div className="tg-menu-item" onClick={(e) => execMenuCommand('link', e)}><span>🔗 Додати посилання</span><span className="tg-menu-hotkey">Ctrl+K</span></div>
                    <div className="tg-menu-divider"></div>
                    <div className="tg-menu-item" onClick={(e) => execMenuCommand('clear', e)}><span>🧹 Без форматування</span><span className="tg-menu-hotkey">Ctrl+Shift+N</span></div>
                </div>
            </div>

            {/* Підменю "Колір тексту" */}
            <div className={`tg-menu-item tg-has-submenu ${contextMenu.align}`}>
                <span><span style={{width:'20px',display:'inline-block',textAlign:'center'}}>🎨</span> Колір тексту</span><span className="tg-menu-hotkey">▶</span>
                <div className="tg-submenu" style={{ minWidth: '180px' }}>
                    <div className="tg-menu-item" onClick={(e) => execMenuCommand('color', e, '#E0A345')}><span style={{color: '#E0A345', fontWeight: 'bold'}}>🟡 Помаранчевий</span></div>
                    <div className="tg-menu-item" onClick={(e) => execMenuCommand('color', e, '#E53E3E')}><span style={{color: '#E53E3E', fontWeight: 'bold'}}>🔴 Червоний</span></div>
                    <div className="tg-menu-item" onClick={(e) => execMenuCommand('color', e, '#38A169')}><span style={{color: '#38A169', fontWeight: 'bold'}}>🟢 Зелений</span></div>
                    <div className="tg-menu-item" onClick={(e) => execMenuCommand('color', e, '#3182ce')}><span style={{color: '#3182ce', fontWeight: 'bold'}}>🔵 Синій</span></div>
                    <div className="tg-menu-item" onClick={(e) => execMenuCommand('color', e, '#805AD5')}><span style={{color: '#805AD5', fontWeight: 'bold'}}>🟣 Фіолетовий</span></div>
                    <div className="tg-menu-divider"></div>
                    <div className="tg-menu-item" onClick={(e) => execMenuCommand('clear', e)}><span>⚪ Стандартний текст</span></div>
                </div>
            </div>
            
            <div className="tg-menu-divider"></div>
            <div className="tg-menu-item" onClick={(e) => execMenuCommand('selectAll', e)}><span><span style={{width:'20px',display:'inline-block',textAlign:'center'}}>✅</span> Вибрати все</span><span className="tg-menu-hotkey">Ctrl+A</span></div>
        </div>
      )}
    </div>
  );
};

function Platform() {
  const navigate = useNavigate();

  // ВСТАВЛЯТИ СЮДИ:
  // --- ЛОГІКА ЗЛИТТЯ АКАУНТІВ (MERGE) ---
  const [mergePrompt, setMergePrompt] = useState(null);

  const confirmMerge = async () => {
    try {
      await supabase.from('users').delete().eq('telegram_id', mergePrompt.tgId).neq('id', mergePrompt.authUserId);
      await supabase.from('users').update({ telegram_id: mergePrompt.tgId, username: mergePrompt.tgUsername }).eq('id', mergePrompt.authUserId);
      setMergePrompt(null);
      window.location.reload(); 
    } catch (e) { alert("Помилка об'єднання: " + e.message); }
  };

  const cancelMerge = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('hack_auth_cache');
    setMergePrompt(null);
    window.location.reload();
  };
  
  // --- 1. ВСІ СТАНИ (HOOKS) ЗАВЖДИ ОГОЛОШУЮТЬСЯ НА ПОЧАТКУ ---
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('hack_lang');
    if (saved) return saved;
    const browserLang = navigator.language || navigator.userLanguage || 'uk';
    if (browserLang.startsWith('sk')) return 'sk';
    if (browserLang.startsWith('en')) return 'en';
    if (browserLang.startsWith('ru')) return 'ru';
    return 'uk';
  });

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('hack_lang', newLang);
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  };

  const t = (key) => translations[lang]?.[key] || translations['uk'][key] || key;
  
  const [newDictWord, setNewDictWord] = useState('');
  const [newDictTranslation, setNewDictTranslation] = useState('');
  const [userName, setUserName] = useState(null);
  const [dbUserId, setDbUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Тепер за замовчуванням юзер - не адмін
  const [accessStatus, setAccessStatus] = useState('loading'); 
  const [telegramId, setTelegramId] = useState(null);
  const [allowedCourses, setAllowedCourses] = useState([]);
  
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const effectiveIsAdmin = isAdmin && !isPreviewMode;

  const [globalView, setGlobalView] = useState(() => {
    try { return sessionStorage.getItem('hack_global_view') || null; } catch(e) { return null; }
  }); 
  useEffect(() => { 
    try { 
      if (globalView) sessionStorage.setItem('hack_global_view', globalView); 
      else sessionStorage.removeItem('hack_global_view'); 
    } catch(e){} 
  }, [globalView]);
  
  const [spacedCards, setSpacedCards] = useState([]);
  const [spacedIndex, setSpacedIndex] = useState(0);
  const [isSpacedFlipped, setIsSpacedFlipped] = useState(false);

  const [sniperCards, setSniperCards] = useState([]);
  const [sniperIndex, setSniperIndex] = useState(0);
  const [sniperInput, setSniperInput] = useState('');
  const [sniperScore, setSniperScore] = useState(0);
  const [sniperTimeLeft, setSniperTimeLeft] = useState(5);
  const [sniperStatus, setSniperStatus] = useState('menu'); 
  const [sniperHp, setSniperHp] = useState(5);
  
  const [ffCards, setFfCards] = useState([]);
  const [ffIndex, setFfIndex] = useState(0);
  const [ffScore, setFfScore] = useState(0);
  const [ffSelected, setFfSelected] = useState(null);
  const [ffCurrentOptions, setFfCurrentOptions] = useState([]);
  const [isFfOver, setIsFfOver] = useState(false);
  const [ffShowTranslation, setFfShowTranslation] = useState(false);

  // --- ТЕМА ТА ЗВУК ---
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('hack_theme_mode');
    if (saved) return saved;
    // Підтримка старих налаштувань
    return localStorage.getItem('hack_theme') === 'dark' ? 'dark' : 'light';
  });
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  const toggleTheme = () => {
    const modes = ['light', 'dark', 'warm'];
    const nextMode = modes[(modes.indexOf(themeMode) + 1) % 3];
    setThemeMode(nextMode);
    localStorage.setItem('hack_theme_mode', nextMode);
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  };

  const themes = {
    light: {
      bg: '#f0f4f8', cardBg: 'white', text: '#333', textSecondary: '#555',
      inputBg: 'white', inputBorder: '#ccc', adminBg: '#ffe6f2', adminBorder: '#FF007F',
      bgIconColor: '#2D3748', bgIconOpacity: 0.03
    },
    dark: {
      bg: '#1a202c', cardBg: '#2d3748', text: '#f7fafc', textSecondary: '#a0aec0',
      inputBg: '#4a5568', inputBorder: '#718096', adminBg: '#4a1c38', adminBorder: '#d53f8c',
      bgIconColor: '#ffffff', bgIconOpacity: 0.04
    },
    warm: {
      bg: '#FFF8F0', cardBg: '#FFE8D6', text: '#5C4033', textSecondary: '#8B7D6B',
      inputBg: '#FFF3E3', inputBorder: '#E0A345', adminBg: '#FFEDD8', adminBorder: '#E29578',
      bgIconColor: '#E0A345', bgIconOpacity: 0.15
    }
  };
  const theme = themes[themeMode];
  const isDarkMode = themeMode === 'dark'; // <--- ДОДАЙ ЦЕЙ РЯДОК

  // --- ФУНКЦІЯ ВИХОДУ ---
  const handleLogout = async () => {
    if (window.confirm("Ви точно хочете вийти з акаунта?")) {
      await supabase.auth.signOut();
      localStorage.removeItem('hack_auth_cache');
      localStorage.removeItem('hack_is_admin'); // Додали очищення статусу адміна
      window.location.href = '/'; 
    }
  };
  
  // ПІСЛЯ ЦЬОГО ІДУТЬ ЕКРАНИ (globalView === 'profile', chat тощо)
  
  const [toast, setToast] = useState(null);

  const [newAdminTelegramId, setNewAdminTelegramId] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(() => {
    try { 
      const saved = sessionStorage.getItem('hack_selected_course');
      return saved ? JSON.parse(saved) : null; 
    } catch(e) { return null; }
  });
  useEffect(() => { 
    try { 
      if (selectedCourse) sessionStorage.setItem('hack_selected_course', JSON.stringify(selectedCourse)); 
      else sessionStorage.removeItem('hack_selected_course'); 
    } catch(e){} 
  }, [selectedCourse]);

  const [activeReorderId, setActiveReorderId] = useState(null);
  const pressTimer = React.useRef(null);

  const [isEditingCourseTitle, setIsEditingCourseTitle] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");

  const [modules, setModules] = useState([]);
  const [activeModule, setActiveModule] = useState(() => {
    try { 
      const saved = sessionStorage.getItem('hack_active_module');
      return saved ? JSON.parse(saved) : null; 
    } catch(e) { return null; }
  });
  useEffect(() => { 
    try { 
      if (activeModule) sessionStorage.setItem('hack_active_module', JSON.stringify(activeModule)); 
      else sessionStorage.removeItem('hack_active_module'); 
    } catch(e){} 
  }, [activeModule]);

  
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isMediaUploading, setIsMediaUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [newModuleTitleMulti, setNewModuleTitleMulti] = useState({ uk: '', ru: '', en: '', sk: '' });
  const [moduleSourceLang, setModuleSourceLang] = useState('uk');
  const [moduleTranslateStatus, setModuleTranslateStatus] = useState('🪄 Автопереклад');

  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editModuleTitleMulti, setEditModuleTitleMulti] = useState({ uk: '', ru: '', en: '', sk: '' });
  const [moduleEditLang, setModuleEditLang] = useState('uk');
  const [editModuleTranslateStatus, setEditModuleTranslateStatus] = useState('🪄 Автопереклад');

  // Функція автоперекладу для створення модуля
  const handleAutoTranslateModule = async (e) => {
    e.preventDefault(); 
    const sourceText = newModuleTitleMulti[moduleSourceLang];
    if (!sourceText.trim()) return alert("Спочатку введіть назву оригіналу!");
    
    setModuleTranslateStatus('⏳...');
    try {
      const translate = async (target) => {
        if (target === moduleSourceLang) return sourceText;
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(sourceText)}&langpair=${moduleSourceLang}|${target}`);
        const data = await res.json();
        return data.responseData.translatedText;
      };
      const [uk, ru, en, sk] = await Promise.all([ translate('uk'), translate('ru'), translate('en'), translate('sk') ]);
      setNewModuleTitleMulti({ uk, ru, en, sk });
      setModuleTranslateStatus('✅ Готово!');
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      setTimeout(() => setModuleTranslateStatus('🪄 Автопереклад'), 2500);
    } catch (err) {
      setModuleTranslateStatus('❌ Помилка');
      setTimeout(() => setModuleTranslateStatus('🪄 Автопереклад'), 2500);
    }
  };

  // Функція автоперекладу для редагування модуля
  const handleEditAutoTranslateModule = async (e) => {
    e.preventDefault(); 
    const sourceText = editModuleTitleMulti[moduleEditLang];
    if (!sourceText?.trim()) return alert("Спочатку введіть назву!");
    
    setEditModuleTranslateStatus('⏳...');
    try {
      const translate = async (target) => {
        if (target === moduleEditLang) return sourceText;
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(sourceText)}&langpair=${moduleEditLang}|${target}`);
        const data = await res.json();
        return data.responseData.translatedText;
      };
      const [uk, ru, en, sk] = await Promise.all([ translate('uk'), translate('ru'), translate('en'), translate('sk') ]);
      setEditModuleTitleMulti({ uk, ru, en, sk });
      setEditModuleTranslateStatus('✅');
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      setTimeout(() => setEditModuleTranslateStatus('🪄 Автопереклад'), 2500);
    } catch (err) {
      setEditModuleTranslateStatus('❌');
      setTimeout(() => setEditModuleTranslateStatus('🪄 Автопереклад'), 2500);
    }
  };
  
  // --- ПАРСЕР ДЛЯ БАГАТОМОВНИХ НАЗВ ---
  const getTranslatedTitle = (titleData) => {
    let parsed = titleData;
    if (typeof parsed === 'string' && parsed.startsWith('{')) {
      try { parsed = JSON.parse(parsed); } catch(e) {}
    }
    return typeof parsed === 'object' && parsed !== null 
      ? (parsed[lang] || parsed.uk || parsed.ru || '') 
      : (parsed || '');
  };


  const [newTaskType, setNewTaskType] = useState('text');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState('medium');
  const [newTaskCategory, setNewTaskCategory] = useState('grammar'); 
  const [newTaskCorrectAnswer, setNewTaskCorrectAnswer] = useState('');
  
  
  // ТЕПЕР КОНТЕНТ — ЦЕ ОБ'ЄКТ ІЗ МОВАМИ
  const [newTaskContentMulti, setNewTaskContentMulti] = useState({ uk: '', ru: '', en: '', sk: '' });
  const [sourceLang, setSourceLang] = useState('uk');
  const [isSingleLang, setIsSingleLang] = useState(false); // Галочка вимкнення перекладу
  const [translateStatus, setTranslateStatus] = useState('🪄 Автопереклад');
  const [newTaskExercise, setNewTaskExercise] = useState(''); // Для нового завдання
  const [editTaskExercise, setEditTaskExercise] = useState(''); // Для редагування
  
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);

  // РОЗУМНЕ АВТОЗГОРТАННЯ КОМПОЗЕРА
  const composerRef = React.useRef(null);
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      // Якщо клікнули повз розгорнуту форму
      if (isComposerExpanded && composerRef.current && !composerRef.current.contains(e.target)) {
        const isTaskEmpty = !(newTaskContentMulti.uk || newTaskContentMulti.ru || newTaskContentMulti.en || newTaskContentMulti.sk || (newTaskExercise || '').replace(/<[^>]*>|&nbsp;/g, '').trim() || newTaskCorrectAnswer);
        if (isTaskEmpty) {
          setIsComposerExpanded(false); // Згортаємо, якщо нічого не введено
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isComposerExpanded, newTaskContentMulti, newTaskExercise, newTaskCorrectAnswer]);
  
 // --- OCR (РОЗПІЗНАВАННЯ ТЕКСТУ) ---
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLangs, setOcrLangs] = useState(['slk']); // За замовчуванням тільки словацька

  const toggleOcrLang = (code) => {
    setOcrLangs(prev => {
      if (prev.includes(code)) {
        return prev.length === 1 ? prev : prev.filter(l => l !== code); // Не даємо вимкнути останню мову
      }
      return [...prev, code];
    });
  };

  const handleOcrUpload = async (e, isEditMode = false) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsOcrRunning(true);
    setOcrProgress(0);
    try {
      // Розпізнаємо словацьку (slk), українську (ukr) та англійську (eng)
      const langStr = ocrLangs.length > 0 ? ocrLangs.join('+') : 'slk';
      const result = await Tesseract.recognize(file, langStr, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });
      
      const recognizedText = result.data.text.trim();
      
      if (isEditMode) {
          setEditTaskExercise(prev => prev + (prev ? '\n\n' : '') + recognizedText);
      } else {
          setNewTaskExercise(prev => prev + (prev ? '\n\n' : '') + recognizedText);
      }
      
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } catch (err) {
      alert("❌ Помилка OCR (розпізнавання тексту): " + err.message);
    } finally {
      setIsOcrRunning(false);
      setOcrProgress(0);
      e.target.value = ''; // Скидаємо інпут для можливості завантажити те саме фото ще раз
    }
  };
  
  const handleOcrFromUrl = async (imageUrl, isEditMode = false) => {
    setIsOcrRunning(true);
    setOcrProgress(0);
    try {
      // Спочатку скачуємо картинку як Blob, щоб обійти можливі блокування (CORS)
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const langStr = ocrLangs.length > 0 ? ocrLangs.join('+') : 'slk';
      const result = await Tesseract.recognize(blob, langStr, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });
      
      const recognizedText = result.data.text.trim();
      
      if (isEditMode) {
          setEditTaskExercise(prev => prev + (prev ? '\n\n' : '') + recognizedText);
      } else {
          setNewTaskExercise(prev => prev + (prev ? '\n\n' : '') + recognizedText);
      }
      
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } catch (err) {
      alert("❌ Помилка OCR (розпізнавання тексту): " + err.message);
    } finally {
      setIsOcrRunning(false);
      setOcrProgress(0);
    }
  };

  // ФУНКЦІЯ АВТОПЕРЕКЛАДУ (ДЛЯ НОВОГО ЗАВДАННЯ)
  const handleAutoTranslate = async (e) => {
    e.preventDefault(); 
    if (isSingleLang) return; // Якщо галочка стоїть, кнопка не працює
    const sourceText = newTaskContentMulti[sourceLang];
    if (!sourceText.trim()) return alert("Спочатку введіть текст у поле оригіналу!");
    
    setTranslateStatus('⏳ Перекладаю...'); // Сповіщення прямо на кнопці
    try {
      const translate = async (target) => {
        if (target === sourceLang) return sourceText;
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(sourceText)}&langpair=${sourceLang}|${target}`);
        const data = await res.json();
        return data.responseData.translatedText;
      };
      const [uk, ru, en, sk] = await Promise.all([ translate('uk'), translate('ru'), translate('en'), translate('sk') ]);
      setNewTaskContentMulti({ uk, ru, en, sk });
      setTranslateStatus('✅ Готово!');
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      setTimeout(() => setTranslateStatus('🪄 Автопереклад'), 2500);
    } catch (err) {
      setTranslateStatus('❌ Помилка');
      alert("Помилка перекладу: " + err.message);
      setTimeout(() => setTranslateStatus('🪄 Автопереклад'), 2500);
    }
  };

  // СТАНИ ТА ФУНКЦІЯ АВТОПЕРЕКЛАДУ (ДЛЯ РЕДАГУВАННЯ СТАРИХ ЗАВДАНЬ)
  const [editContentMulti, setEditContentMulti] = useState({ uk: '', ru: '', en: '', sk: '' });
  const [editLang, setEditLang] = useState('uk');
  const [isEditSingleLang, setIsEditSingleLang] = useState(false);
  const [editTranslateStatus, setEditTranslateStatus] = useState('🪄 Автопереклад');

  const handleInlineInput = async (e, task) => {
    if (!e.target.classList.contains('inline-blank-input')) return;
    
    const cardEl = document.getElementById(`task-card-${task.id}`);
    if (!cardEl) return;
    
    const inputs = Array.from(cardEl.querySelectorAll('.inline-blank-input'));
    const correctAnswersRaw = (task.correct_answer || '').split(/[,;]/).map(s => s.trim());
    
    let allCorrect = true;
    const input = e.target;
    const index = parseInt(input.getAttribute('data-index'));
    if (isNaN(index)) return;

    const studentVal = input.value.trim();
    const correctVal = correctAnswersRaw[index] || '';
    
    const normalize = (str) => typeof normalizeSlovak === 'function' ? normalizeSlovak(str.toLowerCase().trim()) : str.toLowerCase().trim();
    const normStudent = normalize(studentVal);
    const normCorrect = normalize(correctVal);
    
    input.classList.remove('error-flash', 'success-flash', 'solved');
    void input.offsetWidth; 
    input.style.removeProperty('border-color');
    input.style.removeProperty('background-color');
    input.style.removeProperty('color');

    if (studentVal !== '' && normStudent === normCorrect) {
        input.classList.add('solved', 'success-flash'); 
        input.style.width = 'auto'; // Скидаємо ширину для ідеального злиття!
        playUiSound('ding', isSoundEnabled); 
        if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    inputs.forEach((inp, i) => {
      const sVal = inp.value.trim();
      const cVal = correctAnswersRaw[i] || '';
      if (normalize(sVal) === '' || normalize(cVal) === '' || normalize(sVal) !== normalize(cVal)) {
          allCorrect = false;
      }
    });

    // ПЛАШКА ТЕПЕР З'ЯВЛЯЄТЬСЯ ЗАВЖДИ, НАВІТЬ В АДМІНА
    if (allCorrect) {
      setCompletedTasks(prev => [...new Set([...prev, task.id])]);
      if (dbUserId) {
        supabase.from('progress').upsert({
          user_id: dbUserId, task_id: task.id, status: 'completed',
          points: difficultyConfig[task.difficulty || 'medium'].points,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, task_id' }).then();
      }
    } else {
      setCompletedTasks(prev => prev.filter(id => id !== task.id)); // Ховаємо плашку, якщо стерли слово
    }
  };
  
  const handleEditAutoTranslate = async (e) => {
    e.preventDefault();
    if (isEditSingleLang) return;
    const sourceText = editContentMulti[editLang];
    if (!sourceText?.trim()) return alert("Спочатку введіть текст!");
    
    setEditTranslateStatus('⏳ Перекладаю...');
    try {
      const translate = async (target) => {
        if (target === editLang) return sourceText;
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(sourceText)}&langpair=${editLang}|${target}`);
        const data = await res.json();
        return data.responseData.translatedText;
      };
      const [uk, ru, en, sk] = await Promise.all([ translate('uk'), translate('ru'), translate('en'), translate('sk') ]);
      setEditContentMulti({ uk, ru, en, sk });
      setEditTranslateStatus('✅ Готово!');
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      setTimeout(() => setEditTranslateStatus('🪄 Автопереклад'), 2500);
    } catch (err) {
      setEditTranslateStatus('❌ Помилка');
      alert("Помилка перекладу: " + err.message);
      setTimeout(() => setEditTranslateStatus('🪄 Автопереклад'), 2500);
    }
  };

  // ФУНКЦІЯ ВИКАЧУВАННЯ БЕКАПУ (ЯКУ МИ ЗАГУБИЛИ)
  const handleExportData = async () => {
    try {
      setToast("⏳ Збираємо дані...");
      const { data: c } = await supabase.from('courses').select('*');
      const { data: m } = await supabase.from('modules').select('*');
      const { data: t } = await supabase.from('tasks').select('*');

      const backup = { exportDate: new Date().toISOString(), courses: c, modules: m, tasks: t };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hackademia_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast("✅ Бекап завантажено!");
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      alert("❌ Помилка бекапу: " + err.message);
    }
  };

  const [userAnswers, setUserAnswers] = useState({});
  const [completedTasks, setCompletedTasks] = useState([]);

  const [fullscreenTaskImg, setFullscreenTaskImg] = useState(null);
  // --- ДВИЖОК НАРІЗКИ ФОТО (КРОПЕР) ---
  const [cropState, setCropState] = useState(null);
  const [isSavingCrop, setIsSavingCrop] = useState(false);

  const startCrop = (url, langKey, isEditMode) => {
    setCropState({ url, langKey, isEditMode, boxes: [], startPos: null, currentBox: null });
  };

  const handleCropPointerDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCropState(prev => ({ ...prev, startPos: { x, y }, currentBox: { x, y, w: 0, h: 0 } }));
  };

  const handleCropPointerMove = (e) => {
    if (!cropState?.startPos) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const newBox = {
        x: Math.min(cropState.startPos.x, x),
        y: Math.min(cropState.startPos.y, y),
        w: Math.abs(x - cropState.startPos.x),
        h: Math.abs(y - cropState.startPos.y)
    };
    setCropState(prev => ({ ...prev, currentBox: newBox }));
  };

  const handleCropPointerUp = () => {
    if (!cropState?.currentBox) return;
    if (cropState.currentBox.w > 10 && cropState.currentBox.h > 10) {
        setCropState(prev => ({ ...prev, boxes: [...prev.boxes, prev.currentBox], startPos: null, currentBox: null }));
    } else {
        setCropState(prev => ({ ...prev, startPos: null, currentBox: null }));
    }
  };

  const saveCrops = async () => {
    if (cropState.boxes.length === 0) { alert("Виділіть хоча б одну ділянку на фото!"); return; }
    setIsSavingCrop(true);
    setToast("⏳ Нарізаємо та зберігаємо...");
    try {
      const img = document.getElementById('crop-source-img');
      const ratioX = img.naturalWidth / img.offsetWidth;
      const ratioY = img.naturalHeight / img.offsetHeight;
      const newUrls = [];

      for (let i = 0; i < cropState.boxes.length; i++) {
        const box = cropState.boxes[i];
        if (box.w < 5 || box.h < 5) continue; 
        const canvas = document.createElement('canvas');
        canvas.width = box.w * ratioX;
        canvas.height = box.h * ratioY;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, box.x * ratioX, box.y * ratioY, box.w * ratioX, box.h * ratioY, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        const fileName = `crop_${dbUserId}_${Date.now()}_${i}.png`;
        const { error } = await supabase.storage.from('images').upload(fileName, blob);
        if (error) throw error;
        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        newUrls.push(data.publicUrl + '#slice');
      }

      const replacement = newUrls.join(' ');
      if (cropState.isEditMode) {
        const oldText = editContentMulti[cropState.langKey] || '';
        setEditContentMulti({ ...editContentMulti, [cropState.langKey]: oldText.replace(cropState.url, replacement) });
      } else {
        const oldText = newTaskContentMulti[cropState.langKey] || '';
        setNewTaskContentMulti({ ...newTaskContentMulti, [cropState.langKey]: oldText.replace(cropState.url, replacement) });
      }

      setCropState(null);
      setToast("✅ Нарізку успішно збережено!");
      setTimeout(() => setToast(null), 2500);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } catch (e) {
      alert("Помилка нарізки: " + e.message);
      setToast(null);
    } finally {
      setIsSavingCrop(false);
    }
  };
  
  const [courseProgress, setCourseProgress] = useState({ completed: 0, total: 0 });
  const [moduleCompletionMap, setModuleCompletionMap] = useState({}); // Стан для завершених модулів
  const [myCards, setMyCards] = useState([]);
  
  // СТАНИ ДЛЯ ФІЛЬТРУ ЗАВДАНЬ
  const [taskFilterCategory, setTaskFilterCategory] = useState('all');
  const [taskFilterStatus, setTaskFilterStatus] = useState('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  
  const [pendingCount, setPendingCount] = useState(0);
  const [studentsNeedingCourses, setStudentsNeedingCourses] = useState([]);

  const [flippedCards, setFlippedCards] = useState({});
  const [isTrainingMode, setIsTrainingMode] = useState(false);
  const [isTestView, setIsTestView] = useState(false); 
  const [trainingIndex, setTrainingIndex] = useState(0);
  const [isTrainingFlipped, setIsTrainingFlipped] = useState(false);
  const [quizOptions, setQuizOptions] = useState([]);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTaskId, setRecordingTaskId] = useState(null);
  const [studentRecorder, setStudentRecorder] = useState(null);

  
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [activeBlankIndex, setActiveBlankIndex] = useState(null);
  const [editDifficulty, setEditDifficulty] = useState('medium');
  const [editCategory, setEditCategory] = useState('grammar'); // <--- ДОДАТИ ЦЕ
  
  // Локальні стани для екрану профілю
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userProfile, setUserProfile] = useState({});
  
  // НОВІ СТАНИ ДЛЯ ЗМІНИ ПАРОЛЯ:
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false); // ДОДАЙ ЦЕЙ РЯДОК

    // Завантажуємо повні дані користувача при відкритті профілю
    useEffect(() => {
      async function fetchFullProfile() {
        if (!dbUserId) return;
        const { data } = await supabase.from('users').select('*').eq('id', dbUserId).single();
        if (data) setUserProfile(data);
      }
      fetchFullProfile();
    }, [dbUserId]);


// --- ЗАВАНТАЖЕННЯ ДОСТУПІВ ДО КУРСІВ ДЛЯ УЧНЯ ---
  useEffect(() => {
    async function fetchAllowedCourses() {
      // Якщо в профілі ще немає telegram_id, чекаємо
      if (!userProfile?.telegram_id) return;
      
      const { data, error } = await supabase
        .from('user_courses')
        .select('course_id')
        .eq('user_telegram_id', userProfile.telegram_id);
        
      if (data) {
        // Перетворюємо масив об'єктів на простий список ID курсів: ['a1', 'a2']
        setAllowedCourses(data.map(row => row.course_id));
      }
    }
    
    fetchAllowedCourses();
  }, [userProfile?.telegram_id]);
  
  // --- 2. УСІ useEffect ТАХОЖ ВИЩЕ УСІХ УМОВНІХ РЕНДЕРІВ ---
  // (тут розміщуються твої useEffect для ініціалізації юзера, завантаження курсів тощо)

  // --- 3. ТЕПЕР БЕЗПЕЧНО РОБИТИ УМОВНІ ПОВЕРНЕННЯ (ЕКРАНИ) ---

  const handlePressStart = (e, id) => {
    if (!effectiveIsAdmin) return;
    pressTimer.current = setTimeout(() => {
      setActiveReorderId(id);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
    }, 500);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };
  
  // --- ЄДИНИЙ САЙДБАР ТА ЛІЧИЛЬНИК ЧАТУ ---
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    if (!dbUserId) return;
    const fetchUnread = async () => {
      let query = supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_read', false).neq('sender_id', dbUserId);
      if (!effectiveIsAdmin) query = query.eq('user_id', dbUserId);
      
      const { count } = await query;
      setUnreadChatCount(count || 0);
    };
    
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000); // Оновлюємо кожні 5 секунд
    return () => clearInterval(interval);
  }, [dbUserId, effectiveIsAdmin]);

  const renderSidebar = () => (
    <div style={{ 
      width: '85px', background: isDarkMode ? '#1a202c' : '#1A3636', color: '#ffffff', 
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 12px',
      boxShadow: '4px 0 20px rgba(0,0,0,0.08)', position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box'
    }}>
      <div 
        title="На головну сторінку" 
        onClick={() => navigate('/')} 
        className="hover-card" 
        style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '5px', borderRadius: '14px' }}
      >
        <img src="/logo.svg" alt="Hackademia Logo" style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', flex: 1 }}>
        <button title={t('selectCourse')} onClick={() => { setSelectedCourse(null); setActiveModule(null); setGlobalView(null); }} className={`hover-menu-btn ${(selectedCourse === null && globalView === null && activeModule === null) ? 'active' : ''}`} style={{ width: '100%', border: 'none', color: '#fff', padding: '14px 0', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
        </button>
        <button title={t('myProfile')} onClick={() => { setGlobalView('profile'); setSelectedCourse(null); setActiveModule(null); }} className={`hover-menu-btn ${globalView === 'profile' ? 'active' : ''}`} style={{ width: '100%', border: 'none', color: '#fff', padding: '14px 0', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </button>
        
        {/* КНОПКА ЧАТУ ЗІ ЗНАЧКОМ */}
        <button title={t('chatBtn')} onClick={() => { setGlobalView('chat'); setSelectedCourse(null); setActiveModule(null); }} className={`hover-menu-btn ${globalView === 'chat' ? 'active' : ''}`} style={{ position: 'relative', width: '100%', border: 'none', color: '#fff', padding: '14px 0', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          {unreadChatCount > 0 && (
            <span style={{ position: 'absolute', top: '2px', right: '14px', background: '#E0A345', color: 'white', fontSize: '11px', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
              {unreadChatCount}
            </span>
          )}
        </button>
      </div>

      <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {effectiveIsAdmin && (
          <button title={t('adminPanel')} onClick={() => { setGlobalView('admin_panel'); setSelectedCourse(null); setActiveModule(null); }} className={`hover-menu-btn ${globalView === 'admin_panel' ? 'active' : ''}`} style={{ position: 'relative', width: '100%', border: 'none', color: '#F6AD55', padding: '14px 0', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            {pendingCount > 0 && <span style={{ position: 'absolute', top: '2px', right: '6px', background: '#FF007F', color: 'white', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingCount}</span>}
          </button>
        )}
        <button title={t('toSchool')} onClick={() => navigate('/')} className="hover-menu-btn" style={{ width: '100%', border: 'none', color: '#fff', padding: '14px 0', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </button>
      </div>
    </div>
  );


  // (Далі йдуть інші екрани: admin_panel, spaced, sniper, false_friends, activeModule, selectedCourse тощо)

  
  useEffect(() => {
    const savedCards = localStorage.getItem('hack_my_cards');
    if (savedCards) {
      try { setMyCards(JSON.parse(savedCards)); } catch(e){}
    }
  }, []);

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

  // --- СТАНИ ДЛЯ ФЛЕШКАРТОК ТА РЕЖИМІВ ТРЕНУВАННЯ ---

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
 
  
  // Додай цей маленький useEffect на початку платформи, щоб профіль завантажувався одразу
  useEffect(() => {
    async function loadInitialProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('users').select('*').eq('email', session.user.email).maybeSingle();
        if (data) {
          setUserProfile(data);
          if (data.first_name) setUserName(data.first_name);
        }
      }
    }
    loadInitialProfile();
  }, []);
  
useEffect(() => {
    async function initUser() {
      // 1. ШВИДКИЙ КЕШ
      const cachedStatus = localStorage.getItem('hack_auth_cache');
      if (cachedStatus) setAccessStatus(cachedStatus);

      // 2. Отримуємо дані з обох джерел
      const { data: { session } } = await supabase.auth.getSession();
      const tg = window.Telegram?.WebApp;
      const tgUser = tg?.initDataUnsafe?.user;

      // Налаштовуємо Telegram UI
      if (tg) {
        tg.ready();
        tg.expand();
        if (tg.colorScheme === 'dark') setThemeMode('dark');
      }

      // =========================================================
      // ПЕРЕВІРКА НА ЗБІГ АКАУНТІВ (MERGE)
      // =========================================================
      if (session && tgUser) {
        const { data: authDbUser } = await supabase.from('users').select('telegram_id').eq('id', session.user.id).maybeSingle();

        if (authDbUser && authDbUser.telegram_id !== tgUser.id) {
          setMergePrompt({
            email: session.user.email,
            tgId: tgUser.id,
            tgName: tgUser.first_name,
            tgUsername: tgUser.username,
            authUserId: session.user.id
          });
          return; // ЗУПИНЯЄМО ЗАВАНТАЖЕННЯ, чекаємо відповіді від юзера
        }
      }
      // =========================================================

      // --- ФУНКЦІЯ РЕЄСТРАЦІЇ TELEGRAM ---
      async function registerTelegramUser(user) {
        setTelegramId(user.id);
        const savedAdmin = localStorage.getItem('hack_is_admin');
        if (savedAdmin === 'true') setIsAdmin(true);

        const { data } = await supabase
          .from('users')
          .upsert({
            telegram_id: user.id,
            first_name: user.first_name,
            username: user.username || null
          }, { onConflict: 'telegram_id' })
          .select()
          .single();

        if (data) {
          setDbUserId(data.id);
          if (data.role === 'admin') {
            setIsAdmin(true);
            setAccessStatus('approved');
            localStorage.setItem('hack_is_admin', 'true');
            localStorage.setItem('hack_auth_cache', 'approved');
          } else {
            if (savedAdmin === 'true') {
              localStorage.removeItem('hack_is_admin');
              setIsAdmin(false);
            }
            setAccessStatus(data.access_status || 'pending');
            if (data.access_status === 'approved') {
               localStorage.setItem('hack_auth_cache', 'approved');
            }
          }
        }
      }

      // 3. РОЗПОДІЛ ЛОГІКИ ВХОДУ
      if (session) {
        const emailUser = session.user;
        setUserName(emailUser.email.split('@')[0]);
        localStorage.setItem('hack_auth_cache', 'approved');

        let { data: userRecords } = await supabase
          .from('users')
          .select('*')
          .eq('email', emailUser.email)
          .limit(1);
          
        let userData = userRecords && userRecords.length > 0 ? userRecords[0] : null;

        if (!userData) {
          const fakeTelegramId = Math.floor(Math.random() * 1000000000) + 1000000000;
          const { data: newUserData } = await supabase
            .from('users')
            .insert({
              email: emailUser.email,
              first_name: emailUser.user_metadata?.full_name || emailUser.email.split('@')[0],
              avatar_url: emailUser.user_metadata?.avatar_url || null,
              access_status: 'approved',
              telegram_id: fakeTelegramId
            })
            .select()
            .single();
          userData = newUserData;
        }

        if (userData) {
          setDbUserId(userData.id);
          setAccessStatus(userData.access_status || 'approved');
          if (userData.role === 'admin' || emailUser.email === 'hackslovak@gmail.com') {
            setIsAdmin(true);
            localStorage.setItem('hack_is_admin', 'true');
          } else {
            // Жорстко забираємо права, якщо це звичайний юзер
            setIsAdmin(false);
            localStorage.removeItem('hack_is_admin');
          }
        } else {
          setAccessStatus('approved');
          setIsAdmin(false);
        }
        
        // --- ЦЕЙ ШМАТОК БУВ ВИПАДКОВО ВИДАЛЕНИЙ ---
        fetchCourses();
      } else if (tgUser) {
        setUserName(tgUser.first_name);
        registerTelegramUser(tgUser);
        fetchCourses();
      } else {
        window.location.href = '/login';
      }
    }

    initUser();
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
          const { data: tks } = await supabase.from('tasks').select('id, module_id').in('module_id', modIds);
          if (tks && tks.length > 0) {
            const totalTasks = tks.length;
            const taskIds = tks.map(t => t.id);
            const completedCount = taskIds.filter(id => completedTasks.includes(id)).length;
            setCourseProgress({ completed: completedCount, total: totalTasks });
            
            // Розрахунок 100% виконання для кожного модуля
            const modCompletion = {};
            mods.forEach(m => {
              const modTasks = tks.filter(t => t.module_id === m.id);
              if (modTasks.length > 0) {
                const modCompletedTasks = modTasks.filter(t => completedTasks.includes(t.id));
                modCompletion[m.id] = modCompletedTasks.length === modTasks.length;
              } else {
                modCompletion[m.id] = false;
              }
            });
            setModuleCompletionMap(modCompletion);
          } else {
            setCourseProgress({ completed: 0, total: 0 });
            setModuleCompletionMap({});
          }
        } else {
          setCourseProgress({ completed: 0, total: 0 });
          setModuleCompletionMap({});
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
      showMotivation(); playUiSound('ding', isSoundEnabled);
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

  // ВСТАВЛЯЄМО ТУТ:
  const exitSniper = () => {
    setSniperStatus('menu');
    setSniperTimeLeft(5);
    setSniperHp(5);    // Скидаємо життя
    setSniperIndex(0); // Скидаємо індекс слова
    setSniperInput('');
    setGlobalView(null);
  };
  
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
      showMotivation(); playUiSound('ding', isSoundEnabled);
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


  const toggleSound = () => {
    const newSound = !isSoundEnabled;
    setIsSoundEnabled(newSound);
    localStorage.setItem('hack_sound', newSound ? 'true' : 'false');
    
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    if (newSound) {
      // Відтворюємо твій кастомний mp3-файл із папки public
      const audio = new Audio('/sound-on.mp3');
      audio.play().catch(err => console.log("Помилка відтворення:", err));
    }
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
    const courseLang = prompt("Введи код мови аудиторії (uk, sk, en, ru) або all (щоб бачили всі):", "uk");
    if (!courseLang) return;
    
    const newId = title.toLowerCase().replace(/\s+/g, '-');
    const newOrderIndex = courses.length; 
    
    const { data, error } = await supabase.from('courses').insert({ id: newId, title, order_index: newOrderIndex, lang: courseLang.toLowerCase() }).select();
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
  
  function moveCourse(courseId, direction) {
    const index = courses.findIndex(c => c.id === courseId);
    if (index === -1) return;
    
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= courses.length) return; // За межі масиву не рухаємо
    
    const newCourses = [...courses];
    const [movedItem] = newCourses.splice(index, 1);
    newCourses.splice(newIndex, 0, movedItem);
    
    setCourses(newCourses);
    
    // Оновлюємо order_index та зберігаємо в базу Supabase
    const updates = newCourses.map((c, i) => ({ id: c.id, title: c.title, order_index: i }));
    supabase.from('courses').upsert(updates).then(({error}) => {
      if (error) console.error("Помилка збереження порядку:", error);
    });
  }
  
  async function handleAddModule() {
    if (!newModuleTitleMulti[moduleSourceLang].trim() || !selectedCourse) return;
    const { data, error } = await supabase.from('modules').insert({ 
      title: newModuleTitleMulti, 
      course_id: selectedCourse.id, 
      is_unlocked: true 
    }).select();
    if (error) { alert("Помилка: " + error.message); return; }
    if (data) {
      setModules([...modules, data[0]]);
      setNewModuleTitleMulti({ uk: '', ru: '', en: '', sk: '' });
    }
  }

  async function handleSaveModuleTitle(modId) {
    const { error } = await supabase.from('modules').update({ title: editModuleTitleMulti }).eq('id', modId);
    if (error) { alert("Помилка: " + error.message); return; }
    setModules(modules.map(m => m.id === modId ? { ...m, title: editModuleTitleMulti } : m));
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
    // Беремо відповідь тільки з поля вводу
    let finalCorrectAnswer = newTaskCorrectAnswer;
    
    let baseContent = isSingleLang ? { [sourceLang]: newTaskContentMulti[sourceLang] } : newTaskContentMulti;
    const contentToSave = { ...baseContent, exercise: newTaskExercise };

    const { data, error } = await supabase.from('tasks').insert({ 
      module_id: activeModule.id, type: newTaskType, content: contentToSave, difficulty: newTaskDifficulty, correct_answer: finalCorrectAnswer, category: newTaskCategory
    }).select();
      
    if (error) { alert("Помилка: " + error.message); return; }
    if (data) {
      setTasks([...tasks, data[0]]);
      setNewTaskContentMulti({ uk: '', ru: '', en: '', sk: '' });
      setNewTaskExercise('');
      setNewTaskCorrectAnswer('');
      setIsSingleLang(false);
      setNewTaskCategory('grammar'); 
      setIsComposerExpanded(false); // <--- ДОДАЛИ ЗГОРТАННЯ
    }
  }

  // 🚀 Завантаження важких медіа на Catbox із ВІДСОТКАМИ PROGRESS BAR
  function uploadToCatbox(file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://catbox.moe/user/api.php', true);

      // Трекаємо прогрес відправки
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(xhr.responseText);
        } else {
          reject(new Error(`Помилка сервера: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Розрив з\'єднання. Браузер перервав передачу великого файлу.'));
      };

      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('fileToUpload', file);

      xhr.send(formData);
    });
  }
 
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // ЗАПОБІЖНИК: Перевіряємо розмір (200 МБ = 200 * 1024 * 1024 байт)
    if (file.size > 200 * 1024 * 1024) {
      alert("❌ Файл занадто великий! Обмеження Catbox — 200 МБ. Будь ласка, стисніть відео і спробуйте знову.");
      e.target.value = '';
      return;
    }

    setIsMediaUploading(true); // Вмикаємо анімацію завантаження
	setUploadProgress(0);
    try {
      let publicUrl = '';
      
      if (file.type.startsWith('video/')) {
        publicUrl = await uploadToCatbox(file, setUploadProgress);
      } else {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        let bucketName = file.type.startsWith('audio/') ? 'audio' : 'images';

        const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }
      
      setNewTaskContentMulti(prev => {
        const next = { ...prev };
        if (isSingleLang) {
          next[sourceLang] = (next[sourceLang] || '') + ((next[sourceLang] || '') ? '\n\n' : '') + publicUrl;
        } else {
          ['uk', 'ru', 'en', 'sk'].forEach(l => {
            next[l] = (next[l] || '') + ((next[l] || '') ? '\n\n' : '') + publicUrl;
          });
        }
        return next;
      });
      
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } catch (err) { 
      alert(`❌ Помилка завантаження файлу: ` + err.message); 
    } finally {
      setIsMediaUploading(false); // Вимикаємо анімацію завантаження
      e.target.value = '';
    }
  }

  async function handleEditImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 200 * 1024 * 1024) {
      alert("❌ Файл занадто великий! Обмеження Catbox — 200 МБ. Будь ласка, стисніть відео і спробуйте знову.");
      e.target.value = '';
      return;
    }

    setIsMediaUploading(true);
	setUploadProgress(0);
    try {
      let publicUrl = '';
      
      if (file.type.startsWith('video/')) {
        publicUrl = await uploadToCatbox(file, setUploadProgress);
      } else {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        let bucketName = file.type.startsWith('audio/') ? 'audio' : 'images';

        const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }
      
      setEditContentMulti(prev => {
        const next = { ...prev };
        if (isEditSingleLang) {
          next[editLang] = (next[editLang] || '') + ((next[editLang] || '') ? '\n\n' : '') + publicUrl;
        } else {
          ['uk', 'ru', 'en', 'sk'].forEach(l => {
            next[l] = (next[l] || '') + ((next[l] || '') ? '\n\n' : '') + publicUrl;
          });
        }
        return next;
      });
      
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } catch (err) { 
      alert(`❌ Помилка завантаження файлу: ` + err.message); 
    } finally {
      setIsMediaUploading(false);
      e.target.value = '';
    }
  }

  async function handleAudioUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `audio_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('audio').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('audio').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;
      
      setNewTaskContentMulti(prev => {
        const next = { ...prev };
        if (isSingleLang) {
          next[sourceLang] = (next[sourceLang] || '') + ((next[sourceLang] || '') ? '\n\n' : '') + publicUrl;
        } else {
          ['uk', 'ru', 'en', 'sk'].forEach(l => {
            next[l] = (next[l] || '') + ((next[l] || '') ? '\n\n' : '') + publicUrl;
          });
        }
        return next;
      });
      
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } catch (err) { alert("❌ Помилка завантаження аудіо: " + err.message); }
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
    } catch (err) { alert("❌ Не вдалося отримати доступ до мікрофона: " + err.message); }
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
      const { error: uploadError } = await supabase.storage.from('audio').upload(fileName, blob, { contentType: 'audio/mp3' });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('audio').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;
      
      setNewTaskContentMulti(prev => {
        const next = { ...prev };
        if (isSingleLang) {
          next[sourceLang] = (next[sourceLang] || '') + ((next[sourceLang] || '') ? '\n\n' : '') + publicUrl;
        } else {
          ['uk', 'ru', 'en', 'sk'].forEach(l => {
            next[l] = (next[l] || '') + ((next[l] || '') ? '\n\n' : '') + publicUrl;
          });
        }
        return next;
      });
      
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } catch (err) { alert("❌ Помилка збереження голосового запису: " + err.message); }
  }
  
  async function startStudentRecording(taskId) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      let chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        await uploadStudentAudio(blob, taskId);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setStudentRecorder(recorder);
      setRecordingTaskId(taskId);
    } catch (err) { alert("❌ Не вдалося отримати доступ до мікрофона: " + err.message); }
  }

  function stopStudentRecording() {
    if (studentRecorder) {
      studentRecorder.stop();
      setRecordingTaskId(null);
      setStudentRecorder(null);
      setToast("⏳ Відправляємо запис вчителю...");
      setTimeout(() => setToast(null), 3500);
    }
  }

  async function uploadStudentAudio(blob, taskId) {
    try {
      const fileName = `student_ans_${dbUserId}_${Date.now()}.mp3`;
      const { error: uploadError } = await supabase.storage.from('audio').upload(fileName, blob, { contentType: 'audio/mp3' });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('audio').getPublicUrl(fileName);
      
      const task = tasks.find(t => t.id === taskId);
      // ОНОВЛЕНО: Читаємо контент завдання безпечно, якщо це об'єкт
      const taskContentStr = typeof task.content === 'object' && task.content !== null ? (task.content[lang] || task.content.uk || '') : (task.content || '');
      const taskSnippet = taskContentStr ? taskContentStr.substring(0, 35).replace(/\n/g, ' ') + '...' : 'Завдання';
      const msgText = `🎤 Аудіо-відповідь на "${taskSnippet}":\n${data.publicUrl}`;
      
      await supabase.from('messages').insert([{ user_id: dbUserId, sender_id: dbUserId, text: msgText }]);

      const diff = difficultyConfig[task.difficulty || 'medium'];
      await supabase.from('progress').upsert({ user_id: dbUserId, task_id: taskId, status: 'completed', points: diff.points }, { onConflict: 'user_id, task_id' });
      setCompletedTasks(prev => [...new Set([...prev, taskId])]);
      
      playUiSound('ding', isSoundEnabled);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      alert("✅ Вашу вимову відправлено вчителю на перевірку!");
    } catch (err) { alert("❌ Помилка відправки: " + err.message); }
  }

  async function handleCloudBackup() {
    try {
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

      alert("☁️ Бекап успішно збережено у хмару Supabase!");
    } catch (err) { console.error(err); alert("❌ Помилка збереження у хмару: " + err.message); }
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
      if (window.Telegram?.WebApp) window.Telegram.WebApp.showAlert("❌ Помилка відновлення: " + err.message);
      else alert("❌ Помилка відновлення: " + err.message);
    }
  }

  async function handleLocalJsonRestore(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm(`⚠️ УВАГА! Це відновить базу з локального файлу "${file.name}". Поточні дані будуть оновлені/перезаписані. Продовжити?`)) {
      e.target.value = ''; 
      return;
    }
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.courses && data.courses.length > 0) { const { error: cErr } = await supabase.from('courses').upsert(data.courses); if (cErr) throw cErr; }
      if (data.modules && data.modules.length > 0) { const { error: mErr } = await supabase.from('modules').upsert(data.modules); if (mErr) throw mErr; }
      if (data.tasks && data.tasks.length > 0) { const { error: tErr } = await supabase.from('tasks').upsert(data.tasks); if (tErr) throw tErr; }

      alert(`✅ Успішно відновлено з файлу: ${file.name}`);
      fetchCourses(); setSelectedCourse(null); setActiveModule(null);
    } catch (err) { console.error(err); alert("❌ Помилка читання або відновлення з файлу: " + err.message); } 
    finally { e.target.value = ''; }
  }

  async function handleSaveEdit(taskId) {
    const taskToEdit = tasks.find(t => t.id === taskId);
    
    let finalAnswer = editAnswer;

    const parsedAnswer = taskToEdit.type === 'quiz' ? finalAnswer.trim().toLowerCase() : (taskToEdit.type === 'flashcard' || finalAnswer ? finalAnswer.trim() : null);
    
    let baseContent = isEditSingleLang ? { [editLang]: editContentMulti[editLang] } : editContentMulti;
    const contentToSave = { ...baseContent, exercise: editTaskExercise };

    // ДОДАНО ЗБЕРЕЖЕННЯ КАТЕГОРІЇ (category: editCategory) В БАЗУ ДАНИХ
    const { error } = await supabase.from('tasks').update({ 
      content: contentToSave, 
      correct_answer: parsedAnswer, 
      difficulty: editDifficulty,
      category: editCategory 
    }).eq('id', taskId);

    if (error) { alert("Помилка: " + error.message); return; }
    
    // ДОДАНО ОНОВЛЕННЯ КАТЕГОРІЇ НА ЕКРАНІ БЕЗ ПЕРЕЗАВАНТАЖЕННЯ
    setTasks(tasks.map(t => t.id === taskId ? { 
      ...t, 
      content: contentToSave, 
      correct_answer: parsedAnswer, 
      difficulty: editDifficulty,
      category: editCategory 
    } : t));
    
    setEditingTaskId(null);
  }


const handleResetTaskAnswers = (task) => {
    if (!window.confirm("Очистити всі введені відповіді в цьому завданні?")) return;
    
    const cardEl = document.getElementById(`task-card-${task.id}`);
    if (!cardEl) return;
    
    // 1. Очищаємо всі інлайн-пропуски
    const inputs = cardEl.querySelectorAll('.inline-blank-input');
    inputs.forEach((input, index) => {
      input.value = '';
      input.setAttribute('value', '');
      input.style.width = '3ch';
      input.classList.remove('solved', 'success-flash', 'error-flash');
      input.style.borderColor = '';
      input.style.backgroundColor = '';
      input.style.color = '';
      
      const cacheKey = `task_${task.id}_${index}`;
      localStorage.removeItem(cacheKey);
    });
    
    // 2. Очищаємо класичне поле квізу (якщо є)
    if (userAnswers[task.id]) {
      const newAnswers = { ...userAnswers };
      delete newAnswers[task.id];
      setUserAnswers(newAnswers);
    }
    
    // 3. Знімаємо статус "виконано"
    setCompletedTasks(prev => prev.filter(id => id !== task.id));
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
  };
  
  // Обробка звичайного текстового тесту (quiz)
async function handleAnswerSubmit(task) {
    const cardEl = document.getElementById(`task-card-${task.id}`);
    const blankInputs = cardEl ? cardEl.querySelectorAll('.inline-blank-input') : [];
    
    if (blankInputs.length > 0) {
      // Якщо в тексті є інтерактивні пропуски (...)
      const correctAnswersRaw = (task.correct_answer || '').split(/[,;]/).map(s => s.trim());
      let allCorrect = true;
      let hadDiacriticMistake = false;
      let expectedList = [];

blankInputs.forEach((input, index) => {
            const studentVal = input.value.trim();
            const correctVal = correctAnswersRaw[index] ? correctAnswersRaw[index].trim() : '';
            
            if (correctVal) expectedList.push(correctVal);

            input.setAttribute('value', studentVal);
            input.defaultValue = studentVal;

            if (input.classList.contains('solved') || input.readOnly) {
                return; 
            }

            const normalize = (str) => typeof normalizeSlovak === 'function' ? normalizeSlovak(str.toLowerCase().trim()) : str.toLowerCase().trim();
            const normStudent = normalize(studentVal);
            const normCorrect = normalize(correctVal);

            // Скидаємо анімації та стилі перед новою перевіркою
            input.classList.remove('success-flash', 'error-flash', 'solved');
            void input.offsetWidth; // МАГІЯ: Примусово перезапускаємо кадр!
            input.style.removeProperty('border-color');
            input.style.removeProperty('background-color');
            input.style.removeProperty('color');

            if (normStudent !== '' && normCorrect !== '' && normStudent === normCorrect) {
                // ПРАВИЛЬНО - запускаємо мигання зеленим
                input.classList.add('solved', 'success-flash');

                if (studentVal !== correctVal) {
                    hadDiacriticMistake = true;
                }
            } else {
                allCorrect = false;
                
                if (studentVal !== '') {
                    // ПОМИЛКА - запускаємо червоне трусіння (error-flash)
                    setTimeout(() => {
                        input.classList.add('error-flash');
                        input.style.setProperty('border-color', '#E53E3E', 'important');
                        input.style.setProperty('background-color', 'rgba(229, 62, 62, 0.1)', 'important');
                    }, 10);
                }
            }
      });

      if (allCorrect) {
        showMotivation(); 
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

        if (hadDiacriticMistake) {
          alert(`✅ Зараховано! 🎉 +${diff.points} балів.\n\n⚠️ Але зверніть увагу на правильне написання з діакритикою: "${expectedList.join(', ')}"`);
        } else {
          alert(`Правильно! 🎉 +${diff.points} балів.`);
        }
      } else {
        playUiSound('buzz', isSoundEnabled);
        if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        alert("Деякі відповіді неправильні ❌ Перевірте підсвічені поля й спробуйте ще раз!");
      }
    } else {
      // Стандартна перевірка для звичайних квізів
      const studentAnswer = (userAnswers[task.id] || '').trim();
      const correctAnswer = (task.correct_answer || '').trim();

      if (!correctAnswer) {
        alert("⚠️ У цього завдання ще немає правильної відповіді.");
        return;
      }

      const normStudent = normalizeSlovak(studentAnswer);
      const normCorrect = normalizeSlovak(correctAnswer);

      if (normStudent === normCorrect) {
        showMotivation(); playUiSound('ding', isSoundEnabled);
        if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        
        const diff = difficultyConfig[task.difficulty || 'medium'];
        await supabase.from('progress').upsert({
          user_id: dbUserId,
          task_id: task.id,
          status: 'completed',
          points: diff.points
        }, { onConflict: 'user_id, task_id' });

        setCompletedTasks([...new Set([...completedTasks, task.id])]); 

        if (studentAnswer !== correctAnswer) {
          alert(`✅ Зараховано! 🎉 +${diff.points} балів.\n\n⚠️ Правильно писати з діакритикою: "${correctAnswer}"`);
        } else {
          alert(`Правильно! 🎉 +${diff.points} балів.`);
        }
      } else {
        playUiSound('buzz', isSoundEnabled);
        if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        alert("Неправильно ❌ Спробуй ще раз!");
      }
    }
  }

// --- ЛОГІКА ТРЕНУВАННЯ / ТЕСТІВ ФЛЕШКАРТОК ---
  const allTasksToRender = [...tasks, ...myCards];
  const flashcards = allTasksToRender.filter(t => t.type === 'flashcard');

  function handleAddCustomCard(e) {
    e.preventDefault();
    if (!newDictWord.trim() || !newDictTranslation.trim()) return;

    const newCard = {
      id: 'custom_' + Date.now(),
      type: 'flashcard',
      content: newDictWord.trim(),
      correct_answer: newDictTranslation.trim(),
      difficulty: 'medium',
      isCustom: true
    };

    const updated = [...myCards, newCard];
    setMyCards(updated);
    localStorage.setItem('hack_my_cards', JSON.stringify(updated));
    
    // Очищаємо форму після додавання
    setNewDictWord('');
    setNewDictTranslation('');
    
    playUiSound('ding', isSoundEnabled);
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
    showMotivation(); playUiSound('ding', isSoundEnabled);
    const diff = difficultyConfig[task.difficulty || 'medium'];
    await supabase.from('progress').upsert({ user_id: dbUserId, task_id: task.id, status: 'completed', points: diff.points }, { onConflict: 'user_id, task_id' });
    setCompletedTasks([...new Set([...completedTasks, task.id])]); 
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  }

function renderContent(taskContent, currentTask = null) {
    let descText = "";
    let exerciseText = "";

    if (typeof taskContent === 'object' && taskContent !== null) {
      descText = taskContent[lang] || taskContent.uk || taskContent.ru || taskContent.sk || '';
      exerciseText = taskContent.exercise || '';
    } else {
      descText = taskContent || '';
    }

const parseToElements = (text, prefixKey) => {
      if (!text) return { texts: [], media: [] };
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = text.split(urlRegex);
      
      const texts = [];
      const media = [];
      let sliceGroup = [];

      const flushSlices = () => {
        if (sliceGroup.length > 0) {
          media.push(
            <div key={`${prefixKey}-slice-group-${media.length}`} style={{ display: 'flex', gap: '15px', margin: '15px 0', width: '100%', overflowX: 'auto', paddingBottom: '10px', alignItems: 'center' }}>
              {sliceGroup.map((url, idx) => {
                const cleanUrl = url.replace(/#slice/g, '');
                return (
                  <img
                    key={`img-${idx}`} src={cleanUrl} alt="slice" onClick={() => setFullscreenTaskImg(cleanUrl)}
                    className="hover-card"
                    draggable="false" onContextMenu={(e) => e.preventDefault()}
                    style={{ height: '280px', width: 'auto', objectFit: 'contain', borderRadius: '12px', cursor: 'zoom-in', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', flexShrink: 0, userSelect: 'none', WebkitUserDrag: 'none', WebkitTouchCallout: 'none' }}
                    onError={(e)=>{e.target.style.display='none'}}
                  />
                );
              })}
            </div>
          );
          sliceGroup = [];
        }
      };

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.match(urlRegex) && part.includes('#slice')) {
          sliceGroup.push(part);
        } else if (sliceGroup.length > 0 && part.trim() === '') {
          continue;
        } else {
          flushSlices();
          if (part.match(urlRegex)) {
        const ytMatch = part.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        
        if (ytMatch && ytMatch[1]) {
            media.push(
                <div key={`${prefixKey}-${i}`} style={{ margin: '15px 0' }}>
                    <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} title="YouTube" style={{ width: '100%', height: '300px', borderRadius: '12px', border: 'none' }} allowFullScreen />
                </div>
            );
        } else if (part.match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/i) || part.includes("/audio/") || part.includes("voice_")) {
            media.push(
                <div key={`${prefixKey}-${i}`} style={{ margin: '15px 0', width: '100%' }}>
                    <audio controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} src={part} style={{ width: '100%', outline: 'none' }} />
                </div>
            );
        } else if (part.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
            media.push(
                <div key={`${prefixKey}-${i}`} style={{ margin: '15px 0' }}>
                    <video controls controlsList="nodownload" disablePictureInPicture onContextMenu={(e) => e.preventDefault()} src={part} style={{ width: '100%', maxHeight: '400px', borderRadius: '12px', background: '#000' }} />
                </div>
            );
        } else if (part.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) || part.includes("/images/") || part.includes("t.me") || part.includes("chat-images")) {
            const cleanUrl = part.replace(/#split\d|#slice/g, '');
            media.push(
                <div key={`${prefixKey}-${i}`} style={{ margin: '15px 0', textAlign: 'center' }}>
                    <img src={cleanUrl} draggable="false" onContextMenu={(e) => e.preventDefault()} alt="task-img" onClick={() => setFullscreenTaskImg(cleanUrl)} className="hover-card" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '12px', cursor: 'zoom-in', border: '1px solid rgba(0,0,0,0.1)', userSelect: 'none', WebkitUserDrag: 'none', WebkitTouchCallout: 'none' }} />
                </div>
            );
        } else {
            texts.push(
                <a key={`${prefixKey}-${i}`} href={part} target="_blank" rel="noreferrer" style={{ color: '#E0A345', textDecoration: 'underline' }}>
                    {part}
                </a>
            );
        }
    } else if (part) {
            let html = String(part);

            // Обробка Markdown-розмітки, кольорів та перетворення 4 крапок на інтерактивний інпут
let inlineCounter = -1;
    const safeTask = currentTask || { id: 'gen', correct_answer: '' };
    const correctAnswersRaw = (safeTask.correct_answer || '').split(/[,;]/).map(s => s.trim());

html = html.replace(/\.{4,}/g, () => {
      inlineCounter++;
      const cacheKey = `task_${safeTask.id}_${inlineCounter}`;
      const savedVal = localStorage.getItem(cacheKey) || '';
      const correctVal = correctAnswersRaw[inlineCounter] ? correctAnswersRaw[inlineCounter].trim() : '';
      
      const normalize = (str) => typeof normalizeSlovak === 'function' ? normalizeSlovak(str.toLowerCase().trim()) : str.toLowerCase().trim();
      const cleanSaved = normalize(savedVal);
      const cleanCorrect = normalize(correctVal);

      let extraClasses = '';
      let extraAttrs = '';
      // МАГІЯ 1: Використовуємо 'em' із коефіцієнтом, щоб широкі букви (як 'm') містилися, а вузькі не створювали дір
      const emWidth = (Math.max(savedVal.length, 1) * 0.6) + 0.5;
      let inlineStyle = `width: ${emWidth}em; text-align: center; margin: 0 4px; padding: 2px 4px; transition: width 0.1s; box-sizing: content-box; `;

      if (cleanSaved !== '' && cleanCorrect !== '' && cleanSaved === cleanCorrect) {
          extraClasses = 'solved';
      }

      const stopReact = "event.stopPropagation();";
      const safeCorrect = cleanCorrect.replace(/'/g, "\\'");
      
      const updateLogic = `
          localStorage.setItem('${cacheKey}', this.value); 
          this.setAttribute('value', this.value); 
          this.style.width = ((Math.max(this.value.length, 1) * 0.6) + 0.5) + 'em'; 
          this.classList.remove('error-flash', 'success-flash', 'solved'); 
          void this.offsetWidth;
          
          if ('${safeCorrect}' !== '') {
              const studentText = this.value.trim().toLowerCase().replace(/[áäàâãå]/g,'a').replace(/[čç]/g,'c').replace(/[ď]/g,'d').replace(/[éěëêè]/g,'e').replace(/[íîïì]/g,'i').replace(/[ĺľ]/g,'l').replace(/[ňń]/g,'n').replace(/[óôöõòø]/g,'o').replace(/[ŕ]/g,'r').replace(/[šś]/g,'s').replace(/[ť]/g,'t').replace(/[úůüûù]/g,'u').replace(/[ýÿ]/g,'y').replace(/[žźż]/g,'z');
              const correctText = '${safeCorrect}'.toLowerCase().replace(/[áäàâãå]/g,'a').replace(/[čç]/g,'c').replace(/[ď]/g,'d').replace(/[éěëêè]/g,'e').replace(/[íîïì]/g,'i').replace(/[ĺľ]/g,'l').replace(/[ňń]/g,'n').replace(/[óôöõòø]/g,'o').replace(/[ŕ]/g,'r').replace(/[šś]/g,'s').replace(/[ť]/g,'t').replace(/[úůüûù]/g,'u').replace(/[ýÿ]/g,'y').replace(/[žźż]/g,'z');
              
              if (studentText !== '' && studentText === correctText) {
                  this.classList.add('solved', 'success-flash');
                  this.style.width = 'auto'; /* Скидаємо ширину для злиття */
                  if (typeof window.hackPlaySound === 'function') window.hackPlaySound('ding');
              }
          }
      `.replace(/\n/g, ' ');

      return `<input type="text" class="inline-blank-input ${extraClasses}" placeholder="..." value="${savedVal}" ${extraAttrs} style="${inlineStyle}" oninput="${stopReact} ${updateLogic}" onkeydown="${stopReact}" onkeyup="${stopReact}" />`;
    });

    const palettes = [
      'linear-gradient(135deg, #E0A345 0%, #D69E2E 100%)', 
      'linear-gradient(135deg, #48BB78 0%, #38A169 100%)', 
      'linear-gradient(135deg, #4299E1 0%, #3182ce 100%)', 
      'linear-gradient(135deg, #9F7AEA 0%, #805AD5 100%)'  
    ];
    let speakers = [];
    let currentPaletteIndex = 0;
    let normalizedText = html.replace(/<br\s*[\/]?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<\/div>/gi, '\n').replace(/<p[^>]*>/gi, '').replace(/<div[^>]*>/gi, '').replace(/&nbsp;/g, ' ');
    let lines = normalizedText.split('\n');
    
    setTimeout(() => {
        document.querySelectorAll('.inline-blank-input').forEach(input => {
            const tId = input.getAttribute('data-task-id');
            const idx = input.getAttribute('data-index');
            const cleanCorrect = input.getAttribute('data-correct');
            if (tId && idx !== null) {
                const val = localStorage.getItem(`task_${tId}_${idx}`) || '';
                if (val && input.value !== val) {
                    input.value = val;
                    input.setAttribute('value', val);
                    input.style.width = ((Math.max(val.length, 1) * 0.6) + 0.5) + 'em';
                    
                    const normalize = (str) => typeof normalizeSlovak === 'function' ? normalizeSlovak(str.toLowerCase().trim()) : str.toLowerCase().trim();
                    if (normalize(val) !== '' && cleanCorrect !== '' && normalize(val) === cleanCorrect) {
                        input.classList.add('solved');
                        input.style.width = 'auto'; /* Скидаємо ширину для злиття */
                    }
                }
            }
        });
    }, 50);

			
            let resultHtml = '';
            let inBubble = false;
            let inContainer = false;

            for (let j = 0; j < lines.length; j++) {
              let line = lines[j].trim();
              
              if (!line) {
                if (inBubble) { resultHtml += '</div></div>'; inBubble = false; }
                continue;
              }

              const cleanLineForMatch = line.replace(/<[^>]*>/g, '').trim();
              const speakerMatch = cleanLineForMatch.match(/^([A-ZÁÉÍÓÚÝČĎĽŇŠŤŽА-ЯІЇЄҐ]+[a-záéíóúýčďľňšťžа-яіїєґ]*):\s*(.*)$/);
              
              if (speakerMatch) {
                if (!inContainer) {
                    resultHtml += '<div class="chat-container">';
                    inContainer = true;
                }
                if (inBubble) resultHtml += '</div></div>'; 
                
                const name = speakerMatch[1];
                const colonIndex = line.indexOf(':');
                let textAfterColon = line.substring(colonIndex + 1).trim();
                
                if (speakers.length === 2 && !speakers.includes(name)) {
                   speakers = [name]; 
                   currentPaletteIndex = (currentPaletteIndex + 1) % palettes.length; 
                } else if (!speakers.includes(name)) {
                   speakers.push(name);
                }

                const isRight = speakers.length > 1 && speakers[1] === name;
                const sideClass = isRight ? 'msg-right' : 'msg-left';
                const bubbleStyle = isRight ? `style="background: ${palettes[currentPaletteIndex]}; color: #fff; border: none;"` : '';
                
                resultHtml += `<div class="chat-wrapper ${sideClass}"><div class="chat-name">${name}</div><div class="chat-bubble" ${bubbleStyle}>${textAfterColon}`;
                inBubble = true;
              } 
              else if (line.includes('[cols]') || line.includes('[/cols]')) {
                if (inBubble) { resultHtml += '</div></div>'; inBubble = false; }
                if (inContainer) { resultHtml += '</div>'; inContainer = false; }
                resultHtml += line;
              } 
              else {
                if (!inBubble) {
                   if (inContainer) {
                     resultHtml += '</div>'; 
                     inContainer = false;
                     if (speakers.length > 0) {
                       speakers = []; 
                       currentPaletteIndex = (currentPaletteIndex + 1) % palettes.length; 
                     }
                   }
                   resultHtml += line + '<br>';
                } else {
                   resultHtml += '<br>' + line; 
                }
              }
            }
            
            if (inBubble) resultHtml += '</div></div>';
            if (inContainer) resultHtml += '</div>';

            resultHtml = resultHtml.replace(/\[cols\]([\s\S]*?)\[\/cols\]/g, '<div style="column-count: 2; column-gap: 30px; width: 100%; box-sizing: border-box;">$1</div>');

            texts.push(<div key={`${prefixKey}-${i}`} dangerouslySetInnerHTML={{ __html: resultHtml }} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }} />);
          }
        }
      }
      flushSlices();
      
      // Безпечний фільтр, який перевіряє як звичайний текст, так і dangerouslySetInnerHTML
      const validTexts = texts.filter(t => {
        if (t?.props?.children && typeof t.props.children === 'string') {
          return t.props.children.trim() !== '';
        }
        if (t?.props?.dangerouslySetInnerHTML?.__html) {
          return t.props.dangerouslySetInnerHTML.__html.trim() !== '';
        }
        return true; 
      });
      return { texts: validTexts, media };
    };

    const parsedDesc = parseToElements(descText, 'desc');
    const parsedEx = parseToElements(exerciseText, 'ex');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* 1. ТЕКСТ УМОВИ (ЗАВЖДИ ЗВЕРХУ) */}
        {parsedDesc.texts.length > 0 && (
          <div style={{ fontSize: '18px', lineHeight: '1.6', color: theme.text, whiteSpace: 'pre-wrap' }}>
            {parsedDesc.texts}
          </div>
        )}
        
        {/* 2. МЕДІА ФАЙЛИ УМОВИ (Картинки, Аудіо - ЗАВЖДИ ПІД ТЕКСТОМ) */}
        {parsedDesc.media.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {parsedDesc.media}
          </div>
        )}

        {/* 3. ТЕКСТ ВПРАВИ (Оцифрований словацький текст у сірому блоці) */}
        {(parsedEx.texts.length > 0 || parsedEx.media.length > 0) && (
          <div style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, padding: '20px', borderRadius: '16px', fontSize: '20px', fontWeight: '600', color: theme.text, whiteSpace: 'pre-wrap', lineHeight: '1.5', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
            {parsedEx.texts.length > 0 && <div>{parsedEx.texts}</div>}
            {parsedEx.media.length > 0 && <div style={{ marginTop: parsedEx.texts.length > 0 ? '15px' : '0' }}>{parsedEx.media}</div>}
          </div>
        )}
      </div>
    );
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

  const renderGlobalStyles = () => (
    <style>{` 
      /* Floating BG Animations */
      @keyframes floatBg {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-25px); }
      }
      /* Анімація-підказка для перевороту картки */
      @keyframes flipHintPulse {
        0%, 100% { opacity: 0.5; transform: scale(1); filter: drop-shadow(0 0 0px transparent); color: ${theme.textSecondary}; }
        50% { opacity: 1; transform: scale(1.05); color: #FF7B54; filter: drop-shadow(0 0 12px rgba(255, 123, 84, 0.6)); }
      }
      .flip-hint {
        animation: flipHintPulse 2s infinite ease-in-out;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        pointer-events: none;
      }
      .bg-element {
          position: fixed;
          color: ${theme.bgIconColor}; 
          opacity: ${theme.bgIconOpacity}; 
          z-index: 0; 
          pointer-events: none; 
          transition: color 0.3s ease, opacity 0.3s ease;
      }
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

      @keyframes ffPulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; color: #FF007F; }
        100% { opacity: 1; }
      }
	  
	  .interactive-png {
          position: fixed;
          z-index: 1;
          opacity: 0.4;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          /* Резервний свіп, якщо PNG ще не завантажили в public */
          background-color: rgba(224, 163, 69, 0.15); 
          border-radius: 50%;
          filter: blur(8px);
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: floatBg 15s ease-in-out infinite alternate;
          cursor: pointer;
      }
      .interactive-png:hover {
          transform: scale(1.2) rotate(10deg) !important;
          opacity: 0.9;
          filter: blur(0px) drop-shadow(0 20px 40px rgba(224, 163, 69, 0.6));
          z-index: 100;
      }

      /* --- НОВІ ЕФЕКТИ НАВЕДЕННЯ (ХОВЕР) --- */
      .hover-card {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease !important;
      }
      .hover-card:hover {
        transform: translateY(-4px) scale(1.02) !important;
        box-shadow: 0 15px 35px rgba(0,0,0,0.15) !important;
        filter: brightness(1.1);
        z-index: 10 !important;
      }

      .hover-menu-btn {
        transition: background 0.2s ease, transform 0.1s ease !important;
        background: transparent;
      }
      .hover-menu-btn:not(.active):hover {
        background: rgba(255,255,255,0.08) !important;
        transform: scale(1.08); /* Легке збільшення іконки при наведенні */
      }
      .hover-menu-btn.active {
        background: rgba(255,255,255,0.15) !important;
      }
	  
	  /* НОВИЙ МІНІМАЛІСТИЧНИЙ COMPOSER */
      .composer-menu-parent { position: relative; }
      .composer-menu-dropdown { 
          position: absolute; bottom: 130%; left: -10px; background: ${theme.cardBg}; 
          padding: 16px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); 
          border: 1px solid ${theme.inputBorder}; opacity: 0; visibility: hidden; 
          transform: translateY(10px); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); z-index: 1000;
          display: flex; flex-direction: column; gap: 12px; min-width: 220px;
      }
      .composer-menu-parent:hover .composer-menu-dropdown {
          opacity: 1; visibility: visible; transform: translateY(0);
      }
      .composer-input-area {
          transition: 0.3s;
      }
      .composer-input-area:focus-within {
          background: ${theme.cardBg} !important;
          border-color: #E0A345 !important;
          box-shadow: 0 4px 20px rgba(224, 163, 69, 0.1);
      }
      
      /* МЕСЕНДЖЕР ДЛЯ ДІАЛОГІВ З М'ЯКИМ ФОНОМ КОНТЕЙНЕРА */
      .chat-container { display: flex; flex-direction: column; width: 100%; box-sizing: border-box; max-width: 100%; gap: 6px; margin: 15px 0; background: ${isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.025)'}; border: 1px solid ${theme.inputBorder}; border-radius: 16px; padding: 12px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.02); overflow: hidden; }
      .chat-wrapper { display: flex; flex-direction: column; max-width: 85%; width: fit-content; animation: fadeIn 0.3s ease; box-sizing: border-box; }
      .chat-wrapper.msg-left { align-items: flex-start; align-self: flex-start; }
      .chat-wrapper.msg-right { align-items: flex-end; align-self: flex-end; }
      .chat-name { font-size: 10px; font-weight: 800; color: ${theme.textSecondary}; margin-bottom: 2px; padding: 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
      .chat-bubble { padding: 8px 14px; border-radius: 14px; font-size: 15px; line-height: 1.35; box-shadow: 0 2px 5px rgba(0,0,0,0.05); word-wrap: break-word; overflow-wrap: break-word; max-width: 100%; box-sizing: border-box; }
      .msg-left .chat-bubble { background: ${isDarkMode ? '#3b4758' : '#F1F5F9'}; border: 1px solid ${theme.inputBorder}; color: ${theme.text}; border-bottom-left-radius: 4px; }
      .msg-right .chat-bubble { background: linear-gradient(135deg, #E0A345 0%, #D69E2E 100%); color: #ffffff; border: none; border-bottom-right-radius: 4px; }
	  
.inline-blank-input {
      background: rgba(0, 0, 0, 0.06);
      border: 1.5px dashed rgba(0, 0, 0, 0.15);
      border-radius: 8px;
      padding: 2px 6px;
      color: inherit;
      min-width: 30px;
      max-width: 280px;
      font-size: inherit;
      font-family: inherit;
      outline: none;
      transition: all 0.25s ease;
      display: inline-block;
      vertical-align: baseline;
      margin: 0 4px;
      /* МАГІЯ 2: Сучасні браузери автоматично ідеально облягатимуть текст! */
      field-sizing: content; 
    }
    
    .inline-blank-input::placeholder {
      color: rgba(0, 0, 0, 0.4);
    }
    .msg-right .inline-blank-input::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }
    
    .msg-right .inline-blank-input {
      background: rgba(255, 255, 255, 0.2);
      border: 1.5px dashed rgba(255, 255, 255, 0.4);
      color: #ffffff;
    }
    .inline-blank-input:focus {
      background: #ffffff !important;
      color: #1a202c !important;
      border: 2px solid #E0A345 !important;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    }
    
    .inline-blank-input.solved {
      /* МАГІЯ: Прибрали !important, щоб дозволити анімації працювати */
      background: transparent;
      border: none;
      color: inherit;
      box-shadow: none;
      padding: 0;
      margin: 0;
      min-width: 0;
      
      /* Замінили жирний шрифт на КУРСИВ */
      font-weight: inherit;
      font-style: italic; 
      cursor: pointer;
    }

    /* Блокуємо зміну фону, якщо учень випадково клікне на вже вирішене слово */
    .inline-blank-input.solved:focus {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }
    
    /* Яскраве зелене мигання з розчиненням для звичайних повідомлень */
    @keyframes smoothSuccessPulse {
      0% { background-color: #38A169; color: #ffffff; padding: 0 6px; border-radius: 6px; }
      15% { background-color: rgba(56, 161, 105, 0.4); color: #22543D; padding: 0 6px; border-radius: 6px; }
      85% { background-color: rgba(56, 161, 105, 0.4); color: #22543D; padding: 0 6px; border-radius: 6px; }
      100% { background-color: transparent; color: inherit; padding: 0; border-radius: 0; }
    }
    
    /* Яскраве біло-жовте мигання для правих (жовтих) бульбашок */
    @keyframes smoothSuccessPulseRight {
      0% { background-color: #ffffff; color: #D69E2E; padding: 0 6px; border-radius: 6px; }
      15% { background-color: rgba(255, 255, 255, 0.4); color: #ffffff; padding: 0 6px; border-radius: 6px; }
      85% { background-color: rgba(255, 255, 255, 0.4); color: #ffffff; padding: 0 6px; border-radius: 6px; }
      100% { background-color: transparent; color: inherit; padding: 0; border-radius: 0; }
    }

    .inline-blank-input.success-flash {
      animation: smoothSuccessPulse 2s ease-in-out forwards !important;
    }
    
    .msg-right .inline-blank-input.success-flash {
      animation: smoothSuccessPulseRight 2s ease-in-out forwards !important;
    }
	
	/* ТЕЛЕГРАМ КОНТЕКСТНЕ МЕНЮ ДЛЯ РЕДАКТОРА */
      .tg-context-menu {
          position: fixed;
          background: ${theme.cardBg};
          border: 1px solid ${theme.inputBorder};
          box-shadow: 0 8px 30px rgba(0,0,0,0.2);
          border-radius: 12px;
          padding: 8px 0;
          z-index: 1000000;
          min-width: 240px;
          font-size: 14px;
          color: ${theme.text};
          animation: fadeIn 0.15s ease-out;
      }
      .tg-menu-item {
          padding: 10px 16px;
          display: flex;
          justify-content: space-between;
          cursor: pointer;
          align-items: center;
          transition: background 0.1s;
      }
      .tg-menu-item:hover { background: rgba(224, 163, 69, 0.15); }
      .tg-menu-hotkey { color: ${theme.textSecondary}; font-size: 12px; opacity: 0.7; }
      .tg-menu-divider { height: 1px; background: ${theme.inputBorder}; margin: 6px 0; opacity: 0.5; }
      
      .tg-has-submenu { position: relative; }
      .tg-submenu {
          position: absolute;
          top: -8px;
          background: ${theme.cardBg};
          border: 1px solid ${theme.inputBorder};
          box-shadow: 0 8px 30px rgba(0,0,0,0.2);
          border-radius: 12px;
          padding: 8px 0;
          min-width: 240px;
          display: none;
          z-index: 1000001;
      }
      /* Якщо меню зліва екрану - підменю випадає вправо */
      .tg-has-submenu.right-side .tg-submenu { left: 100%; margin-left: 4px; }
      /* Якщо меню справа екрану - підменю випадає вліво */
      .tg-has-submenu.left-side .tg-submenu { right: 100%; margin-right: 4px; }
      .tg-has-submenu:hover > .tg-submenu { display: block; animation: fadeIn 0.15s ease-out; }
    `}</style>
  );


  
  // --- ЕКРАН АДМІН-ПАНЕЛІ (НОВІ ЗАЯВКИ) ---
  if (globalView === 'admin_panel') {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', background: theme.bg }}>
        {renderGlobalStyles()} <FloatingBackgrounds theme="{theme}" themeMode="{themeMode}"/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => setGlobalView(null)} style={{ background: 'transparent', border: 'none', color: '#FF007F', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            ← Назад на головну
          </button>
        </div>
        <AdminPanel />
      </div>
    );
  }
  
// --- ЕКРАН "МІЙ СЛОВНИК" (ХАБ ФЛЕШКАРТОК) ---
  if (globalView === 'dictionary') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
        {renderGlobalStyles()} <FloatingBackgrounds theme="{theme}" themeMode="{themeMode}"/>
        {renderSidebar()}
        <div style={{ flex: 1, padding: '50px 60px', overflowY: 'auto', boxSizing: 'border-box', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
          
          <button onClick={() => setGlobalView(null)} className="hover-card" style={{ background: theme.cardBg, border: `1px solid ${theme.inputBorder}`, color: theme.text, padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', alignSelf: 'flex-start' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Назад на головну
          </button>

          {/* ЗАГОЛОВОК І ГОЛОВНА КНОПКА ПО ЦЕНТРУ */}
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ color: theme.text, fontSize: '42px', margin: '0 0 10px 0', fontWeight: '900', letterSpacing: '-0.5px' }}>📖 Мій словник</h2>
            <p style={{ color: theme.textSecondary, fontSize: '18px', margin: '0 0 30px 0' }}>Ваші власні слова та інтервальне тренування</p>
            
            <button onClick={startSpacedRepetition} className="hover-card" style={{ background: 'linear-gradient(135deg, #FF7B54 0%, #FFB26B 100%)', color: '#fff', padding: '20px 50px', borderRadius: '24px', border: 'none', fontWeight: '900', fontSize: '22px', cursor: 'pointer', boxShadow: '0 15px 35px rgba(255,123,84,0.3)', display: 'inline-flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '28px' }}>🔄</span> Почати тренування
            </button>
          </div>

          {/* СПИСОК ВЛАСНИХ СЛІВ */}
          <h3 style={{ margin: '0 0 20px 0', fontSize: '24px', color: theme.text, fontWeight: '800' }}>Ваші картки ({myCards.length})</h3>
          {myCards.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: theme.inputBg, borderRadius: '24px', color: theme.textSecondary, fontSize: '16px', marginBottom: '40px' }}>
              Ви ще не додали жодного слова. Зробіть це у формі нижче! 👇
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              {myCards.map(card => (
                <div key={card.id} className="hover-card" style={{ background: theme.cardBg, padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: `1px solid ${theme.inputBorder}`, position: 'relative' }}>
                  <button onClick={() => handleDeleteMyCard(card.id)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Видалити</button>
                  <div style={{ fontSize: '11px', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', fontWeight: 'bold' }}>Словацька</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: theme.text, marginBottom: '12px' }}>{card.content}</div>
                  <div style={{ fontSize: '11px', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', fontWeight: 'bold' }}>Переклад</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: theme.primary }}>{card.correct_answer}</div>
                </div>
              ))}
            </div>
          )}

          {/* ФОРМА ДОДАВАННЯ СЛОВА (Компактна, внизу) */}
          <div style={{ background: theme.cardBg, padding: '25px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: `1px solid ${theme.inputBorder}`, marginTop: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: theme.text, fontWeight: '800' }}>➕ Додати власне слово</h3>
            <form onSubmit={handleAddCustomCard} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="text" placeholder="Слово (наприклад: jablko)" value={newDictWord} onChange={e => setNewDictWord(e.target.value)} style={{ flex: 1, minWidth: '150px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: theme.inputBg, color: theme.text, fontSize: '14px' }} />
              <input type="text" placeholder="Переклад (наприклад: яблуко)" value={newDictTranslation} onChange={e => setNewDictTranslation(e.target.value)} style={{ flex: 1, minWidth: '150px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: theme.inputBg, color: theme.text, fontSize: '14px' }} />
              <button type="submit" disabled={!newDictWord.trim() || !newDictTranslation.trim()} className="hover-card" style={{ background: '#E0A345', color: '#fff', padding: '12px 30px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', opacity: (!newDictWord.trim() || !newDictTranslation.trim()) ? 0.5 : 1 }}>
                Зберегти
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  }

  // --- ЕКРАН ІНТЕРВАЛЬНОГО ПОВТОРЕННЯ (Оновлений для ПК) ---
  if (globalView === 'spaced') {
    const currentCard = spacedCards[spacedIndex];
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
        {renderGlobalStyles()} <FloatingBackgrounds theme="{theme}" themeMode="{themeMode}"/>
        {renderSidebar()}
        <div style={{ flex: 1, padding: '50px 60px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <button onClick={() => setGlobalView('dictionary')} className="hover-card" style={{ background: theme.cardBg, border: `1px solid ${theme.inputBorder}`, color: theme.text, padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              До словника
            </button>
            <div style={{ color: theme.textSecondary, fontSize: '16px', fontWeight: 'bold', background: theme.inputBg, padding: '8px 16px', borderRadius: '12px' }}>
              Картка {spacedIndex + 1} із {spacedCards.length}
            </div>
          </div>

          {spacedCards.length > 0 && currentCard ? (
            <div style={{ width: '100%', maxWidth: '700px', marginTop: '20px' }}>
              <div className="card-3d-container" onClick={() => { playUiSound('whoosh', isSoundEnabled); setIsSpacedFlipped(!isSpacedFlipped); }}>
                <div className={`card-3d-inner ${isSpacedFlipped ? 'flipped' : ''}`} style={{ minHeight: '350px' }}>
                  <div className="card-face card-front" style={{ background: isDarkMode ? theme.cardBg : '#ffffff', color: theme.text, border: `1px solid ${theme.inputBorder}`, boxShadow: '0 15px 40px rgba(0,0,0,0.08)' }}>
                    <span className="flip-hint" style={{ fontSize: '13px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900' }}>
  👆 Натисніть для перевороту
</span>
                    <span style={{ fontSize: '48px', fontWeight: '900', margin: '20px 0' }}>{currentCard.content}</span>
                    {/* КНОПКА ОЗВУЧКИ */}
                    <button onClick={(e) => { e.stopPropagation(); speakSlovak(currentCard.content); }} className="hover-card" style={{ background: theme.inputBg, border: 'none', fontSize: '24px', width: '60px', height: '60px', borderRadius: '50%', marginTop: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔊</button>
                  </div>
                  <div className="card-face card-back" style={{ ...getCardStyle(spacedIndex, isDarkMode, true), boxShadow: '0 15px 40px rgba(0,0,0,0.15)' }}>
                    <span style={{ fontSize: '14px', opacity: 0.8, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>Переклад</span>
                    <span style={{ fontSize: '42px', fontWeight: '900' }}>{currentCard.correct_answer}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleSpacedNext(currentCard)} 
                className="hover-card"
                style={{ width: '100%', marginTop: '40px', background: '#00C853', color: 'white', padding: '20px', borderRadius: '16px', border: 'none', fontWeight: '900', fontSize: '20px', cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,200,83,0.3)' }}
              >
                Запам'ятав! Далі →
              </button>
            </div>
          ) : (
            <div style={{ background: theme.cardBg, padding: '40px', borderRadius: '24px', border: `1px solid ${theme.inputBorder}`, color: theme.text, textAlign: 'center', width: '100%', maxWidth: '600px', marginTop: '40px' }}>
              <div style={{ fontSize: '50px', marginBottom: '20px' }}>🎉</div>
              <h3 style={{ fontSize: '28px', margin: '0 0 10px 0', fontWeight: '900' }}>Чудова робота!</h3>
              <p style={{ fontSize: '16px', color: theme.textSecondary }}>На сьогодні немає слів для повторення.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- ЕКРАН МІНІ-ГРИ "ДІАКРИТИЧНИЙ СНАЙПЕР" ---
  if (globalView === 'sniper') {
    const currentCard = sniperCards[sniperIndex % sniperCards.length]; 
    
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', textAlign: 'center' }}>
        {renderGlobalStyles()} <FloatingBackgrounds theme="{theme}" themeMode="{themeMode}"/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={exitSniper} style={{ background: 'transparent', border: 'none', color: '#FF007F', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
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
            <button onClick={exitSniper} style={{ width: '100%', background: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>На головну</button>
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
        {renderGlobalStyles()} <FloatingBackgrounds theme="{theme}" themeMode="{themeMode}"/>
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
  
  // ЕКРАН 3: Список Завдань у Модулі (Оновлений преміум-дизайн з повним функціоналом)
  if (activeModule) {
    // ЛОГІКА ФІЛЬТРУВАННЯ ЗАВДАНЬ
    const filteredTasks = tasks.filter(task => {
      let cat = task.category;
      if (typeof cat === 'string') cat = cat.replace(/['"]/g, '').trim().toLowerCase();
      const validCats = ['grammar', 'vocabulary', 'reading', 'listening', 'bonus'];
      if (!validCats.includes(cat)) cat = 'bonus';

      const matchCat = taskFilterCategory === 'all' || cat === taskFilterCategory;
      const isCompleted = completedTasks.includes(task.id);
      const matchStatus = taskFilterStatus === 'all' 
          || (taskFilterStatus === 'completed' && isCompleted)
          || (taskFilterStatus === 'uncompleted' && !isCompleted);

      return matchCat && matchStatus;
    });

    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
        {renderGlobalStyles()} <FloatingBackgrounds theme="{theme}" themeMode="{themeMode}"/>
        {renderSidebar()}
        
        {/* ПЛАВАЮЧА КНОПКА НАЗАД */}
        <button 
          onClick={() => setActiveModule(null)} 
          className="hover-card"
          style={{ 
            position: 'fixed', top: '30px', left: '115px', zIndex: 999, 
            background: isDarkMode ? 'rgba(26, 32, 44, 0.7)' : 'rgba(255, 255, 255, 0.7)', 
            backdropFilter: 'blur(12px)', border: `1px solid ${theme.inputBorder}`, 
            color: theme.text, padding: '12px 20px', borderRadius: '14px', 
            cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          До модулів
        </button>

        <div style={{ flex: 1, padding: '100px 60px 40px 60px', overflowY: 'auto', boxSizing: 'border-box', textAlign: 'left' }}>
          
          <div style={{ marginBottom: '40px' }}>
            <span style={{ fontSize: '14px', color: '#E0A345', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedCourse?.title}</span>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginTop: '10px' }}>
              <h2 style={{ color: theme.text, fontSize: '38px', margin: 0, fontWeight: '900', letterSpacing: '-0.5px' }}>{getTranslatedTitle(activeModule.title)}</h2>
              
              {/* КНОПКА ТА МЕНЮ ФІЛЬТРУ (Прив'язана до заголовка) */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  className="hover-card"
                  style={{ background: theme.cardBg, border: `1px solid ${theme.inputBorder}`, color: theme.text, padding: '10px 16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                  Фільтр
                  {(taskFilterCategory !== 'all' || taskFilterStatus !== 'all') && <span style={{ background: '#E0A345', width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' }}></span>}
                </button>
                
                {isFilterMenuOpen && (
                  <div style={{ position: 'absolute', top: '115%', left: 0, background: theme.cardBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '20px', padding: '20px', width: '240px', boxShadow: '0 15px 40px rgba(0,0,0,0.1)', zIndex: 100 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                       <h4 style={{ margin: 0, fontSize: '15px', color: theme.text, fontWeight: '900' }}>Фільтри</h4>
                       <button onClick={() => { setTaskFilterCategory('all'); setTaskFilterStatus('all'); setIsFilterMenuOpen(false); }} style={{ background: 'transparent', border: 'none', color: '#E53E3E', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Скинути</button>
                     </div>
                     
                     <label style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '6px', display: 'block', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Категорія</label>
                     <select value={taskFilterCategory} onChange={e => setTaskFilterCategory(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, marginBottom: '15px', fontSize: '14px', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}>
                        <option value="all">🌐 Усі категорії</option>
                        <option value="grammar">📚 Граматика</option>
                        <option value="vocabulary">📝 Лексика</option>
                        <option value="reading">📖 Читання</option>
                        <option value="listening">🎧 Аудіювання</option>
                        <option value="bonus">🎁 Додатково</option>
                     </select>
                     
                     <label style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '6px', display: 'block', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Статус виконання</label>
                     <select value={taskFilterStatus} onChange={e => setTaskFilterStatus(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: '14px', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}>
                        <option value="all">📋 Усі завдання</option>
                        <option value="completed">✅ Виконані</option>
                        <option value="uncompleted">⏳ Невиконані</option>
                     </select>
                  </div>
                )}
              </div>
            </div>
          </div>
		  

          <div style={{ maxWidth: '900px' }}>
            
            {/* СІТКА ЗАВДАНЬ */}
            {tasks.length === 0 ? (
              <div style={{ background: theme.cardBg, padding: '40px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', textAlign: 'center', marginBottom: '40px' }}>
                <p style={{ color: theme.textSecondary, fontSize: '16px', margin: 0 }}>У цьому занятті ще немає матеріалів.</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div style={{ background: theme.cardBg, padding: '40px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ fontSize: '40px', marginBottom: '15px' }}>🔍</div>
                <p style={{ color: theme.textSecondary, fontSize: '16px', margin: 0, fontWeight: 'bold' }}>За вашими фільтрами нічого не знайдено.</p>
                <button onClick={() => { setTaskFilterCategory('all'); setTaskFilterStatus('all'); setIsFilterMenuOpen(false); }} className="hover-card" style={{ marginTop: '20px', background: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Скинути фільтри</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '50px' }}>
                {filteredTasks.map((task, idx) => {
                  // Зчитуємо категорію завдання
                  let cat = task.category;
                  if (typeof cat === 'string') {
                      cat = cat.replace(/['"]/g, '').trim().toLowerCase();
                  }
                  
                  // Допустимі категорії (включно з 'bonus')
                  const validCats = ['grammar', 'vocabulary', 'reading', 'listening', 'bonus'];
                  if (!validCats.includes(cat)) cat = 'bonus';
                  
                  // Кольори та іконки для бейджів
                  const categoryLabels = {
                    grammar: { title: t('catGrammar'), icon: '📚', color: '#3182ce', bg: 'rgba(49, 130, 206, 0.1)' },
                    vocabulary: { title: t('catVocabulary'), icon: '📝', color: '#E0A345', bg: 'rgba(224, 163, 69, 0.1)' },
                    reading: { title: t('catReading'), icon: '📖', color: '#38A169', bg: 'rgba(56, 161, 105, 0.1)' },
                    listening: { title: t('catListening'), icon: '🎧', color: '#805AD5', bg: 'rgba(128, 90, 213, 0.1)' },
                    bonus: { title: t('catBonus'), icon: '🎁', color: theme.textSecondary, bg: theme.inputBg }
                  };
                  const catData = categoryLabels[cat] || categoryLabels['bonus'];

                  return (
                    <div key={task.id} id={`task-card-${task.id}`} style={{ background: theme.cardBg, padding: '35px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                      
                      {/* ШАПКА ЗАВДАННЯ */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                          <div style={{ width: '45px', height: '45px', borderRadius: '14px', background: 'rgba(224,163,69,0.15)', color: '#E0A345', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900' }}>
                            {idx + 1}
                          </div>
                          
                          {/* ІНДИВІДУАЛЬНИЙ БЕЙДЖ КАТЕГОРІЇ ДЛЯ КОЖНОГО ЗАВДАННЯ */}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: catData.bg, color: catData.color, padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <span style={{ fontSize: '16px' }}>{catData.icon}</span> {catData.title}
                          </span>
                          
                          <span style={{ fontSize: '14px', color: theme.textSecondary, fontWeight: 'bold', borderLeft: `2px solid ${theme.inputBorder}`, paddingLeft: '15px' }}>
                            {task.type === 'flashcard' ? '🗂 Флешкартка' : task.type === 'quiz' ? '✅ Тест' : '📝 Матеріал'}
                          </span>
                        </div>
                        
                        {/* КНОПКИ АДМІНА (СКИНУТИ / РЕДАГУВАТИ / ВИДАЛИТИ) */}
                        {effectiveIsAdmin && (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => handleResetTaskAnswers(task)} className="hover-card" title="Скинути введені тестові відповіді" style={{ background: theme.inputBg, color: theme.textSecondary, border: `1px solid ${theme.inputBorder}`, borderRadius: '12px', padding: '10px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>🔄 Скинути</button>
                            
                            <button onClick={() => { 
                              setEditingTaskId(task.id); 
                              if (typeof task.content === 'object' && task.content !== null) {
                                const { exercise, ...restLangs } = task.content;
                                setEditContentMulti({ uk: restLangs.uk || '', ru: restLangs.ru || '', en: restLangs.en || '', sk: restLangs.sk || '' });
                                setEditTaskExercise(exercise || '');
                                setIsEditSingleLang(false);
                              } else {
                                setEditContentMulti({ uk: task.content || '', ru: task.content || '', en: task.content || '', sk: task.content || '' });
                                setEditTaskExercise('');
                                setIsEditSingleLang(true);
                              }
                              setEditAnswer(task.correct_answer || ''); 
                              setEditDifficulty(task.difficulty || 'medium');
                              let safeCat = task.category || 'bonus';
                              if (typeof safeCat === 'string') safeCat = safeCat.replace(/['"]/g, '').trim().toLowerCase();
                              setEditCategory(safeCat); 
                              setEditLang('uk');
                            }} className="hover-card" title="Редагувати завдання" style={{ background: theme.inputBg, color: theme.text, border: 'none', borderRadius: '12px', padding: '10px', cursor: 'pointer' }}>✏️</button>
                            
                            <button onClick={() => handleDeleteTask(task.id)} className="hover-card" title="Видалити завдання" style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '12px', padding: '10px', cursor: 'pointer' }}>🗑</button>
                          </div>
                        )}
                      </div>

                      {/* ВМІСТ ЗАВДАННЯ (РЕЖИМ РЕДАГУВАННЯ АБО ПЕРЕГЛЯДУ) */}
                      {editingTaskId === task.id ? (
                         <div style={{ background: theme.inputBg, padding: '25px', borderRadius: '24px' }}>
                           <label style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>Текст завдання / Посилання на медіа:</label>
                           <div style={{ background: theme.cardBg, borderRadius: '14px', padding: '16px', border: `1px solid ${theme.inputBorder}`, marginBottom: '15px' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                               <div style={{ display: 'flex', gap: '5px' }}>
                                 {['uk', 'ru', 'en', 'sk'].map(l => (
                                   <button key={l} disabled={isEditSingleLang} onClick={(e) => { e.preventDefault(); setEditLang(l); }} style={{ background: editLang === l ? '#E0A345' : 'transparent', color: editLang === l ? '#fff' : theme.textSecondary, border: `1px solid ${editLang === l ? '#E0A345' : theme.inputBorder}`, padding: '4px 10px', borderRadius: '8px', cursor: isEditSingleLang ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 'bold', opacity: isEditSingleLang ? 0.5 : 1 }}>
                                     {l.toUpperCase()}
                                   </button>
                                 ))}
                               </div>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                 <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: theme.textSecondary, cursor: 'pointer' }}>
                                   <input type="checkbox" checked={isEditSingleLang} onChange={e => setIsEditSingleLang(e.target.checked)} />
                                   Тільки одна мова (без перекладу)
                                 </label>
                                 <button onClick={handleEditAutoTranslate} disabled={isEditSingleLang} className="hover-card" style={{ background: isEditSingleLang ? theme.inputBg : '#3182ce', color: isEditSingleLang ? theme.textSecondary : '#fff', border: isEditSingleLang ? `1px solid ${theme.inputBorder}` : 'none', padding: '6px 12px', borderRadius: '8px', cursor: isEditSingleLang ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 'bold', transition: '0.2s' }}>
                                   {editTranslateStatus}
                                 </button>
                               </div>
                             </div>
                             {(() => {
                               const currentRaw = editContentMulti[editLang] || '';
                               const urls = currentRaw.match(/(https?:\/\/[^\s]+)/g) || [];
                               let cleanText = currentRaw;
                               urls.forEach(u => { cleanText = cleanText.replace(u, ''); });
                               
                               return (
                                 <textarea 
                                   value={cleanText} 
                                   onChange={e => {
                                     const combined = e.target.value + (urls.length > 0 ? '\n\n' + urls.join('\n') : '');
                                     setEditContentMulti({...editContentMulti, [editLang]: combined});
                                   }} 
                                   rows="4" 
                                   style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: theme.cardBg, color: theme.text, boxSizing: 'border-box', resize: 'vertical', fontSize: '15px', marginBottom: '10px' }} 
                                 />
                               );
                             })()}
                          </div>
                          
                          <label style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px', marginTop: '15px', display: 'block', fontWeight: 'bold' }}>Текст вправи (Живий редактор):</label>
                          <FormatToolbar theme={theme} />
                          <WYSIWYGEditor 
                            theme={theme}
                            value={editTaskExercise} 
                            onChange={setEditTaskExercise} 
                            placeholder="Введіть текст... (Для створення діалогу просто напишіть Ім'я: текст)" 
                            style={{ width: '100%', padding: '16px', borderRadius: '0 0 10px 10px', border: `1px solid ${theme.inputBorder}`, borderTop: 'none', background: theme.cardBg, color: theme.text, fontSize: '16px', marginBottom: '15px', lineHeight: '1.5' }} 
                          />

                          <div style={{ background: theme.cardBg, padding: '24px', borderRadius: '20px', border: `1px solid ${theme.inputBorder}`, marginTop: '15px', marginBottom: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '13.5px', color: theme.text, fontWeight: 'bold', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>✨ Інтерактивні пропуски діалогу (клікніть на пропуск, щоб задати правильну відповідь):</span>
                            </div>

                            <div style={{ background: theme.inputBg, padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {(() => {
                                const rawText = editTaskExercise || editContentMulti[editLang] || '';
                                const plainText = rawText.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
                                const lines = plainText.split('\n').filter(l => l.trim().length > 0);
                                
                                const currentAnswers = editAnswer ? editAnswer.split(',').map(s => s.trim()) : [];
                                let blankCounter = -1;

                                return lines.map((line, lineIdx) => {
                                  const parts = line.split(/(\.{4,})/g);
                                  
                                  return (
                                    <div key={lineIdx} style={{ fontSize: '15.5px', color: theme.text, lineHeight: '1.6', padding: '6px 0' }}>
                                      {parts.map((part, pIdx) => {
                                        if (/^\.{4,}$/.test(part)) {
                                          blankCounter++;
                                          const bIdx = blankCounter;
                                          const assignedWord = currentAnswers[bIdx] || '';
                                          const isFilled = assignedWord.length > 0;

                                          return (
                                            <span
                                              key={pIdx}
                                              onClick={() => {
                                                const userWord = prompt(`Введіть правильну відповідь для пропуску #${bIdx + 1}:`, assignedWord);
                                                if (userWord !== null) {
                                                  const updatedAnswers = [...currentAnswers];
                                                  updatedAnswers[bIdx] = userWord.trim();
                                                  while (updatedAnswers.length > 0 && !updatedAnswers[updatedAnswers.length - 1]) {
                                                    updatedAnswers.pop();
                                                  }
                                                  setEditAnswer(updatedAnswers.join(', '));
                                                }
                                              }}
                                              style={{
                                                background: isFilled ? 'rgba(56, 161, 105, 0.15)' : 'rgba(224, 163, 69, 0.15)',
                                                border: `1.5px solid ${isFilled ? '#38A169' : '#E0A345'}`,
                                                color: isFilled ? '#276749' : '#D69E2E',
                                                padding: '3px 12px',
                                                borderRadius: '8px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                margin: '0 6px',
                                                display: 'inline-block',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                                              }}
                                              title="Клікніть, щоб змінити еталонне слово"
                                            >
                                              {isFilled ? assignedWord : '....'}
                                            </span>
                                          );
                                        }
                                        return <span key={pIdx}>{part}</span>;
                                      })}
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>

                           {(() => {
                             const allUrlsEdit = ['uk', 'ru', 'en', 'sk'].flatMap(l => (editContentMulti[l] || '').match(/(https?:\/\/[^\s]+)/g) || []);
                             const uniqueUrlsEdit = [...new Set(allUrlsEdit)];
                             const detectedMediaEdit = uniqueUrlsEdit.filter(u => 
                               u.match(/\.(jpeg|jpg|gif|png|webp|mp4|webm|mov|mp3|wav|ogg|m4a)/i) || 
                               u.includes("/images/") || u.includes("chat-images") || 
                               u.includes("/audio/") || u.includes("voice_") ||
                               u.includes("youtube.com") || u.includes("youtu.be")
                             );
                             
                             if (detectedMediaEdit.length === 0) return null;
                             return (
                               <div style={{ marginTop: '10px', padding: '20px', background: 'rgba(224, 163, 69, 0.05)', borderRadius: '16px', border: '1px dashed #E0A345', marginBottom: '15px' }}>
                                 <span style={{ display: 'block', fontSize: '14px', color: theme.textSecondary, fontWeight: 'bold', marginBottom: '15px' }}>📎 Прикріплені медіа (фото, відео, аудіо):</span>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                   {detectedMediaEdit.map((mediaUrl, i) => {
                                     const cleanUrl = mediaUrl.replace(/#split\d|#slice/g, '');
                                     
                                     const isImage = cleanUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || cleanUrl.includes("/images/") || cleanUrl.includes("chat-images");
                                     const isAudio = cleanUrl.match(/\.(mp3|wav|ogg|m4a)/i) || cleanUrl.includes("/audio/") || cleanUrl.includes("voice_");
                                     const isVideoFile = cleanUrl.match(/\.(mp4|webm|mov)/i);
                                     const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);

                                     return (
                                       <div key={i} style={{ position: 'relative', background: theme.cardBg, padding: '20px', borderRadius: '16px', border: `1px solid ${theme.inputBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                         
                                         <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: theme.inputBg, padding: '12px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}`, flexWrap: 'wrap' }}>
                                           <span style={{ fontSize: '13px', fontWeight: 'bold', color: theme.textSecondary }}>Показувати учням з інтерфейсом:</span>
                                           {['uk', 'sk', 'en', 'ru'].map(langKey => {
                                             const hasMedia = (editContentMulti[langKey] || '').includes(mediaUrl);
                                             return (
                                               <button
                                                 key={langKey}
                                                 onClick={(e) => {
                                                   e.preventDefault();
                                                   const text = editContentMulti[langKey] || '';
                                                   if (hasMedia) {
                                                     setEditContentMulti({...editContentMulti, [langKey]: text.replace(mediaUrl, '').trim()});
                                                   } else {
                                                     setEditContentMulti({...editContentMulti, [langKey]: text + (text ? '\n\n' : '') + mediaUrl});
                                                   }
                                                 }}
                                                 style={{
                                                   background: hasMedia ? '#38A169' : 'transparent',
                                                   color: hasMedia ? '#fff' : theme.textSecondary,
                                                   border: `1.5px solid ${hasMedia ? '#38A169' : theme.inputBorder}`,
                                                   padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s'
                                                 }}
                                               >
                                                 {hasMedia ? '✅ ' : ''}{langKey.toUpperCase()}
                                               </button>
                                             );
                                           })}
                                         </div>

                                         <button 
                                           onClick={(e) => { 
                                             e.preventDefault(); 
                                             const nextContent = { ...editContentMulti };
                                             ['uk', 'ru', 'en', 'sk'].forEach(l => {
                                               nextContent[l] = (nextContent[l] || '').replace(mediaUrl, '').trim();
                                             });
                                             setEditContentMulti(nextContent); 
                                           }} 
                                           style={{ position: 'absolute', top: '-12px', right: '-12px', background: '#E53E3E', color: 'white', width: '32px', height: '32px', borderRadius: '50%', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(229,62,62,0.4)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}
                                           title="Видалити медіа з усіх мов"
                                         >✕</button>

                                         {isImage && <img src={cleanUrl} draggable="false" onContextMenu={(e) => e.preventDefault()} alt="preview" onClick={() => setFullscreenTaskImg(cleanUrl)} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '12px', cursor: 'zoom-in', background: 'rgba(0,0,0,0.02)', border: `1px solid ${theme.inputBorder}`, userSelect: 'none', WebkitUserDrag: 'none', WebkitTouchCallout: 'none' }} />}
										 {ytMatch && <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} title="YouTube" style={{ width: '100%', height: '300px', borderRadius: '12px', border: 'none' }} allowFullScreen />}
										 {isAudio && <audio controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} src={cleanUrl} style={{ width: '100%', outline: 'none' }} />}
										 {isVideoFile && <video controls controlsList="nodownload" disablePictureInPicture onContextMenu={(e) => e.preventDefault()} src={cleanUrl} style={{ width: '100%', maxHeight: '400px', borderRadius: '12px', background: '#000' }} />}
                                         
                                         {isImage && (
                                           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
                                             <button onClick={(e) => { e.preventDefault(); startCrop(mediaUrl, editLang, true); }} className="hover-card" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `2px solid #00C853`, background: 'rgba(0,200,83,0.1)', color: '#00C853', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>✂️ Нарізати фото</button>
                                             <button onClick={(e) => { e.preventDefault(); handleOcrFromUrl(cleanUrl, true); }} disabled={isOcrRunning} className="hover-card" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `2px solid #E0A345`, background: 'rgba(224,163,69,0.1)', color: '#E0A345', fontSize: '15px', fontWeight: 'bold', cursor: isOcrRunning ? 'wait' : 'pointer', transition: '0.2s' }}>
                                               {isOcrRunning ? `⏳ ${ocrProgress}%` : '👁️ Зчитати текст'}
                                             </button>
                                           </div>
                                         )}
                                       </div>
                                     );
                                   })}
                                 </div>
                               </div>
                             );
                           })()}
                           
                           <div style={{ marginTop: '20px', textAlign: 'center', marginBottom: '15px' }}>
                             <label className="hover-card" style={{ background: theme.inputBg, color: theme.text, border: `2px dashed ${theme.inputBorder}`, padding: '14px 24px', borderRadius: '12px', cursor: isMediaUploading ? 'wait' : 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', opacity: isMediaUploading ? 0.7 : 1, pointerEvents: isMediaUploading ? 'none' : 'auto' }}>
                               {isMediaUploading ? (uploadProgress > 0 ? `⏳ Завантажено: ${uploadProgress}%` : '⏳ Підготовка...') : '➕ Завантажити ще файл (для іншої мови)'}
                               <input type="file" accept="image/*,video/*,audio/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={isMediaUploading} />
                             </label>
                           </div>
                           
                           <label style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>Правильна відповідь:</label>
                           <input type="text" value={editAnswer} onChange={e => setEditAnswer(e.target.value)} placeholder="Правильна відповідь" style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: theme.cardBg, color: theme.text, marginBottom: '20px', boxSizing: 'border-box' }} />
                           
                           {/* ВИБІР КАТЕГОРІЇ ДЛЯ РЕДАГУВАННЯ */}
                           <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                             <div style={{ flex: 1 }}>
                               <label style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>Складність:</label>
                               <select value={editDifficulty} onChange={e => setEditDifficulty(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: theme.inputBg, color: theme.text }}>
                                  <option value="easy">🟢 Легко (10 балів)</option>
                                  <option value="medium">🟡 Середньо (20 балів)</option>
                                  <option value="hard">🔴 Складно (30 балів)</option>
                               </select>
                             </div>
                             <div style={{ flex: 1 }}>
                               <label style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>Категорія:</label>
                               <select value={editCategory} onChange={e => setEditCategory(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: theme.inputBg, color: theme.text }}>
                                  <option value="grammar">📚 Граматика</option>
                                  <option value="vocabulary">📝 Лексика</option>
                                  <option value="reading">📖 Читання</option>
                                  <option value="listening">🎧 Аудіювання</option>
                                  <option value="bonus">🎁 Бонус / Додатково</option>
                               </select>
                             </div>
                           </div>

                           <div style={{ background: 'rgba(224, 163, 69, 0.05)', padding: '15px', borderRadius: '14px', border: '1px solid rgba(224, 163, 69, 0.3)', marginBottom: '20px' }}>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: 'bold' }}>Мова OCR:</span>
                                {[{code: 'slk', label: 'SK'}, {code: 'ukr', label: 'UK'}, {code: 'eng', label: 'EN'}].map(l => (
                                  <label key={l.code} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: theme.text, cursor: 'pointer', background: theme.cardBg, padding: '4px 8px', borderRadius: '6px', border: `1px solid ${ocrLangs.includes(l.code) ? '#E0A345' : theme.inputBorder}` }}>
                                    <input type="checkbox" checked={ocrLangs.includes(l.code)} onChange={() => toggleOcrLang(l.code)} style={{ cursor: 'pointer' }} />
                                    {l.label}
                                  </label>
                                ))}
                              </div>
                              <label className="hover-card" style={{ background: isOcrRunning ? '#E0A345' : theme.inputBg, padding: '10px 16px', borderRadius: '10px', cursor: isOcrRunning ? 'wait' : 'pointer', fontSize: '13px', color: isOcrRunning ? '#fff' : theme.text, display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', border: isOcrRunning ? 'none' : `1px solid ${theme.inputBorder}` }}>
                                {isOcrRunning ? `⏳ Сканую... ${ocrProgress}%` : '👁️ Додати текст з фото (OCR)'}
                                <input type="file" accept="image/*" onChange={e => handleOcrUpload(e, true)} style={{ display: 'none' }} disabled={isOcrRunning} />
                              </label>
                           </div>

                           <div style={{ display: 'flex', gap: '10px' }}>
                             <button onClick={() => handleSaveEdit(task.id)} className="hover-card" style={{ background: '#38A169', color: '#fff', padding: '14px 24px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Зберегти зміни</button>
                             <button onClick={() => setEditingTaskId(null)} className="hover-card" style={{ background: theme.cardBg, color: theme.text, padding: '14px 24px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Скасувати</button>
                           </div>
                         </div>
                      ) : (
                         <div>
                           {/* САМ КОНТЕНТ ЗАВДАННЯ */}
                           <div style={{ fontSize: '18px', lineHeight: '1.6', color: theme.text, marginBottom: '25px', whiteSpace: 'pre-wrap' }}>
                             {renderContent(task.content, task)}
                           </div>

                           {!effectiveIsAdmin && (
                             <div style={{ marginTop: '25px', borderTop: `1px solid ${theme.inputBorder}`, paddingTop: '25px' }}>
                               {task.correct_answer && (
                                 <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                                   <input 
                                     type="text" 
                                     placeholder="Ваша текстова відповідь..." 
                                     value={userAnswers[task.id] || ''} 
                                     onChange={e => setUserAnswers({...userAnswers, [task.id]: e.target.value})} 
                                     style={{ flex: 1, padding: '16px', borderRadius: '14px', border: 'none', background: theme.inputBg, color: theme.text, fontSize: '16px' }}
                                   />
                                   <button onClick={() => handleAnswerSubmit(task)} className="hover-card" style={{ background: '#E0A345', color: '#fff', padding: '16px 30px', borderRadius: '14px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
                                     Перевірити
                                   </button>
                                 </div>
                               )}

                               <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                 <button 
                                   onClick={() => recordingTaskId === task.id ? stopStudentRecording() : startStudentRecording(task.id)}
                                   className="hover-card"
                                   style={{ background: recordingTaskId === task.id ? '#E53E3E' : theme.inputBg, color: recordingTaskId === task.id ? '#fff' : theme.text, padding: '14px 24px', borderRadius: '14px', border: `1px solid ${recordingTaskId === task.id ? '#E53E3E' : theme.inputBorder}`, fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: '0.2s', animation: recordingTaskId === task.id ? 'ffPulse 1.5s infinite' : 'none' }}
                                 >
                                   {recordingTaskId === task.id ? '⏹ Відправити аудіо' : '🎤 Записати вимову'}
                                 </button>
                                 {recordingTaskId === task.id && <span style={{ color: '#E53E3E', fontWeight: 'bold', fontSize: '14px' }}>🔴 Запис іде...</span>}
                               </div>
                             </div>
                           )}

                           {/* СТАТУС ВИКОНАННЯ */}
                           {completedTasks.includes(task.id) && (
                             <div style={{ marginTop: '20px', color: '#38A169', fontWeight: '900', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(56, 161, 105, 0.1)', padding: '12px 20px', borderRadius: '12px', display: 'inline-flex' }}>
                               ✅ Завдання успішно виконано
                             </div>
                           )}
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ПАНЕЛЬ ДОДАВАННЯ НОВОГО ЗАВДАННЯ (ТЕЛЕГРАМ-СТИЛЬ З РОЗГОРТАННЯМ ВГОРУ) */}
            {effectiveIsAdmin && (
              <div style={{ marginTop: '30px', position: 'relative' }}>
                
                {/* === ПЛАВАЮЧИЙ ВІДЖЕТ CATBOX === */}
                <div style={{ position: 'fixed', right: '30px', top: '250px', width: '260px', background: theme.cardBg, border: `2px solid #E0A345`, borderRadius: '16px', padding: '20px', boxShadow: '0 15px 40px rgba(0,0,0,0.15)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h4 style={{ margin: 0, color: theme.text, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>📦 Завантаження Відео</h4>
                  <ol style={{ margin: 0, paddingLeft: '20px', color: theme.textSecondary, fontSize: '13px', lineHeight: '1.6' }}>
                    <li>Натисніть кнопку нижче</li><li>Перетягніть відео (до 200 МБ) у вікно Catbox</li><li>Скопіюйте зелене посилання</li><li>Вставте <b>(Ctrl+V)</b> у поле тексту на платформі</li>
                  </ol>
                  <a href="https://catbox.moe/" target="_blank" rel="noopener noreferrer" className="hover-card" style={{ background: '#E0A345', color: 'white', padding: '12px', borderRadius: '10px', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 10px rgba(224, 163, 69, 0.3)' }}>Відкрити Catbox ↗</a>
                  <button onClick={async (e) => { e.preventDefault(); try { const text = await navigator.clipboard.readText(); if (text.includes('catbox.moe')) { alert(`✅ Посилання скопійовано успішно!\n\n${text}\n\nКлікніть у поле тексту завдання та натисніть Ctrl+V.`); } else { alert('❌ У вашому буфері немає посилання Catbox. Скопіюйте його на сайті!'); } } catch (err) { alert('Натисніть Ctrl+V у полі тексту, щоб вставити посилання.'); } }} style={{ background: 'transparent', border: `1px dashed ${theme.inputBorder}`, color: theme.textSecondary, padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>📋 Перевірити буфер</button>
                </div>
                {/* ================================= */}

                {/* РОЗГОРНУТЕ ПРЕВ'Ю МЕДІА */}
                {(() => {
                  const allUrls = ['uk', 'ru', 'en', 'sk'].flatMap(l => (newTaskContentMulti[l] || '').match(/(https?:\/\/[^\s]+)/g) || []);
                  const uniqueUrls = [...new Set(allUrls)];
                  const detectedMediaAdd = uniqueUrls.filter(u => 
                    u.match(/\.(jpeg|jpg|gif|png|webp|mp4|webm|mov|mp3|wav|ogg|m4a)/i) || 
                    u.includes("/images/") || u.includes("chat-images") || 
                    u.includes("/audio/") || u.includes("voice_") ||
                    u.includes("youtube.com") || u.includes("youtu.be")
                  );
                  
                  if (detectedMediaAdd.length === 0) return null;
                  return (
                    <div style={{ padding: '20px', background: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.inputBorder}`, marginBottom: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                      <span style={{ display: 'block', fontSize: '14px', color: theme.textSecondary, fontWeight: 'bold', marginBottom: '15px' }}>📎 Прикріплені медіа:</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        {detectedMediaAdd.map((mediaUrl, i) => {
                          const cleanUrl = mediaUrl.replace(/#split\d|#slice/g, '');
                          const isImage = cleanUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || cleanUrl.includes("/images/") || cleanUrl.includes("chat-images");
                          const isAudio = cleanUrl.match(/\.(mp3|wav|ogg|m4a)/i) || cleanUrl.includes("/audio/") || cleanUrl.includes("voice_");
                          const isVideoFile = cleanUrl.match(/\.(mp4|webm|mov)/i);
                          const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                          
                          return (
                            <div key={i} style={{ position: 'relative', background: theme.inputBg, padding: '20px', borderRadius: '16px', border: `1px solid ${theme.inputBorder}`, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: theme.cardBg, padding: '12px', borderRadius: '12px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: theme.textSecondary }}>Показувати учням з інтерфейсом:</span>
                                {['uk', 'sk', 'en', 'ru'].map(langKey => {
                                  const hasMedia = (newTaskContentMulti[langKey] || '').includes(mediaUrl);
                                  return (
                                    <button key={langKey} onClick={(e) => { e.preventDefault(); const text = newTaskContentMulti[langKey] || ''; if (hasMedia) { setNewTaskContentMulti({...newTaskContentMulti, [langKey]: text.replace(mediaUrl, '').trim()}); } else { setNewTaskContentMulti({...newTaskContentMulti, [langKey]: text + (text ? '\n\n' : '') + mediaUrl}); } }} style={{ background: hasMedia ? '#38A169' : 'transparent', color: hasMedia ? '#fff' : theme.textSecondary, border: `1.5px solid ${hasMedia ? '#38A169' : theme.inputBorder}`, padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
                                      {hasMedia ? '✅ ' : ''}{langKey.toUpperCase()}
                                    </button>
                                  );
                                })}
                              </div>
                              <button onClick={(e) => { e.preventDefault(); const nextContent = { ...newTaskContentMulti }; ['uk', 'ru', 'en', 'sk'].forEach(l => { nextContent[l] = (nextContent[l] || '').replace(mediaUrl, '').trim(); }); setNewTaskContentMulti(nextContent); }} style={{ position: 'absolute', top: '-12px', right: '-12px', background: '#E53E3E', color: 'white', width: '32px', height: '32px', borderRadius: '50%', border: 'none', fontWeight: 'bold', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(229,62,62,0.4)', fontSize: '16px' }} title="Видалити медіа з усіх мов">✕</button>
                              {isImage && <img src={cleanUrl} alt="preview" onClick={() => setFullscreenTaskImg(cleanUrl)} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '12px', cursor: 'zoom-in', background: 'rgba(0,0,0,0.02)', border: `1px solid ${theme.inputBorder}` }} />}
                              {ytMatch && <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} title="YouTube" style={{ width: '100%', height: '300px', borderRadius: '12px', border: 'none' }} allowFullScreen />}
                              {isAudio && <audio controls src={cleanUrl} style={{ width: '100%', outline: 'none' }} />}
                              {isVideoFile && <video controls src={cleanUrl} style={{ width: '100%', maxHeight: '400px', borderRadius: '12px', background: '#000' }} />}
                              
                              {isImage && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
                                  <button onClick={(e) => { e.preventDefault(); startCrop(mediaUrl, sourceLang, false); }} className="hover-card" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `2px solid #00C853`, background: 'rgba(0,200,83,0.1)', color: '#00C853', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>✂️ Нарізати фото</button>
                                  <button onClick={(e) => { e.preventDefault(); handleOcrFromUrl(cleanUrl, false); }} disabled={isOcrRunning} className="hover-card" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `2px solid #E0A345`, background: 'rgba(224,163,69,0.1)', color: '#E0A345', fontSize: '15px', fontWeight: 'bold', cursor: isOcrRunning ? 'wait' : 'pointer', transition: '0.2s' }}>
                                    {isOcrRunning ? `⏳ ${ocrProgress}%` : '👁️ Зчитати текст'}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* НОВИЙ КОМПАКТНИЙ РЯДОК ВВЕДЕННЯ (ТЕЛЕГРАМ-СТИЛЬ: РОЗГОРТАННЯ ВГОРУ) */}
                <div ref={composerRef} style={{ background: theme.cardBg, borderRadius: '28px', padding: '10px 14px', boxShadow: '0 15px 50px rgba(0,0,0,0.08)', border: `1px solid ${theme.inputBorder}`, display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
                    
                    {/* === ВЕРХНЯ ЧАСТИНА: ВІДКРИТІ ПОЛЯ ВВОДУ (ВИЇЖДЖАЮТЬ ВГОРУ) === */}
                    {isComposerExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '10px', borderBottom: `1px dashed ${theme.inputBorder}`, animation: 'fadeIn 0.2s ease', position: 'relative' }}>
                            <button onClick={(e) => { e.stopPropagation(); setIsComposerExpanded(false); }} title="Згорнути" style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: '18px', zIndex: 10, padding: '4px' }}>✕</button>

                            {/* 1. Поле для Умови */}
                            {(() => {
                                const currentRaw = newTaskContentMulti[sourceLang] || '';
                                const urls = currentRaw.match(/(https?:\/\/[^\s]+)/g) || [];
                                let cleanText = currentRaw;
                                urls.forEach(u => { cleanText = cleanText.replace(u, ''); });
                                return (
                                    <textarea 
                                        placeholder={`Умова завдання (${sourceLang.toUpperCase()})...`} 
                                        value={cleanText} 
                                        onChange={e => {
                                            const combined = e.target.value + (urls.length > 0 ? '\n\n' + urls.join('\n') : '');
                                            setNewTaskContentMulti({...newTaskContentMulti, [sourceLang]: combined});
                                        }} 
                                        rows="1"
                                        autoFocus
                                        style={{ width: '100%', padding: '14px 35px 14px 14px', border: 'none', background: theme.inputBg, borderRadius: '16px', color: theme.text, fontSize: '14px', outline: 'none', resize: 'none', minHeight: '45px', fontWeight: 'bold', boxSizing: 'border-box' }}
                                        onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = (e.target.scrollHeight) + 'px'; }}
                                    />
                                );
                            })()}

                            {/* 2. Живий редактор для вправи */}
                            <div style={{ background: theme.inputBg, borderRadius: '16px', padding: '10px 14px', display: 'flex', flexDirection: 'column' }}>
                                <FormatToolbar theme={theme} />
                                <WYSIWYGEditor 
                                    theme={theme}
                                    value={newTaskExercise} 
                                    onChange={setNewTaskExercise} 
                                    placeholder="Введіть текст вправи (або Діалог: Текст)..." 
                                    style={{ width: '100%', padding: '8px 0', border: 'none', background: 'transparent', color: theme.text, fontSize: '15px', outline: 'none', minHeight: '60px', lineHeight: '1.5' }} 
                                />
                            </div>

                            {/* 3. Поле для правильної відповіді */}
                            <input 
                                type="text" 
                                placeholder="Правильна відповідь (необов'язково)..." 
                                value={newTaskCorrectAnswer} 
                                onChange={e => setNewTaskCorrectAnswer(e.target.value)} 
                                style={{ width: '100%', padding: '14px 16px', border: 'none', background: theme.inputBg, borderRadius: '16px', color: '#38A169', fontSize: '14px', outline: 'none', fontWeight: 'bold', boxSizing: 'border-box' }}
                            />
                        </div>
                    )}

                    {/* === НИЖНЯ ЧАСТИНА: СМУЖКА ТА ІКОНКИ (ЗАВЖДИ ЗНИЗУ) === */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        
                        {/* ЛІВІ ІКОНКИ (Скріпка, OCR, Налаштування, Мова) */}
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            
                            {/* 1. Пряме завантаження медіа (Скріпка) */}
                            <label className="hover-card" title="Прикріпити медіа" style={{ background: 'transparent', border: 'none', cursor: isMediaUploading ? 'wait' : 'pointer', color: theme.textSecondary, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isMediaUploading ? '⏳' : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>}
                                <input type="file" accept="image/*,video/*,audio/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={isMediaUploading} />
                            </label>

                            {/* 2. Меню OCR (Іконка Сканера) */}
                            <div className="composer-menu-parent">
                                <button className="hover-card" title="Оцифрувати текст (OCR)" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.textSecondary, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {isOcrRunning ? '⏳' : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>}
                                </button>
                                <div className="composer-menu-dropdown" style={{ minWidth: '220px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: theme.textSecondary, textTransform: 'uppercase' }}>Мова OCR:</label>
                                    <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                      {[{code: 'slk', label: 'SK'}, {code: 'ukr', label: 'UK'}, {code: 'eng', label: 'EN'}].map(l => (
                                        <label key={l.code} style={{ flex: 1, textAlign: 'center', fontSize: '12px', cursor: 'pointer', background: ocrLangs.includes(l.code) ? '#E0A345' : theme.inputBg, color: ocrLangs.includes(l.code) ? '#fff' : theme.text, padding: '6px', borderRadius: '6px', fontWeight: 'bold', transition: '0.2s' }}>
                                          <input type="checkbox" checked={ocrLangs.includes(l.code)} onChange={() => toggleOcrLang(l.code)} style={{ display: 'none' }} />
                                          {l.label}
                                        </label>
                                      ))}
                                    </div>
                                    <label className="hover-card" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: isOcrRunning ? 'wait' : 'pointer', padding: '12px 14px', background: isOcrRunning ? '#E0A345' : theme.inputBg, color: isOcrRunning ? '#fff' : theme.text, borderRadius: '12px', fontWeight: 'bold', fontSize: '13px' }}>
                                        {isOcrRunning ? `⏳ Сканую... ${ocrProgress}%` : '👁️ Сканувати нове фото'}
                                        <input type="file" accept="image/*" onChange={e => handleOcrUpload(e, false)} style={{ display: 'none' }} disabled={isOcrRunning} />
                                    </label>
                                </div>
                            </div>

                            {/* 3. Меню Налаштувань */}
                            <div className="composer-menu-parent">
                                <button className="hover-card" title="Налаштування" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.textSecondary, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                                </button>
                                <div className="composer-menu-dropdown">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: theme.textSecondary, textTransform: 'uppercase' }}>Тип:</label>
                                    <select value={newTaskType} onChange={e=>setNewTaskType(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: 'none', background: theme.inputBg, color: theme.text, fontSize: '13px', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}>
                                        <option value="text">📝 Текст / Теорія</option>
                                        <option value="flashcard">🗂 Флешкартка</option>
                                        <option value="quiz">✅ Квіз</option>
                                    </select>
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: theme.textSecondary, textTransform: 'uppercase' }}>Складність:</label>
                                    <select value={newTaskDifficulty} onChange={e=>setNewTaskDifficulty(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: 'none', background: theme.inputBg, color: theme.text, fontSize: '13px', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}>
                                        <option value="easy">🟢 Легко</option>
                                        <option value="medium">🟡 Середньо</option>
                                        <option value="hard">🔴 Складно</option>
                                    </select>
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: theme.textSecondary, textTransform: 'uppercase' }}>Категорія:</label>
                                    <select value={newTaskCategory} onChange={e=>setNewTaskCategory(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: 'none', background: theme.inputBg, color: theme.text, fontSize: '13px', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}>
                                        <option value="grammar">📚 Граматика</option>
                                        <option value="vocabulary">📝 Лексика</option>
                                        <option value="reading">📖 Читання</option>
                                        <option value="listening">🎧 Аудіювання</option>
                                        <option value="bonus">🎁 Додатково</option>
                                    </select>
                                </div>
                            </div>

                            {/* 4. Меню Мов та Перекладу */}
                            <div className="composer-menu-parent">
                                <button className="hover-card" title="Мова та переклад" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.textSecondary, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                                </button>
                                <div className="composer-menu-dropdown" style={{ minWidth: '260px' }}>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                        {['uk', 'ru', 'en', 'sk'].map(l => (
                                            <button key={l} disabled={isSingleLang} onClick={(e) => { e.preventDefault(); setSourceLang(l); }} style={{ background: sourceLang === l ? '#E0A345' : theme.inputBg, color: sourceLang === l ? '#fff' : theme.textSecondary, border: 'none', padding: '8px', borderRadius: '8px', cursor: isSingleLang ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 'bold', flex: 1 }}>{l.toUpperCase()}</button>
                                        ))}
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: theme.text, cursor: 'pointer', fontWeight: 'bold', background: theme.inputBg, padding: '10px 12px', borderRadius: '8px' }}>
                                        <input type="checkbox" checked={isSingleLang} onChange={e => setIsSingleLang(e.target.checked)} /> Тільки одна мова
                                    </label>
                                    <button onClick={handleAutoTranslate} disabled={isSingleLang} style={{ background: isSingleLang ? theme.inputBg : '#3182ce', color: isSingleLang ? theme.textSecondary : '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: isSingleLang ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold', transition: '0.2s' }}>
                                        {translateStatus}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ЦЕНТР: ПРЕВ'Ю СМУЖКА АБО ІНДИКАТОР РЕДАГУВАННЯ */}
                        <div 
                            onClick={() => { if (!isComposerExpanded) setIsComposerExpanded(true); }}
                            style={{ flex: 1, padding: '0 16px', borderRadius: '16px', background: theme.inputBg, color: theme.textSecondary, fontSize: '15px', fontWeight: 'bold', cursor: isComposerExpanded ? 'default' : 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', height: '40px', boxSizing: 'border-box' }}
                        >
                            {!isComposerExpanded ? "Створити нове завдання..." : "✍️ Редагування завдання..."}
                        </div>

                        {/* ПРАВІ КНОПКИ (Мікрофон, Зберегти) */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button onClick={isRecording ? stopRecording : startRecording} className="hover-card" title={isRecording ? "Зупинити запис" : "Записати голос"} style={{ background: isRecording ? '#E53E3E' : 'transparent', color: isRecording ? '#fff' : theme.textSecondary, border: 'none', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', animation: isRecording ? 'ffPulse 1.5s infinite' : 'none' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                            </button>
                            
                            {(() => {
                                const isTaskEmpty = !(newTaskContentMulti.uk || newTaskContentMulti.ru || newTaskContentMulti.en || newTaskContentMulti.sk || (newTaskExercise || '').replace(/<[^>]*>|&nbsp;/g, '').trim() || newTaskCorrectAnswer);
                                return (
                                    <button 
                                        onClick={handleAddTask} 
                                        disabled={isTaskEmpty} 
                                        className={isTaskEmpty ? "" : "hover-card"} 
                                        title={isTaskEmpty ? "Введіть текст або завантажте файл" : "Зберегти завдання"} 
                                        style={{ 
                                            background: isTaskEmpty ? theme.inputBg : '#E0A345', 
                                            color: isTaskEmpty ? theme.textSecondary : '#fff', 
                                            border: isTaskEmpty ? `1px solid ${theme.inputBorder}` : 'none', 
                                            cursor: isTaskEmpty ? 'not-allowed' : 'pointer', 
                                            width: '42px', height: '42px', borderRadius: '50%', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                            boxShadow: isTaskEmpty ? 'none' : '0 4px 15px rgba(224,163,69,0.3)', 
                                            transition: '0.2s', 
                                            opacity: isTaskEmpty ? 0.6 : 1 
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '-2px' }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                                    </button>
                                );
                            })()}
                        </div>

                    </div>
                </div>
              </div>
            )}

        {/* МОДАЛКИ ДЛЯ ЕКРАНУ МОДУЛЯ (ЗУМ, КРОПЕР, СПОВІЩЕННЯ) */}
        {toast && <div style={{ position: 'fixed', top: '40px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #FFD3B6 0%, #FDE68A 100%)', color: '#2C3E50', padding: '14px 30px', borderRadius: '24px', fontWeight: '900', fontSize: '17px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 9999, animation: 'ffPulse 1.5s infinite', border: '2px solid #fff' }}>{toast}</div>}
        
        {fullscreenTaskImg && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={() => setFullscreenTaskImg(null)} style={{ position: 'absolute', top: '25px', right: '35px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: '24px', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            <img src={fullscreenTaskImg} draggable="false" onContextMenu={(e) => e.preventDefault()} alt="Zoomed Task" style={{ maxWidth: '95%', maxHeight: '95vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', userSelect: 'none', WebkitUserDrag: 'none', WebkitTouchCallout: 'none' }} />
          </div>
        )}

        {cropState && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px' }}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', zIndex: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                 <div style={{ color: 'white', background: 'rgba(255,255,255,0.1)', padding: '10px 15px', borderRadius: '10px', fontSize: '14px' }}>
                    👆 Затисніть і тягніть мишку, щоб виділити області
                 </div>
                 <button onClick={() => setCropState({...cropState, boxes: []})} style={{ background: theme.inputBg, color: theme.text, border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Очистити все</button>
                 <button onClick={() => setCropState(null)} style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Скасувати</button>
                 <button onClick={saveCrops} disabled={isSavingCrop} style={{ background: '#00C853', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,200,83,0.4)' }}>
                     {isSavingCrop ? '⏳ Збереження...' : `✅ Зберегти нарізку (${cropState.boxes.length} шт)`}
                 </button>
              </div>
              
              <div style={{ flex: 1, overflow: 'auto', width: '100%', textAlign: 'center', paddingBottom: '40px' }}>
                  <div 
                      style={{ position: 'relative', display: 'inline-block', touchAction: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                      onPointerDown={handleCropPointerDown}
                      onPointerMove={handleCropPointerMove}
                      onPointerUp={handleCropPointerUp}
                      onPointerLeave={handleCropPointerUp}
                  >
                      <img id="crop-source-img" crossOrigin="anonymous" src={cropState.url.replace(/#split\d|#slice/g, '')} alt="crop source" style={{ maxWidth: '90vw', border: '2px dashed #4A5568', userSelect: 'none', display: 'block' }} draggable={false} />
                      
                      {cropState.boxes.map((b, i) => (
                          <div key={i} style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, border: '3px solid #00C853', background: 'rgba(0,200,83,0.15)', pointerEvents: 'none' }}>
                             <div style={{ position: 'absolute', top: -25, left: -3, background: '#00C853', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Фрагмент {i + 1}</div>
                          </div>
                      ))}
                      {cropState.currentBox && (
                          <div style={{ position: 'absolute', left: cropState.currentBox.x, top: cropState.currentBox.y, width: cropState.currentBox.w, height: cropState.currentBox.h, border: '3px dashed #E0A345', background: 'rgba(224,163,69,0.2)', pointerEvents: 'none' }} />
                      )}
                  </div>
              </div>
          </div>
        )}

          </div>
        </div>
      </div>
    );
  }


  // ЕКРАН 2: Список Модулів вибраного курсу (Дизайн Visual 360)
  if (selectedCourse && !activeModule) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
        {renderGlobalStyles()} <FloatingBackgrounds theme="{theme}" themeMode="{themeMode}"/>
        {renderSidebar()}
        
        <div style={{ flex: 1, padding: '20px 40px', overflowY: 'auto', boxSizing: 'border-box', textAlign: 'left' }}>
          
          {/* Верхня міні-панель */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '15px', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '4px', background: theme.cardBg, padding: '4px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}` }}>
            {['uk', 'sk', 'en', 'ru'].map((l) => (
              <button 
                key={l} 
                onClick={() => changeLang(l)} 
                className="hover-card"
                style={{ 
                  background: lang === l ? '#E0A345' : 'transparent', 
                  color: lang === l ? '#fff' : theme.text, 
                  border: 'none', 
                  padding: '6px 12px', 
                  borderRadius: '8px', 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  transition: '0.2s' 
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={toggleSound} className="hover-card" style={{ background: theme.cardBg, border: `1px solid ${theme.inputBorder}`, width: '38px', height: '38px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isSoundEnabled ? '🔊' : '🔇'}</button>
          <button onClick={toggleTheme} className="hover-card" style={{ background: theme.cardBg, border: `1px solid ${theme.inputBorder}`, width: '38px', height: '38px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{themeMode === 'light' ? '☀️' : themeMode === 'dark' ? '🌙' : '☕'}</button>
          
          {/* НОВА КНОПКА ВИХОДУ */}
          <button onClick={handleLogout} className="hover-card" title={t('logout')} style={{ background: 'transparent', border: 'none', color: theme.textSecondary, fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '10px' }}>
            {t('logout')}
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>

          <button onClick={() => setSelectedCourse(null)} style={{ background: 'transparent', border: 'none', color: theme.textSecondary, cursor: 'pointer', marginBottom: '20px', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', padding: 0 }}>
            ← До списку курсів
          </button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
            {effectiveIsAdmin && isEditingCourseTitle ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="text" value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} style={{ fontSize: '24px', padding: '10px 15px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}`, width: '300px' }} />
                <button onClick={handleSaveCourseTitle} style={{ background: '#00C853', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Зберегти</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h2 style={{ color: theme.text, fontSize: '38px', margin: 0, fontWeight: '900', letterSpacing: '-0.5px' }}>{selectedCourse.title}</h2>
                {effectiveIsAdmin && <button onClick={() => { setIsEditingCourseTitle(true); setNewCourseTitle(selectedCourse.title); }} style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '8px', padding: '8px', cursor: 'pointer', color: theme.text }}>✏️</button>}
              </div>
            )}

            {/* ОНОВЛЕНИЙ ТЕПЛИЙ КОЛІР ДЛЯ КНОПКИ СТВОРЕННЯ МОДУЛЯ */}
            {effectiveIsAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: theme.adminBg, padding: '15px', borderRadius: '16px', border: `1px dashed ${theme.adminBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {['uk', 'ru', 'en', 'sk'].map(l => (
                        <button key={l} onClick={(e) => { e.preventDefault(); setModuleSourceLang(l); }} style={{ background: moduleSourceLang === l ? '#E0A345' : 'transparent', color: moduleSourceLang === l ? '#fff' : theme.adminBorder, border: `1px solid ${moduleSourceLang === l ? '#E0A345' : theme.adminBorder}`, padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                          {l.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleAutoTranslateModule} className="hover-card" title="Автоматично перекласти на інші 3 мови" style={{ background: '#3182ce', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      {moduleTranslateStatus}
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" placeholder={`Назва мовою: ${moduleSourceLang.toUpperCase()}...`} value={newModuleTitleMulti[moduleSourceLang] || ''} onChange={e => setNewModuleTitleMulti({...newModuleTitleMulti, [moduleSourceLang]: e.target.value})} style={{ flex: 1, padding: '10px 15px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}`, minWidth: '200px' }} />
                  <button onClick={handleAddModule} className="hover-card" style={{ background: 'linear-gradient(135deg, #F6AD55 0%, #D69E2E 100%)', color: '#1A3636', padding: '10px 20px', border: 'none', fontWeight: '900', cursor: 'pointer', borderRadius: '10px' }}>
                    + Створити
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* СІТКА МОДУЛІВ */}
          <div style={{ maxWidth: '1150px' }}>
            {modules.length === 0 ? (
              <p style={{ color: theme.textSecondary, fontSize: '15px', fontStyle: 'italic' }}>У цьому курсі ще немає модулів.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                {modules.map((mod, idx) => (
                  <div key={mod.id} className="hover-card" style={{ background: theme.cardBg, padding: '30px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: `1px solid ${theme.inputBorder}`, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '200px' }}>
                    
                    {/* Декоративний фон для Модуля */}
                    <div style={{ position: 'absolute', right: '-30px', bottom: '-30px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(43,108,176,0.15) 0%, rgba(43,108,176,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>

                    {/* Галочка завершеного модуля */}
                    {moduleCompletionMap[mod.id] && (
                      <div style={{ position: 'absolute', top: '20px', right: '20px', background: '#38A169', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(56, 161, 105, 0.3)', zIndex: 5 }} title="Модуль повністю пройдено">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    )}

                    {/* Контент модуля */}
                    <div onClick={() => setActiveModule(mod)} style={{ cursor: 'pointer', position: 'relative', zIndex: 1, flex: 1 }}>
                      <span style={{ fontSize: '13px', color: '#2B6CB0', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Модуль {idx + 1}</span>
                      <h3 style={{ fontSize: '24px', color: theme.text, marginTop: '10px', marginBottom: '0', fontWeight: '900', lineHeight: '1.3' }}>
                        {getTranslatedTitle(mod.title)}
                      </h3>
                    </div>

                    {/* Керування для Адміна */}
                    {effectiveIsAdmin && (
                      <div style={{ position: 'relative', zIndex: 10, marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${theme.inputBorder}` }}>
                        {editingModuleId === mod.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {['uk', 'ru', 'en', 'sk'].map(l => (
                                  <button key={l} onClick={(e) => { e.preventDefault(); setModuleEditLang(l); }} style={{ background: moduleEditLang === l ? '#E0A345' : 'transparent', color: moduleEditLang === l ? '#fff' : theme.textSecondary, border: `1px solid ${moduleEditLang === l ? '#E0A345' : theme.inputBorder}`, padding: '2px 6px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>
                                    {l.toUpperCase()}
                                  </button>
                                ))}
                              </div>
                              <button onClick={handleEditAutoTranslateModule} className="hover-card" title="Автопереклад" style={{ background: '#3182ce', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>
                                {editModuleTranslateStatus}
                              </button>
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <input type="text" value={editModuleTitleMulti[moduleEditLang] || ''} onChange={e => setEditModuleTitleMulti({...editModuleTitleMulti, [moduleEditLang]: e.target.value})} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text }} />
                              <button onClick={() => handleSaveModuleTitle(mod.id)} style={{ background: '#00C853', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>💾</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => { 
                              setEditingModuleId(mod.id); 
                              let parsedForEdit = mod.title;
                              if (typeof parsedForEdit === 'string' && parsedForEdit.startsWith('{')) {
                                try { parsedForEdit = JSON.parse(parsedForEdit); } catch(e) {}
                              }
                              if (typeof parsedForEdit === 'object' && parsedForEdit !== null) {
                                setEditModuleTitleMulti(parsedForEdit);
                              } else {
                                setEditModuleTitleMulti({ uk: parsedForEdit || '', ru: parsedForEdit || '', en: parsedForEdit || '', sk: parsedForEdit || '' });
                              }
                              setModuleEditLang('uk');
                            }} style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: theme.text }}>✏️ Редагувати</button>
                            <button onClick={() => handleDeleteModule(mod.id)} style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}>🗑</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- ЕКРАН ЗАВАНТАЖЕННЯ ---
  if (accessStatus === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: theme.bg }}>
        {/* Гігантський SVG логотип з пульсацією */}
        <img 
          src="/logo.svg" 
          alt="Hackademia" 
          style={{ 
            width: '280px', 
            height: '280px', 
            objectFit: 'contain',
            animation: 'ffPulse 1.5s infinite', 
            filter: 'drop-shadow(0 20px 40px rgba(224,163,69,0.3))' 
          }} 
        />
        <div style={{ marginTop: '40px', color: theme.textSecondary, fontWeight: '900', letterSpacing: '4px', fontSize: '18px', textTransform: 'uppercase', animation: 'ffPulse 1.5s infinite' }}>
          Завантаження...
        </div>
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
        <button onClick={handleReapplyWeb} style={{ background: '#3182ce', color: 'white', padding: '15px 30px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 10px rgba(49,130,206,0.3)' }}>
          🔄 Надіслати запит повторно
        </button>
      </div>
    );
  }
  

  const decorImages = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop'
  ];


// --- ЕКРАН ЧАТУ ---
  if (globalView === 'chat') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
        {renderGlobalStyles()} <FloatingBackgrounds theme="{theme}" themeMode="{themeMode}"/>
        {renderSidebar()}
        <ChatView 
          dbUserId={dbUserId} 
          isAdmin={effectiveIsAdmin} 
		  userProfile={userProfile} // ДОДАЛИ ЦЕЙ РЯДОК
          theme={theme} 
          t={t}
          courses={courses} /* <--- ДОДАЙ ЦЕЙ РЯДОК */		  
          onBack={() => setGlobalView(null)} 
        />
      </div>
    );
  }

// --- ЕКРАН ПРОФІЛЮ (Повністю функціональний) ---
  if (globalView === 'profile') {
    const handleSaveProfile = async (e) => {
      e.preventDefault();
      setIsSaving(true);
      const form = e.target;
      const updates = {
        first_name: form.firstName.value.trim(),
        last_name: form.lastName.value.trim(),
        phone: form.phone.value.trim(),
        city: form.city.value.trim(),
        bio: form.bio.value.trim(),
      };
      const { error } = await supabase.from('users').update(updates).eq('id', dbUserId);
      setIsSaving(false);
      if (error) {
        alert("❌ Помилка збереження: " + error.message);
      } else {
        setUserName(updates.first_name); 
        setUserProfile(prev => ({ ...prev, ...updates }));
        localStorage.setItem('hack_user_name', updates.first_name);
        playUiSound('ding', isSoundEnabled);
        if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        alert("✅ Дані успішно збережено!");
      }
    };

    const handleAvatarUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setIsUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar_${dbUserId}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        const { error: updateError } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', dbUserId);
        if (updateError) throw updateError;
        setUserProfile({ ...userProfile, avatar_url: publicUrl });
        playUiSound('ding', isSoundEnabled);
      } catch (err) {
        alert("❌ Помилка завантаження фото: " + err.message);
      } finally {
        setIsUploading(false);
      }
    };

    // ОНОВЛЕНА ФУНКЦІЯ ЗМІНИ ПАРОЛЯ З ПЕРЕВІРКОЮ
    const handleChangePassword = async (e) => {
      e.preventDefault();
      
      if (newPassword !== confirmPassword) {
        alert("❌ Новий пароль та його підтвердження не збігаються!");
        return;
      }
      
      if (!window.confirm("❓ Ви впевнені, що хочете зберегти цей новий пароль?")) {
        return;
      }

      setIsChangingPassword(true);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userProfile.email,
        password: oldPassword,
      });

      if (signInError) {
        alert("❌ Старий пароль введено неправильно!");
        setIsChangingPassword(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      setIsChangingPassword(false);

      if (updateError) {
        alert("❌ Помилка оновлення пароля: " + updateError.message);
      } else {
        alert("✅ Пароль успішно змінено!");
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setIsPasswordFormVisible(false); // Ховаємо форму після успіху
      }
    };

    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
        {renderGlobalStyles()} <FloatingBackgrounds theme="{theme}" themeMode="{themeMode}"/>
        {renderSidebar()}
        <div style={{ flex: 1, padding: '50px 60px', overflowY: 'auto', boxSizing: 'border-box', textAlign: 'left' }}>
          
          <button onClick={() => setGlobalView(null)} className="hover-card" style={{ background: theme.cardBg, border: `1px solid ${theme.inputBorder}`, color: theme.text, padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Назад до курсів
          </button>

          <h2 style={{ color: theme.text, fontSize: '32px', marginBottom: '30px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#4A5568' }}>👤</span> Мій профіль
          </h2>

          {!dbUserId ? (
            <div style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #C92A2A 100%)', padding: '40px', borderRadius: '32px', color: '#fff', textAlign: 'center', boxShadow: '0 10px 30px rgba(201,42,42,0.3)', maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ fontSize: '60px', marginBottom: '15px' }}>👾</div>
              <h3 style={{ fontSize: '28px', margin: '0 0 10px 0', fontWeight: '900' }}>Ой, сталася помилочка!</h3>
              <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '20px' }}>Ваші дані профілю десь загубилися в матриці або сесія застаріла. Спробуйте оновити систему.</p>
              <button onClick={() => window.location.reload()} style={{ background: '#fff', color: '#C92A2A', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>🔄 Оновити сторінку</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              
              {/* ЛІВА КОЛОНКА */}
              <div style={{ flex: '1 1 500px', background: theme.cardBg, padding: '45px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '40px' }}>
                   <label title="Змінити фото" className="hover-card" style={{ position: 'relative', width: '85px', height: '85px', borderRadius: '50%', background: userProfile.avatar_url ? 'transparent' : '#E0A345', color: '#fff', fontSize: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', cursor: 'pointer', overflow: 'hidden', boxShadow: '0 4px 15px rgba(224, 163, 69, 0.3)' }}>
                      {isUploading ? (
                        <span style={{ fontSize: '14px' }}>⏳</span>
                      ) : userProfile.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', borderRadius: '50%' }} />
                      ) : (
                        userName ? userName[0].toUpperCase() : 'H'
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0.8 }}>
                        <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </div>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                   </label>
                   <div>
                      <h3 style={{ margin: '0 0 8px 0', color: theme.text, fontSize: '26px', fontWeight: '900' }}>{userName || 'Гість'}</h3>
                      <span style={{ color: accessStatus === 'approved' ? '#38A169' : '#E53E3E', fontWeight: 'bold', fontSize: '14px' }}>
                        {accessStatus === 'approved' ? 'Активний учень' : 'Обмежений доступ'}
                      </span>
                   </div>
                </div>

                <form onSubmit={handleSaveProfile} style={{ position: 'relative', zIndex: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                    <div>
                       <label style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px', display: 'block', fontWeight: '600' }}>Ім'я</label>
                       <input type="text" name="firstName" value={userProfile.first_name || userName || ''} onChange={e => setUserProfile({...userProfile, first_name: e.target.value})} placeholder="Ваше ім'я" style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: theme.inputBg, color: theme.text, boxSizing: 'border-box', fontSize: '15px' }} />
                    </div>
                    <div>
                       <label style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px', display: 'block', fontWeight: '600' }}>Прізвище</label>
                       <input type="text" name="lastName" value={userProfile.last_name || ''} onChange={e => setUserProfile({...userProfile, last_name: e.target.value})} placeholder="Не вказано" style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: theme.inputBg, color: theme.text, boxSizing: 'border-box', fontSize: '15px' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                    <div>
                       <label style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px', display: 'block', fontWeight: '600' }}>Телефон / Telegram</label>
                       <input type="text" name="phone" value={userProfile.phone || ''} onChange={e => setUserProfile({...userProfile, phone: e.target.value})} placeholder="+380..." style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: theme.inputBg, color: theme.text, boxSizing: 'border-box', fontSize: '15px' }} />
                    </div>
                    <div>
                       <label style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px', display: 'block', fontWeight: '600' }}>Місто</label>
                       <input type="text" name="city" value={userProfile.city || ''} onChange={e => setUserProfile({...userProfile, city: e.target.value})} placeholder="Наприклад, Братислава" style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: theme.inputBg, color: theme.text, boxSizing: 'border-box', fontSize: '15px' }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '35px' }}>
                    <label style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px', display: 'block', fontWeight: '600' }}>Про мене</label>
                    <textarea name="bio" rows="3" value={userProfile.bio || ''} onChange={e => setUserProfile({...userProfile, bio: e.target.value})} placeholder="Які ваші цілі у вивченні мови? Який поточний рівень?" style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: theme.inputBg, color: theme.text, boxSizing: 'border-box', resize: 'vertical', fontSize: '15px', fontFamily: 'inherit' }}></textarea>
                  </div>

                  <button type="submit" disabled={isSaving} className="hover-card" style={{ background: '#E0A345', color: '#ffffff', padding: '18px 24px', borderRadius: '14px', border: 'none', fontWeight: 'bold', cursor: isSaving ? 'wait' : 'pointer', fontSize: '16px', width: '100%', opacity: isSaving ? 0.7 : 1, position: 'relative', zIndex: 30 }}>
                    {isSaving ? 'Збереження...' : 'Зберегти особисті дані'}
                  </button>
                </form>
              </div>

              {/* ПРАВА КОЛОНКА */}
              <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  
                  {/* БЛОК ПАРОЛЯ З ПРИХОВАНОЮ ФОРМОЮ */}
                  <div style={{ background: theme.cardBg, padding: '40px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                      <h3 style={{ margin: '0 0 15px 0', fontSize: '20px', color: theme.text, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#E0A345' }}>🔐</span> Доступ / Пароль
                      </h3>
                      <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '25px', lineHeight: '1.6' }}>
                        Тут ви можете побачити свій email для входу або <b>змінити пароль</b>.
                      </p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input type="email" value={userProfile.email || ''} disabled style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: theme.inputBg, color: theme.textSecondary, boxSizing: 'border-box', fontSize: '15px', opacity: 0.6, cursor: 'not-allowed' }} />
                        
                        {!isPasswordFormVisible ? (
                          <button onClick={() => setIsPasswordFormVisible(true)} className="hover-card" style={{ background: theme.inputBg, color: theme.text, border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', transition: '0.2s', marginTop: '5px' }}>
                            Змінити пароль
                          </button>
                        ) : (
                          <div style={{ background: isDarkMode ? '#1a202c' : '#F4F7F6', padding: '20px', borderRadius: '16px', border: `1px solid ${theme.inputBorder}`, marginTop: '5px', animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                              <h4 style={{ margin: 0, fontSize: '15px', color: theme.text, fontWeight: '700' }}>Новий пароль</h4>
                              <button onClick={() => { setIsPasswordFormVisible(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }} style={{ background: 'transparent', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>✕ Скасувати</button>
                            </div>
                            
                            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <input type={showPassword ? "text" : "password"} placeholder="Старий пароль" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box', padding: '14px', borderRadius: '12px', fontSize: '14px', border: `1px solid ${theme.inputBorder}`, background: theme.cardBg, color: theme.text }} />
                              <input type={showPassword ? "text" : "password"} placeholder="Новий пароль" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength="6" style={{ width: '100%', boxSizing: 'border-box', padding: '14px', borderRadius: '12px', fontSize: '14px', border: `1px solid ${theme.inputBorder}`, background: theme.cardBg, color: theme.text }} />
                              <input type={showPassword ? "text" : "password"} placeholder="Повторіть новий пароль" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength="6" style={{ width: '100%', boxSizing: 'border-box', padding: '14px', borderRadius: '12px', fontSize: '14px', border: `1px solid ${theme.inputBorder}`, background: theme.cardBg, color: theme.text }} />
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                <label style={{ fontSize: '13px', color: theme.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', userSelect: 'none' }}>
                                   <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }} />
                                   Показати
                                </label>
                                <button type="submit" disabled={isChangingPassword || !oldPassword || !newPassword || !confirmPassword} className="hover-card" style={{ background: '#E0A345', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: (isChangingPassword || !oldPassword || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: (isChangingPassword || !oldPassword || !newPassword || !confirmPassword) ? 0.6 : 1 }}>
                                  {isChangingPassword ? 'Збереження...' : 'Зберегти'}
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                  </div>

                  {/* ТЕХНІЧНА ІНФОРМАЦІЯ */}
                  <div style={{ background: theme.cardBg, padding: '40px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                      <h3 style={{ margin: '0 0 25px 0', fontSize: '18px', color: theme.textSecondary, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ opacity: 0.7 }}>⚙️</span> Технічна інформація
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${theme.inputBg}`, paddingBottom: '12px', alignItems: 'center' }}>
                          <span style={{ color: theme.textSecondary, fontSize: '14px' }}>Роль</span>
                          <b style={{ color: isAdmin ? '#E0A345' : theme.text, fontSize: '14px' }}>{isAdmin ? 'Адміністратор' : 'Учень'}</b>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: theme.textSecondary, fontSize: '14px' }}>Telegram</span>
                          {userProfile?.telegram_id ? (
                            <div style={{ textAlign: 'right' }}>
                              <b style={{ color: '#38A169', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                ✅ Підключено
                              </b>
                              <span style={{ fontSize: '11px', color: theme.textSecondary }}>ID: {userProfile.telegram_id}</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <a href="https://t.me/hackademiapp_bot" target="_blank" rel="noreferrer" className="hover-card" title="Підключіть Telegram для входу в 1 клік без пароля!" style={{ background: '#3182ce', color: '#fff', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(49,130,206,0.2)' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                                Підключити бот
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                  </div>

              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      {renderGlobalStyles()} <FloatingBackgrounds theme="{theme}" themeMode="{themeMode}"/>
      {renderSidebar()}
      
      <div style={{ flex: 1, padding: '20px 40px', overflowY: 'auto', boxSizing: 'border-box', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '15px', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '4px', background: theme.cardBg, padding: '4px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}` }}>
            {['uk', 'sk', 'en', 'ru'].map((l) => (
              <button key={l} onClick={() => changeLang(l)} className="hover-card" style={{ background: lang === l ? '#E0A345' : 'transparent', color: lang === l ? '#fff' : theme.text, border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={toggleSound} className="hover-card" style={{ background: theme.cardBg, border: `1px solid ${theme.inputBorder}`, width: '38px', height: '38px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isSoundEnabled ? '🔊' : '🔇'}</button>
          <button onClick={toggleTheme} className="hover-card" style={{ background: theme.cardBg, border: `1px solid ${theme.inputBorder}`, width: '38px', height: '38px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{themeMode === 'light' ? '☀️' : themeMode === 'dark' ? '🌙' : '☕'}</button>
          
          <button onClick={handleLogout} className="hover-card" title={t('logout')} style={{ background: 'transparent', border: 'none', color: theme.textSecondary, fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '10px' }}>
            {t('logout')}
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div className="hover-card" onClick={() => setGlobalView('profile')} title="Перейти в профіль" style={{ width: '65px', height: '65px', borderRadius: '50%', background: userProfile.avatar_url ? 'transparent' : '#E0A345', color: '#fff', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden', boxShadow: '0 4px 15px rgba(224, 163, 69, 0.3)', cursor: 'pointer', flexShrink: 0 }}>
                {userProfile.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                ) : (
                  userName ? userName[0].toUpperCase() : 'H'
                )}
              </div>
              <div>
                {userName && <p style={{ color: theme.textSecondary, fontSize: '26px', margin: 0 }}>{t('greeting')}, <b style={{color: theme.text}}>{userProfile.first_name || userName}</b>! 👋</p>}
                {isAdmin && <span onClick={handleBadgeClick} onDoubleClick={handleBadgeDoubleClick} style={{ background: isPreviewMode ? '#4A5568' : '#E0A345', color: isPreviewMode ? 'white' : '#ffffff', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', userSelect: 'none', display: 'inline-block', marginTop: '10px', fontWeight: '900', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>{isPreviewMode ? t('studentPreview') : t('admin')}</span>}
              </div>
            </div>
          </div>

          {effectiveIsAdmin && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px' }}>
              <button onClick={handleAddCourse} className="hover-card" style={{ background: 'linear-gradient(135deg, #FF7B54 0%, #FFB26B 100%)', color: '#ffffff', padding: '12px 24px', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(255,123,84,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                + Створити новий курс
              </button>
            </div>
          )}
        </div>
		
		
		<div style={{ maxWidth: '1150px', marginBottom: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '20px' }}>
            {effectiveIsAdmin ? (
              <Reorder.Group axis="y" values={courses} onReorder={handleReorderCourses} style={{ display: 'contents', listStyle: 'none' }}>
                {courses.map((course, idx) => {
                  const imgUrl = decorImages[idx % decorImages.length];
                  const isReorderActive = activeReorderId === course.id;
                  const isDimmed = activeReorderId !== null && activeReorderId !== course.id;
                  return (
                    <Reorder.Item dragListener={false} key={course.id} value={course} onPointerDown={(e) => handlePressStart(e, course.id)} onPointerUp={handlePressEnd} onPointerLeave={handlePressEnd} onClick={() => { if (!isReorderActive) setSelectedCourse(course); }} whileHover={{ scale: isReorderActive ? 1.02 : 1.02, filter: 'brightness(1.1)', y: isReorderActive ? 0 : -4 }} whileDrag={{ scale: 1.03, zIndex: 50, boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.2)" }} style={{ position: 'relative', overflow: 'hidden', zIndex: isReorderActive ? 10 : 1, background: isDarkMode ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)' : 'linear-gradient(135deg, #1E3A3A 0%, #2A4D4D 100%)', color: '#ffffff', padding: '25px', borderRadius: '24px', boxShadow: isReorderActive ? '0 0 0 4px #F6AD55, 0 15px 40px rgba(246,173,85,0.4)' : '0 10px 30px rgba(30,58,58,0.12)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px', opacity: isDimmed ? 0.4 : 1, border: '1px solid rgba(255,255,255,0.1)', boxSizing: 'border-box', cursor: isReorderActive ? 'default' : 'pointer', transition: 'all 0.3s ease', transform: isReorderActive ? 'scale(1.02)' : 'scale(1)' }}>
                      <img src={imgUrl} alt="3d decor" style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '140px', height: '140px', objectFit: 'cover', borderRadius: '50%', opacity: isDarkMode ? 0.3 : 0.4, mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 0 }} />
                      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></div>
                        {effectiveIsAdmin && isReorderActive ? (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); moveCourse(course.id, 'left'); }} style={{ background: '#F6AD55', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}>←</button>
                            <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); moveCourse(course.id, 'right'); }} style={{ background: '#F6AD55', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}>→</button>
                            <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setActiveReorderId(null); }} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}>✓</button>
                          </div>
                        ) : (
                          courses.length > 1 && <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }} style={{ background: 'rgba(255,255,255,0.15)', color: '#ff8080', border: 'none', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', fontSize: '14px' }}>🗑</button>
                        )}
                      </div>
                      <div style={{ position: 'relative', zIndex: 2, textAlign: 'left', marginTop: '20px' }}>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#F6AD55', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Hackademia</span>
                        <span onClick={() => { if (!isReorderActive) setSelectedCourse(course); }} style={{ cursor: isReorderActive ? 'default' : 'pointer', fontWeight: '900', fontSize: '20px', color: '#ffffff', lineHeight: '1.2', display: 'flex', alignItems: 'center', gap: '10px' }}>
  {course.title}
  <span style={{ background: '#4A5568', color: '#fff', fontSize: '10px', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>{course.lang || 'UK'}</span>
</span>
                      </div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            ) : (
              courses.filter(c => !c.lang || c.lang === lang || c.lang === 'all').map((course, idx) => {
                const hasAccess = effectiveIsAdmin || allowedCourses.includes(course.id);
                const imgUrl = decorImages[idx % decorImages.length];
                return (
                  <div key={course.id} className={hasAccess ? "hover-card" : ""} style={{ position: 'relative', overflow: 'hidden', zIndex: 1, background: hasAccess ? (isDarkMode ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)' : 'linear-gradient(135deg, #1E3A3A 0%, #2A4D4D 100%)') : (isDarkMode ? '#2d3748' : '#e2e8f0'), color: hasAccess ? '#ffffff' : theme.textSecondary, padding: '25px', borderRadius: '24px', boxShadow: hasAccess ? '0 10px 30px rgba(30,58,58,0.12)' : 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px', opacity: hasAccess ? 1 : 0.75, border: '1px solid rgba(255,255,255,0.1)', boxSizing: 'border-box', cursor: hasAccess ? 'pointer' : 'not-allowed' }} onClick={() => { if (hasAccess) setSelectedCourse(course); else alert(t('lockedAlert')); }}>
                    {hasAccess && <img src={imgUrl} alt="3d decor" style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '140px', height: '140px', objectFit: 'cover', borderRadius: '50%', opacity: isDarkMode ? 0.3 : 0.4, mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 0 }} />}
                    <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: hasAccess ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: hasAccess ? '#fff' : theme.textSecondary }}>
                        {hasAccess ? <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> : <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                      </div>
                    </div>
                    <div style={{ position: 'relative', zIndex: 2, textAlign: 'left', marginTop: '20px' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: hasAccess ? '#F6AD55' : theme.textSecondary, fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Hackademia</span>
                      <span style={{ fontWeight: '900', fontSize: '20px', color: hasAccess ? '#ffffff' : theme.text, lineHeight: '1.2', display: 'block' }}>{course.title}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={{ maxWidth: '1150px', marginBottom: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '20px' }}>
            {/* КАРТКА: ТЕМАТИЧНИЙ СЛОВНИК */}
            <div onClick={() => navigate('/vocabulary')} className="hover-card" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #FF7B54 0%, #FFB26B 100%)', color: '#ffffff', padding: '25px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(255,123,84,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '170px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', boxSizing: 'border-box' }}>
              <img src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop" alt="3d" style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '130px', height: '130px', objectFit: 'cover', borderRadius: '50%', opacity: 0.15, mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 0 }} />
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', position: 'relative', zIndex: 1 }}>📚</div>
              <div style={{ position: 'relative', zIndex: 1, marginTop: '20px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#FFF5F5', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>{t('vocabSub')}</span>
                <span style={{ fontWeight: '900', fontSize: '20px', color: '#ffffff', lineHeight: '1.2', display: 'block' }}>{t('vocabTitle')}</span>
              </div>
            </div>
            
            {/* КАРТКА: ІНТЕРВАЛЬНЕ ПОВТОРЕННЯ */}
            <div onClick={() => setGlobalView('dictionary')} className="hover-card" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #2B6CB0 0%, #4299E1 100%)', color: '#ffffff', padding: '25px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(43,108,176,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '170px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', boxSizing: 'border-box' }}>
              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop" alt="3d" style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '130px', height: '130px', objectFit: 'cover', borderRadius: '50%', opacity: 0.2, mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 0 }} />
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', position: 'relative', zIndex: 1 }}>🔄</div>
              <div style={{ position: 'relative', zIndex: 1, marginTop: '20px' }}><span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#E2E8F0', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>{t('spacedRep')}</span><span style={{ fontWeight: '900', fontSize: '20px', color: '#ffffff', lineHeight: '1.2', display: 'block' }}>{t('flashcardsSub')}</span></div>
            </div>
            <div onClick={() => { setGlobalView('sniper'); setSniperStatus('menu'); }} className="hover-card" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #805AD5 0%, #9F7AEA 100%)', color: '#ffffff', padding: '25px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(128,90,213,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '170px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', boxSizing: 'border-box' }}>
              <img src="https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=400&auto=format&fit=crop" alt="3d" style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '130px', height: '130px', objectFit: 'cover', borderRadius: '50%', opacity: 0.2, mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 0 }} />
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', position: 'relative', zIndex: 1 }}>🎯</div>
              <div style={{ position: 'relative', zIndex: 1, marginTop: '20px' }}><span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#E2E8F0', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Міні-гра на час</span><span style={{ fontWeight: '900', fontSize: '20px', color: '#ffffff', lineHeight: '1.2', display: 'block' }}>{t('sniperGame')}</span></div>
            </div>
            <div onClick={startFalseFriends} className="hover-card" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #D69E2E 0%, #ECC94B 100%)', color: '#ffffff', padding: '25px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(214,158,46,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '170px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)', boxSizing: 'border-box' }}>
              <img src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=400&auto=format&fit=crop" alt="3d" style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '130px', height: '130px', objectFit: 'cover', borderRadius: '50%', opacity: 0.15, mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 0 }} />
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', position: 'relative', zIndex: 1 }}>🎭</div>
              <div style={{ position: 'relative', zIndex: 1, marginTop: '20px' }}><span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#FFF5F5', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Тест на уважність</span><span style={{ fontWeight: '900', fontSize: '20px', color: '#ffffff', lineHeight: '1.2', display: 'block' }}>{t('falseFriends')}</span></div>
            </div>
          </div>
        </div>

        {!window.Telegram?.WebApp?.initDataUnsafe?.user && !userName && (
          <div style={{ marginBottom: '35px', maxWidth: '350px' }}>
            <p style={{ color: theme.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Як до вас звертатися?</p>
            <input type="text" placeholder="Твоє ім'я..." defaultValue={localStorage.getItem('hack_browser_user') || ''} onBlur={e => { localStorage.setItem('hack_browser_user', e.target.value); window.location.reload(); }} style={{ padding: '12px 16px', width: '100%', borderRadius: '10px', border: `1px solid ${theme.inputBorder}`, fontSize: '15px', background: theme.cardBg, color: theme.text, boxSizing: 'border-box' }} />
          </div>
        )}

        {isAdmin && (
          <div style={{ marginTop: '30px', opacity: 0.85, fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '15px', borderTop: `1px solid ${theme.inputBorder}`, paddingTop: '20px' }}>
            {effectiveIsAdmin && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: theme.textSecondary }}>
                <span>Додати адміна:</span>
                <input type="number" placeholder="Telegram ID" value={newAdminTelegramId} onChange={e => setNewAdminTelegramId(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '14px', width: '140px' }} />
                <button onClick={handleMakeAdmin} style={{ background: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 'bold' }}>OK</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={handleCloudBackup} style={{ background: 'transparent', border: '1px solid #2B6CB0', color: '#2B6CB0', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>☁️ Зробити бекап у хмару</button>
              <button 
                onClick={handleExportData} 
                className="hover-card"
                title="📥 Завантажити локальний бекап (.json)"
                style={{ background: 'transparent', border: '1px solid #38A169', color: '#38A169', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              </button>
			  <button onClick={() => setIsHelpOpen(true)} style={{ background: 'transparent', border: '1px solid #D69E2E', color: '#D69E2E', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>❓ Довідка</button>
              <button onClick={handleCloudRestore} style={{ background: 'transparent', border: '1px solid #C53030', color: '#C53030', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🔄 Відновити останній бекап</button>
              <label style={{ background: 'transparent', border: '1px solid #38A169', color: '#38A169', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                📂 Завантажити JSON бекап
                <input type="file" accept=".json" onChange={handleLocalJsonRestore} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* МОДАЛЬНЕ ВІКНО ОБ'ЄДНАННЯ АКАУНТІВ */}
      {mergePrompt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: theme.bg, padding: '30px', borderRadius: '24px', maxWidth: '400px', textAlign: 'center', border: `1px solid ${theme.inputBorder}`, boxShadow: '0 20px 50px rgba(224,163,69,0.2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔗</div>
            <h2 style={{ color: theme.text, margin: '0 0 15px 0' }}>Об'єднання акаунтів</h2>
            <p style={{ color: theme.textSecondary, fontSize: '15px', lineHeight: '1.5' }}>
              Ми виявили, що ви авторизовані через пошту <b style={{ color: theme.text }}>{mergePrompt.email}</b>, але зараз зайшли через Telegram <b style={{ color: theme.text }}>@{mergePrompt.tgUsername || mergePrompt.tgName}</b>.
            </p>
            <p style={{ color: theme.textSecondary, fontSize: '15px', marginBottom: '25px' }}>
              Бажаєте зв'язати цей Telegram з вашою поштою в єдиний профіль?
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={confirmMerge} className="hover-card" style={{ flex: 1, background: '#E0A345', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                Так, це я
              </button>
              <button onClick={cancelMerge} className="hover-card" style={{ flex: 1, background: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                Ні, вийти
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', top: '40px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #FFD3B6 0%, #FDE68A 100%)', color: '#2C3E50', padding: '14px 30px', borderRadius: '24px', fontWeight: '900', fontSize: '17px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 9999, animation: 'ffPulse 1.5s infinite', border: '2px solid #fff' }}>{toast}</div>}
      {/* ФУЛСКРІН ЗУМ ДЛЯ КАРТИНОК У ЗАВДАННЯХ */}
      {fullscreenTaskImg && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setFullscreenTaskImg(null)} style={{ position: 'absolute', top: '25px', right: '35px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: '24px', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <img src={fullscreenTaskImg} draggable="false" onContextMenu={(e) => e.preventDefault()} alt="Zoomed Task" style={{ maxWidth: '95%', maxHeight: '95vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', userSelect: 'none', WebkitUserDrag: 'none', WebkitTouchCallout: 'none' }} />
        </div>
      )}
	  <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      {effectiveIsAdmin && studentsNeedingCourses.length > 0 && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, background: theme.cardBg, padding: '24px', borderRadius: '18px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', border: `2px solid #2B6CB0`, maxWidth: '350px', textAlign: 'left', animation: 'ffPulse 2s infinite' }}>
          <h4 style={{ margin: '0 0 10px 0', color: theme.text, fontSize: '20px' }}>🚨 Увага!</h4>
          <p style={{ margin: '0 0 18px 0', fontSize: '15px', color: theme.textSecondary, lineHeight: '1.4' }}>Нещодавно ви додали учня. Який курс та групу бажаєте йому призначити?</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setGlobalView('admin_panel')} style={{ flex: 1, background: '#2B6CB0', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>⚙️ Налаштувати</button>
            <button onClick={dismissCourseAlert} style={{ background: theme.inputBg, color: theme.textSecondary, border: `1px solid ${theme.inputBorder}`, padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>Пізніше</button>
          </div>
        </div>
      )}
	  {/* ВІЗУАЛЬНИЙ КРОПЕР (НАРІЗКА) */}
      {cropState && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', zIndex: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
               <div style={{ color: 'white', background: 'rgba(255,255,255,0.1)', padding: '10px 15px', borderRadius: '10px', fontSize: '14px' }}>
                  👆 Затисніть і тягніть мишку, щоб виділити області
               </div>
               <button onClick={() => setCropState({...cropState, boxes: []})} style={{ background: theme.inputBg, color: theme.text, border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Очистити все</button>
               <button onClick={() => setCropState(null)} style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Скасувати</button>
               <button onClick={saveCrops} disabled={isSavingCrop} style={{ background: '#00C853', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,200,83,0.4)' }}>
                   {isSavingCrop ? '⏳ Збереження...' : `✅ Зберегти нарізку (${cropState.boxes.length} шт)`}
               </button>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto', width: '100%', textAlign: 'center', paddingBottom: '40px' }}>
                <div 
                    style={{ position: 'relative', display: 'inline-block', touchAction: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    onPointerDown={handleCropPointerDown}
                    onPointerMove={handleCropPointerMove}
                    onPointerUp={handleCropPointerUp}
                    onPointerLeave={handleCropPointerUp}
                >
                    <img id="crop-source-img" crossOrigin="anonymous" src={cropState.url.replace(/#split\d|#slice/g, '')} alt="crop source" style={{ maxWidth: '90vw', border: '2px dashed #4A5568', userSelect: 'none', display: 'block' }} draggable={false} />
                    
                    {cropState.boxes.map((b, i) => (
                        <div key={i} style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, border: '3px solid #00C853', background: 'rgba(0,200,83,0.15)', pointerEvents: 'none' }}>
                           <div style={{ position: 'absolute', top: -25, left: -3, background: '#00C853', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Фрагмент {i + 1}</div>
                        </div>
                    ))}
                    {cropState.currentBox && (
                        <div style={{ position: 'absolute', left: cropState.currentBox.x, top: cropState.currentBox.y, width: cropState.currentBox.w, height: cropState.currentBox.h, border: '3px dashed #E0A345', background: 'rgba(224,163,69,0.2)', pointerEvents: 'none' }} />
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// --- ГОЛОВНИЙ РОУТЕР ДОДАТКУ ---
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
		<Route path="/vocabulary" element={<Vocabulary />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<Platform />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;