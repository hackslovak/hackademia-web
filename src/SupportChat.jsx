import React, { useState, useEffect } from 'react';
import { supabase } from './supabase'; 

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); 
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [messenger, setMessenger] = useState('Telegram');
  const [isSending, setIsSending] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Шукаємо юзера по email, а якщо немає - по id
        let { data } = await supabase.from('users').select('id, first_name').eq('email', session.user.email).maybeSingle();
        if (!data) {
          const res = await supabase.from('users').select('id, first_name').eq('id', session.user.id).maybeSingle();
          data = res.data;
        }
        if (data) setAuthUser(data);
      }
    }
    checkAuth();
  }, []);

  const sendToTelegram = async (text) => {
    setIsSending(true);
    const BOT_TOKEN = import.meta.env.VITE_TG_BOT_TOKEN; 
    const CHAT_ID = import.meta.env.VITE_TG_CHAT_ID; 

    if (!BOT_TOKEN || !CHAT_ID) {
      alert("Помилка конфігурації Telegram.");
      setIsSending(false);
      return false;
    }

    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: 'HTML' })
      });
      return true;
    } catch (error) {
      alert("Помилка відправки. Спробуйте пізніше.");
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const handleTelegramAuth = async () => {
    const text = `🚀 <b>ЛІД ПЕРЕЙШОВ У БОТ</b>\n\n💬 Питання: <i>${message}</i>\n\n(Шукайте його повідомлення поруч у цьому чаті)`;
    const success = await sendToTelegram(text);
    if (success) {
      window.open('https://t.me/hackademiapp_bot?start=support', '_blank');
      setStep(3);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!contact.trim()) return;
    const text = `🔥 <b>НОВИЙ ЛІД З САЙТУ</b>\n\n💬 Питання: <i>${message}</i>\n\n📞 Контакт [<b>${messenger}</b>]: ${contact.trim()}`;
    const success = await sendToTelegram(text);
    if (success) setStep(3);
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (authUser) {
      setIsSending(true);
      
      // ВСТАВЛЯЄМО ПОВІДОМЛЕННЯ ТА ПЕРЕВІРЯЄМО НА ПОМИЛКУ
      const { error } = await supabase.from('messages').insert([
        { user_id: authUser.id, sender_id: authUser.id, text: message.trim(), is_read: false }
      ]);
      
      if (error) {
        console.error("Помилка БД:", error);
        alert("Не вдалося зберегти на платформі. Відправляємо через Telegram...");
        await sendToTelegram(`⚠️ <b>Аварійна відправка (студент ${authUser.first_name})</b>\n\n💬 ${message.trim()}`);
        setStep(3);
        setIsSending(false);
        return;
      }
      
      const BOT_TOKEN = import.meta.env.VITE_TG_BOT_TOKEN; 
      const CHAT_ID = import.meta.env.VITE_TG_CHAT_ID; 
      if (BOT_TOKEN && CHAT_ID) {
        const text = `🟢 <b>ПОВІДОМЛЕННЯ ВІД СТУДЕНТА</b>\n\n👤 Учень: <b>${authUser.first_name}</b>\n💬 Текст: <i>${message.trim()}</i>\n\n⚠️ <i>Зайдіть на платформу в розділ 'Чат', щоб відповісти!</i>`;
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: 'HTML' })
        });
      }
      setStep(3);
      setIsSending(false);
    } else {
      setStep(2); 
    }
  };

  const resetChat = () => {
    setStep(1);
    setMessage('');
    setContact('');
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, fontFamily: 'sans-serif' }}>
      
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="hover-card"
          style={{ width: '65px', height: '65px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF7B54 0%, #FFB26B 100%)', color: '#fff', border: 'none', boxShadow: '0 10px 25px rgba(255,123,84,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'ffPulse 2s infinite' }}
        >
          <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
      )}

      {isOpen && (
        <div style={{ width: '340px', background: '#fff', borderRadius: '20px', boxShadow: '0 15px 40px rgba(0,0,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ background: '#1A3636', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '35px', height: '35px', background: '#FF7B54', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>H</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px' }}>Асистент Hackademia</div>
                <div style={{ color: '#00C853', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#00C853', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 4px rgba(0,200,83,0.6)' }}></span>
                  Онлайн
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px', opacity: 0.7 }}>×</button>
          </div>

          <div style={{ padding: '20px', flex: 1, minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            
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

            {step === 2 && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ background: '#F4F7F6', padding: '12px', borderRadius: '15px 15px 15px 4px', fontSize: '13px', color: '#2D3748', lineHeight: '1.4', marginBottom: '15px' }}>
                  Щоб отримати відповідь миттєво, авторизуйтесь через наш Telegram-бот 👇
                </div>
                
                <button 
                  type="button"
                  onClick={handleTelegramAuth}
                  disabled={isSending}
                  style={{ width: '100%', background: '#2AABEE', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', cursor: isSending ? 'wait' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '15px', boxShadow: '0 4px 15px rgba(42,171,238,0.3)', transition: '0.2s' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                  {isSending ? 'Відправка...' : 'Перейти в Telegram'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
                  <span style={{ fontSize: '11px', color: '#A0AEC0', fontWeight: 'bold' }}>АБО</span>
                  <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#718096', fontWeight: 'bold', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Де вам зручніше отримати відповідь?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {[
                      { id: 'Telegram', icon: '✈️' },
                      { id: 'Viber', icon: '💜' },
                      { id: 'WhatsApp', icon: '🟩' },
                      { id: 'Телефон/Пошта', icon: '📞' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMessenger(m.id)}
                        style={{ padding: '8px', borderRadius: '10px', border: messenger === m.id ? '2px solid #FF7B54' : '1px solid #E2E8F0', background: messenger === m.id ? '#FFF5F5' : '#fff', color: messenger === m.id ? '#FF7B54' : '#4A5568', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: '0.2s' }}
                      >
                        <span style={{ fontSize: '14px' }}>{m.icon}</span> {m.id}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder={`Ваш ${messenger}...`}
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

            {step === 3 && (
              <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease', padding: '15px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
                <h3 style={{ color: '#2D3748', margin: '0 0 10px 0', fontSize: '18px' }}>
                  {authUser ? "Відправлено!" : "Перехід у Telegram..."}
                </h3>
                <p style={{ color: '#718096', fontSize: '13px', lineHeight: '1.5', background: '#F4F7F6', padding: '10px', borderRadius: '10px' }}>
                  {authUser 
                    ? "Ми отримали ваше повідомлення. Викладач відповість вам у чаті платформи!"
                    : "Якщо бот не привітався автоматично, надішліть йому команду /support або напишіть своє питання."}
                </p>
                <button onClick={() => { setIsOpen(false); setTimeout(resetChat, 500); }} style={{ background: '#1A3636', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 20px', marginTop: '15px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
                  Зрозуміло, закрити
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}