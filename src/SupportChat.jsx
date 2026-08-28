import React, { useState } from 'react';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: повідомлення, 2: контакти, 3: успіх
  
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Функція відправки в Telegram
  const sendToTelegram = async () => {
    if (!contact.trim()) return;
    setIsSending(true);

    // Тягнемо ключі з безпечного середовища Vite
    const BOT_TOKEN = import.meta.env.VITE_TG_BOT_TOKEN; 
    const CHAT_ID = import.meta.env.VITE_TG_CHAT_ID; 

    if (!BOT_TOKEN || !CHAT_ID) {
      alert("Помилка конфігурації: не знайдено токен або ID чату.");
      setIsSending(false);
      return;
    }

    const text = `🚨 <b>Новий запит з сайту Hackademia!</b>\n\n💬 <b>Повідомлення:</b>\n${message}\n\n📞 <b>Контакт:</b>\n${contact}`;

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
      setStep(3); // Переходимо на екран "Успіх"
    } catch (error) {
      alert("Помилка відправки. Спробуйте пізніше.");
    } finally {
      setIsSending(false);
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (message.trim()) setStep(2); // Переходимо до запиту контактів
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendToTelegram();
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
                <div style={{ color: '#FF7B54', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#FF7B54', borderRadius: '50%', display: 'inline-block' }}></span>
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
                  Вітаю! 👋 Напишіть своє питання нижче, і воно миттєво полетить до нашого менеджера!
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

            {/* КРОК 2: ВВІД КОНТАКТІВ */}
            {step === 2 && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ background: '#F4F7F6', padding: '15px', borderRadius: '15px 15px 15px 4px', fontSize: '14px', color: '#2D3748', lineHeight: '1.5', marginBottom: '20px' }}>
                  Клас! Щоб ми могли вам відповісти, залиште свій номер телефону або email 👇
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="+380... або email" 
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    style={{ width: '100%', padding: '14px 15px', borderRadius: '12px', border: '2px solid #FF7B54', outline: 'none', boxSizing: 'border-box' }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setStep(1)} style={{ background: '#EDF2F7', color: '#718096', border: 'none', borderRadius: '12px', padding: '12px', flex: 1, cursor: 'pointer', fontWeight: 'bold' }}>
                      Назад
                    </button>
                    <button type="submit" disabled={!contact.trim() || isSending} style={{ background: '#FF7B54', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', flex: 2, cursor: contact.trim() ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                      {isSending ? 'Відправка...' : 'Відправити'}
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
                <p style={{ color: '#718096', fontSize: '14px', lineHeight: '1.5' }}>Дякуємо! Ми вже отримали ваш запит і скоро зв'яжемося.</p>
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