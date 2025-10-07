// Скрипт для генерации кадров из видео с помощью Node.js
// Требует: npm install fluent-ffmpeg

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');
const FRAMES_DIR = path.join(PUBLIC_DIR, 'frames');
const FPS = 15; // Кадров в секунду
const QUALITY = 85; // Качество WebP

// Очистка и создание директории
if (fs.existsSync(FRAMES_DIR)) {
  fs.rmSync(FRAMES_DIR, { recursive: true });
}
fs.mkdirSync(FRAMES_DIR, { recursive: true });

console.log('🎬 Генерация кадров для Moon Monk\n');

let currentFrameNum = 1;
const snapPoints = [1];

async function processVideo(videoNum) {
  const videoPath = path.join(PUBLIC_DIR, `part${videoNum}.mp4`);
  
  if (!fs.existsSync(videoPath)) {
    console.log(`❌ Файл part${videoNum}.mp4 не найден`);
    return 0;
  }

  return new Promise((resolve, reject) => {
    console.log(`📹 Обработка part${videoNum}.mp4...`);
    
    ffmpeg(videoPath)
      .fps(FPS)
      .size('1920x?')
      .outputOptions([
        '-q:v 2',
        `-start_number ${currentFrameNum}`
      ])
      .output(path.join(FRAMES_DIR, 'frame_%04d.webp'))
      .on('end', function() {
        const files = fs.readdirSync(FRAMES_DIR)
          .filter(f => f.startsWith('frame_') && f.endsWith('.webp'));
        
        const lastFrame = files.length;
        snapPoints.push(lastFrame);
        
        console.log(`✅ part${videoNum}.mp4 обработан (${lastFrame - currentFrameNum + 1} кадров)`);
        currentFrameNum = lastFrame + 1;
        resolve(lastFrame - currentFrameNum + 1);
      })
      .on('error', function(err) {
        console.error(`❌ Ошибка: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

async function main() {
  try {
    for (let i = 1; i <= 4; i++) {
      await processVideo(i);
    }
    
    const totalFrames = fs.readdirSync(FRAMES_DIR)
      .filter(f => f.startsWith('frame_') && f.endsWith('.webp'))
      .length;
    
    console.log('\n🎉 Генерация завершена!');
    console.log(`📊 Всего кадров: ${totalFrames}`);
    console.log(`📍 Snap points: [${snapPoints.join(', ')}]`);
    
    // Сохраняем информацию
    const info = `# Moon Monk Frame Info
Всего кадров: ${totalFrames}
FPS: ${FPS}
Snap points: [${snapPoints.join(', ')}]

Обновите в App.jsx:
const totalFrames = ${totalFrames}
const snapPoints = [${snapPoints.join(', ')}]
`;
    
    fs.writeFileSync(path.join(FRAMES_DIR, 'INFO.txt'), info);
    console.log('\n💾 Информация сохранена в frames/INFO.txt');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

main();