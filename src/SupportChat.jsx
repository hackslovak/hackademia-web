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

  const [isOpen, setIsOpen] = useState(() => sessionStorage.getItem('keepSupportChatOpen') === 'true');
  const [view, setView] = useState('main'); 
  const [message, setMessage] = useState('');
  const [authUser, setAuthUser] = useState(null);
  
  // Нові стани для живого чату
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [systemMsg, setSystemMsg] = useState('');
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);

  // Прокрутка до останнього повідомлення
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping, systemMsg]);

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
        if (data) setAuthUser(data);
        else setAuthUser({ id: session.user.id, first_name: session.user.user_metadata?.full_name || 'Студент', email: session.user.email });
      }
    }
    checkAuth();

    return () => clearTimeout(timerRef.current);
  }, []);

  // Підписка на реальні відповіді менеджера з БД
  useEffect(() => {
    if (!authUser) return;
    
    const channel = supabase.channel('support_replies')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${authUser.id}` }, (payload) => {
        // Якщо це повідомлення від адміна
        if (payload.new.sender_id !== authUser.id) {
          setChatHistory(prev => [...prev, { text: payload.new.text, sender: 'admin' }]);
          setIsTyping(false);
          setSystemMsg('');
          clearTimeout(timerRef.current);
        }
      }).subscribe();

    return () => supabase.removeChannel(channel);
  }, [authUser]);

  const handleGoogleLogin = async () => {
    sessionStorage.setItem('keepSupportChatOpen', 'true');
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  };

  const handleTelegramLogin = async () => {
    sessionStorage.setItem('keepSupportChatOpen', 'true');
    setView('telegram');
    const BOT_TOKEN = import.meta.env.VITE_TG_BOT_TOKEN; 
    
    if (message.trim() && BOT_TOKEN) {
      const pin = Math.floor(1000 + Math.random() * 9000);
      const text = `🚨 <b>НОВЕ ПИТАННЯ З САЙТУ</b>\n\n💬 Текст: <i>${message.trim()}</i>\n\n🔑 <b>PIN-КОД: ${pin}</b>`;
      for (const adminId of ADMIN_IDS) {
        try { await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: adminId, text: text, parse_mode: 'HTML' }) }); } catch (e) {}
      }
      window.open(`https://t.me/hackademiapp_bot?start=pin_${pin}`, '_blank');
    } else {
      window.open('https://t.me/hackademiapp_bot?start=support', '_blank');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !authUser) return;
    
    const msgText = message.trim();
    setMessage('');
    
    // Додаємо в UI
    setChatHistory(prev => [...prev, { text: msgText, sender: 'user' }]);
    setIsTyping(true);
    setSystemMsg('');
    clearTimeout(timerRef.current);
    
    // Запускаємо таймер на 2 хвилини
    timerRef.current = setTimeout(() => {
      setSystemMsg('Наразі ваше повідомлення надійшло. Очікується вільний менеджер, будь ласка, зачекайте...');
      setIsTyping(false);
    }, 120000);

    const { error } = await supabase.from('messages').insert([
      { user_id: authUser.id, sender_id: authUser.id, text: msgText, is_read: false }
    ]);
    
    if (error) console.error(error);
    
    const BOT_TOKEN = import.meta.env.VITE_TG_BOT_TOKEN; 
    if (BOT_TOKEN) {
      const targetId = authUser.telegram_id || authUser.id;
      const text = `🟢 <b>ПОВІДОМЛЕННЯ З САЙТУ (Live)</b>\n\n👤 Учень: <b>${authUser.first_name}</b>\n📧 Email: ${authUser.email || 'Немає'}\n\n💬 Текст: <i>${msgText}</i>\n\n🆔 ID: <code>${targetId}</code>\n\n💬 <i>Зробіть Reply (Відповісти) на це повідомлення, щоб відповісти в Live-чат!</i>`;
      for (const adminId of ADMIN_IDS) {
        try { await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: adminId, text: text, parse_mode: 'HTML' }) }); } catch (e) {}
      }
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', fontFamily: 'sans-serif' }}>
      {/* СТИЛІ І КНОПКИ ВІДКРИТТЯ ЗАЛИШАЮТЬСЯ ЯК БУЛИ */}
      <style>{`.support-trigger-btn { width: 55px; height: 55px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.15); transition: all 0.3s ease; } .support-trigger-btn:hover { transform: translateY(-4px) scale(1.05); box-shadow: 0 10px 25px rgba(255,123,84,0.35); } .auth-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px; border-radius: 12px; border: none; cursor: pointer; font-weight: bold; font-size: 14px; transition: 0.2s; margin-bottom: 10px; } .auth-btn.tg { background: #2AABEE; color: #fff; } .auth-btn.tg:hover { background: #1C9CE0; } .auth-btn.google { background: #fff; color: #3C4043; border: 1px solid #E2E8F0; } .auth-btn.google:hover { background: #F8FAFC; } `}</style>

      {!isOpen && (
        <a href="https://t.me/hackademiapp_bot" target="_blank" rel="noreferrer" className="support-trigger-btn" style={{ background: 'linear-gradient(135deg, #FF7B54 0%, #FFB26B 100%)', textDecoration: 'none', boxShadow: '0 6px 20px rgba(255,123,84,0.35)' }}>
          <img src="/telegram.svg" alt="Telegram" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
        </a>
      )}

      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="support-trigger-btn" style={{ backgroundColor: '#062440', color: '#ffffff' }}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
      )}

      {isOpen && (
        <div style={{ width: '340px', background: '#fff', borderRadius: '20px', boxShadow: '0 15px 40px rgba(0,0,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '500px' }}>
          
          <div style={{ background: '#1A3636', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '35px', height: '35px', background: '#FF7B54', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>H</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px' }}>{t('assistant')}</div>
                <div style={{ color: '#00C853', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#00C853', borderRadius: '50%', display: 'inline-block' }}></span> {t('online')}
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px', opacity: 0.7 }}>×</button>
          </div>

          <div style={{ padding: '20px', flex: 1, minHeight: '300px', display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
            
            {!authUser && view === 'main' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ background: '#F4F7F6', padding: '15px', borderRadius: '15px 15px 15px 4px', fontSize: '14px', color: '#2D3748', lineHeight: '1.5', marginBottom: '20px' }}>
                  {t('authRequired')}
                </div>
                <button onClick={handleTelegramLogin} className="auth-btn tg">{t('loginTelegram')}</button>
                <button onClick={handleGoogleLogin} className="auth-btn google">{t('loginGoogle')}</button>
              </div>
            )}

            {authUser && view === 'main' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                
                {/* ОБЛАСТЬ ЧАТУ */}
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '5px' }}>
                  <div style={{ background: '#F4F7F6', padding: '15px', borderRadius: '15px 15px 15px 4px', fontSize: '14px', color: '#2D3748', lineHeight: '1.5', marginBottom: '10px' }}>
                    <b>{t('greeting')}, {authUser.first_name || 'Студент'}!</b><br/>{t('prompt')}
                  </div>
                  
                  {chatHistory.map((msg, i) => (
                    <div key={i} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', background: msg.sender === 'user' ? '#FF7B54' : '#E2E8F0', color: msg.sender === 'user' ? '#fff' : '#2D3748', padding: '10px 14px', borderRadius: msg.sender === 'user' ? '15px 15px 4px 15px' : '15px 15px 15px 4px', maxWidth: '85%', fontSize: '13px' }}>
                      {msg.text}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div style={{ alignSelf: 'flex-start', background: '#F4F7F6', padding: '10px 14px', borderRadius: '15px 15px 15px 4px', fontSize: '12px', color: '#718096', fontStyle: 'italic' }}>
                      Асистент друкує... ✍️
                    </div>
                  )}

                  {systemMsg && (
                    <div style={{ alignSelf: 'center', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', color: '#92400E', textAlign: 'center', marginTop: '10px' }}>
                      {systemMsg}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <input type="text" placeholder={t('placeholder')} value={message} onChange={(e) => setMessage(e.target.value)} style={{ flex: 1, padding: '12px 15px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                  <button type="submit" disabled={!message.trim()} style={{ background: '#FF7B54', color: '#fff', border: 'none', borderRadius: '12px', width: '45px', cursor: message.trim() ? 'pointer' : 'not-allowed', opacity: message.trim() ? 1 : 0.5 }}>➤</button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}