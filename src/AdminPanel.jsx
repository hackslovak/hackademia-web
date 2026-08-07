import React, { useState, useEffect } from 'react';
// УВАГА: Перевір, чи правильний тут шлях до твого файлу налаштувань Supabase
import { supabase } from './supabaseClient'; 

const AdminPanel = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Функція для завантаження списку заявок
  const fetchPendingUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('access_status', 'pending');
      
    if (!error && data) {
      setPendingUsers(data);
    }
    setLoading(false);
  };

  // Завантажуємо дані при відкритті сторінки
  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // Універсальна функція для обробки кнопок "Схвалити" та "Відхилити"
  const handleDecision = async (telegramId, status) => {
    setActionLoading(true);
    try {
      // 1. Оновлюємо статус користувача в базі даних
      const { error: dbError } = await supabase
        .from('users')
        .update({ access_status: status })
        .eq('telegram_id', telegramId);

      if (dbError) throw new Error("Помилка оновлення бази даних");

      // 2. Викликаємо нашу безпечну Edge Function для відправки повідомлення в Telegram
      const { data, error: funcError } = await supabase.functions.invoke('telegram-notify', {
        body: { telegram_id: telegramId, status: status }
      });

      if (funcError) throw new Error("Помилка зв'язку з Telegram-ботом");

      // 3. Оновлюємо інтерфейс (прибираємо опрацьованого учня зі списку)
      setPendingUsers(pendingUsers.filter(user => user.telegram_id !== telegramId));
      
      // Показуємо успішне повідомлення
      alert(status === 'approved' ? `✅ Доступ надано для ID: ${telegramId}` : `❌ Заявку відхилено!`);
      
    } catch (err) {
      alert(`⚠️ Сталася помилка: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        🔔 Нові заявки на доступ ({pendingUsers.length})
      </h2>
      
      {loading ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Завантаження заявок...</p>
      ) : pendingUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '8px' }}>
          <p style={{ fontSize: '18px', color: '#888' }}>Нових заявок немає.</p>
          <p style={{ color: '#aaa' }}>Ви все розібрали! 🎉</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          {pendingUsers.map((user) => (
            <div key={user.telegram_id} style={{
              border: '1px solid #e0e0e0', padding: '15px', borderRadius: '12px', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)', background: 'white'
            }}>
              <div>
                <strong style={{ fontSize: '18px', display: 'block', marginBottom: '4px' }}>
                  {user.first_name || 'Без імені'}
                </strong>
                <span style={{ fontSize: '13px', color: '#888', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>
                  ID: {user.telegram_id}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleDecision(user.telegram_id, 'approved')}
                  disabled={actionLoading}
                  style={{ 
                    background: '#00C853', color: 'white', border: 'none', 
                    padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold',
                    cursor: actionLoading ? 'wait' : 'pointer', opacity: actionLoading ? 0.7 : 1
                  }}>
                  ✅ Схвалити
                </button>
                <button 
                  onClick={() => handleDecision(user.telegram_id, 'rejected')}
                  disabled={actionLoading}
                  style={{ 
                    background: '#F44336', color: 'white', border: 'none', 
                    padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold',
                    cursor: actionLoading ? 'wait' : 'pointer', opacity: actionLoading ? 0.7 : 1
                  }}>
                  ❌ Відхилити
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;