import React from 'react';
import { vocabularyData } from './vocabularyData'; // Підтягуємо наш згенерований масив

// Функція для різних кольорів бейджів залежно від рівня
const getBadgeStyle = (level) => {
  switch (level) {
    case 'A1': return { background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }; // Світло-зелений
    case 'A2': return { background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }; // Насичений зелений
    case 'B1': return { background: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa' }; // Світло-синій
    case 'B2': return { background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }; // Насичений синій
    default: return { background: 'rgba(255, 123, 84, 0.2)', color: '#FF7B54' };   // Наш помаранчевий за замовчуванням
  }
};

export default function Vocabulary() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#062440', color: '#fff', padding: '40px 20px', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      {/* CSS ДЛЯ АНІМАЦІЙ ТА АКОРДЕОНА */}
      <style>{`
        @keyframes floatIcon {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
        }
        .bg-floating-icon {
            position: absolute;
            color: #FF7B54; 
            opacity: 0.10; 
            z-index: 0; 
            pointer-events: none; 
            animation: floatIcon 8s ease-in-out infinite;
        }
        
        .vocab-category {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            margin-bottom: 10px;
            position: relative;
            z-index: 10;
            transition: all 0.3s ease;
        }
        .vocab-category[open] {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 123, 84, 0.4);
        }
        .vocab-category summary {
            padding: 18px 20px;
            cursor: pointer;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 15px;
            list-style: none;
            user-select: none;
        }
        .vocab-category summary::-webkit-details-marker {
            display: none;
        }
        .vocab-category summary:hover {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
        }
        .vocab-list {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding: 15px 20px;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .vocab-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 15px;
            background: transparent;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            transition: 0.2s;
            cursor: pointer;
        }
        .vocab-item:last-child {
            border-bottom: none;
        }
        .vocab-item:hover {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            transform: translateX(5px);
        }
        .badge-level {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.5px;
        }
      `}</style>

      {/* ЛІТАЮЧІ ІКОНКИ НА ФОНІ (Тільки для краси) */}
      <div className="bg-floating-icon" style={{ top: '10%', left: '5%', animationDelay: '0s', fontSize: '60px' }}>🇸🇰</div>
      <div className="bg-floating-icon" style={{ top: '40%', right: '10%', animationDelay: '2s', fontSize: '80px' }}>📚</div>
      <div className="bg-floating-icon" style={{ top: '75%', left: '12%', animationDelay: '4s', fontSize: '50px' }}>🎓</div>
      <div className="bg-floating-icon" style={{ top: '20%', right: '18%', animationDelay: '1s', fontSize: '45px' }}>💬</div>
      <div className="bg-floating-icon" style={{ top: '85%', right: '25%', animationDelay: '3s', fontSize: '65px' }}>📝</div>

      {/* ГОЛОВНИЙ КОНТЕНТ */}
      <div style={{ maxWidth: '850px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        {/* Хедер сторінки */}
        <div style={{ marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '40px' }}>🇸🇰</span> Словник (словацька)
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', lineHeight: '1.6', maxWidth: '600px' }}>
            Списки слів українська — словацька за 14 категоріями. 
            Кожен список безкоштовно переглядати, а з обліковим записом — зберігати для вивчення.
          </p>
        </div>

        <h2 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 'bold' }}>Категорії</h2>

        {/* ДИНАМІЧНИЙ РЕНДЕР КАТЕГОРІЙ */}
        {vocabularyData.map((category) => (
          <details key={category.id} className="vocab-category">
            
            <summary>
              <span style={{ fontSize: '22px', width: '30px', textAlign: 'center' }}>{category.icon}</span> 
              <span style={{ flex: 1, fontSize: '18px' }}>{category.title}</span>
              <span className="badge-level" style={getBadgeStyle(category.level)}>{category.level}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', minWidth: '70px', textAlign: 'right' }}>
                {category.totalWords} слів
              </span>
            </summary>
            
            <div className="vocab-list">
              {category.subcategories.map((sub, index) => (
                <div key={index} className="vocab-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '20px', width: '25px', textAlign: 'center' }}>{sub.icon}</span>
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>{sub.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span className="badge-level" style={getBadgeStyle(sub.level)}>{sub.level}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', minWidth: '60px', textAlign: 'right' }}>
                      {sub.words} слів
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
          </details>
        ))}

      </div>
    </div>
  );
}