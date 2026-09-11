import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { translations } from './i18n';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Підтягуємо мову, яку користувач вибрав на лендінгу
  const lang = localStorage.getItem('hack_lang') || 'uk';
  const t = (key) => translations[lang]?.[key] || translations['uk'][key] || key;

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (isRegister) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert("❌ " + error.message);
      else {
         alert("✅ Успішно! Тепер можете увійти.");
         setIsRegister(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("❌ " + error.message);
      else navigate('/app');
    }
    setLoading(false);
  };

  // --- НОВА ФУНКЦІЯ ВХОДУ ЧЕРЕЗ GOOGLE ---
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/app' 
      }
    });

    if (error) {
      alert("Помилка входу через Google: " + error.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F7F6', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', overflow: 'hidden', textAlign: 'center', paddingBottom: '30px' }}>
        
        {/* Оранжева шапка замість зеленої */}
        <div style={{ height: '8px', background: 'linear-gradient(135deg, #FF7B54 0%, #FFB26B 100%)', width: '100%' }}></div>
        
        <div style={{ padding: '40px 30px 10px 30px' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '28px', color: '#1A202C', fontWeight: '900' }}>
            {isRegister ? t('regTitle') : t('loginTitle')}
          </h2>
          <p style={{ color: '#718096', fontSize: '14px', margin: '0 0 30px 0' }}>
            {isRegister ? t('regSub') : t('loginSub')}
          </p>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4A5568', marginBottom: '8px' }}>{t('emailLabel')}</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#EDF2F7', color: '#2D3748', fontSize: '15px', boxSizing: 'border-box' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4A5568', marginBottom: '8px' }}>{t('passwordLabel')}</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#EDF2F7', color: '#2D3748', fontSize: '15px', boxSizing: 'border-box' }} 
              />
            </div>
            
            <button 
                type="submit" 
                disabled={loading} 
                style={{ 
                    background: 'linear-gradient(135deg, #FF7B54 0%, #FFB26B 100%)', 
                    color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', 
                    fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer', 
                    marginTop: '10px', boxShadow: '0 4px 15px rgba(255,123,84,0.3)', transition: '0.2s' 
                }}
            >
              {loading ? '...' : (isRegister ? t('regBtn') : t('loginBtn'))}
            </button>
          </form>

          <div style={{ marginTop: '25px', fontSize: '14px', color: '#718096' }}>
            {isRegister ? t('hasAccount') : t('noAccount')}{' '}
            <span onClick={() => setIsRegister(!isRegister)} style={{ color: '#E0A345', fontWeight: 'bold', cursor: 'pointer' }}>
              {isRegister ? t('loginLink') : t('registerLink')}
            </span>
          </div>

          <div style={{ margin: '30px 0', borderTop: '1px solid #E2E8F0', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 15px', fontSize: '12px', color: '#A0AEC0' }}>
              {t('quickLogin')}
            </span>
          </div>

          {/* --- НОВА КНОПКА GOOGLE --- */}
          <button 
            type="button" 
            onClick={handleGoogleLogin}
            className="hover-card"
            style={{ 
              width: '100%', 
              background: '#ffffff', 
              color: '#2D3748', 
              border: '1px solid #E2E8F0', 
              padding: '14px', 
              borderRadius: '12px', 
              fontWeight: 'bold', 
              fontSize: '15px',
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              marginBottom: '15px'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {t('continueWithGoogle')}
          </button>

          {/* ІСНУЮЧА КНОПКА TELEGRAM */}
          <a href="https://t.me/hackademiapp_bot" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%', background: '#2B6CB0', color: '#fff', padding: '14px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', boxSizing: 'border-box', marginBottom: '25px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            {t('openBotBtn')}
          </a>

          <span onClick={() => navigate('/')} style={{ color: '#A0AEC0', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
            &lt; {t('backToHome')}
          </span>
        </div>
      </div>
    </div>
  );
}