import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css'; // Сюди потрібно буде винести CSS, який був у <style> тегу

export default function Landing() {
    const navigate = useNavigate();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');

    const toggleChat = () => setIsChatOpen(!isChatOpen);

    const sendLead = () => {
        if (!chatInput.trim()) {
            alert('Введіть текст повідомлення!');
            return;
        }
        const encodedText = encodeURIComponent("Лід з сайту (Закритий доступ / Навчання): " + chatInput.trim());
        window.open(`https://t.me/xackademia?text=${encodedText}`, '_blank');
        setChatInput('');
        toggleChat();
    };

    return (
        <div className="landing-body">
            <header>
                <a href="#" className="logo">
                    <svg viewBox="0 0 500 500" style={{ width: '45px', height: '45px' }}>
                        <circle cx="250" cy="250" r="215" fill="#38BA9B" opacity="0.25" stroke="#062440" strokeWidth="6" />
                        <path d="M 155,45 A 205,205 0 0,1 345,45" fill="none" stroke="#38BA9B" strokeWidth="18" strokeLinecap="round" />
                        <path d="M 45,230 A 205,205 0 0,1 70,150" fill="none" stroke="#062440" strokeWidth="16" strokeLinecap="round" />
                        <path d="M 455,230 A 205,205 0 0,1 430,310" fill="none" stroke="#062440" strokeWidth="16" strokeLinecap="round" />
                        <polygon points="250,95 380,130 250,165 120,130" fill="#062440" />
                        <rect x="205" y="150" width="90" height="25" fill="#031626" rx="4" />
                        <path d="M 345,138 L 345,190 Q 345,198 353,198 L 353,198" fill="none" stroke="#38BA9B" strokeWidth="4" />
                        <circle cx="353" cy="198" r="4.5" fill="#38BA9B" />
                        <path d="M 170,175 L 135,130 L 210,170 Z" fill="#062440" />
                        <path d="M 330,175 L 365,130 L 290,170 Z" fill="#062440" />
                        <ellipse cx="250" cy="285" rx="115" ry="125" fill="#062440" />
                        <ellipse cx="250" cy="295" rx="90" ry="105" fill="#082d4d" />
                        <ellipse cx="250" cy="310" rx="65" ry="85" fill="#ffffff" />
                        <circle cx="198" cy="230" r="42" fill="#ffffff" stroke="#062440" strokeWidth="4" />
                        <circle cx="302" cy="230" r="42" fill="#ffffff" stroke="#062440" strokeWidth="4" />
                        <circle cx="203" cy="230" r="21" fill="#38BA9B" />
                        <circle cx="297" cy="230" r="21" fill="#38BA9B" />
                        <circle cx="209" cy="225" r="7.5" fill="#ffffff" />
                        <circle cx="303" cy="225" r="7.5" fill="#ffffff" />
                        <polygon points="250,240 238,272 262,272" fill="#38BA9B" />
                        <rect x="115" y="350" width="270" height="24" rx="4" fill="#38BA9B" />
                        <polygon points="115,350 93,362 115,374" fill="#062440" />
                        <rect x="385" y="350" width="18" height="24" rx="2" fill="#062440" />
                        <path d="M 203,350 L 203,366 M 211,350 L 211,366 M 219,350 L 219,366" stroke="#38BA9B" strokeWidth="4.5" strokeLinecap="round" />
                        <path d="M 281,350 L 281,366 M 289,350 L 289,366 M 297,350 L 297,366" stroke="#38BA9B" strokeWidth="4.5" strokeLinecap="round" />
                    </svg>
                    <span>HACK<span>ADEMIA</span></span>
                </a>
                <button className="header-btn" onClick={toggleChat}>Зв'язатися</button>
            </header>

            <section className="hero">
                <div className="hero__label">( Школа онлайн )</div>
                <h1>ВИВЧАЙ СЛОВАЦЬКУ<br /><span>З HACKADEMIA</span></h1>
                <p>Новий, крутий формат навчання у нашій школі. Старт нових груп вже незабаром!</p>
                {/* Перенаправлення на сторінку платформи */}
                <button className="btn" onClick={() => navigate('/app')}>Увійти до платформи</button>
            </section>

            <div className="container">
                <h2 className="section-title"><span>( 01 - Про нас )</span>Сучасна онлайн-школа словацької мови</h2>
                <div className="about-grid">
                    <div className="about-card">
                        <h3>🎓 Вступ до ВНЗ Словаччини</h3>
                        <p>Готуємо до вступу та допомагаємо з повною адаптацією на новому місці.</p>
                    </div>
                    <div className="about-card">
                        <h3>💡 Інноваційний підхід</h3>
                        <p>Інтерактивні матеріали, гейміфікація та максимальна кількість розмовної практики.</p>
                    </div>
                    <div className="about-card">
                        <h3>🤝 Спільнота однодумців</h3>
                        <p>Жодної нудної субординації — лише дружня атмосфера, гумор і постійна підтримка ментора.</p>
                    </div>
                </div>
            </div>

            <div className="container" style={{ paddingTop: 0 }}>
                <h2 className="section-title"><span>( 02 - Формати та ціни )</span>Оберіть зручний формат навчання</h2>
                <div className="pricing-grid">
                    <div className="price-card">
                        <div>
                            <span className="badge" style={{ background: '#EBF3FF', color: '#062440' }}>Самостійно</span>
                            <h3>Закритий доступ</h3>
                            <p style={{ color: '#666', fontSize: '0.95rem' }}>Навчання за матеріалами платформи у власному темпі без викладача.</p>
                            <ul>
                                <li>✔ <b>Повний доступ</b> до всіх курсів і модулів</li>
                                <li>✔ Інтерактивні завдання та тести</li>
                                <li>✔ Навчання у власному темпі</li>
                            </ul>
                        </div>
                        <div>
                            <div className="price">35€ <span>/ місяць</span></div>
                            <button className="btn" style={{ width: '100%', textAlign: 'center', backgroundColor: '#062440' }} onClick={() => navigate('/app')}>Отримати доступ</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="floating-buttons">
                <a href="https://t.me/xackademia" target="_blank" rel="noreferrer" className="float-btn" title="Зв'язатися в Telegram">
                    <svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg>
                </a>
                <button className="float-btn" onClick={toggleChat} title="Написати асистенту">
                    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" /></svg>
                </button>
            </div>

            <div className={`chat-modal ${isChatOpen ? 'active' : ''}`}>
                <div className="chat-header">
                    <div className="chat-header-info">
                        <div className="chat-avatar">H</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Асистент Hackademia</div>
                            <div style={{ fontSize: '0.75rem', color: '#38BA9B' }}>Онлайн</div>
                        </div>
                    </div>
                    <button onClick={toggleChat} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
                </div>
                <div className="chat-body">
                    <div className="chat-message">
                        Вітаю! 👋 Я ваш віртуальний асистент Hackademia. Напишіть своє питання нижче, і воно миттєво полетить до нашого менеджера в Telegram!
                    </div>
                </div>
                <div className="chat-footer">
                    <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ваше повідомлення..." onKeyDown={e => e.key === 'Enter' && sendLead()} />
                    <button onClick={sendLead}>➤</button>
                </div>
            </div>

            <footer>
                <h3>HACKADEMIA</h3>
                <p>Сучасна онлайн-школа словацької мови</p>
                <p style={{ marginTop: '40px', fontSize: '0.85rem', color: '#789' }}>© 2026 Hackademia. Всі права захищено.</p>
            </footer>
        </div>
    );
}