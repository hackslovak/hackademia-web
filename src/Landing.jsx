import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { translations } from './i18n';
import './Landing.css';
import SupportChat from './SupportChat'; 

export default function Landing() {
    const navigate = useNavigate();
    
    // --- ЛОГІКА МОВИ ---
    const [lang, setLang] = useState(() => localStorage.getItem('hack_lang') || 'uk');
    const changeLang = (newLang) => {
        setLang(newLang);
        localStorage.setItem('hack_lang', newLang);
    };
    const t = (key) => translations[lang]?.[key] || translations['uk'][key] || key;

    // --- ЛОГІКА АВТОРИЗАЦІЇ ---
    const isAuth = localStorage.getItem('hack_auth_cache') === 'approved';
    
    const handleLogout = async () => {
        if (window.confirm(t('logout') + "?")) {
            await supabase.auth.signOut();
            localStorage.removeItem('hack_auth_cache');
            window.location.reload(); 
        }
    };

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const toggleChat = () => setIsChatOpen(!isChatOpen);

    const sendLead = () => {
        if (!chatInput.trim()) {
            alert(t('chatAlert'));
            return;
        }
        const encodedText = encodeURIComponent("Лід з сайту: " + chatInput.trim());
        window.open(`https://t.me/xackademia?text=${encodedText}`, '_blank');
        setChatInput('');
        toggleChat();
    };

    return (
        <div className="landing-body">
            <style>{`
                .landing-body { overflow-x: hidden; }
                .hero h1 { font-size: clamp(32px, 8vw, 64px) !important; line-height: 1.15 !important; }
                .section-title { font-size: clamp(22px, 5vw, 36px) !important; word-break: break-word; }
                @media (max-width: 768px) {
                    .landing-body { padding: 0 10px; }
                    header { padding: 15px 20px !important; flex-wrap: wrap; gap: 15px;}
                    .hero { padding: 40px 15px !important; }
                    .container { padding: 30px 15px !important; }
                    .about-grid, .pricing-grid { grid-template-columns: 1fr !important; }
                    .extra-box { grid-template-columns: 1fr !important; padding: 20px !important; }
                    .chat-modal { width: calc(100% - 30px) !important; right: 15px !important; bottom: 80px !important; }
                    .floating-buttons { bottom: 15px !important; right: 15px !important; }
                }
            `}</style>

            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <a href="#" className="logo">
                    <img src="/logo-main.svg" alt="Hackademia Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                    <span>HACK<span>ADEMIA</span></span>
                </a>

                <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginLeft: 'auto' }}>
                    
                    {/* Перемикач мов */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {['uk', 'sk', 'en', 'ru'].map(l => (
                            <span 
                                key={l} 
                                onClick={() => changeLang(l)} 
                                style={{ 
                                    cursor: 'pointer', 
                                    color: lang === l ? '#E0A345' : 'rgba(255,255,255,0.4)', 
                                    fontSize: '13px', 
                                    fontWeight: lang === l ? 'bold' : 'normal',
                                    transition: 'color 0.2s'
                                }}
                            >
                                {l.toUpperCase()}
                            </span>
                        ))}
                    </div>

                    {/* Кнопка виходу (мінімалістична) */}
                    {isAuth && (
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: '5px' }}>
                            <span>{t('loggedIn')}</span>
                            <span 
                                onClick={handleLogout} 
                                style={{ color: '#fff', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '1px' }}
                            >
                                {t('logout')}
                            </span>
                        </div>
                    )}

                    <button className="header-btn" onClick={toggleChat}>{t('contactBtn')}</button>
                </div>
            </header>

            <section className="hero">
                <div className="hero__label">{t('heroLabel')}</div>
                <h1>{t('heroTitle1')}<br /><span>{t('heroTitle2')}</span></h1>
                <p>{t('heroSub')}</p>
                <button className="btn" onClick={() => navigate(isAuth ? '/app' : '/login')}>
                  {isAuth ? t('heroBtnAuth') : t('heroBtnNoAuth')}
                </button>
            </section>

            <div className="container">
                <h2 className="section-title"><span>{t('aboutLabel')}</span>{t('aboutTitle')}</h2>
                <div className="about-grid">
                    <div className="about-card">
                        <h3>{t('about1Title')}</h3>
                        <p>{t('about1Text')}</p>
                    </div>
                    <div className="about-card">
                        <h3>{t('about2Title')}</h3>
                        <p>{t('about2Text')}</p>
                    </div>
                    <div className="about-card">
                        <h3>{t('about3Title')}</h3>
                        <p>{t('about3Text')}</p>
                    </div>
                </div>
            </div>

            <div className="container" style={{ paddingTop: 0 }}>
                <h2 className="section-title"><span>{t('priceLabel')}</span>{t('priceTitle')}</h2>
                <div className="pricing-grid">
                    {/* 1 */}
                    <div className="price-card">
                        <div>
                            <span className="badge" style={{ background: '#EBF3FF', color: '#062440' }}>{t('price1Badge')}</span>
                            <h3>{t('price1Title')}</h3>
                            <p style={{ color: '#666', fontSize: '0.95rem' }}>{t('price1Sub')}</p>
                            <ul>
                                <li>✔ <b>{t('price1Li1')}</b> {t('price1Li1_2')}</li>
                                <li>✔ {t('price1Li2')}</li>
                                <li>✔ {t('price1Li3')}</li>
                            </ul>
                        </div>
                        <div>
                            <div className="price">35€ <span>{t('priceMonth')}</span></div>
                            <button className="btn" style={{ width: '100%', textAlign: 'center', backgroundColor: '#062440' }} onClick={() => navigate(isAuth ? '/app' : '/login')}>
                                {isAuth ? t('priceBtn1Auth') : t('priceBtn1NoAuth')}
                            </button>
                        </div>
                    </div>

                    {/* 2 */}
                    <div className="price-card">
                        <div>
                            <span className="badge">{t('price2Badge')}</span>
                            <h3>{t('price2Title')}</h3>
                            <p style={{ color: '#666', fontSize: '0.95rem' }}>{t('price2Sub')}</p>
                            <ul>
                                <li>✔ <b>{t('price2Li1')}</b> {t('price2Li1_2')}</li>
                                <li>✔ {t('price2Li2')}</li>
                                <li>✔ {t('price2Li3')}</li>
                            </ul>
                        </div>
                        <div>
                            <div className="price">85€ <span>{t('priceMonth')}</span></div>
                            <button className="btn" style={{ width: '100%', textAlign: 'center' }} onClick={toggleChat}>{t('priceTryBtn')}</button>
                        </div>
                    </div>

                    {/* 3 */}
                    <div className="price-card highlight">
                        <div>
                            <span className="badge" style={{ background: '#062440', color: '#fff' }}>{t('price3Badge')}</span>
                            <h3>{t('price3Title')}</h3>
                            <p style={{ color: '#666', fontSize: '0.95rem' }}>{t('price3Sub')}</p>
                            <ul>
                                <li>✔ <b>{t('price3Li1')}</b> {t('price3Li1_2')}</li>
                                <li>✔ {t('price3Li2')}</li>
                                <li>✔ {t('price3Li3')}</li>
                            </ul>
                        </div>
                        <div>
                            <div className="price">85€ <span>{t('priceMonth')}</span></div>
                            <button className="btn" style={{ width: '100%', textAlign: 'center' }} onClick={toggleChat}>{t('priceTryBtn')}</button>
                        </div>
                    </div>

                    {/* 4 */}
                    <div className="price-card">
                        <div>
                            <span className="badge">{t('price4Badge')}</span>
                            <h3>{t('price4Title')}</h3>
                            <p style={{ color: '#666', fontSize: '0.95rem' }}>{t('price4Sub')}</p>
                            <ul>
                                <li>✔ <b>{t('price4Li1')}</b></li>
                                <li>✔ {t('price4Li2')}</li>
                                <li>✔ {t('price4Li3')}</li>
                            </ul>
                        </div>
                        <div>
                            <div className="price">175€ <span>{t('priceMonth')}</span></div>
                            <button className="btn" style={{ width: '100%', textAlign: 'center' }} onClick={toggleChat}>{t('priceTryBtn')}</button>
                        </div>
                    </div>
                </div>

                <div className="extra-box">
                    <div>
                        <h4 style={{ fontSize: '1.3rem', marginBottom: '15px', fontWeight: 800, color: '#062440' }}>{t('extraTitle1')}</h4>
                        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                            <li style={{ marginBottom: '10px', fontSize: '0.95rem' }}>{t('extraLi1')}</li>
                            <li style={{ marginBottom: '10px', fontSize: '0.95rem' }}>{t('extraLi2')}</li>
                            <li style={{ marginBottom: '10px', fontSize: '0.95rem' }}>{t('extraLi3')}</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.3rem', marginBottom: '15px', fontWeight: 800, color: '#062440' }}>{t('extraTitle2')}</h4>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{t('extraText')}</p>
                    </div>
                </div>
            </div>

            <div className="floating-buttons">
                <a href="https://t.me/xackademia" target="_blank" rel="noreferrer" className="float-btn" title="Telegram">
                    <svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg>
                </a>
                <button className="float-btn" onClick={toggleChat}>
                    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" /></svg>
                </button>
            </div>

            <div className={`chat-modal ${isChatOpen ? 'active' : ''}`}>
                <div className="chat-header">
                    <div className="chat-header-info">
                        <div className="chat-avatar">H</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('chatAssistant')}</div>
                            <div style={{ fontSize: '0.75rem', color: '#FF4B2B' }}>{t('chatOnline')}</div>
                        </div>
                    </div>
                    <button onClick={toggleChat} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
                </div>
                <div className="chat-body">
                    <div className="chat-message">{t('chatGreeting')}</div>
                </div>
                <div className="chat-footer">
                    <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder={t('chatPlaceholder')} onKeyDown={e => e.key === 'Enter' && sendLead()} />
                    <button onClick={sendLead}>➤</button>
                </div>
            </div>

            <footer>
                <h3>HACKADEMIA</h3>
                <p>{t('footerDesc')}</p>
                <p style={{ marginTop: '40px', fontSize: '0.85rem', color: '#789' }}>{t('footerRights')}</p>
            </footer>
        {/* ПЛАВАЮЧИЙ ЧАТ ПІДТРИМКИ */}
      <SupportChat />
    </div>
  );
}