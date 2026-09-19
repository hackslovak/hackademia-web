import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'App.jsx');

try {
  let code = fs.readFileSync(filePath, 'utf8');
  
  if (code.includes("isInline ? newTaskType : task?.type")) {
      code = code.replace("isInline ? newTaskType : task?.type", "newTaskType");
      fs.writeFileSync(filePath, code, 'utf8');
      console.log("✅ УСПІХ! Помилку 'task is not defined' виправлено у файлі src/App.jsx!");
  } else {
      console.log("⚠️ Рядок не знайдено. Можливо, ви вже його виправили.");
  }
} catch (error) {
  console.error("❌ Помилка:", error.message);
}