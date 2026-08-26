import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Реєстрація нового користувача
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("🎉 Реєстрація успішна! Тепер ви можете увійти.");
        setIsSignUp(false); // Перемикаємо на форму входу
        setPassword('');
      } else {
        // Вхід існуючого користувача
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Якщо успішно, перекидаємо на навчальну платформу
        navigate('/app');
      }
    } catch (err) {
      setError(err.message === "Invalid login credentials" ? "Неправильний email або пароль." : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAF9', fontFamily: "'Montserrat', sans-serif", padding: '20px' }}>
      
      <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', borderTop: '6px solid #38BA9B' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: '#062440', fontSize: '28px', fontWeight: '900', marginBottom: '10px' }}>
            {isSignUp ? 'Створення акаунту' : 'Вхід на платформу'}
          </h2>
          <p style={{ color: '#7F8C8D', fontSize: '14px' }}>
            {isSignUp ? 'Приєднуйся до Hackademia вже зараз!' : 'З поверненням! Раді бачити тебе знову 💛'}
          </p>
        </div>

        {error && (
          <div style={{ background: '#FFF5F5', color: '#E53E3E', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', fontWeight: 'bold' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#2C3E50', marginBottom: '5px' }}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="twój.email@gmail.com" 
              required
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F0F4F8', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#2C3E50', marginBottom: '5px' }}>Пароль</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Мінімум 6 символів" 
              required
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F0F4F8', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', background: '#38BA9B', color: '#fff', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px', transition: '0.3s', boxShadow: '0 4px 15px rgba(56,186,155,0.3)' }}
          >
            {loading ? 'Зачекайте...' : (isSignUp ? 'Зареєструватися' : 'Увійти')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '14px', color: '#7F8C8D' }}>
          {isSignUp ? 'Вже маєте акаунт? ' : 'Ще немає акаунту? '}
          <span 
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }} 
            style={{ color: '#38BA9B', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isSignUp ? 'Увійти' : 'Зареєструватися'}
          </span>
        </div>

        <div style={{ marginTop: '30px', borderTop: '1px solid #E2E8F0', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#A0AEC0', marginBottom: '10px' }}>Або увійдіть через Telegram (Mini App)</p>
          <a href="https://t.me/hackademiapp_bot" target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#EBF3FF', color: '#3182ce', padding: '10px 20px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>
            Відкрити бота 🚀
          </a>
        </div>
        
        {/* Кнопка повернення на головну */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
             <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: '#A0AEC0', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                 ← Повернутися на головну
             </button>
        </div>

      </div>
    </div>
  );
}