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
              {t('orTelegram')}
            </span>
          </div>

          <a href="https://t.me/hackademiapp_bot" target="_blank" rel="noreferrer" style={{ display: 'inline-block', width: '100%', background: '#2B6CB0', color: '#fff', padding: '14px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', boxSizing: 'border-box', marginBottom: '20px' }}>
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