import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase'; 

const chatTranslations = {
  uk: {
    assistant: "Асистент Hackademia",
    online: "Онлайн",
    authRequired: "Щоб ми могли допомогти вам, будь ласка, авторизуйтесь (це займе 2 секунди) 👇",
    loginTelegram: "Увійти через Telegram",
    loginGoogle: "Увійти через Google",
    greeting: "Вітаю",
    prompt: "Напишіть своє питання нижче:",
    placeholder: "Ваше повідомлення...",
    transition: "Перехід у Telegram...",
    guestReply: "Якщо бот не відкрився автоматично, перейдіть за посиланням."
  },
  sk: {
    assistant: "Asistent Hackademia",
    online: "Online",
    authRequired: "Aby sme vám mohli pomôcť, prihláste sa prosím (zaberie to 2 sekundy) 👇",
    loginTelegram: "Prihlásiť sa cez Telegram",
    loginGoogle: "Prihlásiť sa cez Google",
    greeting: "Ahoj",
    prompt: "Napíšte svoju otázku nižšie:",
    placeholder: "Vaša správa...",
    send: "Odoslať",
    sent: "✅ Ďakujeme! Odoslané.",
    studentReply: "Úspešne sme prijali vašu správu! Náš manažér vás bude čoskoro kontaktovať.",
    transition: "Prechod do Telegramu...",
    guestReply: "Ak sa bot neotvoril automaticky, prejdite na odkaz.",
    close: "Zavrieť",
    sending: "Odosielanie..."
  },
  en: {
    assistant: "Hackademia Support",
    online: "Online",
    authRequired: "To help you quickly, please log in (it takes 2 seconds) 👇",
    loginTelegram: "Log in with Telegram",
    loginGoogle: "Log in with Google",
    greeting: "Hello",
    prompt: "Write your question below:",
    placeholder: "Your message...",
    send: "Send",
    sent: "✅ Thank you! Sent.",
    studentReply: "We have successfully received your message! Our manager will contact you shortly.",
    transition: "Going to Telegram...",
    guestReply: "If the bot didn't open automatically, follow the link.",
    close: "Close",
    sending: "Sending..."
  },
  ru: {
    assistant: "Ассистент Hackademia",
    online: "Онлайн",
    authRequired: "Чтобы мы могли вам помочь, пожалуйста, авторизуйтесь (это займет 2 секунды) 👇",
    loginTelegram: "Войти через Telegram",
    loginGoogle: "Войти через Google",
    greeting: "Здравствуйте",
    prompt: "Напишите свой вопрос ниже:",
    placeholder: "Ваше сообщение...",
    send: "Отправить",
    sent: "✅ Спасибо! Отправлено.",
    studentReply: "Мы успешно получили ваше сообщение! Наш менеджер вскоре свяжется с вами.",
    transition: "Переход в Telegram...",
    guestReply: "Если бот не открылся автоматически, перейдите по ссылке.",
    close: "Закрыть",
    sending: "Отправка..."
  }
};

const ADMIN_IDS = [597686904, 5604755902];

export default function SupportChat() {
  const lang = localStorage.getItem('hack_lang') || 'uk';
  const t = (key) => chatTranslations[lang]?.[key] || chatTranslations['uk'][key] || key;

  const [isOpen, setIsOpen] = useState(() => {
    return sessionStorage.getItem('keepSupportChatOpen') === 'true';
  });
  
  const [view, setView] = useState('main'); 
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    if (sessionStorage.getItem('keepSupportChatOpen')) {
      sessionStorage.removeItem('keepSupportChatOpen');
    }

    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        let { data } = await supabase.from('users').select('id, first_name, email, telegram_id').eq('email', session.user.email).maybeSingle();
        if (!data) {
            const res = await supabase.from('users').select('id, first_name, email, telegram_id').eq('id', session.user.id).maybeSingle();
            data = res.data;
        }
        if (data) {
            setAuthUser(data);
        } else {
            setAuthUser({ id: session.user.id, first_name: session.user.user_metadata?.full_name || 'Студент', email: session.user.email });
        }
      }
    }
    checkAuth();
  }, []);

  const handleGoogleLogin = async () => {
    sessionStorage.setItem('keepSupportChatOpen', 'true');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const handleTelegramLogin = async () => {
    sessionStorage.setItem('keepSupportChatOpen', 'true');
    setView('telegram');
    
    const BOT_TOKEN = import.meta.env.VITE_TG_BOT_TOKEN; 
    
    if (message.trim() && BOT_TOKEN) {
      const pin = Math.floor(1000 + Math.random() * 9000);
      const text = `🚨 <b>НОВЕ ПИТАННЯ З САЙТУ</b>\n\n💬 Текст: <i>${message.trim()}</i>\n\n🔑 <b>PIN-КОД: ${pin}</b>\n\n<i>(Очікуємо авторизації. Як тільки клієнт натисне Start у боті, ви отримаєте сповіщення з цим же PIN-кодом).</i>`;
      
      for (const adminId of ADMIN_IDS) {
        try {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: adminId, text: text, parse_mode: 'HTML' })
          });
        } catch (e) {}
      }
      window.open(`https://t.me/hackademiapp_bot?start=pin_${pin}`, '_blank');
    } else {
      window.open('https://t.me/hackademiapp_bot?start=support', '_blank');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !authUser) return;
    
    setIsSending(true);
    
    const { error } = await supabase.from('messages').insert([
      { user_id: authUser.id, sender_id: authUser.id, text: message.trim(), is_read: false }
    ]);
    
    if (error) console.error("Помилка збереження повідомлення:", error);
    
    const BOT_TOKEN = import.meta.env.VITE_TG_BOT_TOKEN; 
    
    if (BOT_TOKEN) {
      const targetId = authUser.telegram_id || authUser.id;
      const text = `🟢 <b>ПОВІДОМЛЕННЯ З САЙТУ</b>\n\n👤 Учень: <b>${authUser.first_name}</b>\n📧 Email: ${authUser.email || 'Немає'}\n\n💬 Текст: <i>${message.trim()}</i>\n\n🆔 ID: <code>${targetId}</code>\n\n💬 <i>Щоб відповісти клієнту прямо тут, зробіть Reply (Відповісти) на це повідомлення.</i>`;
      
      for (const adminId of ADMIN_IDS) {
        try {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: adminId, text: text, parse_mode: 'HTML' })
          });
        } catch (e) {}
      }
    }
    
    setIsSending(false);
    setView('sent');
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', fontFamily: 'sans-serif' }}>
      
      <style>{`
        .support-trigger-btn {
          width: 55px;
          height: 55px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
        }
        .support-trigger-btn:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 10px 25px rgba(255,123,84,0.35);
        }
        .auth-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 12px; border-radius: 12px; border: none; cursor: pointer; font-weight: bold;
          font-size: 14px; transition: 0.2s; margin-bottom: 10px;
        }
        .auth-btn.tg { background: #2AABEE; color: #fff; box-shadow: 0 4px 15px rgba(42,171,238,0.3); }
        .auth-btn.tg:hover { background: #1C9CE0; }
        .auth-btn.google { background: #fff; color: #3C4043; border: 1px solid #E2E8F0; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .auth-btn.google:hover { background: #F8FAFC; }
      `}</style>

      {/* КНОПКА ПЕРЕХОДУ В TELEGRAM БОТ */}
      {!isOpen && (
        <a 
          href="https://t.me/hackademiapp_bot" 
          target="_blank" 
          rel="noreferrer"
          className="support-trigger-btn"
          style={{ background: 'linear-gradient(135deg, #FF7B54 0%, #FFB26B 100%)', textDecoration: 'none', boxShadow: '0 6px 20px rgba(255,123,84,0.35)' }}
          title="Наш Telegram-бот"
        >
          <img src="/telegram.svg" alt="Telegram" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
        </a>
      )}

      {/* КНОПКА ВІДКРИТТЯ ВІДЖЕТА ЧАТУ ПІДТРИМКИ */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="support-trigger-btn" style={{ backgroundColor: '#062440', color: '#ffffff' }} title="Чат підтримки">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
      )}

      {isOpen && (
        <div style={{ width: '340px', background: '#fff', borderRadius: '20px', boxShadow: '0 15px 40px rgba(0,0,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ background: '#1A3636', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '35px', height: '35px', background: '#FF7B54', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>H</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px' }}>{t('assistant')}</div>
                <div style={{ color: '#00C853', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#00C853', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 4px rgba(0,200,83,0.6)' }}></span>
                  {t('online')}
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px', opacity: 0.7 }}>×</button>
          </div>

          <div style={{ padding: '20px', flex: 1, minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            
            {!authUser && view === 'main' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ background: '#F4F7F6', padding: '15px', borderRadius: '15px 15px 15px 4px', fontSize: '14px', color: '#2D3748', lineHeight: '1.5', marginBottom: '20px' }}>
                  {t('authRequired')}
                </div>
                
                <button onClick={handleTelegramLogin} className="auth-btn tg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                  {t('loginTelegram')}
                </button>
                
                <button onClick={handleGoogleLogin} className="auth-btn google">
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  {t('loginGoogle')}
                </button>
              </div>
            )}

            {authUser && view === 'main' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ background: '#F4F7F6', padding: '15px', borderRadius: '15px 15px 15px 4px', fontSize: '14px', color: '#2D3748', lineHeight: '1.5', marginBottom: '20px' }}>
                  <b>{t('greeting')}, {authUser.first_name || 'Студент'}!</b><br/>
                  {t('prompt')}
                </div>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <input 
                    type="text" 
                    placeholder={t('placeholder')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ flex: 1, padding: '12px 15px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                  />
                  <button type="submit" disabled={!message.trim() || isSending} style={{ background: '#FF7B54', color: '#fff', border: 'none', borderRadius: '12px', width: '45px', cursor: message.trim() ? 'pointer' : 'not-allowed', opacity: message.trim() ? 1 : 0.5 }}>
                    ➤
                  </button>
                </form>
              </div>
            )}

            {view === 'sent' && (
              <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease', padding: '15px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
                <h3 style={{ color: '#2D3748', margin: '0 0 10px 0', fontSize: '18px' }}>{t('sent')}</h3>
                <p style={{ color: '#718096', fontSize: '13px', lineHeight: '1.5', background: '#F4F7F6', padding: '12px', borderRadius: '10px' }}>
                  {t('studentReply')}
                </p>
                <button onClick={() => { setIsOpen(false); setTimeout(() => { setView('main'); setMessage(''); }, 500); }} style={{ background: '#1A3636', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 20px', marginTop: '15px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
                  {t('close')}
                </button>
              </div>
            )}

            {view === 'telegram' && (
              <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease', padding: '15px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🚀</div>
                <h3 style={{ color: '#2D3748', margin: '0 0 10px 0', fontSize: '18px' }}>{t('transition')}</h3>
                <p style={{ color: '#718096', fontSize: '13px', lineHeight: '1.5', background: '#F4F7F6', padding: '12px', borderRadius: '10px' }}>
                  {t('guestReply')}
                </p>
                <button onClick={() => { setIsOpen(false); setTimeout(() => setView('main'), 500); }} style={{ background: '#1A3636', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 20px', marginTop: '15px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
                  {t('close')}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}