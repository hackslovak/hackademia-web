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

    // --- ЛОГІКА ТЕМИ (Синхронізована з App.jsx) ---
    const [themeMode, setThemeMode] = useState(() => {
        const saved = localStorage.getItem('hack_theme_mode');
        if (saved) return saved;
        // Автоматичний нічний режим з 18:00 до 06:00
        const hour = new Date().getHours();
        return (hour < 6 || hour >= 18) ? 'dark' : 'light';
    });

    const toggleTheme = () => {
        const modes = ['light', 'dark', 'warm'];
        const nextMode = modes[(modes.indexOf(themeMode) + 1) % 3];
        setThemeMode(nextMode);
        localStorage.setItem('hack_theme_mode', nextMode);
        if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    };

    const themes = {
        light: {
            bg: '#f0f4f8', cardBg: 'white', text: '#1a202c', textSecondary: '#4a5568',
            inputBorder: '#e2e8f0', inactiveText: 'rgba(0,0,0,0.4)',
            highlightBg: '#062440', highlightText: '#fff'
        },
        dark: {
            bg: '#1a202c', cardBg: '#2d3748', text: '#f7fafc', textSecondary: '#a0aec0',
            inputBorder: '#4a5568', inactiveText: 'rgba(255,255,255,0.4)',
            highlightBg: '#E0A345', highlightText: '#1a202c'
        },
        warm: {
            bg: '#FFF8F0', cardBg: '#FFE8D6', text: '#5C4033', textSecondary: '#8B7D6B',
            inputBorder: '#E0A345', inactiveText: 'rgba(92, 64, 51, 0.4)',
            highlightBg: '#E29578', highlightText: '#fff'
        }
    };
    const theme = themes[themeMode];

    // --- ЛОГІКА АВТОРИЗАЦІЇ ---
    const isAuth = localStorage.getItem('hack_auth_cache') === 'approved';
    
    const handleLogout = async () => {
        if (window.confirm(t('logout') + "?")) {
            await supabase.auth.signOut();
            localStorage.removeItem('hack_auth_cache');
            window.location.reload(); 
        }
    };

    // Виклик глобальної події для відкриття нового чату підтримки
    const openSupportWidget = () => window.dispatchEvent(new CustomEvent('openSupportChat'));

    return (
        <div className="landing-body" style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', transition: 'all 0.3s ease' }}>
            <style>{`
                .landing-body { overflow-x: hidden; }
                
                /* ЖОРСТКЕ ПЕРЕВИЗНАЧЕННЯ КОЛЬОРІВ ТЕКСТУ */
                .hero h1 { font-size: clamp(32px, 8vw, 64px) !important; line-height: 1.15 !important; color: ${theme.text} !important; }
                .hero p, .hero__label { color: ${theme.textSecondary} !important; }
                .section-title { font-size: clamp(22px, 5vw, 36px) !important; word-break: break-word; color: ${theme.text} !important; }
                .section-title span { color: #E0A345 !important; }
                
                /* Адаптація карток до теми */
                .about-card, .price-card { background: ${theme.cardBg} !important; border: 1px solid ${theme.inputBorder} !important; box-shadow: 0 4px 15px rgba(0,0,0,0.03); transition: all 0.3s; }
                .about-card h3, .price-card h3 { color: ${theme.text} !important; }
                .about-card p, .price-card p { color: ${theme.textSecondary} !important; }
                .price-card ul li { color: ${theme.text} !important; }
                .price-card .price { color: ${theme.text} !important; }
                .price-card .price span { color: ${theme.textSecondary} !important; }
                
                .extra-box { background: ${theme.cardBg} !important; border: 1px solid ${theme.inputBorder} !important; }
                .extra-box h4 { color: ${theme.text} !important; }
                .extra-box li, .extra-box p { color: ${theme.textSecondary} !important; }
                
                header .logo { color: ${theme.text} !important; text-decoration: none; }
                header .logo span { color: ${theme.text} !important; }
                header .logo span span { color: #E0A345 !important; }
                
                footer h3, footer p { color: ${theme.textSecondary} !important; }

                /* НОВА АНІМАЦІЯ ДЛЯ КНОПКИ */
                @keyframes pulseCTA {
                    0% { transform: scale(1); box-shadow: 0 15px 35px rgba(255,123,84,0.4); }
                    50% { transform: scale(1.03); box-shadow: 0 20px 45px rgba(255,123,84,0.7); }
                    100% { transform: scale(1); box-shadow: 0 15px 35px rgba(255,123,84,0.4); }
                }

                @media (max-width: 768px) {
                    .landing-body { padding: 0 10px; }
                    header { padding: 15px 20px !important; flex-wrap: wrap; gap: 15px;}
                    .hero { padding: 40px 15px !important; }
                    .container { padding: 30px 15px !important; }
                    .about-grid, .pricing-grid { grid-template-columns: 1fr !important; }
                    .extra-box { grid-template-columns: 1fr !important; padding: 20px !important; }
                }
            `}</style>

            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <a href="#" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '20px' }}>
                    <img src="/logo-main.svg" alt="Hackademia Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                    <span>HACK<span>ADEMIA</span></span>
                </a>

                <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginLeft: 'auto' }}>
                    
                    {/* Перемикач тем */}
                    <button 
                        onClick={toggleTheme} 
                        style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', transition: '0.2s', padding: 0 }} 
                        className="hover-card"
                    >
                        {themeMode === 'light' ? '☀️' : themeMode === 'dark' ? '🌙' : '☕'}
                    </button>

                    {/* Перемикач мов */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {['uk', 'sk', 'en', 'ru'].map(l => (
                            <span 
                                key={l} 
                                onClick={() => changeLang(l)} 
                                style={{ 
                                    cursor: 'pointer', 
                                    color: lang === l ? '#E0A345' : theme.inactiveText, 
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
                        <div style={{ fontSize: '12px', color: theme.inactiveText, display: 'flex', gap: '5px' }}>
                            <span>{t('loggedIn')}</span>
                            <span 
                                onClick={handleLogout} 
                                style={{ color: theme.text, cursor: 'pointer', borderBottom: `1px solid ${theme.inactiveText}`, paddingBottom: '1px' }}
                            >
                                {t('logout')}
                            </span>
                        </div>
                    )}

                    <button className="header-btn" onClick={openSupportWidget}>{t('contactBtn')}</button>
                </div>
            </header>

            <section className="hero">
                <div className="hero__label">{t('heroLabel')}</div>
                <h1>{t('heroTitle1')}<br /><span>{t('heroTitle2')}</span></h1>
                <p>{t('heroSub')}</p>
                
                <button 
                  className="hover-card" 
                  onClick={() => navigate(isAuth ? '/app' : '/login')}
                  style={{ 
                    background: 'linear-gradient(135deg, #FF7B54 0%, #FFB26B 100%)', 
                    color: '#fff', 
                    padding: '18px 45px', 
                    borderRadius: '30px', 
                    border: 'none', 
                    fontWeight: '900', 
                    fontSize: '22px', 
                    cursor: 'pointer', 
                    boxShadow: '0 15px 35px rgba(255,123,84,0.4)',
                    animation: 'pulseCTA 2s infinite',
                    transition: '0.3s ease'
                  }}
                >
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
                            <span className="badge" style={{ background: theme.highlightBg, color: theme.highlightText }}>{t('price1Badge')}</span>
                            <h3>{t('price1Title')}</h3>
                            <p style={{ fontSize: '0.95rem' }}>{t('price1Sub')}</p>
                            <ul>
                                <li>✔ <b>{t('price1Li1')}</b> {t('price1Li1_2')}</li>
                                <li>✔ {t('price1Li2')}</li>
                                <li>✔ {t('price1Li3')}</li>
                            </ul>
                        </div>
                        <div>
                            <div className="price">35€ <span>{t('priceMonth')}</span></div>
                            <button className="btn" style={{ width: '100%', textAlign: 'center', backgroundColor: theme.highlightBg, color: theme.highlightText, border: 'none' }} onClick={() => navigate(isAuth ? '/app' : '/login')}>
                                {isAuth ? t('priceBtn1Auth') : t('priceBtn1NoAuth')}
                            </button>
                        </div>
                    </div>

                    {/* 2 */}
                    <div className="price-card">
                        <div>
                            <span className="badge">{t('price2Badge')}</span>
                            <h3>{t('price2Title')}</h3>
                            <p style={{ fontSize: '0.95rem' }}>{t('price2Sub')}</p>
                            <ul>
                                <li>✔ <b>{t('price2Li1')}</b> {t('price2Li1_2')}</li>
                                <li>✔ {t('price2Li2')}</li>
                                <li>✔ {t('price2Li3')}</li>
                            </ul>
                        </div>
                        <div>
                            <div className="price">85€ <span>{t('priceMonth')}</span></div>
                            <button className="btn" style={{ width: '100%', textAlign: 'center' }} onClick={openSupportWidget}>{t('priceTryBtn')}</button>
                        </div>
                    </div>

                    {/* 3 */}
                    <div className="price-card highlight">
                        <div>
                            <span className="badge" style={{ background: theme.highlightBg, color: theme.highlightText }}>{t('price3Badge')}</span>
                            <h3>{t('price3Title')}</h3>
                            <p style={{ fontSize: '0.95rem' }}>{t('price3Sub')}</p>
                            <ul>
                                <li>✔ <b>{t('price3Li1')}</b> {t('price3Li1_2')}</li>
                                <li>✔ {t('price3Li2')}</li>
                                <li>✔ {t('price3Li3')}</li>
                            </ul>
                        </div>
                        <div>
                            <div className="price">85€ <span>{t('priceMonth')}</span></div>
                            <button className="btn" style={{ width: '100%', textAlign: 'center' }} onClick={openSupportWidget}>{t('priceTryBtn')}</button>
                        </div>
                    </div>

                    {/* 4 */}
                    <div className="price-card">
                        <div>
                            <span className="badge">{t('price4Badge')}</span>
                            <h3>{t('price4Title')}</h3>
                            <p style={{ fontSize: '0.95rem' }}>{t('price4Sub')}</p>
                            <ul>
                                <li>✔ <b>{t('price4Li1')}</b></li>
                                <li>✔ {t('price4Li2')}</li>
                                <li>✔ {t('price4Li3')}</li>
                            </ul>
                        </div>
                        <div>
                            <div className="price">175€ <span>{t('priceMonth')}</span></div>
                            <button className="btn" style={{ width: '100%', textAlign: 'center' }} onClick={openSupportWidget}>{t('priceTryBtn')}</button>
                        </div>
                    </div>
                </div>

                <div className="extra-box">
                    <div>
                        <h4 style={{ fontSize: '1.3rem', marginBottom: '15px', fontWeight: 800 }}>{t('extraTitle1')}</h4>
                        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                            <li style={{ marginBottom: '10px', fontSize: '0.95rem' }}>{t('extraLi1')}</li>
                            <li style={{ marginBottom: '10px', fontSize: '0.95rem' }}>{t('extraLi2')}</li>
                            <li style={{ marginBottom: '10px', fontSize: '0.95rem' }}>{t('extraLi3')}</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.3rem', marginBottom: '15px', fontWeight: 800 }}>{t('extraTitle2')}</h4>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{t('extraText')}</p>
                    </div>
                </div>
            </div>

            <footer>
                <h3>HACKADEMIA</h3>
                <p>{t('footerDesc')}</p>
                <p style={{ marginTop: '40px', fontSize: '0.85rem' }}>{t('footerRights')}</p>
            </footer>
            
        {/* ПЛАВАЮЧИЙ ЧАТ ПІДТРИМКИ */}
      <SupportChat />
    </div>
  );
}