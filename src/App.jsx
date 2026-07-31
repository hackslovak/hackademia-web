import React, { useEffect, useState } from 'react';
import HelpModal from './HelpModal';
import { supabase } from './supabase';
import { Reorder } from 'framer-motion';

// --- ЗВУКОВИЙ ДВИЖОК ---
let audioCtx = null;
function playUiSound(type, isEnabled) {
  if (!isEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    
    if (type === 'ding') {
      // Райські дзвіночки (Арфа)
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const delay = i * 0.06;
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.2);
        osc.start(now + delay);
        osc.stop(now + delay + 1.2);
      });
    } else if (type === 'buzz') {
      // М'який глухий "буп" для помилки
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'whoosh') {
      // Легкий вітерець для перегортання
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle'; 
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (e) { console.error(e); }
}

// --- ПАЛІТРА ДЛЯ КАРТОК (Генератор унікальних кольорів) ---
function getCardStyle(index, isDark, isBack = false) {
  const gradientsLight = [
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    'linear-gradient(135deg, #cd9cf2 0%, #f6f3ff 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  ];
  
  const gradientsDark = [
    'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
    'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    'linear-gradient(135deg, #114357 0%, #f29492 100%)',
    'linear-gradient(135deg, #4b1248 0%, #f0c27b 100%)',
    'linear-gradient(135deg, #0f2027 0%, #203a43 100%)',
    'linear-gradient(135deg, #3a1c71 0%, #d76d77 100%)',
    'linear-gradient(135deg, #232526 0%, #414345 100%)',
    'linear-gradient(135deg, #141e30 0%, #243b55 100%)'
  ];

  const palette = isDark ? gradientsDark : gradientsLight;
  // Зворотна сторона використовує колір зі зсувом, щоб візуально відрізнятися
  const colorIndex = (index + (isBack ? 3 : 0)) % palette.length; 
  
  return {
    background: palette[colorIndex],
    color: isDark ? '#ffffff' : '#1a202c',
    border: 'none',
    boxShadow: isDark ? '0 4px 15px rgba(0,0,0,0.4)' : '0 4px 15px rgba(0,0,0,0.1)'
  };
}

function App() {
  // --- БАЗОВІ СТАНИ ---
  const [userName, setUserName] = useState(null);
  const [dbUserId, setDbUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const effectiveIsAdmin = isAdmin && !isPreviewMode;

  // --- ТЕМА ТА ЗВУК ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Об'єкт із кольорами для швидкого перемикання теми
  const theme = {
    bg: isDarkMode ? '#1a202c' : '#f0f4f8',
    cardBg: isDarkMode ? '#2d3748' : 'white',
    text: isDarkMode ? '#f7fafc' : '#333',
    textSecondary: isDarkMode ? '#a0aec0' : '#555',
    inputBg: isDarkMode ? '#4a5568' : 'white',
    inputBorder: isDarkMode ? '#718096' : '#ccc',
    adminBg: isDarkMode ? '#4a1c38' : '#ffe6f2',
    adminBorder: isDarkMode ? '#d53f8c' : '#FF007F'
  };

  const [newAdminTelegramId, setNewAdminTelegramId] = useState('');

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  const [isEditingCourseTitle, setIsEditingCourseTitle] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");

  const [modules, setModules] = useState([]);
  const [activeModule, setActiveModule] = useState(null);
  
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editModuleTitleText, setEditModuleTitleText] = useState('');

  const [newTaskType, setNewTaskType] = useState('text');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState('medium');
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskCorrectAnswer, setNewTaskCorrectAnswer] = useState('');

  const [userAnswers, setUserAnswers] = useState({});
  const [completedTasks, setCompletedTasks] = useState([]);
  const [courseProgress, setCourseProgress] = useState({ completed: 0, total: 0 });
  const [myCards, setMyCards] = useState([]);
  
  useEffect(() => {
    const savedCards = localStorage.getItem('hack_my_cards');
    if (savedCards) {
      try { setMyCards(JSON.parse(savedCards)); } catch(e){}
    }
  }, []);

  // --- СТАНИ ДЛЯ ФЛЕШ-КАРТОК ТА РЕЖИМІВ ТРЕНУВАННЯ ---
  const [flippedCards, setFlippedCards] = useState({});
  
  const [isTrainingMode, setIsTrainingMode] = useState(false);
  const [isTestView, setIsTestView] = useState(false); // false = просто гортати, true = тест з варіантами
  const [trainingIndex, setTrainingIndex] = useState(0);
  const [isTrainingFlipped, setIsTrainingFlipped] = useState(false);
  const [quizOptions, setQuizOptions] = useState([]);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('medium');

  const difficultyConfig = {
    easy: { color: '#00C853', label: '🟢 Легко', points: 10 },
    medium: { color: '#FFB300', label: '🟡 Середньо', points: 20 },
    hard: { color: '#F44336', label: '🔴 Складно', points: 30 }
  };

  useEffect(() => {
    try {
      const tg = window.Telegram?.WebApp;
      if (tg) { 
        tg.ready(); 
        tg.expand();
        // Автоматично підтягуємо тему з Telegram
        if (tg.colorScheme === 'dark') setIsDarkMode(true);
      } else {
        const savedTheme = localStorage.getItem('hack_theme');
        if (savedTheme === 'dark') setIsDarkMode(true);
      }

      // Завантажуємо налаштування звуку
      const savedSound = localStorage.getItem('hack_sound');
      if (savedSound === 'false') setIsSoundEnabled(false);

      async function registerUser(user) {
        const savedAdmin = localStorage.getItem('hack_is_admin');
        if (savedAdmin === 'true') {
          setIsAdmin(true);
        }

        const { data } = await supabase
          .from('users')
          .upsert({ telegram_id: user.id, first_name: user.first_name }, { onConflict: 'telegram_id' })
          .select()
          .single();
          
        if (data) {
          setDbUserId(data.id);
          if (data.role === 'admin' || savedAdmin === 'true') {
            setIsAdmin(true);
            localStorage.setItem('hack_is_admin', 'true');
          }
        }
      }

      if (tg?.initDataUnsafe?.user) {
        setUserName(tg.initDataUnsafe.user.first_name);
        registerUser(tg.initDataUnsafe.user);
      } else {
        const browserUser = localStorage.getItem('hack_browser_user') || 'Web Guest';
        setUserName(browserUser);
        
        supabase.from('users').upsert({ telegram_id: 999999, first_name: browserUser }, { onConflict: 'telegram_id' }).select().single().then(({data}) => {
          if (data) setDbUserId(data.id);
        });

        if (localStorage.getItem('hack_is_admin') === 'true') {
          setIsAdmin(true);
        }
      }
    } catch (e) { console.error(e); }

    fetchCourses();
  }, []);

  useEffect(() => {
    if (!dbUserId) return;
    async function fetchProgress() {
      const { data } = await supabase
        .from('progress')
        .select('task_id')
        .eq('user_id', dbUserId)
        .eq('status', 'completed');

      if (data) {
        setCompletedTasks(data.map(p => p.task_id));
      }
    }
    fetchProgress();
  }, [dbUserId]);

  useEffect(() => {
    if (!selectedCourse) return;
    async function fetchModulesAndProgress() {
      const { data: mods } = await supabase.from('modules').select('*').eq('course_id', selectedCourse.id).order('id', { ascending: true });
      if (mods) {
        setModules(mods);

        const modIds = mods.map(m => m.id);
        if (modIds.length > 0) {
          const { data: tks } = await supabase.from('tasks').select('id').in('module_id', modIds);
          if (tks && tks.length > 0) {
            const totalTasks = tks.length;
            const taskIds = tks.map(t => t.id);
            const completedCount = taskIds.filter(id => completedTasks.includes(id)).length;
            setCourseProgress({ completed: completedCount, total: totalTasks });
          } else {
            setCourseProgress({ completed: 0, total: 0 });
          }
        } else {
          setCourseProgress({ completed: 0, total: 0 });
        }
      }
    }
    fetchModulesAndProgress();
  }, [selectedCourse, completedTasks]);

  useEffect(() => {
    if (!activeModule) return;
    async function fetchTasks() {
      setIsLoadingTasks(true);
      const { data } = await supabase.from('tasks').select('*').eq('module_id', activeModule.id).order('id', { ascending: true });
      if (data) setTasks(data);
      setIsLoadingTasks(false);
    }
    fetchTasks();
    setIsTrainingMode(false); // скидаємо режим тренування при зміні модуля
  }, [activeModule]);

  // Функції перемикання теми та звуку
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('hack_theme', newTheme ? 'dark' : 'light');
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const toggleSound = () => {
    const newSound = !isSoundEnabled;
    setIsSoundEnabled(newSound);
    localStorage.setItem('hack_sound', newSound ? 'true' : 'false');
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    if (newSound) playUiSound('ding', true); // Підтвердження увімкнення звуку
  };

  async function fetchCourses() {
    const { data } = await supabase.from('courses').select('*').order('order_index', { ascending: true });
    if (data) setCourses(data);
  }

  async function handleMakeAdmin() {
    if (!newAdminTelegramId.trim()) return;
    const { error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('telegram_id', parseInt(newAdminTelegramId.trim()));

    if (error) {
      alert("Помилка: " + error.message);
    } else {
      alert(`Користувача з ID ${newAdminTelegramId} успішно призначено адміном!`);
      setNewAdminTelegramId('');
    }
  }

  async function handleAddCourse() {
    const title = prompt("Введи назву нового курсу:");
    if (!title) return;
    const newId = title.toLowerCase().replace(/\s+/g, '-');
    const newOrderIndex = courses.length; 
    
    const { data, error } = await supabase.from('courses').insert({ id: newId, title, order_index: newOrderIndex }).select();
    if (error) { alert("Помилка створення: " + error.message); return; }
    if (data) setCourses([...courses, data[0]]);
  }

  async function handleDeleteCourse(courseId) {
    if (!window.confirm("⚠️ Ви точно хочете видалити цей курс?")) return;
    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    if (error) { alert("Помилка: " + error.message); return; }
    setCourses(courses.filter(c => c.id !== courseId));
    if (selectedCourse?.id === courseId) setSelectedCourse(null);
  }

  async function handleSaveCourseTitle() {
    if (!newCourseTitle.trim()) return;
    
    const { error } = await supabase.from('courses').update({ title: newCourseTitle }).eq('id', selectedCourse.id);
    if (error) { 
      alert("Помилка перейменування: " + error.message); 
      return; 
    }
    
    setCourses(courses.map(c => c.id === selectedCourse.id ? { ...c, title: newCourseTitle } : c));
    setSelectedCourse({ ...selectedCourse, title: newCourseTitle });
    setIsEditingCourseTitle(false);
    
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  }

  function handleReorderCourses(newOrder) {
    setCourses(newOrder);
    
    const updates = newOrder.map((c, i) => ({ id: c.id, title: c.title, order_index: i }));
    supabase.from('courses').upsert(updates).then(({error}) => {
      if (error) console.error("Помилка збереження порядку:", error);
    });
  }
  
  async function handleAddModule() {
    if (!newModuleTitle.trim() || !selectedCourse) return;
    const { data, error } = await supabase.from('modules').insert({ 
      title: newModuleTitle, 
      course_id: selectedCourse.id, 
      is_unlocked: true 
    }).select();
    if (error) { alert("Помилка: " + error.message); return; }
    if (data) {
      setModules([...modules, data[0]]);
      setNewModuleTitle('');
    }
  }

  async function handleSaveModuleTitle(modId) {
    const { error } = await supabase.from('modules').update({ title: editModuleTitleText }).eq('id', modId);
    if (error) { alert("Помилка: " + error.message); return; }
    setModules(modules.map(m => m.id === modId ? { ...m, title: editModuleTitleText } : m));
    setEditingModuleId(null);
  }

  async function handleDeleteModule(modId) {
    if (!window.confirm("⚠️ Ви точно хочете видалити цей розділ (тиждень)?")) return;
    const { error } = await supabase.from('modules').delete().eq('id', modId);
    if (error) { alert("Помилка: " + error.message); return; }
    setModules(modules.filter(m => m.id !== modId));
  }

  async function handleDeleteTask(taskId) {
    if (!window.confirm("⚠️ Ви точно хочете видалити це завдання?")) return;
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) { alert("Помилка: " + error.message); return; }
    setTasks(tasks.filter(t => t.id !== taskId));
  }

  async function handleAddTask() {
    if (!newTaskContent.trim()) return;

    // Для флешкартки правильна відповідь обов'язкова і не приводиться до lowerCase
    const answer = newTaskType === 'quiz' 
      ? newTaskCorrectAnswer.trim().toLowerCase() 
      : (newTaskType === 'flashcard' ? newTaskCorrectAnswer.trim() : null);

    const { data, error } = await supabase
      .from('tasks')
      .insert({ 
        module_id: activeModule.id, 
        type: newTaskType, 
        content: newTaskContent,
        difficulty: newTaskDifficulty,
        correct_answer: answer
      })
      .select();
      
    if (error) { alert("Помилка: " + error.message); return; }
    if (data) {
      setTasks([...tasks, data[0]]);
      setNewTaskContent('');
      setNewTaskCorrectAnswer('');
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;
      setNewTaskContent(prev => prev + (prev ? '\n' : '') + publicUrl);
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (err) {
      alert("❌ Помилка завантаження фото: " + err.message);
    }
  }

  async function handleAudioUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `audio_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('audio')
        .getPublicUrl(fileName);

      const publicUrl = data.publicUrl;
      setNewTaskContent(prev => prev + (prev ? '\n' : '') + publicUrl);
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (err) {
      alert("❌ Помилка завантаження аудіо: " + err.message);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      let chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        await uploadAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert("❌ Не вдалося отримати доступ до мікрофона: " + err.message);
    }
  }

  function stopRecording() {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  }

  async function uploadAudioBlob(blob) {
    try {
      const fileName = `voice_${Date.now()}.mp3`;
      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, blob, { contentType: 'audio/mp3' });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('audio')
        .getPublicUrl(fileName);

      const publicUrl = data.publicUrl;
      setNewTaskContent(prev => prev + (prev ? '\n' : '') + publicUrl);
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (err) {
      alert("❌ Помилка збереження голосового запису: " + err.message);
    }
  }

  async function handleCloudBackup() {
    try {
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      
      const { data: allCourses } = await supabase.from('courses').select('*');
      const { data: allModules } = await supabase.from('modules').select('*');
      const { data: allTasks } = await supabase.from('tasks').select('*');
      
      const backupData = {
        type: 'Full Cloud Backup',
        export_date: new Date().toISOString(),
        courses: allCourses,
        modules: allModules,
        tasks: allTasks
      };

      const fileData = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
      const fileName = `backup_${dateStr}.json`;

      const { error } = await supabase.storage.from('Backups').upload(fileName, fileData);
      if (error) throw error;

      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("☁️ Бекап успішно збережено у хмару Supabase!");
      } else {
        alert("☁️ Бекап успішно збережено у хмару!");
      }
    } catch (err) {
      console.error(err);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("❌ Помилка збереження у хмару: " + err.message);
      } else {
        alert("❌ Помилка збереження у хмару: " + err.message);
      }
    }
  }

  async function handleCloudRestore() {
    if (!window.confirm("⚠️ УВАГА! Це відновить базу з ОСТАННЬОГО хмарного бекапу. Поточні дані будуть перезаписані. Продовжити?")) return;
    
    try {
      const { data: files, error: listError } = await supabase.storage.from('Backups').list();
      if (listError) throw listError;
      
      if (!files || files.length === 0) {
        if (window.Telegram?.WebApp) window.Telegram.WebApp.showAlert("У хмарі ще немає жодного бекапу!");
        else alert("У хмарі ще немає жодного бекапу!");
        return;
      }

      const latestFile = files.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      
      const { data: fileData, error: downloadError } = await supabase.storage.from('Backups').download(latestFile.name);
      if (downloadError) throw downloadError;

      const text = await fileData.text();
      const data = JSON.parse(text);

      if (data.courses && data.courses.length > 0) await supabase.from('courses').upsert(data.courses);
      if (data.modules && data.modules.length > 0) await supabase.from('modules').upsert(data.modules);
      if (data.tasks && data.tasks.length > 0) await supabase.from('tasks').upsert(data.tasks);

      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        window.Telegram.WebApp.showAlert(`✅ Успішно відновлено з файлу: ${latestFile.name}`);
      } else {
        alert(`✅ Успішно відновлено з файлу: ${latestFile.name}`);
      }
      
      fetchCourses();
      setSelectedCourse(null);
      setActiveModule(null);
      
    } catch (err) {
      console.error(err);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("❌ Помилка відновлення: " + err.message);
      } else {
        alert("❌ Помилка відновлення: " + err.message);
      }
    }
  }

  async function handleSaveEdit(taskId) {
    const taskToEdit = tasks.find(t => t.id === taskId);
    const parsedAnswer = taskToEdit.type === 'quiz' 
      ? editAnswer.trim().toLowerCase() 
      : (taskToEdit.type === 'flashcard' ? editAnswer.trim() : null);

    const { error } = await supabase
      .from('tasks')
      .update({ content: editContent, correct_answer: parsedAnswer, difficulty: editDifficulty })
      .eq('id', taskId);

    if (error) { alert("Помилка: " + error.message); return; }
    setTasks(tasks.map(t => t.id === taskId ? { ...t, content: editContent, correct_answer: parsedAnswer, difficulty: editDifficulty } : t));
    setEditingTaskId(null);
  }

  // Обробка звичайного текстового тесту (quiz)
  async function handleAnswerSubmit(task) {
    const studentAnswer = (userAnswers[task.id] || '').trim().toLowerCase();
    const correctAnswer = (task.correct_answer || '').trim().toLowerCase();

    if (!correctAnswer) {
      alert("⚠️ У цього завдання ще немає правильної відповіді.");
      return;
    }

    if (studentAnswer === correctAnswer) {
      playUiSound('ding', isSoundEnabled);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      
      const diff = difficultyConfig[task.difficulty || 'medium'];
      await supabase.from('progress').upsert({
        user_id: dbUserId,
        task_id: task.id,
        status: 'completed',
        points: diff.points
      }, { onConflict: 'user_id, task_id' });

      setCompletedTasks([...new Set([...completedTasks, task.id])]); 
      alert(`Правильно! 🎉 +${diff.points} балів.`);
    } else {
      playUiSound('buzz', isSoundEnabled);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      alert("Неправильно ❌ Спробуй ще раз!");
    }
  }

// --- ЛОГІКА ТРЕНУВАННЯ / ТЕСТІВ ФЛЕШКАРТОК ---
  const allTasksToRender = [...tasks, ...myCards];
  const flashcards = allTasksToRender.filter(t => t.type === 'flashcard');

  function handleAddMyCard() {
    const word = prompt("Введи слово (лицьова сторона):");
    if (!word) return;
    const translation = prompt("Введи переклад (зворотна сторона):");
    if (!translation) return;

    const newCard = {
      id: 'custom_' + Date.now(),
      type: 'flashcard',
      content: word.trim(),
      correct_answer: translation.trim(),
      difficulty: 'medium',
      isCustom: true
    };

    const updated = [...myCards, newCard];
    setMyCards(updated);
    localStorage.setItem('hack_my_cards', JSON.stringify(updated));
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  }

  function handleDeleteMyCard(cardId) {
    if (!window.confirm("🗑 Точно видалити цю власну картку?")) return;
    const updated = myCards.filter(c => c.id !== cardId);
    setMyCards(updated);
    localStorage.setItem('hack_my_cards', JSON.stringify(updated));
  }
  
  function startTraining(testMode = false) {
    if (flashcards.length === 0) return;
    setIsTestView(testMode);
    setTrainingIndex(0);
    setIsTrainingFlipped(false);
    setSelectedQuizAnswer(null);
    setQuizScore(0);
    setIsQuizFinished(false);
    setIsTrainingMode(true);
    prepareQuizOptions(0, flashcards);
  }

  function prepareQuizOptions(currentIndex, cards) {
    const currentCard = cards[currentIndex];
    const otherCards = cards.filter((_, idx) => idx !== currentIndex);
    const shuffledOthers = [...otherCards].sort(() => 0.5 - Math.random());
    const wrongAnswers = shuffledOthers.slice(0, 3).map(c => c.correct_answer);
    const options = [currentCard.correct_answer, ...wrongAnswers].sort(() => 0.5 - Math.random());
    setQuizOptions(options);
  }

  function handleQuizAnswer(option) {
    if (selectedQuizAnswer !== null) return; 
    setSelectedQuizAnswer(option);
    
    const currentCard = flashcards[trainingIndex];
    const isCorrect = option === currentCard.correct_answer;
    
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      playUiSound('ding', isSoundEnabled);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } else {
      playUiSound('buzz', isSoundEnabled);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
  }

  function nextTrainingCard() {
    if (trainingIndex + 1 < flashcards.length) {
      const nextIdx = trainingIndex + 1;
      setTrainingIndex(nextIdx);
      setIsTrainingFlipped(false);
      setSelectedQuizAnswer(null);
      prepareQuizOptions(nextIdx, flashcards);
    } else {
      setIsQuizFinished(true);
    }
  }

  function toggleFlashcard(id) {
    playUiSound('whoosh', isSoundEnabled);
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  }

  function toggleTrainingFlashcard() {
    playUiSound('whoosh', isSoundEnabled);
    setIsTrainingFlipped(!isTrainingFlipped);
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  }

  async function handleCompleteFlashcard(task) {
    playUiSound('ding', isSoundEnabled);
    const diff = difficultyConfig[task.difficulty || 'medium'];
    await supabase.from('progress').upsert({ user_id: dbUserId, task_id: task.id, status: 'completed', points: diff.points }, { onConflict: 'user_id, task_id' });
    setCompletedTasks([...new Set([...completedTasks, task.id])]); 
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  }

  function renderContent(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        const ytMatch = part.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (ytMatch && ytMatch[1]) {
          const videoId = ytMatch[1];
          return (
            <div key={i} style={{ margin: '15px 0', position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }

        if (part.match(/\.(mp3|wav|ogg|m4a)$/i) || part.includes("/audio/")) {
          return (
            <div key={i} style={{ margin: '15px 0', background: theme.inputBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}`, boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: theme.textSecondary }}>🎧 Аудіозапис / Аудіювання:</p>
              <audio controls style={{ width: '100%' }}>
                <source src={part} type="audio/mpeg" />
                Ваш браузер не підтримує аудіо елемент.
              </audio>
              <div style={{ marginTop: '8px', textAlign: 'right' }}>
                <a href={part} target="_blank" rel="noreferrer" style={{ color: '#FF007F', fontSize: '12px', textDecoration: 'none' }}>🔗 Відкрити у новому вікні</a>
              </div>
            </div>
          );
        }

        if (part.match(/\.(jpeg|jpg|gif|png)$/i) || part.includes("t.me") || part.includes("telegram")) {
          return (
            <div key={i} style={{ margin: '10px 0' }}>
              <img src={part} alt="attachment" style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '300px', objectFit: 'cover' }} onError={(e)=>{e.target.style.display='none'}} />
              <br/>
              <a href={part} target="_blank" rel="noreferrer" style={{ color: '#FF007F', fontSize: '14px' }}>🔗 Відкрити посилання</a>
            </div>
          );
        }
        return <a key={i} href={part} target="_blank" rel="noreferrer" style={{ color: '#FF007F' }}>{part}</a>;
      }
      return part;
    });
  }

  let clickTimeout = null;
  function handleBadgeClick() {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      clickTimeout = null;
    } else {
      clickTimeout = setTimeout(() => {
        clickTimeout = null;
        alert("ℹ️ Ці інструменти редагування бачите лише ви (адмін).\n\n💡 Хочете побачити, як платформа виглядає для учня? Клікніть на цей значок двічі швидко!");
      }, 300);
    }
  }

  function handleBadgeDoubleClick() {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      clickTimeout = null;
    }
    setIsPreviewMode(prev => !prev);
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  }

  function handleProgressClick() {
    const percent = courseProgress.total > 0 ? Math.round((courseProgress.completed / courseProgress.total) * 100) : 0;
    alert(
      `📊 Інформація про прогрес курсу:\n\n` +
      `• Що це означає: Показник демонструє ваш загальний ступінь проходження всіх навчальних матеріалів і тестів у цьому курсі.\n` +
      `• Як рахується: Формула вираховує відсоток успішно виконаних завдань від загальної кількості опублікованих завдань у всіх модулях цього курсу.\n\n` +
      `Поточний статус: ${percent}% (${courseProgress.completed} з ${courseProgress.total} завдань виконано).`
    );
  }

  const GlobalStyles = () => (
    <style>{`
      body { background-color: ${theme.bg}; color: ${theme.text}; transition: all 0.3s ease; }
      input, textarea, select { background-color: ${theme.inputBg}; color: ${theme.text}; border: 1px solid ${theme.inputBorder}; }
      input::placeholder, textarea::placeholder { color: ${theme.textSecondary}; }

      /* 3D Flip Card Styles */
      .card-3d-container { perspective: 1000px; width: 100%; cursor: pointer; }
      .card-3d-inner { 
        position: relative; width: 100%; min-height: 160px; text-align: center; 
        transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1); 
        transform-style: preserve-3d; 
      }
      .card-3d-inner.flipped { transform: rotateY(180deg); }
      .card-face { 
        position: absolute; width: 100%; height: 100%; backface-visibility: hidden; 
        display: flex; flex-direction: column; justify-content: center; align-items: center; 
        border-radius: 12px; padding: 25px; box-sizing: border-box; 
      }
      .card-front { }
      .card-back { transform: rotateY(180deg); }
    `}</style>
  );

  // ЕКРАН 3: Завдання розділу
  if (activeModule) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', paddingBottom: '100px' }}>
        <GlobalStyles />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => { if (isTrainingMode) setIsTrainingMode(false); else setActiveModule(null); }} style={{ background: 'transparent', border: 'none', color: '#FF007F', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', padding: '0' }}>
            ← Назад 
          </button>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={toggleSound} style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer' }}>
              {isSoundEnabled ? '🔊' : '🔇'}
            </button>
            <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer' }}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        
        <h2 style={{ color: theme.text }}>{activeModule.title}</h2>

        {/* КНОПКИ ТРЕНУВАННЯ / ТЕСТУ */}
        {!isTrainingMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {flashcards.length > 0 && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => startTraining(false)} style={{ flex: 1, background: '#3182ce', color: 'white', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                  🎴 Гортати ({flashcards.length})
                </button>
                <button onClick={() => startTraining(true)} style={{ flex: 1, background: '#805ad5', color: 'white', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                  📝 Тест
                </button>
              </div>
            )}
            <button onClick={handleAddMyCard} style={{ width: '100%', background: theme.inputBg, color: theme.text, padding: '12px', borderRadius: '10px', border: `1px dashed ${theme.inputBorder}`, fontWeight: 'bold', cursor: 'pointer' }}>
              ➕ Додати свою картку
            </button>
          </div>
        )}

        {isTrainingMode ? (
          <div style={{ background: theme.cardBg, padding: '25px', borderRadius: '16px', boxShadow: '0 8px 25px rgba(0,0,0,0.08)', textAlign: 'center', border: `1px solid ${theme.inputBorder}` }}>
            {isQuizFinished ? (
              <div>
                <h3 style={{ color: theme.text }}>🎉 Тренування завершено!</h3>
                <p style={{ fontSize: '18px', margin: '20px 0', color: theme.textSecondary }}>Твій результат: <b style={{ color: theme.text }}>{quizScore}</b> з <b style={{ color: theme.text }}>{flashcards.length}</b></p>
                <button onClick={() => setIsTrainingMode(false)} style={{ background: '#FF007F', color: 'white', padding: '12px 25px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Повернутися до завдань</button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '15px' }}>Картка {trainingIndex + 1} із {flashcards.length}</p>
                
                {!isTestView ? (
                  <div>
                    <div className="card-3d-container" onClick={toggleTrainingFlashcard}>
                      <div className={`card-3d-inner ${isTrainingFlipped ? 'flipped' : ''}`}>
                        <div className="card-face card-front" style={getCardStyle(trainingIndex, isDarkMode, false)}>
                          <span style={{ fontSize: '11px', opacity: 0.6, marginBottom: '8px', color: theme.textSecondary }}>Лицьова сторона (натисни для оберту)</span>
                          <span style={{ fontSize: '26px', fontWeight: 'bold', textShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.5)' : 'none' }}>{flashcards[trainingIndex].content}</span>
                        </div>
                        <div className="card-face card-back" style={getCardStyle(trainingIndex, isDarkMode, true)}>
                          <span style={{ fontSize: '11px', opacity: 0.8, marginBottom: '8px' }}>Переклад</span>
                          <span style={{ fontSize: '26px', fontWeight: 'bold', textShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.5)' : 'none' }}>{flashcards[trainingIndex].correct_answer}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button onClick={() => { setIsTrainingFlipped(false); setTrainingIndex(prev => Math.max(0, prev - 1)); }} disabled={trainingIndex === 0} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, cursor: 'pointer' }}>← Попередня</button>
                      <button onClick={() => { setIsTrainingFlipped(false); if (trainingIndex + 1 < flashcards.length) setTrainingIndex(prev => prev + 1); else setIsQuizFinished(true); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#3182ce', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Наступна →</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ background: theme.inputBg, padding: '20px', borderRadius: '12px', marginBottom: '20px', border: `1px solid ${theme.inputBorder}` }}>
                      <span style={{ fontSize: '13px', color: theme.textSecondary }}>Як правильно перекладається:</span>
                      <h3 style={{ fontSize: '24px', margin: '10px 0 0 0', color: theme.text }}>{flashcards[trainingIndex].content}</h3>
                    </div>

                    {selectedQuizAnswer !== null && (
                      <div style={{ padding: '15px', borderRadius: '10px', marginBottom: '15px', background: selectedQuizAnswer === flashcards[trainingIndex].correct_answer ? (isDarkMode ? '#22543D' : '#E8F5E9') : (isDarkMode ? '#742A2A' : '#FFEBEE') }}>
                        {selectedQuizAnswer === flashcards[trainingIndex].correct_answer ? (
                          <span style={{ color: isDarkMode ? '#9AE6B4' : '#2E7D32', fontWeight: 'bold', fontSize: '16px' }}>✅ Правильно!</span>
                        ) : (
                          <span style={{ color: isDarkMode ? '#FEB2B2' : '#C62828', fontWeight: 'bold', fontSize: '16px' }}>❌ Невірно!<br/><span style={{ fontSize: '14px', fontWeight: 'normal' }}>Правильна відповідь: <b>{flashcards[trainingIndex].correct_answer}</b></span></span>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                      {quizOptions.map((opt, idx) => {
                        const isCorrect = opt === flashcards[trainingIndex].correct_answer;
                        const isSelected = selectedQuizAnswer === opt;
                        
                        let btnBg = theme.inputBg;
                        let btnColor = theme.text;
                        let borderColor = theme.inputBorder;

                        if (selectedQuizAnswer !== null) {
                          if (isCorrect) { 
                            btnBg = '#00C853'; btnColor = 'white'; borderColor = '#00C853'; 
                          } else if (isSelected) { 
                            btnBg = '#F44336'; btnColor = 'white'; borderColor = '#F44336'; 
                          } else {
                            btnBg = isDarkMode ? '#2d3748' : '#f8fafc';
                            btnColor = isDarkMode ? '#718096' : '#a0aec0';
                          }
                        }

                        return (
                          <button key={idx} onClick={() => handleQuizAnswer(opt)} disabled={selectedQuizAnswer !== null} style={{ background: btnBg, color: btnColor, border: `2px solid ${borderColor}`, padding: '15px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: selectedQuizAnswer === null ? 'pointer' : 'default', transition: 'all 0.2s' }}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {selectedQuizAnswer !== null && (
                      <button onClick={nextTrainingCard} style={{ width: '100%', background: '#3182ce', color: 'white', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>Далі →</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {effectiveIsAdmin && (
              <div style={{ background: theme.adminBg, padding: '20px', borderRadius: '12px', marginBottom: '20px', border: `2px dashed ${theme.adminBorder}` }}>
                <h4 style={{ margin: '0 0 15px 0', color: theme.adminBorder }}>🛠 Додати завдання</h4>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <select value={newTaskType} onChange={e => setNewTaskType(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px' }}>
                    <option value="text">📖 Текст / Фото / Аудіо</option>
                    <option value="video">📺 Відео</option>
                    <option value="quiz">📝 Тест</option>
                    <option value="flashcard">🎴 Флеш-картка (Словник)</option>
                  </select>
                  <select value={newTaskDifficulty} onChange={e => setNewTaskDifficulty(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px' }}>
                    <option value="easy">🟢 Легко</option>
                    <option value="medium">🟡 Середньо</option>
                    <option value="hard">🔴 Складно</option>
                  </select>
                </div>
                
                <textarea 
                  placeholder={newTaskType === 'flashcard' ? "Лицьова сторона (наприклад: слово українською)..." : "Текст завдання або посилання на медіа..."}
                  value={newTaskContent} 
                  onChange={e => setNewTaskContent(e.target.value)} 
                  autoComplete="off"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', minHeight: '80px', marginBottom: '10px', boxSizing: 'border-box' }} 
                />

                {(newTaskType === 'quiz' || newTaskType === 'flashcard') && (
                  <input 
                    type="text" 
                    placeholder={newTaskType === 'flashcard' ? "Зворотна сторона (Переклад або пояснення)..." : "Правильна відповідь..."}
                    value={newTaskCorrectAnswer} 
                    onChange={e => setNewTaskCorrectAnswer(e.target.value)} 
                    autoComplete="off"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', marginBottom: '10px', boxSizing: 'border-box' }} 
                  />
                )}

                {newTaskType !== 'flashcard' && (
                  <div style={{ background: theme.cardBg, padding: '12px', borderRadius: '8px', marginBottom: '15px', border: `1px solid ${theme.inputBorder}`, textAlign: 'left' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', color: theme.textSecondary, display: 'block', marginBottom: '4px' }}>📎 Додати зображення:</label>
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: '12px', color: theme.text }} />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', color: theme.textSecondary, display: 'block', marginBottom: '4px' }}>🎧 Завантажити аудіофайл (MP3/WAV):</label>
                      <input type="file" accept="audio/*" onChange={handleAudioUpload} style={{ fontSize: '12px', color: theme.text }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: theme.textSecondary, display: 'block', marginBottom: '4px' }}>🎙 Записати голос з мікрофона:</label>
                      {isRecording ? (
                        <button onClick={stopRecording} style={{ background: '#F44336', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>⏹ Зупинити запис</button>
                      ) : (
                        <button onClick={startRecording} style={{ background: '#3182ce', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>🔴 Почати запис голосу</button>
                      )}
                    </div>
                  </div>
                )}
                
                <button onClick={handleAddTask} style={{ width: '100%', background: '#FF007F', color: 'white', padding: '15px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>+ Опублікувати</button>
              </div>
            )}

            {isLoadingTasks ? (
              <p style={{ color: theme.text }}>Завантаження...</p>
            ) : tasks.length === 0 ? (
              <div style={{ color: theme.textSecondary, fontSize: '13px', fontStyle: 'italic', textAlign: 'center', margin: '30px auto', padding: '20px', background: theme.cardBg, borderRadius: '12px', lineHeight: '1.6', maxWidth: '400px', border: `1px dashed ${theme.inputBorder}` }}>
                📂 У цьому розділі ще немає завдань.<br/>Ви можете додавати текстові матеріали, YouTube-відео, аудіофайли, записувати голос напряму з мікрофона, а також створювати інтерактивні тести та флешкартки!
              </div>
            ) : (
              allTasksToRender.map((task, index) => {
                const diff = difficultyConfig[task.difficulty || 'medium'];
                const isCompleted = completedTasks.includes(task.id);
                const isEditing = editingTaskId === task.id;
                const isFlipped = flippedCards[task.id];

                return (
                  <div key={task.id} style={{ background: theme.cardBg, padding: '20px', borderRadius: '12px', marginTop: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: isDarkMode ? `1px solid ${theme.inputBorder}` : 'none' }}>
                    {effectiveIsAdmin && isEditing ? (
                      <div>
                        <select value={editDifficulty} onChange={e => setEditDifficulty(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }}>
                          <option value="easy">🟢 Легко</option>
                          <option value="medium">🟡 Середньо</option>
                          <option value="hard">🔴 Складно</option>
                        </select>
                        <textarea value={editContent} onChange={e => setEditContent(e.target.value)} style={{ width: '100%', padding: '10px', minHeight: '80px', marginBottom: '10px' }} />
                        {(task.type === 'quiz' || task.type === 'flashcard') && <input type="text" value={editAnswer} onChange={e => setEditAnswer(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />}
                        <button onClick={() => handleSaveEdit(task.id)} style={{ background: '#00C853', color: 'white', padding: '10px', border: 'none', marginRight: '5px' }}>Зберегти</button>
                        <button onClick={() => setEditingTaskId(null)} style={{ background: '#ccc', padding: '10px', border: 'none' }}>Скасувати</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <h4 style={{ margin: 0, color: theme.text }}>
                            {task.type === 'video' ? '📺 Відео' : task.type === 'quiz' ? '📝 Тест' : task.type === 'flashcard' ? '🎴 Словник' : '📖 Матеріал'} {index + 1}
                          </h4>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ background: diff.color, color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>{diff.label}</span>
                            {effectiveIsAdmin && (
                              <>
                                <button onClick={() => { setEditingTaskId(task.id); setEditContent(task.content); setEditAnswer(task.correct_answer || ''); setEditDifficulty(task.difficulty || 'medium'); }} style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '6px', padding: '5px', color: theme.text }}>✏️</button>
                                <button onClick={() => handleDeleteTask(task.id)} style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', padding: '5px' }}>🗑</button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {task.type === 'flashcard' ? (
                          <div>
                            <div className="card-3d-container" onClick={() => toggleFlashcard(task.id)}>
                              <div className={`card-3d-inner ${isFlipped ? 'flipped' : ''}`}>
                                {/* БІЛА ЛИЦЬОВА СТОРОНА */}
                                <div className="card-face card-front" style={{ background: isDarkMode ? theme.cardBg : '#ffffff', color: theme.text, border: `1px solid ${theme.inputBorder}` }}>
                                  <span style={{ fontSize: '11px', opacity: 0.6, marginBottom: '8px', color: theme.textSecondary }}>🔄 Натисни для оберту</span>
                                  <span style={{ fontSize: '22px', fontWeight: 'bold' }}>{task.content}</span>
                                </div>
                                {/* КОЛЬОРОВИЙ ГРАДІЄНТ НА ЗВОРОТІ */}
                                <div className="card-face card-back" style={getCardStyle(index, isDarkMode, true)}>
                                  <span style={{ fontSize: '11px', opacity: 0.8, marginBottom: '8px', color: isDarkMode ? '#e2e8f0' : '#4a5568' }}>Переклад</span>
                                  <span style={{ fontSize: '22px', fontWeight: 'bold', textShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.5)' : 'none' }}>{task.correct_answer}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                              {isCompleted ? (
                                <div style={{ flex: 1, background: isDarkMode ? '#22543D' : '#E8F5E9', color: isDarkMode ? '#9AE6B4' : '#2E7D32', padding: '10px', textAlign: 'center', fontWeight: 'bold', borderRadius: '8px' }}>✅ Вивчено (+{diff.points} балів)</div>
                              ) : (
                                <button onClick={() => handleCompleteFlashcard(task)} style={{ flex: 1, background: '#00C853', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>✅ Я вивчив(ла) це слово</button>
                              )}
                              
                              {/* КНОПКА ВИДАЛЕННЯ ДЛЯ ВЛАСНОЇ КАРТКИ УЧНЯ */}
                              {task.isCustom && (
                                <button onClick={() => handleDeleteMyCard(task.id)} style={{ background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                                  🗑 Видалити
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ color: theme.text }}>{renderContent(task.content)}</div>
                            {task.type === 'quiz' && (
                              <div style={{ marginTop: '15px' }}>
                                {isCompleted ? <div style={{ background: isDarkMode ? '#22543D' : '#E8F5E9', color: isDarkMode ? '#9AE6B4' : '#2E7D32', padding: '10px', textAlign: 'center', fontWeight: 'bold', borderRadius: '8px' }}>✅ Виконано (+{diff.points} балів)</div> : (
                                  <>
                                    <input type="text" placeholder="Твоя відповідь..." value={userAnswers[task.id] || ''} onChange={e => setUserAnswers({ ...userAnswers, [task.id]: e.target.value })} autoComplete="off" style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box', borderRadius: '8px' }} />
                                    <button onClick={() => handleAnswerSubmit(task)} style={{ width: '100%', background: '#00C853', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Перевірити</button>
                                  </>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    );
  }

  // ЕКРАН 2: Список розділів вибраного курсу
  if (selectedCourse) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', fontFamily: 'sans-serif', minHeight: '100vh' }}>
        <GlobalStyles />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => setSelectedCourse(null)} style={{ background: 'transparent', border: 'none', color: '#FF007F', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', padding: '0' }}>
            ← Всі курси
          </button>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={toggleSound} style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer' }}>
              {isSoundEnabled ? '🔊' : '🔇'}
            </button>
            <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer' }}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {effectiveIsAdmin && isEditingCourseTitle ? (
          <div style={{ marginBottom: '20px' }}>
            <input type="text" value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} style={{ fontSize: '20px', padding: '8px', textAlign: 'center', borderRadius: '6px', border: `1px solid ${theme.adminBorder}`, width: '80%' }} />
            <br/><br/>
            <button onClick={handleSaveCourseTitle} style={{ background: '#00C853', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginRight: '5px' }}>Зберегти</button>
            <button onClick={() => setIsEditingCourseTitle(false)} style={{ background: '#ccc', padding: '8px 15px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Скасувати</button>
          </div>
        ) : (
          <h2 style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', color: theme.text }}>
            {selectedCourse.title}
            {effectiveIsAdmin && <button onClick={() => { setIsEditingCourseTitle(true); setNewCourseTitle(selectedCourse.title); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✏️</button>}
          </h2>
        )}

        {userName && <p style={{ color: theme.textSecondary }}>Привіт, <b>{userName}</b>!</p>}
        
        {isAdmin && (
          <span 
            onClick={handleBadgeClick}
            onDoubleClick={handleBadgeDoubleClick}
            style={{ background: isPreviewMode ? '#4A5568' : '#FF007F', color: 'white', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', userSelect: 'none', display: 'inline-block', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
            title="Клікніть для довідки, двічі клікніть для перемикання превью"
          >
            {isPreviewMode ? '👤 Учень (Превью)' : 'ADMIN'}
          </span>
        )}

        {courseProgress.total > 0 && (
          <div 
            onClick={handleProgressClick}
            style={{ maxWidth: '400px', margin: '20px auto 10px auto', background: theme.cardBg, padding: '15px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', textAlign: 'left', cursor: 'pointer', transition: 'transform 0.1s ease', border: `1px solid ${theme.inputBorder}` }}
            title="Клікніть, щоб дізнатися деталі про розрахунок прогресу"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: theme.text }}>
              <span>📊 Прогрес курсу ℹ️</span>
              <span>{Math.round((courseProgress.completed / courseProgress.total) * 100)}% ({courseProgress.completed}/{courseProgress.total})</span>
            </div>
            <div style={{ width: '100%', background: theme.inputBg, borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${(courseProgress.completed / courseProgress.total) * 100}%`, background: '#00C853', height: '100%', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {effectiveIsAdmin && (
          <div style={{ background: theme.adminBg, padding: '15px', borderRadius: '12px', maxWidth: '400px', margin: '20px auto', border: `2px dashed ${theme.adminBorder}`, textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 10px 0', color: theme.adminBorder }}>➕ Додати новий розділ / тиждень</h4>
            <input type="text" placeholder="Назва (напр., Тиждень 1)" value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box', borderRadius: '8px' }} />
            <button onClick={handleAddModule} style={{ width: '100%', background: '#FF007F', color: 'white', padding: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px' }}>Створити розділ</button>
          </div>
        )}

        <div style={{ marginTop: '20px', maxWidth: '400px', margin: '20px auto', textAlign: 'left' }}>
          <h3 style={{ color: theme.text }}>Програма курсу:</h3>
          
          {modules.length === 0 ? (
            <p style={{ color: theme.textSecondary, fontSize: '13px', fontStyle: 'italic', lineHeight: '1.5', padding: '10px 0' }}>
              💡 Тут поки немає розділів. Створіть перший тиждень або модуль вище. У розділах ви зможете структурувати навчальні матеріали, відео, аудіо та тести для студентів.
            </p>
          ) : (
            modules.map((mod) => (
              <div key={mod.id} style={{ background: theme.cardBg, padding: '15px', borderRadius: '10px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${theme.inputBorder}` }}>
                {effectiveIsAdmin && editingModuleId === mod.id ? (
                  <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                    <input type="text" value={editModuleTitleText} onChange={e => setEditModuleTitleText(e.target.value)} style={{ flex: 1, padding: '5px' }} />
                    <button onClick={() => handleSaveModuleTitle(mod.id)} style={{ background: '#00C853', color: 'white', border: 'none', padding: '5px 10px' }}>💾</button>
                  </div>
                ) : (
                  <>
                    <b onClick={() => setActiveModule(mod)} style={{ cursor: 'pointer', flex: 1, color: theme.text }}>{mod.title}</b>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {effectiveIsAdmin && (
                        <>
                          <button onClick={() => { setEditingModuleId(mod.id); setEditModuleTitleText(mod.title); }} style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '4px', padding: '4px', cursor: 'pointer', color: theme.text }}>✏️</button>
                          <button onClick={() => handleDeleteModule(mod.id)} style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}>🗑</button>
                        </>
                      )}
                      <span>🔓</span>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ЕКРАН 1: Головна сторінка вибору курсів
  return (
    <div style={{ textAlign: 'center', padding: '30px', fontFamily: 'sans-serif', minHeight: '100vh' }}>
      <GlobalStyles />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div></div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={toggleSound} style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer' }}>
            {isSoundEnabled ? '🔊' : '🔇'}
          </button>
          <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer' }}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <h1 style={{ color: theme.text }}>🎓 Hackademia Курси</h1>
      {userName && <p style={{ color: theme.textSecondary }}>Привіт, <b>{userName}</b>!</p>}
      
      {isAdmin && (
        <span 
          onClick={handleBadgeClick}
          onDoubleClick={handleBadgeDoubleClick}
          style={{ background: isPreviewMode ? '#4A5568' : '#FF007F', color: 'white', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', userSelect: 'none', display: 'inline-block', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
          title="Клікніть для довідки, двічі клікніть для перемикання превью"
        >
          {isPreviewMode ? '👤 Учень (Превью)' : 'ADMIN'}
        </span>
      )}

      {!window.Telegram?.WebApp?.initDataUnsafe?.user && (
        <div style={{ margin: '15px auto', maxWidth: '300px' }}>
          <input 
            type="text" 
            placeholder="Твоє ім'я для веб-версії" 
            defaultValue={localStorage.getItem('hack_browser_user') || ''} 
            onBlur={e => { localStorage.setItem('hack_browser_user', e.target.value); window.location.reload(); }}
            style={{ padding: '8px', width: '100%', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, boxSizing: 'border-box' }}
          />
        </div>
      )}

      {effectiveIsAdmin && (
        <div style={{ margin: '20px 0' }}>
          <button onClick={handleAddCourse} style={{ background: '#FF007F', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Створити новий курс</button>
        </div>
      )}

      <div style={{ marginTop: '30px', maxWidth: '400px', margin: '30px auto' }}>
        <h3 style={{ color: theme.text }}>Обери курс:</h3>
        
        {effectiveIsAdmin && courses.length > 1 && (
          <p style={{ fontSize: '13px', color: theme.textSecondary, fontStyle: 'italic', marginBottom: '15px' }}>
            💡 Затисни і потягни блок курсу, щоб змінити його позицію
          </p>
        )}

        {effectiveIsAdmin ? (
          <Reorder.Group axis="y" values={courses} onReorder={handleReorderCourses} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {courses.map(course => (
              <Reorder.Item
                key={course.id}
                value={course}
                whileDrag={{ scale: 1.05, boxShadow: "0px 15px 25px rgba(255, 0, 127, 0.25)" }} 
                style={{ background: theme.cardBg, padding: '20px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab', position: 'relative', border: `1px solid ${theme.inputBorder}` }}
              >
                <span onClick={() => setSelectedCourse(course)} style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', color: theme.text, flex: 1, textAlign: 'left' }}>
                  🚀 {course.title}
                </span>
                
                {courses.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }} style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer', zIndex: 10 }}>🗑</button>
                )}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          courses.map(course => (
            <div key={course.id} style={{ background: theme.cardBg, padding: '20px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${theme.inputBorder}` }}>
              <span onClick={() => setSelectedCourse(course)} style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', color: theme.text, flex: 1, textAlign: 'left' }}>
                🚀 {course.title}
              </span>
            </div>
          ))
        )}
      </div>

      {isAdmin && (
        <div style={{ marginTop: '60px', opacity: 0.6, fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          {effectiveIsAdmin && (
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center', color: theme.textSecondary }}>
              <span>Додати адміна:</span>
              <input 
                type="number" 
                placeholder="Telegram ID" 
                value={newAdminTelegramId} 
                onChange={e => setNewAdminTelegramId(e.target.value)} 
                style={{ padding: '4px 8px', borderRadius: '4px', border: `1px solid ${theme.inputBorder}`, fontSize: '12px', width: '100px' }} 
              />
              <button onClick={handleMakeAdmin} style={{ background: theme.inputBg, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>OK</button>
            </div>
          )}
          
          <button onClick={handleCloudBackup} style={{ background: 'transparent', border: '1px solid #00C853', color: '#00C853', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
            ☁️ Зробити бекап у хмару
          </button>
          
          <button onClick={() => setIsHelpOpen(true)} style={{ background: 'transparent', border: '1px solid #3182ce', color: '#3182ce', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
            ❓ Довідка
          </button>
          
          <button onClick={handleCloudRestore} style={{ background: 'transparent', border: '1px solid #d32f2f', color: '#d32f2f', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginTop: '-5px' }}>
            🔄 Відновити останній бекап
          </button>
        </div>
      )}
    
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}

export default App;