import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const AdminPanel = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Завантажуємо і нові заявки, і активних учнів
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('access_status', ['pending', 'approved']);
      
    if (!error && data) {
      // Фільтруємо нові заявки
      setPendingUsers(data.filter(user => user.access_status === 'pending'));
      
      // Фільтруємо активних (але ховаємо адмінів, щоб ти випадково не видалив сам себе)
      setApprovedUsers(data.filter(user => user.access_status === 'approved' && user.role !== 'admin'));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Універсальна функція для кнопок "Схвалити", "Відхилити" та "Видалити"
  const handleDecision = async (telegramId, status, isRevoke = false) => {
    if (isRevoke && !window.confirm("⚠️ Точно хочете забрати доступ у цього учня?")) return;

    setActionLoading(true);
    try {
      const { error: dbError } = await supabase
        .from('users')
        .update({ access_status: status })
        .eq('telegram_id', telegramId);

      if (dbError) throw new Error("Помилка оновлення бази даних");

      // Бот надсилає сповіщення учню
      await supabase.functions.invoke('telegram-notify', {
        body: { telegram_id: telegramId, status: status }
      });

      // Оновлюємо списки на екрані без перезавантаження сторінки
      if (status === 'approved') {
        const userToMove = pendingUsers.find(u => u.telegram_id === telegramId);
        setPendingUsers(pendingUsers.filter(user => user.telegram_id !== telegramId));
        if (userToMove) setApprovedUsers([...approvedUsers, { ...userToMove, access_status: 'approved' }]);
        alert(`✅ Доступ надано для ID: ${telegramId}`);
      } else if (status === 'rejected') {
        setPendingUsers(pendingUsers.filter(user => user.telegram_id !== telegramId));
        setApprovedUsers(approvedUsers.filter(user => user.telegram_id !== telegramId));
        alert(`❌ Доступ скасовано!`);
      }
      
    } catch (err) {
      alert(`⚠️ Сталася помилка: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* СЕКЦІЯ 1: НОВІ ЗАЯВКИ */}
      <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginTop: '0' }}>
        🔔 Нові заявки ({pendingUsers.length})
      </h2>
      
      {loading ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Завантаження...</p>
      ) : pendingUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', background: '#f9f9f9', borderRadius: '8px', marginBottom: '40px' }}>
          <p style={{ color: '#888', margin: 0 }}>Нових заявок немає. 🎉</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px', marginBottom: '40px' }}>
          {pendingUsers.map((user) => (
            <div key={user.telegram_id} style={{
              border: '1px solid #e0e0e0', padding: '15px', borderRadius: '12px', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white'
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
                  style={{ background: '#00C853', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: actionLoading ? 'wait' : 'pointer' }}>
                  ✅ Схвалити
                </button>
                <button 
                  onClick={() => handleDecision(user.telegram_id, 'rejected')}
                  disabled={actionLoading}
                  style={{ background: '#F44336', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: actionLoading ? 'wait' : 'pointer' }}>
                  ❌ Відхилити
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* СЕКЦІЯ 2: АКТИВНІ УЧНІ */}
      <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        🎓 Активні учні ({approvedUsers.length})
      </h2>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Завантаження...</p>
      ) : approvedUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <p style={{ color: '#888', margin: 0 }}>Поки немає активних учнів.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          {approvedUsers.map((user) => (
            <div key={user.telegram_id} style={{
              border: '1px solid #e0e0e0', padding: '12px 15px', borderRadius: '8px', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc'
            }}>
              <div>
                <strong style={{ fontSize: '16px', display: 'block' }}>
                  {user.first_name || 'Без імені'}
                </strong>
                <span style={{ fontSize: '12px', color: '#888' }}>ID: {user.telegram_id}</span>
              </div>
              
              <button 
                onClick={() => handleDecision(user.telegram_id, 'rejected', true)}
                disabled={actionLoading}
                style={{ background: 'transparent', color: '#F44336', border: '1px solid #F44336', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: actionLoading ? 'wait' : 'pointer', transition: '0.2s' }}>
                ❌ Забрати доступ
              </button>
            </div>
          ))}
        </div>
      )}
      
    </div>
  );
};

export default AdminPanel;