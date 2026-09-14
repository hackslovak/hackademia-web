import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { translations } from './i18n';
import './Landing.css';
import SupportChat from './SupportChat'; 

export default function Landing() {
    const navigate = useNavigate();
    
    const [lang, setLang] = useState(() => localStorage.getItem('hack_lang') || 'uk');
    const changeLang = (newLang) => {
        setLang(newLang);
        localStorage.setItem('hack_lang', newLang);
    };
    const t = (key) => translations[lang]?.[key] || translations['uk'][key] || key;

    const [themeMode, setThemeMode] = useState(() => {
        const saved = localStorage.getItem('hack_theme_mode');
        if (saved) return saved;
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

    // ОНОВЛЕНІ ПАЛІТРИ З ІДЕАЛЬНИМ КОНТРАСТОМ
    const themes = {
        light: {
            bg: '#F8FAFC', cardBg: '#FFFFFF', text: '#0F172A', textSecondary: '#475569',
            inputBorder: '#E2E8F0', inactiveText: 'rgba(15, 23, 42, 0.4)',
            highlightBg: '#0F172A', highlightText: '#FFFFFF', accent: '#FF7B54',
            heroBg: '#062440', heroText: '#FFFFFF', heroInactive: 'rgba(255,255,255,0.7)'
        },
        dark: {
            bg: '#0F172A', cardBg: '#1E293B', text: '#F8FAFC', textSecondary: '#94A3B8',
            inputBorder: '#334155', inactiveText: 'rgba(248, 250, 252, 0.4)',
            highlightBg: '#E0A345', highlightText: '#0F172A', accent: '#FF7B54',
            heroBg: '#080C16', heroText: '#F8FAFC', heroInactive: 'rgba(248, 250, 252, 0.7)'
        },
        warm: {
            bg: '#FDF6E3', cardBg: '#FFFBF5', text: '#4A3B32', textSecondary: '#857163',
            inputBorder: '#E6D5C3', inactiveText: 'rgba(74, 59, 50, 0.4)',
            highlightBg: '#D4A373', highlightText: '#FFFFFF', 
            accent: '#FF7B54', // Яскравий помаранчевий, щоб гармоніював з кнопкою
            // Контрастний верх: колір "гіркого шоколаду / еспресо"
            heroBg: '#23150E', heroText: '#FFFBF5', heroInactive: 'rgba(255, 251, 245, 0.75)'
        }
    };
    const theme = themes[themeMode];

    const isAuth = localStorage.getItem('hack_auth_cache') === 'approved';
    
    const handleLogout = async () => {
        if (window.confirm(t('logout') + "?")) {
            await supabase.auth.signOut();
            localStorage.removeItem('hack_auth_cache');
            window.location.reload(); 
        }
    };

    const openSupportWidget = () => window.dispatchEvent(new CustomEvent('openSupportChat'));

    return (
        <div className="landing-body" style={{ backgroundColor: theme.bg, color: theme.text, transition: 'background-color 0.3s ease, color 0.3s ease' }}>
            <style>{`
                .landing-body { overflow-x: hidden; }
                
                /* ========================================= */
                /* ШАПКА ТА ГОЛОВНИЙ ЕКРАН (ТЕМНИЙ ФОН)      */
                /* ========================================= */
                .landing-body header { 
                    background-color: ${theme.heroBg} !important; 
                    border-bottom: 1px solid rgba(255,255,255,0.05); 
                    box-shadow: 0 4px 30px rgba(0,0,0,0.15);
                    position: sticky; 
                    top: 0; 
                    z-index: 1000;
                    padding: 15px 40px !important;
                    transition: background-color 0.3s ease;
                }
                .landing-body .hero { background-color: ${theme.heroBg} !important; transition: background-color 0.3s ease; }
                
                header .logo, header .logo span { color: ${theme.heroText} !important; text-decoration: none; }
                header .logo span span { color: ${theme.accent} !important; }
                header .logo .collab-text { 
                    display: block;
                    font-size: 13px !important; /* Зробили трохи більшим (було 11px) */
                    color: ${theme.heroText} !important; /* Тепер колір ідентичний до слова HACK */
                    letter-spacing: 1.5px !important; 
                    margin-top: 2px !important; 
                    font-weight: 800 !important;
                }
				
                .hero h1 { font-size: clamp(32px, 8vw, 64px) !important; line-height: 1.15 !important; color: ${theme.heroText} !important; }
                .hero p { color: ${theme.heroInactive} !important; }
                .hero__label { color: ${theme.accent} !important; }
                
                /* ========================================= */
                /* ВСЕ ІНШЕ (СВІТЛЕ/ТЕМНЕ/ЗАТИШНЕ)           */
                /* ========================================= */
                .landing-body footer { background-color: ${theme.cardBg}; border-top: 1px solid ${theme.inputBorder}; }
                
                .section-title, .about-card h3, .price-card h3, .extra-box h4, .price, footer h3 { color: ${theme.text} !important; }
                .about-card p, .price-card ul li, .extra-box li, .extra-box p, .price span, footer p { color: ${theme.textSecondary} !important; }
                
                .section-title span { color: ${theme.accent} !important; }
                
                .about-card, .price-card, .extra-box { 
                    background-color: ${theme.cardBg} !important; 
                    border: 1px solid ${theme.inputBorder} !important; 
                    box-shadow: 0 4px 15px rgba(0,0,0,0.03); 
                }
                
                .price-card ul li b { color: ${theme.text} !important; font-weight: 900; }
                .price-card.highlight { border-color: ${theme.accent} !important; box-shadow: 0 15px 35px ${theme.accent}33; }

                @keyframes pulseCTA {
                    0% { transform: scale(1); box-shadow: 0 15px 35px rgba(255,123,84,0.4); }
                    50% { transform: scale(1.03); box-shadow: 0 20px 45px rgba(255,123,84,0.7); }
                    100% { transform: scale(1); box-shadow: 0 15px 35px rgba(255,123,84,0.4); }
                }

                @media (max-width: 768px) {
                    .landing-body { padding: 0 10px; }
                    .landing-body header { padding: 15px 20px !important; flex-wrap: wrap; gap: 15px;}
                    .hero { padding: 40px 15px !important; }
                    .container { padding: 30px 15px !important; }
                    .about-grid, .pricing-grid { grid-template-columns: 1fr !important; }
                    .extra-box { grid-template-columns: 1fr !important; padding: 20px !important; }
                }
            `}</style>

            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <a href="#" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 'bold', fontSize: '20px' }}>
                    <img src="/logo-main.svg" alt="Hackademia Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ lineHeight: '1' }}>HACK<span>ADEMIA</span></span>
                        <span className="collab-text">+ slovo.sk</span>
                    </div>
                </a>

                <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginLeft: 'auto' }}>
                    
                    <button 
                        onClick={toggleTheme} 
                        style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', transition: '0.2s', padding: 0 }} 
                        className="hover-card"
                    >
                        {themeMode === 'light' ? '☀️' : themeMode === 'dark' ? '🌙' : '☕'}
                    </button>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {['uk', 'sk', 'en', 'ru'].map(l => (
                            <span 
                                key={l} 
                                onClick={() => changeLang(l)} 
                                style={{ 
                                    cursor: 'pointer', 
                                    color: lang === l ? theme.accent : theme.heroInactive, 
                                    fontSize: '13px', 
                                    fontWeight: lang === l ? '900' : 'bold',
                                    transition: 'color 0.2s'
                                }}
                            >
                                {l.toUpperCase()}
                            </span>
                        ))}
                    </div>

                    {isAuth && (
                        <div style={{ fontSize: '12px', color: theme.heroInactive, display: 'flex', gap: '5px', fontWeight: 'bold' }}>
                            <span>{t('loggedIn')}</span>
                            <span 
                                onClick={handleLogout} 
                                style={{ color: theme.heroText, cursor: 'pointer', borderBottom: `1px solid ${theme.heroInactive}`, paddingBottom: '1px' }}
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
                            <span className="badge" style={{ background: `${theme.accent}22`, color: theme.accent }}>{t('price2Badge')}</span>
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
                            <span className="badge" style={{ background: `${theme.accent}22`, color: theme.accent }}>{t('price4Badge')}</span>
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
                        <h4>{t('extraTitle1')}</h4>
                        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                            <li style={{ marginBottom: '10px', fontSize: '0.95rem' }}>{t('extraLi1')}</li>
                            <li style={{ marginBottom: '10px', fontSize: '0.95rem' }}>{t('extraLi2')}</li>
                            <li style={{ marginBottom: '10px', fontSize: '0.95rem' }}>{t('extraLi3')}</li>
                        </ul>
                    </div>
                    <div>
                        <h4>{t('extraTitle2')}</h4>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{t('extraText')}</p>
                    </div>
                </div>
            </div>

            <footer>
                <h3>HACKADEMIA</h3>
                <p>{t('footerDesc')}</p>
                <p style={{ marginTop: '40px', fontSize: '0.85rem', opacity: 0.6 }}>{t('footerRights')}</p>
            </footer>
            
      <SupportChat />
    </div>
  );
}