import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vocabularyData } from './vocabularyData';
import { translations } from './i18n'; // Підключаємо твої переклади

const getBadgeStyle = (level) => {
  switch (level) {
    case 'A1': return { background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' };
    case 'A2': return { background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
    case 'B1': return { background: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa' };
    case 'B2': return { background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
    default: return { background: 'rgba(255, 123, 84, 0.2)', color: '#FF7B54' };
  }
};

const BgIconBook = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c1.66 0 3.218.51 4.5 1.38v-14.25a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" /></svg>;
const BgIconAcademic = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>;
const BgIconGlobe = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.896 1.157C8.583 4.251 7.235 5.564 6.22 7.214h4.482l-.598-3.807zM5.535 8.714C5.19 9.738 5 10.84 5 12c0 1.16.19 2.262.535 3.286h4.862l-.768-3.286-1.63 1.63a.75.75 0 01-1.06-1.06l3-3a.75.75 0 011.06 0l3 3a.75.75 0 11-1.06 1.06l-1.63-1.63.768 3.286h4.862c.345-1.024.535-2.126.535-3.286 0-1.16-.19-2.262-.535-3.286H5.535zm12.245 8.497H13.3l.598 3.807c1.521-.843 2.869-2.156 3.882-3.807zm-9.56 0H6.22a8.216 8.216 0 003.882 3.807l.598-3.807h-2.48zM13.3 3.407l-.598 3.807h4.482a8.216 8.216 0 00-3.884-3.807z" clipRule="evenodd" /></svg>;
const BgIconChat = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" /></svg>;
const BgIconTranslate = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>;


// --- ГОЛОСОВИЙ ДВИЖОК ---
const globalAudioPlayer = new Audio();

function speakSlovak(text) {
  if (!text) return;
  const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=sk&client=tw-ob&q=${encodeURIComponent(text)}`;
  globalAudioPlayer.src = audioUrl;
  
  globalAudioPlayer.play().catch(err => {
    console.warn("Мережеве аудіо не спрацювало:", err);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'sk-SK';
      utterance.rate = 0.85;
      
      const voices = window.speechSynthesis.getVoices();
      const slovakVoice = voices.find(v => v.lang === 'sk-SK' || v.lang.startsWith('sk'));
      
      if (slovakVoice) {
        utterance.voice = slovakVoice;
        window.speechSynthesis.speak(utterance);
      } else {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showPopup({
            title: "Блокування звуку 🔇",
            message: "Ваш пристрій блокує звук у Telegram і не має словацького голосу.\n\nВідкрийте словник у звичайному браузері (Chrome/Safari).",
            buttons: [
              { id: "open_web", type: "default", text: "🌐 Відкрити в браузері" },
              { type: "cancel", text: "Закрити" }
            ]
          }, (btnId) => {
            if (btnId === "open_web") {
              const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
              let url = "https://hackademia-web.vercel.app/vocabulary";
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

export default function Vocabulary() {
  const navigate = useNavigate();
  
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('hack_theme') === 'dark');
  
  // Додаємо підтримку мов як в App.jsx
  const [lang, setLang] = useState(() => localStorage.getItem('hack_lang') || 'uk');

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('hack_lang', newLang);
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  };
  
  const addToFlashcards = (wordSk, translation, e) => {
    e.stopPropagation(); // Щоб картка не клікалась вся цілком
    const btn = e.currentTarget;
    try {
      const saved = localStorage.getItem('hack_my_cards');
      let myCards = saved ? JSON.parse(saved) : [];

      // Перевіряємо, чи вже є це слово в колекції
      if (myCards.some(c => c.content === wordSk)) {
         btn.innerHTML = '👌'; // Показуємо, що вже додано
         setTimeout(() => btn.innerHTML = '➕', 2000);
         return;
      }

      // Створюємо нову картку
      const newCard = {
        id: 'custom_' + Date.now(),
        type: 'flashcard',
        content: wordSk,
        correct_answer: translation,
        difficulty: 'medium',
        isCustom: true
      };

      // Зберігаємо
      myCards.push(newCard);
      localStorage.setItem('hack_my_cards', JSON.stringify(myCards));

      // Анімація успіху на кнопці
      btn.innerHTML = '✅';
      setTimeout(() => btn.innerHTML = '➕', 2000);

      // Вібрація для телефонів
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const t = (key) => translations[lang]?.[key] || translations['uk'][key] || key;

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('hack_theme', newTheme ? 'dark' : 'light');
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  };

  const theme = {
    bg: isDarkMode ? '#1a202c' : '#F4F7F6',
    cardBg: isDarkMode ? '#2d3748' : '#ffffff',
    text: isDarkMode ? '#f7fafc' : '#2D3748',
    textSecondary: isDarkMode ? '#a0aec0' : '#718096',
    inputBg: isDarkMode ? '#4a5568' : '#EDF2F7',
    inputBorder: isDarkMode ? '#718096' : '#E2E8F0',
    openWordsBg: isDarkMode ? 'rgba(255, 123, 84, 0.08)' : 'rgba(255, 123, 84, 0.05)',
    bgIconColor: isDarkMode ? '#ffffff' : '#2D3748',
    bgIconOpacity: isDarkMode ? 0.05 : 0.04,
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: theme.bg, color: theme.text, padding: '40px 20px', fontFamily: 'sans-serif', transition: 'all 0.3s ease', overflow: 'hidden' }}>
      
      <style>{`
        @keyframes floatBg {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-25px); }
        }
        .bg-element {
            position: fixed;
            color: ${theme.bgIconColor}; 
            opacity: ${theme.bgIconOpacity}; 
            z-index: 0; 
            pointer-events: none; 
            transition: color 0.3s ease, opacity 0.3s ease;
        }
        
        .floating-back-btn {
            position: fixed;
            top: 25px;
            left: 25px;
            z-index: 1000;
            background: ${isDarkMode ? 'rgba(45, 55, 72, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
            backdrop-filter: blur(12px);
            border: 1px solid ${theme.inputBorder};
            color: ${theme.text};
            padding: 12px 20px;
            border-radius: 14px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            transition: all 0.2s ease;
        }
        .floating-back-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(0,0,0,0.12);
            border-color: #FF7B54;
        }
        
        .vocab-category {
            background: ${theme.cardBg};
            border: 1px solid ${theme.inputBorder};
            border-radius: 16px;
            margin-bottom: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.02);
            transition: all 0.2s ease;
            position: relative;
            z-index: 10;
        }
        .vocab-category[open] {
            border-color: #FF7B54;
        }
        .vocab-category > summary {
            padding: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 15px;
            list-style: none;
            user-select: none;
            font-weight: 900;
            font-size: 18px;
        }
        .vocab-category > summary::-webkit-details-marker { display: none; }
        
        .vocab-sub-category {
            border-top: 1px solid ${theme.inputBorder};
            background: ${isDarkMode ? '#232b38' : '#fafafa'};
            transition: background 0.3s ease;
        }
        .vocab-sub-category[open] {
            background: ${theme.openWordsBg};
        }
        .vocab-sub-category > summary {
            padding: 15px 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 15px;
            list-style: none;
            user-select: none;
            font-weight: bold;
            font-size: 16px;
        }
        .vocab-sub-category > summary::-webkit-details-marker { display: none; }

        .words-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 10px;
            padding: 15px 20px 25px 20px;
            border-top: 1px dashed rgba(255, 123, 84, 0.2);
        }
        .word-card {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background: ${theme.cardBg};
            border: 1px solid ${theme.inputBorder};
            border-radius: 10px;
            font-size: 15px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.02);
            transition: 0.2s;
        }
        .word-card:hover {
            border-color: #FF7B54;
            transform: translateX(3px);
        }
        .badge-level {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 800;
        }
        .theme-toggle-btn {
            background: transparent;
            border: none;
            color: ${theme.text};
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: 0.2s;
        }
        .theme-toggle-btn:hover {
            transform: scale(1.1) rotate(15deg);
        }
      `}</style>

      {/* ФОН */}
      <div className="bg-element" style={{ top: '15%', left: '8%', width: '80px', animation: 'floatBg 9s ease-in-out infinite' }}><BgIconBook /></div>
      <div className="bg-element" style={{ top: '65%', right: '8%', width: '100px', animation: 'floatBg 12s ease-in-out infinite 1s' }}><BgIconAcademic /></div>
      <div className="bg-element" style={{ top: '30%', right: '12%', width: '70px', animation: 'floatBg 10s ease-in-out infinite 2s' }}><BgIconChat /></div>
      <div className="bg-element" style={{ bottom: '15%', left: '15%', width: '90px', animation: 'floatBg 11s ease-in-out infinite 0.5s' }}><BgIconGlobe /></div>
	  <div className="bg-element" style={{ top: '12%', right: '28%', width: '110px', animation: 'floatBg 14s ease-in-out infinite 1.5s', opacity: theme.bgIconOpacity * 0.8 }}><BgIconTranslate /></div>

      {/* КНОПКА НАЗАД */}
      <button onClick={() => navigate('/app')} className="floating-back-btn">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        {t('toSchool') || 'На платформу'}
      </button>

      {/* ГОЛОВНИЙ КОНТЕНТ */}
      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        {/* ПЕРЕМИКАЧ МОВ ТА ТЕМИ */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '4px', background: theme.cardBg, padding: '4px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}` }}>
            {['uk', 'sk', 'en', 'ru'].map((l) => (
              <button 
                key={l} 
                onClick={() => changeLang(l)} 
                style={{ 
                  background: lang === l ? '#FF7B54' : 'transparent', 
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
          <div style={{ background: theme.cardBg, padding: '4px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}`, display: 'flex', alignItems: 'center' }}>
            <button onClick={toggleTheme} className="theme-toggle-btn" style={{ width: '30px', height: '30px' }}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* ЗАГОЛОВОК СТОРІНКИ */}
        <div style={{ marginBottom: '40px', paddingBottom: '20px', borderBottom: `2px solid ${theme.inputBorder}` }}>
          <h1 style={{ fontSize: '36px', marginBottom: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '15px', color: theme.text }}>
            <img src="https://flagcdn.com/sk.svg" alt="Словаччина" style={{ width: '45px', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} />
            {t('vocabTitle')}
          </h1>
        </div>

        {/* СПИСОК */}
        {vocabularyData.map((category) => (
          <details key={category.id} className="vocab-category">
            <summary>
              <span style={{ fontSize: '24px', width: '30px', textAlign: 'center' }}>{category.icon}</span> 
              <span style={{ flex: 1 }}>{typeof category.title === 'object' ? (category.title[lang] || category.title.uk) : category.title}</span>
              <span className="badge-level" style={getBadgeStyle(category.level)}>{category.level}</span>
            </summary>
            
            <div>
              {category.subcategories.map((sub, index) => (
                <details key={index} className="vocab-sub-category">
                  <summary>
                    <span style={{ fontSize: '20px', width: '25px', textAlign: 'center' }}>{sub.icon}</span>
                    <span style={{ flex: 1 }}>{typeof sub.title === 'object' ? (sub.title[lang] || sub.title.uk) : sub.title}</span>
                    <span className="badge-level" style={getBadgeStyle(sub.level)}>{sub.level}</span>
                  </summary>

                  <div className="words-grid">
                    {sub.wordList && sub.wordList.map((word, wIdx) => (
                      <div key={wIdx} className="word-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '50%' }}>
                          <span style={{ fontSize: '20px' }}>{word.emoji}</span>
                          <span style={{ fontWeight: '600', color: theme.text }}>
                            {word[lang] || word.ua || word.uk}
                          </span>
                        </div>
                        <div style={{ width: '50%', textAlign: 'right', color: '#FF7B54', fontWeight: '800', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                          <span>{word.sk}</span>
                          <button onClick={(e) => addToFlashcards(word.sk, word[lang] || word.ua || word.uk, e)} title="Додати до моїх флеш-карток" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', padding: 0, transition: '0.2s', filter: 'grayscale(0.2)' }} className="hover-card">➕</button>
                          <button onClick={(e) => { e.stopPropagation(); speakSlovak(word.sk); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', padding: 0, opacity: 0.8, transition: '0.2s' }} className="hover-card">🔊</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </details>
        ))}

      </div>
    </div>
  );
}