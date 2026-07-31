import React, { useState } from 'react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '24px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        color: '#2d3748',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>📖 Довідка Hackademia</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#a0aec0'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 12px 0' }}>
            Ця інструкція допоможе вам швидко налаштовувати курси та керувати навчальним контентом платформи.
          </p>

          <h3 style={{ fontSize: '16px', margin: '16px 0 8px 0', color: '#1a202c' }}>1. Управління курсами та тижнями</h3>
          <ul style={{ paddingLeft: '20px', margin: '0 0 12px 0' }}>
            <li>Використовуйте кнопку <strong>«+ Створити новий курс»</strong> для додавання розділів.</li>
            <li>Змінюйте порядок елементів за допомогою перетягування.</li>
            <li>Редагуйте назви курсів чи тижнів, натискаючи на іконку олівця.</li>
          </ul>

          <h3 style={{ fontSize: '16px', margin: '16px 0 8px 0', color: '#1a202c' }}>2. Додавання медіафайлів</h3>
          <ul style={{ paddingLeft: '20px', margin: '0 0 12px 0' }}>
            <li><strong>Картинки:</strong> надішліть будь-яке фото у чат із Telegram-ботом, скопіюйте отримане пряме посилання та вставте його у поле матеріалу.</li>
            <li><strong>Відео:</strong> скопіюйте посилання на відео з YouTube та додайте у відповідне поле завдання.</li>
          </ul>

          <h3 style={{ fontSize: '16px', margin: '16px 0 8px 0', color: '#1a202c' }}>3. Збереження даних</h3>
          <p style={{ margin: 0 }}>
            Усі зміни автоматично синхронізуються та зберігаються у хмарній базі даних Supabase.
          </p>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3182ce',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Зрозуміло
          </button>
        </div>
      </div>
    </div>
  );
}