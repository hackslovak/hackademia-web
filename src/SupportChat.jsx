import React, { useState } from 'react';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); 
  
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Універсальна функція відправки
  const sendToTelegram = async (contactInfo) => {
    setIsSending(true);
    const BOT_TOKEN = import.meta.env.VITE_TG_BOT_TOKEN; 
    const CHAT_ID = import.meta.env.VITE_TG_CHAT_ID; 

    if (!BOT_TOKEN || !CHAT_ID) {
      alert("Помилка конфігурації: не знайдено токен або ID чату.");
      setIsSending(false);
      return false;
    }

    // МАКСИМАЛЬНО МІНІМАЛІСТИЧНИЙ ФОРМАТ (без зайвих слів)
    const text = `💬 ${message}\n\n📞 ${contactInfo}`;

    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: text,
          parse_mode: 'HTML'
        })
      });
      return true;
    } catch (error) {
      alert("Помилка відправки. Спробуйте пізніше.");
      return false;
    } finally {
      setIsSending(false);
    }
  };

  // 🚀 Головний флоу: Авторизація через Telegram
  const handleTelegramAuth = async () => {
    // Відправляємо питання адміну і позначаємо, що юзер пішов у бота
    const success = await sendToTelegram("Перейшов у Telegram-бот 🚀");
    
    if (success) {
      // Відкриваємо твого основного бота (це і реєстрація, і канал зв'язку)
      window.open('https://t.me/hackademiapp_bot', '_blank');
      setStep(3);
    }
  };

  // 📝 Резервний флоу: Ручний ввід контактів
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!contact.trim()) return;
    const success = await sendToTelegram(contact.trim());
    if (success) setStep(3);
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (message.trim()) setStep(2); 
  };

  const resetChat = () => {
    setStep(1);
    setMessage('');
    setContact('');
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, fontFamily: 'sans-serif' }}>
      
      {/* Кнопка відкриття чату */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#1A3636', color: '#fff', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
      )}

      {/* Вікно чату */}
      {isOpen && (
        <div style={{ width: '340px', background: '#fff', borderRadius: '20px', boxShadow: '0 15px 40px rgba(0,0,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* Шапка чату */}
          <div style={{ background: '#1A3636', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '35px', height: '35px', background: '#FF7B54', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>H</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px' }}>Асистент Hackademia</div>
                {/* 🟢 Змінено колір на зелений + світіння */}
                <div style={{ color: '#00C853', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#00C853', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 4px rgba(0,200,83,0.6)' }}></span>
                  Онлайн
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px', opacity: 0.7 }}>×</button>
          </div>

          {/* Тіло чату */}
          <div style={{ padding: '20px', flex: 1, minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            
            {/* КРОК 1: ВВІД ПОВІДОМЛЕННЯ */}
            {step === 1 && (
              <>
                <div style={{ background: '#F4F7F6', padding: '15px', borderRadius: '15px 15px 15px 4px', fontSize: '14px', color: '#2D3748', lineHeight: '1.5', marginBottom: '20px' }}>
                  Вітаю! 👋 Напишіть своє питання нижче, і воно миттєво полетить до нашого менеджера.
                </div>
                <form onSubmit={handleNext} style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <input 
                    type="text" 
                    placeholder="Ваше повідомлення..." 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ flex: 1, padding: '12px 15px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                  />
                  <button type="submit" disabled={!message.trim()} style={{ background: '#FF7B54', color: '#fff', border: 'none', borderRadius: '12px', width: '45px', cursor: message.trim() ? 'pointer' : 'not-allowed', opacity: message.trim() ? 1 : 0.5 }}>
                    ➤
                  </button>
                </form>
              </>
            )}

            {/* КРОК 2: АВТОРИЗАЦІЯ АБО РЕЗЕРВНИЙ КОНТАКТ */}
            {step === 2 && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ background: '#F4F7F6', padding: '15px', borderRadius: '15px 15px 15px 4px', fontSize: '14px', color: '#2D3748', lineHeight: '1.5', marginBottom: '15px' }}>
                  Клас! Щоб отримати відповідь миттєво, авторизуйтесь через наш Telegram-бот 👇
                </div>
                
                {/* 🚀 Головна яскрава кнопка Telegram */}
                <button 
                  type="button"
                  onClick={handleTelegramAuth}
                  disabled={isSending}
                  style={{ width: '100%', background: '#2AABEE', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', cursor: isSending ? 'wait' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '15px', boxShadow: '0 4px 15px rgba(42,171,238,0.3)', transition: '0.2s' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                  {isSending ? 'Відправка...' : 'Перейти в Telegram'}
                </button>

                {/* Розділювач */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
                  <span style={{ fontSize: '11px', color: '#A0AEC0', fontWeight: 'bold' }}>АБО ІНШИМ СПОСОБОМ</span>
                  <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
                </div>

                {/* 📝 Ручний ввід (резерв) */}
                <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Viber, номер або email..." 
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    style={{ width: '100%', padding: '12px 15px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', boxSizing: 'border-box', fontSize: '14px' }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setStep(1)} style={{ background: '#EDF2F7', color: '#718096', border: 'none', borderRadius: '12px', padding: '10px', flex: 1, cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                      Назад
                    </button>
                    <button type="submit" disabled={!contact.trim() || isSending} style={{ background: '#1A3636', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px', flex: 2, cursor: contact.trim() ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '14px', opacity: contact.trim() ? 1 : 0.5 }}>
                      Відправити
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* КРОК 3: УСПІХ */}
            {step === 3 && (
              <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease', padding: '20px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
                <h3 style={{ color: '#2D3748', margin: '0 0 10px 0' }}>Відправлено!</h3>
                <p style={{ color: '#718096', fontSize: '14px', lineHeight: '1.5' }}>Дякуємо! Ми вже отримали ваш запит.</p>
                <button onClick={() => { setIsOpen(false); setTimeout(resetChat, 500); }} style={{ background: '#1A3636', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 20px', marginTop: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Закрити
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}