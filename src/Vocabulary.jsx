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

export default function Vocabulary() {
  const navigate = useNavigate();
  
  // Беремо тему з кешу (як на платформі)
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
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text, padding: '40px 20px', fontFamily: 'sans-serif', transition: 'all 0.3s ease' }}>
      
      <style>{`
        .vocab-category {
            background: ${theme.cardBg};
            border: 1px solid ${theme.inputBorder};
            border-radius: 16px;
            margin-bottom: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.02);
            transition: all 0.2s ease;
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
        }
        .vocab-sub-category[open] {
            background: ${theme.inputBg};
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
            border-top: 1px dashed ${theme.inputBorder};
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
        }
        .word-card:hover {
            border-color: #FF7B54;
            transform: translateY(-2px);
        }
        .badge-level {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 800;
        }
        .hover-btn {
            transition: 0.2s;
        }
        .hover-btn:hover {
            transform: scale(1.05);
        }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* ХЕДЕР: Кнопка Назад + Зміна теми */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <button onClick={() => navigate('/app')} className="hover-btn" style={{ background: theme.cardBg, border: `1px solid ${theme.inputBorder}`, color: theme.text, padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            На платформу
          </button>
          
          <button onClick={toggleTheme} className="hover-btn" style={{ background: theme.cardBg, border: `1px solid ${theme.inputBorder}`, color: theme.text, width: '42px', height: '42px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* ЗАГОЛОВОК СТОРІНКИ */}
        <div style={{ marginBottom: '40px', paddingBottom: '20px', borderBottom: `2px solid ${theme.inputBorder}` }}>
          <h1 style={{ fontSize: '36px', marginBottom: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '15px', color: theme.text }}>
            <span style={{ fontSize: '40px' }}>🇸🇰</span> Словник (словацька)
          </h1>
          <p style={{ color: theme.textSecondary, fontSize: '16px', lineHeight: '1.6', maxWidth: '600px' }}>
            Списки слів українська — словацька за 14 категоріями. Розгорніть категорію, оберіть тему і вивчайте нові слова!
          </p>
        </div>

        <h2 style={{ fontSize: '22px', marginBottom: '20px', fontWeight: 'bold', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '1px' }}>Категорії</h2>

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
                        <div style={{ width: '50%', textAlign: 'right', color: theme.primary, fontWeight: 'bold' }}>
                          {word.sk}
                        </div>
                      </div>
                    ))}
                    {(!sub.wordList || sub.wordList.length === 0) && (
                      <div style={{ padding: '10px', color: theme.textSecondary, fontStyle: 'italic', fontSize: '14px' }}>
                        Слова для цієї категорії ще завантажуються...
                      </div>
                    )}
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