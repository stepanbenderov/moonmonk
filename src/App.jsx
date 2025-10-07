import React, { useState, useEffect, useRef, useCallback } from 'react';

const TOTAL_FRAMES = 204;
const SECTIONS = [
  { id: 1, frame: 1, title: 'Главная' },
  { id: 2, frame: 51, title: 'Команда' },
  { id: 3, frame: 102, title: 'Услуги' },
  { id: 4, frame: 153, title: 'Навыки' },
  { id: 5, frame: 204, title: 'Контакты' }
];

function App() {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const frameCache = useRef({});
  const imagesLoaded = useRef(0);

  // Агрессивная предзагрузка всех кадров
  useEffect(() => {
    const loadFrames = async () => {
      // Сначала загружаем ключевые кадры
      const keyFrames = [1, 51, 102, 153, 204];
      
      for (const frame of keyFrames) {
        const img = new Image();
        const frameNum = String(frame).padStart(4, '0');
        img.src = `/frames/frame_${frameNum}.webp`;
        frameCache.current[frame] = img;
        await new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }

      // Затем загружаем все остальные кадры в фоне
      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        if (keyFrames.includes(i)) continue;
        
        const img = new Image();
        const frameNum = String(i).padStart(4, '0');
        img.src = `/frames/frame_${frameNum}.webp`;
        frameCache.current[i] = img;
        
        img.onload = () => {
          imagesLoaded.current++;
          setLoadingProgress((imagesLoaded.current / TOTAL_FRAMES) * 100);
        };
      }
    };

    loadFrames();
  }, []);

  // Быстрая анимация перехода между кадрами
  const animateToFrame = useCallback((target) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const start = currentFrame;
    const distance = target - start;
    
    if (Math.abs(distance) === 0) return;

    setIsAnimating(true);
    
    // Очень быстрая анимация: 3ms на кадр
    const duration = Math.abs(distance) * 3;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Быстрый easing
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const newFrame = Math.round(start + distance * easeProgress);
      setCurrentFrame(newFrame);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setCurrentFrame(target);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [currentFrame]);

  // Обработка скролла с более быстрой реакцией
  useEffect(() => {
    let scrollTimeout = null;
    
    const handleWheel = (e) => {
      e.preventDefault();
      
      // Отменяем предыдущий таймаут
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Более чувствительная прокрутка
      const delta = e.deltaY > 0 ? 3 : -3;
      const newFrame = Math.max(1, Math.min(TOTAL_FRAMES, currentFrame + delta));
      
      // Мгновенно переключаем кадр
      setCurrentFrame(newFrame);
      
      // Небольшая задержка перед следующим скроллом
      scrollTimeout = setTimeout(() => {
        setIsAnimating(false);
      }, 50);
    };

    const container = containerRef.current;
    container?.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container?.removeEventListener('wheel', handleWheel);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [currentFrame]);

  const goToSection = (frame) => {
    animateToFrame(frame);
  };

  const getCurrentSection = () => {
    for (let i = SECTIONS.length - 1; i >= 0; i--) {
      if (currentFrame >= SECTIONS[i].frame) {
        return SECTIONS[i].id;
      }
    }
    return 1;
  };

  const frameNumber = String(currentFrame).padStart(4, '0');
  
  // Логика переключения логотипов
  const getLogoState = () => {
    if (currentFrame <= 10) {
      return { show: true, type: 'black' }; // Темный логотип первые 10 кадров
    } else if (currentFrame >= 195) {
      return { show: true, type: 'white' }; // Светлый логотип последние 10 кадров
    } else {
      return { show: false, type: 'black' }; // Логотип скрыт
    }
  };
  
  const logoState = getLogoState();
  const currentSection = getCurrentSection();

  return (
    <div ref={containerRef} className="site-container">
      {/* Индикатор загрузки */}
      {loadingProgress < 100 && (
        <div className="loading-indicator">
          <div className="loading-bar" style={{ width: `${loadingProgress}%` }}></div>
          <p>Загрузка: {Math.round(loadingProgress)}%</p>
        </div>
      )}

      {/* Фоновая анимация - используем кэшированные изображения */}
      <div className="background-animation">
        {frameCache.current[currentFrame] ? (
          <img
            src={frameCache.current[currentFrame].src}
            alt="Background"
            className="frame-image"
            key={currentFrame}
          />
        ) : (
          <img
            src={`/frames/frame_${frameNumber}.webp`}
            alt="Background"
            className="frame-image"
            key={currentFrame}
          />
        )}
      </div>

      {/* Логотип */}
      <div className={`logo-container ${logoState.show ? 'visible' : 'hidden'}`}>
        <img
          src={logoState.type === 'white' ? '/images/logo_site_white.png' : '/images/logo_site_black.png'}
          alt="MoonMonk"
          className="logo"
        />
      </div>

      {/* Контент секций */}
      <div className="content-container">
        {/* Секция 1: Главная */}
        <div className={`section section-1 ${currentSection === 1 ? 'active' : ''}`}>
          <div className="quote">
            <p className="quote-text">
              ❝ То, что мы есть сегодня,— это следствие наших вчерашних мыслей, а сегодняшние мысли создают завтрашнюю жизнь. Жизнь — это порождение нашего разума. ❞
            </p>
            <p className="quote-author">Сиддхартха Гаутама (Будда)</p>
          </div>
          <div className="main-title-container">
            <h1 className="main-title-line main-title-line-1 gradient-ochre">Наша команда</h1>
            <h1 className="main-title-line main-title-line-2 gradient-ochre">для развития</h1>
            <h1 className="main-title-line main-title-line-3 gradient-ochre">вашего дела</h1>
          </div>
        </div>

        {/* Секция 2: Команда */}
        <div className={`section section-2 ${currentSection === 2 ? 'active' : ''}`}>
          <h2 className="section-heading">Кто мы</h2>
          <div className="team-photo">
            <div className="placeholder-box">Фото команды</div>
          </div>
        </div>

        {/* Секция 3: Что мы делаем */}
        <div className={`section section-3 ${currentSection === 3 ? 'active' : ''}`}>
          <h2 className="section-heading gradient-red-yellow">Что мы делаем</h2>
          <div className="services-grid">
            <div className="service-card gradient-red-yellow">
              <h4>Telegram-боты и мини-аппы</h4>
              <p>Заказы, запись, оплаты (СБП/ЮKassa), мини-CRM, интеграции</p>
            </div>
            <div className="service-card gradient-red-yellow">
              <h4>WB/Ozon-автоматизация</h4>
              <p>Репрайсинг, синк остатков/цен, отчёты, рекламные роботы</p>
            </div>
            <div className="service-card gradient-red-yellow">
              <h4>Сайты + интеграции</h4>
              <p>Лендинги/витрины, платежи, CRM/1C, маркетплейсы</p>
            </div>
            <div className="service-card gradient-red-yellow">
              <h4>CRM Bitrix24/1C</h4>
              <p>Внедрение, туннели продаж, телефония, автозадачи, отчёты</p>
            </div>
            <div className="service-card gradient-red-yellow">
              <h4>Интеграции с 1C</h4>
              <p>Обмены заказами/остатками/чеками, печатные формы, склад</p>
            </div>
            <div className="service-card gradient-red-yellow">
              <h4>BI-аналитика</h4>
              <p>Дашборды по продажам/марже/рекламе, сквозная аналитика</p>
            </div>
          </div>
        </div>

        {/* Секция 4: Навыки */}
        <div className={`section section-4 ${currentSection === 4 ? 'active' : ''}`}>
          <h2 className="section-heading gradient-red-purple">
            Какие у нас<br/>
            <span className="heading-indent">навыки</span>
          </h2>
          <div className="skills-list">
            <div className="skill-card gradient-red-purple">
              <h4>Инженерная дисциплина</h4>
              <p>Архитектуры, код-ревью, автотесты</p>
            </div>
            <div className="skill-card gradient-red-purple">
              <h4>Практика e-commerce</h4>
              <p>Говорим на языке селлеров и офлайн-бизнеса</p>
            </div>
            <div className="skill-card gradient-red-purple">
              <h4>Прозрачные сроки</h4>
              <p>Спринты 1–2 недели, демо каждую итерацию</p>
            </div>
            <div className="skill-card gradient-red-purple">
              <h4>Поддержка</h4>
              <p>SLA и дежурства, мониторинг и алерты</p>
            </div>
          </div>
        </div>

        {/* Секция 5: Контакты */}
        <div className={`section section-5 ${currentSection === 5 ? 'active' : ''}`}>
          <div className="contact-form">
            <h3>Форма обратной связи</h3>
            <input type="text" placeholder="Телег" className="form-input" />
            <input type="email" placeholder="Почта" className="form-input" />
            <textarea placeholder="Сообщение" className="form-textarea"></textarea>
            <button className="form-button">Отправить</button>
          </div>
        </div>
      </div>

      {/* Навигация */}
      <div className="navigation">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            className={`nav-dot ${currentSection === section.id ? 'active' : ''}`}
            onClick={() => goToSection(section.frame)}
            aria-label={section.title}
          />
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@800&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .site-container {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          position: relative;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .loading-indicator {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1000;
          background: rgba(0, 0, 0, 0.8);
          padding: 2rem;
          border-radius: 10px;
          text-align: center;
          color: white;
          min-width: 300px;
        }

        .loading-bar {
          height: 4px;
          background: linear-gradient(90deg, #4CAF50, #8BC34A);
          border-radius: 2px;
          transition: width 0.3s ease;
          margin-bottom: 1rem;
        }

        .background-animation {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          will-change: contents;
        }

        .frame-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }

        .logo-container {
          position: fixed;
          left: 1.3%;
          top: 27%;
          width: 40.0vw;
          max-width: 795px;
          height: auto;
          z-index: 10;
          opacity: 1;
          transition: opacity 0.3s ease;
          will-change: opacity;
        }

        .logo-container.visible {
          opacity: 1;
        }

        .logo-container.hidden {
          opacity: 0;
          pointer-events: none;
        }

        .logo {
          width: 100%;
          height: auto;
          max-height: 343px;
          display: block;
          object-fit: contain;
        }

        .content-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 5;
          pointer-events: none;
        }

        .section {
          position: absolute;
          width: 100%;
          height: 100%;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          will-change: opacity;
        }

        .section.active {
          opacity: 1;
          pointer-events: auto;
        }

        /* Секция 1: Главная */
        .quote {
          position: absolute;
          right: 5%;
          top: 8%;
          width: 45%;
          max-width: 600px;
          color: #000;
          transition: transform 0.3s ease;
        }

        .quote:hover {
          transform: translateY(-5px);
        }

        .quote-text {
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          font-size: clamp(1rem, 1.5vw, 1.5rem);
          line-height: 1.4;
          margin-bottom: 1rem;
          letter-spacing: -0.01em;
        }

        .quote-author {
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          font-size: clamp(0.9rem, 1.2vw, 1.2rem);
          text-align: right;
          margin-top: 0.8rem;
        }

        .main-title-container {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 20;
          pointer-events: none;
        }

        .main-title-line {
          position: absolute;
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          font-size: clamp(1.8rem, 3.5vw, 3.5rem);
          line-height: 1.3;
          letter-spacing: -0.02em;
          margin: 0;
          transition: transform 0.3s ease, filter 0.3s ease;
          pointer-events: auto;
        }

        .main-title-line:hover {
          transform: scale(1.05);
          filter: drop-shadow(3px 3px 15px rgba(0, 0, 0, 0.5));
        }

        .main-title-line-1 {
          left: 50%;
          top: 70%;
          transform: translateX(-50%);
        }

        .main-title-line-2 {
          left: 55%;
          top: 80%;
          transform: translateX(-50%);
        }

        .main-title-line-3 {
          left: 60%;
          top: 90%;
          transform: translateX(-50%);
        }



        .main-title h1 {
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          font-size: clamp(1.8rem, 3.5vw, 3.5rem);
          line-height: 1.2;
          letter-spacing: -0.02em;
          text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
        }

        /* Секция 2: Команда */
        .section-heading {
          position: absolute;
          left: 5%;
          top: 5%;
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: bold;
          color: #000;
          transition: all 0.3s ease;
          cursor: default;
        }

        .section-heading:hover {
          transform: translateX(10px);
          text-shadow: 3px 3px 10px rgba(0, 0, 0, 0.2);
        }

        .team-photo {
          position: absolute;
          right: 5%;
          top: 50%;
          transform: translateY(-50%);
          width: 40%;
          max-width: 600px;
        }

        .placeholder-box {
          background: rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.5);
          border-radius: 20px;
          padding: 3rem;
          text-align: center;
          font-size: 1.5rem;
          color: #333;
          aspect-ratio: 16/9;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .placeholder-box:hover {
          transform: scale(1.05);
          background: rgba(255, 255, 255, 0.4);
          border-color: rgba(255, 255, 255, 0.7);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
        }

        /* Секция 3: Услуги */
        .landing-grid {
          position: absolute;
          right: 5%;
          top: 50%;
          transform: translateY(-50%);
          width: 50%;
          max-width: 700px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .landing-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 15px;
          padding: 2rem;
          text-align: center;
          font-size: 1.2rem;
          color: #333;
          aspect-ratio: 4/3;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .landing-card:hover {
          transform: translateY(-10px) scale(1.05);
          background: rgba(255, 255, 255, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
        }

        /* Секция 4: Навыки */
        .skills-list {
          position: absolute;
          right: 5%;
          top: 50%;
          transform: translateY(-50%);
          width: 50%;
          max-width: 700px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .skill-card {
          background: rgba(255, 100, 100, 0.3);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 15px;
          padding: 2rem;
          text-align: center;
          font-size: 1.2rem;
          color: #fff;
          aspect-ratio: 4/3;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .skill-card:hover {
          transform: translateY(-10px) scale(1.05);
          background: rgba(255, 100, 100, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 15px 40px rgba(255, 50, 50, 0.3);
        }

        /* Секция 5: Контакты */
        .contact-form {
          position: absolute;
          right: 5%;
          top: 50%;
          transform: translateY(-50%);
          width: 40%;
          max-width: 500px;
          background: rgba(100, 100, 100, 0.3);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          padding: 2rem;
          color: #fff;
          transition: all 0.3s ease;
        }

        .contact-form:hover {
          background: rgba(100, 100, 100, 0.4);
          border-color: rgba(255, 255, 255, 0.5);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .contact-form h3 {
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
          transition: transform 0.3s ease;
        }

        .contact-form:hover h3 {
          transform: translateY(-5px);
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 0.8rem;
          margin-bottom: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-input:hover,
        .form-textarea:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.7);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .form-textarea {
          min-height: 120px;
          resize: vertical;
        }

        .form-button {
          width: 100%;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 8px;
          color: #fff;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .form-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .form-button:hover::before {
          width: 300px;
          height: 300px;
        }

        .form-button:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.7);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .form-button:active {
          transform: translateY(0);
        }

        /* Навигация */
        .navigation {
          position: fixed;
          right: 3%;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          z-index: 100;
        }

        .nav-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid #fff;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
          will-change: transform;
          position: relative;
        }

        .nav-dot::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .nav-dot:hover::before {
          width: 24px;
          height: 24px;
        }

        .nav-dot:hover {
          transform: scale(1.4);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
        }

        .nav-dot.active {
          background: #fff;
          transform: scale(1.5);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
        }

        .nav-dot.active::before {
          width: 30px;
          height: 30px;
          background: rgba(255, 255, 255, 0.2);
        }

        /* Секция 2: Команда - обновленные стили */
        .team-content {
          position: absolute;
          right: 5%;
          top: 50%;
          transform: translateY(-50%);
          width: 50%;
          max-width: 700px;
        }

        .team-text {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          padding: 2.5rem;
          transition: all 0.3s ease;
        }

        .team-text:hover {
          transform: scale(1.02);
          background: rgba(255, 255, 255, 0.35);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
        }

        .team-text h3 {
          font-size: clamp(1.3rem, 2vw, 1.8rem);
          margin-bottom: 1.5rem;
          line-height: 1.3;
        }

        .team-text p {
          font-size: clamp(1rem, 1.2vw, 1.2rem);
          line-height: 1.6;
          margin-bottom: 1rem;
          color: #333;
        }

        .team-facts {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .team-facts span {
          background: rgba(0, 0, 0, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #333;
          font-weight: 600;
        }

        /* Секция 3: Услуги - обновленные стили */
        .services-grid {
          position: absolute;
          right: 5%;
          top: 50%;
          transform: translateY(-50%);
          width: 55%;
          max-width: 800px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .service-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 15px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .service-card:hover {
          transform: translateY(-10px) scale(1.03);
          background: rgba(255, 255, 255, 0.4);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
        }

        .service-card h4 {
          font-size: clamp(1rem, 1.3vw, 1.3rem);
          margin-bottom: 0.8rem;
          line-height: 1.2;
        }

        .service-card p {
          font-size: clamp(0.85rem, 1vw, 1rem);
          line-height: 1.4;
          color: #333;
          opacity: 0.9;
        }

        /* Секция 4: Навыки - заголовок в две строки */
        .heading-indent {
          display: inline-block;
          margin-left: 4rem;
        }

        .skill-card h4 {
          font-size: clamp(1.1rem, 1.4vw, 1.5rem);
          margin-bottom: 0.8rem;
          line-height: 1.2;
        }

        .skill-card p {
          font-size: clamp(0.9rem, 1.1vw, 1.1rem);
          line-height: 1.4;
          opacity: 0.95;
        }


        @media (max-width: 768px) {
          .team-content,
          .services-grid {
            width: 90%;
            right: 5%;
          }

          .services-grid {
            grid-template-columns: 1fr;
            gap: 0.8rem;
          }

          .service-card {
            padding: 1.2rem;
          }

          .heading-indent {
            margin-left: 2rem;
          }

          .team-text {
            padding: 1.5rem;
          }

          .team-facts {
            flex-direction: column;
            gap: 0.5rem;
          }
        
          .logo-container {
            width: 60vw;
            left: 5%;
            top: 5%;
          }

          .quote {
            width: 90%;
            right: 5%;
            top: 20%;
          }

          .quote-text {
            font-size: clamp(0.9rem, 2.5vw, 1.2rem);
          }

          .quote-author {
            font-size: clamp(0.8rem, 2vw, 1rem);
          }

          .main-title-line {
            font-size: clamp(1.5rem, 4vw, 2.5rem);
          }

          .main-title-line-1 {
            left: 45%;
            top: 65%;
          }

          .main-title-line-2 {
            left: 50%;
            top: 75%;
          }

          .main-title-line-3 {
            left: 55%;
            top: 85%;
          }

          .section-heading {
            font-size: clamp(1.5rem, 5vw, 2.5rem);
          }

          .team-photo,
          .landing-grid,
          .skills-list,
          .contact-form {
            width: 85%;
            right: 7.5%;
          }

          .landing-grid,
          .skills-list {
            grid-template-columns: 1fr;
          }

          .landing-card,
          .skill-card {
            font-size: 1rem;
          }

          .nav-dot {
            width: 10px;
            height: 10px;
          }
        }
      `}</style>
    </div>
  );
}

export default App;