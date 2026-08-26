import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css'; 

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
        const encodedText = encodeURIComponent("Лід з сайту: " + chatInput.trim());
        window.open(`https://t.me/xackademia?text=${encodedText}`, '_blank');
        setChatInput('');
        toggleChat();
    };

    return (
        <div className="landing-body">
            <header>
                <a href="#" className="logo">
                    <img 
                        src="/logo-main.svg" 
                        alt="Hackademia Logo" 
                        style={{ width: '50px', height: '50px', objectFit: 'contain' }} 
                    />
                    <span>HACK<span>ADEMIA</span></span>
                </a>
                <button className="header-btn" onClick={toggleChat}>Зв'язатися</button>
            </header>

            <section className="hero">
                <div className="hero__label">( Школа онлайн )</div>
                <h1>ВИВЧАЙ СЛОВАЦЬКУ<br /><span>З HACKADEMIA</span></h1>
                <p>Новий, крутий формат навчання у нашій школі. Старт нових груп вже незабаром!</p>
                <button className="btn" onClick={() => navigate('/login')}>Увійти до платформи</button>
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
                    {/* 1. Закритий доступ */}
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
                            <button className="btn" style={{ width: '100%', textAlign: 'center', backgroundColor: '#062440' }} onClick={() => navigate('/login')}>Отримати доступ</button>
                        </div>
                    </div>

                    {/* 2. Рівні А1 / А2 */}
                    <div className="price-card">
                        <div>
                            <span className="badge">Група (до 6 осіб)</span>
                            <h3>Рівні А1 / А2</h3>
                            <p style={{ color: '#666', fontSize: '0.95rem' }}>Максимум живої комунікації та гумору у дружній атмосфері.</p>
                            <ul>
                                <li>✔ <b>16 занять</b> (2 місяці)</li>
                                <li>✔ 2 рази на тиждень по 1.5 год</li>
                                <li>✔ Помісячна оплата</li>
                            </ul>
                        </div>
                        <div>
                            <div className="price">85€ <span>/ місяць</span></div>
                            <button className="btn" style={{ width: '100%', textAlign: 'center' }} onClick={toggleChat}>Спробувати безкоштовно</button>
                        </div>
                    </div>

                    {/* 3. Рівень В1 */}
                    <div className="price-card highlight">
                        <div>
                            <span className="badge" style={{ background: '#062440', color: '#fff' }}>Популярний</span>
                            <h3>Рівень В1</h3>
                            <p style={{ color: '#666', fontSize: '0.95rem' }}>Поглиблене вивчення для тих, хто вже має базові знання.</p>
                            <ul>
                                <li>✔ <b>24 заняття</b> (~2.5 місяці)</li>
                                <li>✔ 2 рази на тиждень по 1.5 год</li>
                                <li>✔ Чат із вашим ментором</li>
                            </ul>
                        </div>
                        <div>
                            <div className="price">85€ <span>/ місяць</span></div>
                            <button className="btn" style={{ width: '100%', textAlign: 'center' }} onClick={toggleChat}>Спробувати безкоштовно</button>
                        </div>
                    </div>

                    {/* 4. Індивідуально */}
                    <div className="price-card">
                        <div>
                            <span className="badge">1 особа або пара</span>
                            <h3>Індивідуально</h3>
                            <p style={{ color: '#666', fontSize: '0.95rem' }}>Повна персональна адаптація під ваші особисті цілі та графік.</p>
                            <ul>
                                <li>✔ <b>Власний гнучкий графік</b></li>
                                <li>✔ 100% уваги викладача</li>
                                <li>✔ Записи занять за бажанням</li>
                            </ul>
                        </div>
                        <div>
                            <div className="price">175€ <span>/ місяць</span></div>
                            <button className="btn" style={{ width: '100%', textAlign: 'center' }} onClick={toggleChat}>Спробувати безкоштовно</button>
                        </div>
                    </div>
                </div>

                {/* Додаткові переваги */}
                <div className="extra-box">
                    <div>
                        <h4 style={{ fontSize: '1.3rem', marginBottom: '15px', fontWeight: 800, color: '#062440' }}>✨ Всі формати включають:</h4>
                        <ul style={{ listStyle: 'none' }}>
                            <li style={{ marginBottom: '10px', fontSize: '0.95rem' }}>💬 <b>Постійний чат</b> з особистим ментором</li>
                            <li style={{ marginBottom: '10px', fontSize: '0.95rem' }}>🎥 <b>Відеозаписи всіх занять</b></li>
                            <li style={{ marginBottom: '10px', fontSize: '0.95rem' }}>📚 <b>Авторські капсули</b> та ілюстровані воркбуки</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.3rem', marginBottom: '15px', fontWeight: 800, color: '#062440' }}>🕊️ Як почати навчання?</h4>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>Ви можете записатися на <b>безкоштовне пробне заняття</b> або отримати доступ до платформи матеріалів. Оплату здійснюєте лише тоді, коли переконаєтеся, що вам усе подобається!</p>
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
                            <div style={{ fontSize: '0.75rem', color: '#FF4B2B' }}>Онлайн</div>
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