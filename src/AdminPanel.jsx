import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const AdminPanel = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [userCourses, setUserCourses] = useState({}); // Зберігає масиви курсів для кожного учня
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Форма для створення нової групи
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupLevel, setNewGroupLevel] = useState('A1');

  const fetchAllData = async () => {
    setLoading(true);
    
    // 1. Отримуємо користувачів
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .in('access_status', ['pending', 'approved']);
      
    if (userData) {
      setPendingUsers(userData.filter(user => user.access_status === 'pending'));
      setApprovedUsers(userData.filter(user => user.access_status === 'approved' && user.role !== 'admin'));
    }

    // 2. Отримуємо курси
    const { data: courseData } = await supabase.from('courses').select('*').order('order_index', { ascending: true });
    if (courseData) setCourses(courseData);

    // 3. Отримуємо групи
    const { data: groupData } = await supabase.from('groups').select('*');
    if (groupData) setGroups(groupData);

    // 4. Отримуємо зв'язки учень-курс (галочки)
    const { data: ucData } = await supabase.from('user_courses').select('*');
    if (ucData) {
      const mapping = {};
      ucData.forEach(item => {
        if (!mapping[item.user_telegram_id]) mapping[item.user_telegram_id] = [];
        mapping[item.user_telegram_id].push(item.course_id);
      });
      setUserCourses(mapping);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Створення нової групи
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const { error } = await supabase.from('groups').insert({
      name: newGroupName.trim(),
      level: newGroupLevel
    });

    if (error) {
      alert("Помилка створення групи: " + error.message);
    } else {
      setNewGroupName('');
      fetchAllData();
    }
  };

  // Видалення групи
  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("⚠️ Видалити цю групу? Учні в ній залишаться без групи.")) return;
    await supabase.from('groups').delete().eq('id', groupId);
    fetchAllData();
  };

  // Призначення групи учню
  const handleAssignGroup = async (telegramId, groupId) => {
    const val = groupId === "" ? null : groupId;
    await supabase.from('users').update({ group_id: val }).eq('telegram_id', telegramId);
    fetchAllData();
  };

  // Перемикання галочки доступу до курсу
  const handleToggleCourseAccess = async (telegramId, courseId) => {
    const currentCourses = userCourses[telegramId] || [];
    const hasAccess = currentCourses.includes(courseId);

    if (hasAccess) {
      // Видаляємо доступ
      await supabase.from('user_courses').delete().match({ user_telegram_id: telegramId, course_id: courseId });
      setUserCourses({
        ...userCourses,
        [telegramId]: currentCourses.filter(id => id !== courseId)
      });
    } else {
      // Додаємо доступ
      await supabase.from('user_courses').insert({ user_telegram_id: telegramId, course_id: courseId });
      setUserCourses({
        ...userCourses,
        [telegramId]: [...currentCourses, courseId]
      });
    }
  };

  // Схвалення / Відхилення / Видалення
  const handleDecision = async (telegramId, status, isRevoke = false) => {
    if (isRevoke && !window.confirm("⚠️ Точно хочете забрати доступ у цього учня?")) return;

    setActionLoading(true);
    try {
      await supabase.from('users').update({ access_status: status }).eq('telegram_id', telegramId);

      await supabase.functions.invoke('telegram-notify', {
        body: { telegram_id: telegramId, status: status }
      });

      fetchAllData();
    } catch (err) {
      alert(`⚠️ Сталася помилка: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* СЕКЦІЯ 1: НОВІ ЗАЯВКИ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginTop: '0', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>🔔 Нові заявки ({pendingUsers.length})</h2>
        <button onClick={fetchAllData} style={{ background: '#3182ce', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
          🔄 Оновити
        </button>
      </div>
      
      {loading ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Завантаження...</p>
      ) : pendingUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', background: '#f9f9f9', borderRadius: '8px', marginBottom: '40px' }}>
          <p style={{ color: '#888', margin: 0 }}>Нових заявок немає. 🎉</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
          {pendingUsers.map((user) => (
            <div key={user.telegram_id} style={{ border: '1px solid #e0e0e0', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
              <div>
                <strong style={{ fontSize: '18px', display: 'block', marginBottom: '4px' }}>{user.first_name || 'Без імені'}</strong>
                <span style={{ fontSize: '13px', color: '#888', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>ID: {user.telegram_id}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleDecision(user.telegram_id, 'approved')} disabled={actionLoading} style={{ background: '#00C853', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>✅ Схвалити</button>
                <button onClick={() => handleDecision(user.telegram_id, 'rejected')} disabled={actionLoading} style={{ background: '#F44336', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>❌ Відхилити</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* СЕКЦІЯ 2: УБОРКА ТА УПРАВЛІННЯ ГРУПАМИ */}
      <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>👥 Управління групами</h2>
      <form onSubmit={handleCreateGroup} style={{ display: 'flex', gap: '10px', marginBottom: '20px', marginTop: '15px' }}>
        <input 
          type="text" 
          placeholder="Номер групи (напр. 101)" 
          value={newGroupName} 
          onChange={e => setNewGroupName(e.target.value)} 
          style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <select 
          value={newGroupLevel} 
          onChange={e => setNewGroupLevel(e.target.value)}
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
        >
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
          <option value="Індивідуальні">Індивідуальні</option>
        </select>
        <button type="submit" style={{ background: '#FF007F', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+ Створити групу</button>
      </form>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '40px' }}>
        {groups.map(g => (
          <div key={g.id} style={{ background: '#f0f4f8', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span><b>Група {g.name}</b> ({g.level})</span>
            <button onClick={() => handleDeleteGroup(g.id)} style={{ background: 'transparent', border: 'none', color: 'red', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
        ))}
      </div>

      {/* СЕКЦІЯ 3: АКТИВНІ УЧНІ ТА ГАЛОЧКИ ДОСТУПУ */}
      <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>🎓 Активні учні та доступи ({approvedUsers.length})</h2>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Завантаження...</p>
      ) : approvedUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <p style={{ color: '#888', margin: 0 }}>Поки немає активних учнів.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          {approvedUsers.map((user) => {
            const studentCourses = userCourses[user.telegram_id] || [];

            return (
              <div key={user.telegram_id} style={{ border: '1px solid #e0e0e0', padding: '15px', borderRadius: '12px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '16px', display: 'block' }}>{user.first_name || 'Без імені'}</strong>
                    <span style={{ fontSize: '12px', color: '#888' }}>ID: {user.telegram_id}</span>
                  </div>

                  {/* Вибір групи для учня */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#555' }}>Група:</span>
                    <select 
                      value={user.group_id || ""} 
                      onChange={(e) => handleAssignGroup(user.telegram_id, e.target.value)}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px' }}
                    >
                      <option value="">(Без групи)</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name} ({g.level})</option>
                      ))}
                    </select>
                  </div>

                  <button onClick={() => handleDecision(user.telegram_id, 'rejected', true)} disabled={actionLoading} style={{ background: 'transparent', color: '#F44336', border: '1px solid #F44336', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                    ❌ Забрати доступ
                  </button>
                </div>

                {/* Галочки курсів для цього учня */}
                <div style={{ background: 'white', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568', display: 'block', marginBottom: '6px' }}>Доступ до курсів:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {courses.map(course => {
                      const isChecked = studentCourses.includes(course.id);
                      return (
                        <label key={course.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => handleToggleCourseAccess(user.telegram_id, course.id)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          {course.title}
                        </label>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
      
    </div>
  );
};

App.jsx // Помилки уникнемо, оскільки це AdminPanel.jsx
export default AdminPanel;