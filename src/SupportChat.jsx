import React, { useState, useEffect } from 'react';
import { supabase } from './supabase'; 

// --- ВБУДОВАНІ ПЕРЕКЛАДИ ДЛЯ ЧАТУ ---
const chatTranslations = {
  uk: {
    assistant: "Асистент Hackademia",
    online: "Онлайн",
    greeting: "Вітаю! 👋 Напишіть своє питання нижче, і воно миттєво полетить до нашого менеджера.",
    placeholder: "Ваше повідомлення...",
    authPrompt: "Щоб отримати відповідь миттєво, авторизуйтесь через наш Telegram-бот 👇",
    toTelegram: "Перейти в Telegram",
    or: "АБО",
    whereConvenient: "Де вам зручніше отримати відповідь? (можна кілька)",
    send: "Відправити",
    back: "Назад",
    sent: "Відправлено!",
    transition: "Перехід у Telegram...",
    studentReply: "Ми отримали ваше повідомлення. Викладач відповість вам у чаті платформи!",
    guestReply: "Якщо бот не привітався автоматично, надішліть йому команду /support або напишіть своє питання.",
    contactSuccess: "Дякуємо!",
    contactReply: "Ми успішно отримали ваші контакти й незабаром зв'яжемося з вами у вибраному месенджері.",
    close: "Зрозуміло, закрити",
    sending: "Відправка..."
  },
  sk: {
    assistant: "Asistent Hackademia",
    online: "Online",
    greeting: "Ahoj! 👋 Napíšte svoju otázku nižšie a okamžite ju pošleme nášmu manažérovi.",
    placeholder: "Vaša správa...",
    authPrompt: "Pre okamžitú odpoveď sa prihláste cez náš Telegram bot 👇",
    toTelegram: "Prejsť do Telegramu",
    or: "ALEBO",
    whereConvenient: "Kde vám najviac vyhovuje prijať odpoveď? (môžete vybrať viaceré)",
    send: "Odoslať",
    back: "Späť",
    sent: "Odoslané!",
    transition: "Prechod do Telegramu...",
    studentReply: "Dostali sme vašu správu. Lektor vám odpovie v chate platformy!",
    guestReply: "Ak bot nepozdraví automaticky, pošlite nam príkaz /support alebo napíšte svoju otázku.",
    contactSuccess: "Ďakujeme!",
    contactReply: "Úspešne sme prijali vaše kontakty a čoskoro vás budeme kontaktovať.",
    close: "Rozumiem, zavrieť",
    sending: "Odosielanie..."
  },
  en: {
    assistant: "Hackademia Support",
    online: "Online",
    greeting: "Hello! 👋 Write your question below, and it will instantly fly to our manager.",
    placeholder: "Your message...",
    authPrompt: "To get an instant reply, log in via our Telegram bot 👇",
    toTelegram: "Go to Telegram",
    or: "OR",
    whereConvenient: "Where is it more convenient to get a reply? (multiple choice)",
    send: "Send",
    back: "Back",
    sent: "Sent!",
    transition: "Going to Telegram...",
    studentReply: "We received your message. The teacher will reply to you in the platform chat!",
    guestReply: "If the bot didn't greet you automatically, send it the /support command or write your question.",
    contactSuccess: "Thank you!",
    contactReply: "We have successfully received your contacts and will contact you shortly.",
    close: "Got it, close",
    sending: "Sending..."
  },
  ru: {
    assistant: "Ассистент Hackademia",
    online: "Онлайн",
    greeting: "Здравствуйте! 👋 Напишите свой вопрос ниже, и он моментально улетит нашему менеджеру.",
    placeholder: "Ваше сообщение...",
    authPrompt: "Чтобы получить ответ мгновенно, авторизуйтесь через наш Telegram-бот 👇",
    toTelegram: "Перейти в Telegram",
    or: "ИЛИ",
    whereConvenient: "Где вам удобнее получить ответ? (можно несколько)",
    send: "Отправить",
    back: "Назад",
    sent: "Отправлено!",
    transition: "Переход в Telegram...",
    studentReply: "Мы получили ваше сообщение. Преподаватель ответит вам в чате платформы!",
    guestReply: "Если бот не поздоровался автоматически, отправьте ему команду /support или напишите свой вопрос.",
    contactSuccess: "Спасибо!",
    contactReply: "Мы успешно получили ваши контакти и вскоре свяжемся с вами.",
    close: "Понятно, закрыть",
    sending: "Отправка..."
  }
};

const messengers = [
  { id: 'Telegram', icon: <svg viewBox="0 0 24 24" fill="#0088cc" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.42.94-4.02 2.69-.38.27-.72.4-.1.03-.31-.04-.89-.23-1.33-.37-.54-.18-.96-.28-.92-.59.02-.16.23-.32.65-.49 2.54-1.11 4.24-1.81 5.09-2.17 2.42-1.03 2.92-1.2 3.25-1.2.07 0 .23.02.32.08s.16.14.18.23c.02.09.02.2.01.3z"/></svg> },
  { id: 'Viber', icon: <svg viewBox="0 0 24 24" fill="#7360f2" width="18" height="18"><path d="M18.89 14.12c-.28-.31-.69-.53-1.12-.53-.44 0-.85.22-1.12.53l-1.3 1.45c-2.3-1.1-4.04-2.84-5.14-5.14l1.45-1.3c.31-.28.53-.69.53-1.12 0-.44-.22-.85-.53-1.12L9.2 4.45C8.92 4.14 8.51 3.92 8.08 3.92c-.44 0-.85.22-1.12.53L4.9 6.5C4.24 7.16 4 8.1 4 9.1c0 6.64 5.36 12 12 12 1 0 1.94-.24 2.6-.9l2.05-2.05c.31-.28.53-.69.53-1.12 0-.44-.22-.85-.53-1.12l-2.29-2.79z"/></svg> },
  { id: 'WhatsApp', icon: <svg viewBox="0 0 24 24" fill="#25D366" width="18" height="18"><path d="M12.04 2C6.5 2 2 6.5 2 12.04c0 1.76.46 3.47 1.32 4.98L2 22l5.12-1.3c1.47.8 3.12 1.22 4.92 1.22 5.54 0 10.04-4.5 10.04-10.04S17.58 2 12.04 2zm5.46 14.5c-.23.64-1.28 1.2-1.76 1.28-.48.08-1.1.2-3.13-.64-2.46-1.02-4.06-3.53-4.18-3.69-.13-.15-1-1.33-1-2.54s.64-1.8.87-2.06c.22-.24.48-.3.64-.3h.46c.15 0 .33-.06.51.34.19.45.64 1.58.7 1.73.06.15.11.33.02.56-.1.23-.15.36-.3.54-.15.19-.32.41-.46.54-.15.15-.31.32-.14.62.17.3.76 1.26 1.63 2.03 1.12.98 2.06 1.29 2.36 1.44.3.15.48.13.65-.05.18-.19.74-.87.94-1.17.2-.3.39-.24.67-.14.28.1 1.76.83 2.06.98.3.15.5.23.57.36.08.13.08.77-.15 1.41z"/></svg> },
  { id: 'Телефон', icon: <svg viewBox="0 0 24 24" fill="#4A5568" width="18" height="18"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.25l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.2c.28-.28.36-.67.25-1.02C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2a9 9 0 00-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z"/></svg> }
];

export default function SupportChat() {
  const lang = localStorage.getItem('hack_lang') || 'uk';
  const t = (key) => chatTranslations[lang]?.[key] || chatTranslations['uk'][key] || key;

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); 
  const [submissionType, setSubmissionType] = useState(null);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [selectedMessengers, setSelectedMessengers] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
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

  const toggleMessenger = (id) => {
    if (selectedMessengers.includes(id)) {
      setSelectedMessengers(selectedMessengers.filter(m => m !== id));
    } else {
      setSelectedMessengers([...selectedMessengers, id]);
    }
  };

  const handleTelegramAuth = async () => {
    setSubmissionType('telegram');
    // Ми повністю видалили відправку анонімного "ЛІД ПЕРЕЙШОВ У БОТ"
    // Тепер користувач просто переходить у бот, де його зустріне повноцінне меню
    window.open('https://t.me/hackademiapp_bot?start=support', '_blank');
    setStep(3);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!contact.trim()) return;
    setSubmissionType('manual');
    const messengersList = selectedMessengers.length > 0 ? selectedMessengers.join(', ') : 'Не вказано';
    const text = `🔥 <b>НОВИЙ ЛІД З САЙТУ</b>\n\n💬 Питання: <i>${message}</i>\n\n📞 Контакти [<b>${messengersList}</b>]: ${contact.trim()}`;
    const success = await sendToTelegram(text);
    if (success) setStep(3);
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (authUser) {
      setSubmissionType('manual');
      setIsSending(true);
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
    setSelectedMessengers([]);
    setSubmissionType(null);
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
      `}</style>

      {/* ВЕРХНЯ КНОПКА (ПЕРЕХІД НА TELEGRAM-БОТ У ФІРМОВОМУ ТЕПЛОМУ СТИЛІ) */}
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

      {/* НИЖНЯ КНОПКА (ВІДКРИТТЯ ВІДЖЕТА ЧАТУ ПІДТРИМКИ З ІКОНКОЮ БУБАЛЬКА) */}
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
            
            {step === 1 && (
              <>
                <div style={{ background: '#F4F7F6', padding: '15px', borderRadius: '15px 15px 15px 4px', fontSize: '14px', color: '#2D3748', lineHeight: '1.5', marginBottom: '20px' }}>
                  {t('greeting')}
                </div>
                <form onSubmit={handleNext} style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <input 
                    type="text" 
                    placeholder={t('placeholder')}
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
                  {t('authPrompt')}
                </div>
                
                <button 
                  type="button"
                  onClick={handleTelegramAuth}
                  disabled={isSending}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #FF7B54 0%, #FFB26B 100%)', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', cursor: isSending ? 'wait' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '15px', boxShadow: '0 4px 15px rgba(255,123,84,0.3)', transition: '0.2s' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                  {isSending ? t('sending') : t('toTelegram')}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
                  <span style={{ fontSize: '11px', color: '#A0AEC0', fontWeight: 'bold' }}>{t('or')}</span>
                  <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#718096', fontWeight: 'bold', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>{t('whereConvenient')}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {messengers.map(m => {
                      const isSelected = selectedMessengers.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleMessenger(m.id)}
                          style={{ padding: '8px', borderRadius: '10px', border: isSelected ? '2px solid #FF7B54' : '1px solid #E2E8F0', background: isSelected ? '#FFF5F5' : '#fff', color: isSelected ? '#FF7B54' : '#4A5568', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: '0.2s' }}
                        >
                          {m.icon} {m.id}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Ваші контакти..."
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    style={{ width: '100%', padding: '12px 15px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', boxSizing: 'border-box', fontSize: '14px' }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setStep(1)} style={{ background: '#EDF2F7', color: '#718096', border: 'none', borderRadius: '12px', padding: '10px', flex: 1, cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                      {t('back')}
                    </button>
                    <button type="submit" disabled={!contact.trim() || isSending} style={{ background: '#1A3636', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px', flex: 2, cursor: contact.trim() ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '14px', opacity: contact.trim() ? 1 : 0.5 }}>
                      {t('send')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 3 && (
              <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease', padding: '15px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
                <h3 style={{ color: '#2D3748', margin: '0 0 10px 0', fontSize: '18px' }}>
                  {submissionType === 'telegram' ? t('transition') : t('contactSuccess')}
                </h3>
                <p style={{ color: '#718096', fontSize: '13px', lineHeight: '1.5', background: '#F4F7F6', padding: '12px', borderRadius: '10px' }}>
                  {submissionType === 'telegram' ? t('guestReply') : t('contactReply')}
                </p>
                <button onClick={() => { setIsOpen(false); setTimeout(resetChat, 500); }} style={{ background: '#1A3636', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 20px', marginTop: '15px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
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