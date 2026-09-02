import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vocabularyData } from './vocabularyData';

const getBadgeStyle = (level) => {
  switch (level) {
    case 'A1': return { background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' };
    case 'A2': return { background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
    case 'B1': return { background: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa' };
    case 'B2': return { background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
    default: return { background: 'rgba(255, 123, 84, 0.2)', color: '#FF7B54' };
  }
};

// Компоненти векторних іконок для фону (як на оригінальному сайті)
const BgIconBook = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c1.66 0 3.218.51 4.5 1.38v-14.25a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" /></svg>;
const BgIconAcademic = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>;
const BgIconGlobe = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.896 1.157C8.583 4.251 7.235 5.564 6.22 7.214h4.482l-.598-3.807zM5.535 8.714C5.19 9.738 5 10.84 5 12c0 1.16.19 2.262.535 3.286h4.862l-.768-3.286-1.63 1.63a.75.75 0 01-1.06-1.06l3-3a.75.75 0 011.06 0l3 3a.75.75 0 11-1.06 1.06l-1.63-1.63.768 3.286h4.862c.345-1.024.535-2.126.535-3.286 0-1.16-.19-2.262-.535-3.286H5.535zm12.245 8.497H13.3l.598 3.807c1.521-.843 2.869-2.156 3.882-3.807zm-9.56 0H6.22a8.216 8.216 0 003.882 3.807l.598-3.807h-2.48zM13.3 3.407l-.598 3.807h4.482a8.216 8.216 0 00-3.884-3.807z" clipRule="evenodd" /></svg>;
const BgIconChat = () => <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" /></svg>;

export default function Vocabulary() {
  const navigate = useNavigate();
  
  // Зберігаємо та оновлюємо тему
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('hack_theme') === 'dark');

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('hack_theme', newTheme ? 'dark' : 'light');
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  };

  // Кольорова палітра під режими
  const theme = {
    bg: isDarkMode ? '#1a202c' : '#F4F7F6',
    cardBg: isDarkMode ? '#2d3748' : '#ffffff',
    text: isDarkMode ? '#f7fafc' : '#2D3748',
    textSecondary: isDarkMode ? '#a0aec0' : '#718096',
    inputBg: isDarkMode ? '#4a5568' : '#EDF2F7',
    inputBorder: isDarkMode ? '#718096' : '#E2E8F0',
    // Спеціальний теплий фон для відкритих слів
    openWordsBg: isDarkMode ? 'rgba(255, 123, 84, 0.08)' : 'rgba(255, 123, 84, 0.05)',
    // Колір фонових іконок (в оригіналі вони сірі/білі з прозорістю)
    bgIconColor: isDarkMode ? '#ffffff' : '#2D3748',
    bgIconOpacity: isDarkMode ? 0.05 : 0.04,
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: theme.bg, color: theme.text, padding: '40px 20px', fontFamily: 'sans-serif', transition: 'all 0.3s ease', overflow: 'hidden' }}>
      
      <style>{`
        /* Анімація плаваючого фону */
        @keyframes floatBg {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-25px); }
        }
        .bg-element {
            position: fixed; /* Fixed щоб вони лишалися на фоні при скролі */
            color: ${theme.bgIconColor}; 
            opacity: ${theme.bgIconOpacity}; 
            z-index: 0; 
            pointer-events: none; 
            transition: color 0.3s ease, opacity 0.3s ease;
        }
        
        /* ПЛАВАЮЧА КНОПКА НАЗАД */
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
        
        /* Стилі категорій */
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
        /* Теплий фон для відкритої підкатегорії */
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
            background: ${theme.cardBg};
            border: 1px solid ${theme.inputBorder};
            color: ${theme.text};
            width: 46px;
            height: 46px;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            transition: 0.2s;
        }
        .theme-toggle-btn:hover {
            transform: scale(1.1) rotate(15deg);
            border-color: #FF7B54;
        }
      `}</style>

      {/* ПЛАВАЮЧІ ВЕКТОРНІ ІКОНКИ НА ФОНІ (Точна копія оригіналу) */}
      <div className="bg-element" style={{ top: '15%', left: '8%', width: '80px', animation: 'floatBg 9s ease-in-out infinite' }}>
        <BgIconBook />
      </div>
      <div className="bg-element" style={{ top: '65%', right: '8%', width: '100px', animation: 'floatBg 12s ease-in-out infinite 1s' }}>
        <BgIconAcademic />
      </div>
      <div className="bg-element" style={{ top: '30%', right: '12%', width: '70px', animation: 'floatBg 10s ease-in-out infinite 2s' }}>
        <BgIconChat />
      </div>
      <div className="bg-element" style={{ bottom: '15%', left: '15%', width: '90px', animation: 'floatBg 11s ease-in-out infinite 0.5s' }}>
        <BgIconGlobe />
      </div>

      {/* ПЛАВАЮЧА КНОПКА "НАЗАД" */}
      <button onClick={() => navigate('/app')} className="floating-back-btn">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        На платформу
      </button>

      {/* ГОЛОВНИЙ КОНТЕНТ */}
      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        {/* Кнопка зміни теми вирівняна по правому краю */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button onClick={toggleTheme} className="theme-toggle-btn">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* ЗАГОЛОВОК СТОРІНКИ */}
        <div style={{ marginBottom: '40px', paddingBottom: '20px', borderBottom: `2px solid ${theme.inputBorder}` }}>
          <h1 style={{ fontSize: '36px', marginBottom: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '15px', color: theme.text }}>
            {/* Векторний прапор замість проблемного емодзі Windows */}
            <img 
              src="https://flagcdn.com/sk.svg" 
              alt="Словаччина" 
              style={{ width: '45px', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} 
            />
            Словник (словацька)
          </h1>
          <p style={{ color: theme.textSecondary, fontSize: '16px', lineHeight: '1.6', maxWidth: '600px' }}>
            Списки слів українська — словацька за 14 категоріями. Розгорніть категорію, оберіть тему і вивчайте нові слова!
          </p>
        </div>

        <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: '800', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '2px' }}>
          Категорії
        </h2>

        {/* ДИНАМІЧНИЙ РЕНДЕР: КАТЕГОРІЯ -> ПІДКАТЕГОРІЯ -> СЛОВА */}
        {vocabularyData.map((category) => (
          <details key={category.id} className="vocab-category">
            
            {/* РІВЕНЬ 1: КАТЕГОРІЯ */}
            <summary>
              <span style={{ fontSize: '24px', width: '30px', textAlign: 'center' }}>{category.icon}</span> 
              <span style={{ flex: 1 }}>{category.title}</span>
              <span className="badge-level" style={getBadgeStyle(category.level)}>{category.level}</span>
              <span style={{ color: theme.textSecondary, fontSize: '14px', minWidth: '70px', textAlign: 'right', fontWeight: 'normal' }}>
                {category.totalWords} слів
              </span>
            </summary>
            
            {/* РІВЕНЬ 2: ПІДКАТЕГОРІЇ */}
            <div>
              {category.subcategories.map((sub, index) => (
                <details key={index} className="vocab-sub-category">
                  <summary>
                    <span style={{ fontSize: '20px', width: '25px', textAlign: 'center' }}>{sub.icon}</span>
                    <span style={{ flex: 1 }}>{sub.title}</span>
                    <span className="badge-level" style={getBadgeStyle(sub.level)}>{sub.level}</span>
                    <span style={{ color: theme.textSecondary, fontSize: '13px', minWidth: '60px', textAlign: 'right', fontWeight: 'normal' }}>
                      {sub.wordList ? sub.wordList.length : 0} слів
                    </span>
                  </summary>

                  {/* РІВЕНЬ 3: САМІ СЛОВА */}
                  <div className="words-grid">
                    {sub.wordList && sub.wordList.map((word, wIdx) => (
                      <div key={wIdx} className="word-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '50%' }}>
                          <span style={{ fontSize: '20px' }}>{word.emoji}</span>
                          <span style={{ fontWeight: '600', color: theme.text }}>{word.ua}</span>
                        </div>
                        <div style={{ width: '50%', textAlign: 'right', color: '#FF7B54', fontWeight: '800' }}>
                          {word.sk}
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