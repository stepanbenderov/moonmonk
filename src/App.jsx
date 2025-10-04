import { useState, useEffect, useRef, useCallback } from 'react'
import Section1 from './components/Section1'
import Section2 from './components/Section2'
import Section3 from './components/Section3'
import Section4 from './components/Section4'
import Section5 from './components/Section5'
import './App.css'

function App() {
  const [currentFrame, setCurrentFrame] = useState(1)
  const [activeSection, setActiveSection] = useState(0)
  const [preloadedImages, setPreloadedImages] = useState([])
  
  const containerRef = useRef(null)
  const targetFrameRef = useRef(1)
  const currentFrameRef = useRef(1)
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef(null)
  const isSnappingRef = useRef(false)
  const rafIdRef = useRef(null)
  
  const totalFrames = 408
  const snapPoints = [1, 102, 204, 306, 408]
  const snapThreshold = 35

  // Предзагрузка изображений
  useEffect(() => {
    const images = []
    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image()
      img.src = `/frames/frame_${String(i).padStart(4, '0')}.webp`
      images.push(img)
    }
    setPreloadedImages(images)
  }, [])

  // Определение активной секции по кадру
  const getActiveSectionByFrame = useCallback((frame) => {
    if (frame >= 1 && frame < 102) return 0
    if (frame >= 102 && frame < 204) return 1
    if (frame >= 204 && frame < 306) return 2
    if (frame >= 306 && frame < 408) return 3
    if (frame >= 408) return 4
    return 0
  }, [])

  // Обновление активной секции
  useEffect(() => {
    const newSection = getActiveSectionByFrame(currentFrame)
    if (newSection !== activeSection) {
      setActiveSection(newSection)
    }
  }, [currentFrame, activeSection, getActiveSectionByFrame])

  // Функция lerp
  const lerp = useCallback((start, end, factor) => {
    return start + (end - start) * factor
  }, [])

  // Поиск ближайшего snap point
  const findNearestSnapPoint = useCallback((frame) => {
    let nearest = snapPoints[0]
    let minDistance = Math.abs(frame - nearest)
    
    for (let point of snapPoints) {
      const distance = Math.abs(frame - point)
      if (distance < minDistance) {
        minDistance = distance
        nearest = point
      }
    }
    
    return minDistance < snapThreshold ? nearest : null
  }, [])

  // Программная прокрутка
  const scrollToFrame = useCallback((frame) => {
    const scrollFraction = (frame - 1) / (totalFrames - 1)
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const targetScroll = scrollFraction * docHeight
    
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    })
  }, [])

  // Навигация к секции - МГНОВЕННО обновляем activeSection
  const navigateToSection = useCallback((sectionIndex) => {
    const targetFrame = snapPoints[sectionIndex]
    
    // СРАЗУ устанавливаем активную секцию
    setActiveSection(sectionIndex)
    
    isSnappingRef.current = true
    targetFrameRef.current = targetFrame
    scrollToFrame(targetFrame)
    
    setTimeout(() => {
      isSnappingRef.current = false
    }, 800)
  }, [scrollToFrame])

  // Анимационный цикл - ОПТИМИЗИРОВАН
  useEffect(() => {
    let lastUpdateTime = Date.now()
    
    const animate = () => {
      const now = Date.now()
      const deltaTime = now - lastUpdateTime
      
      // Ограничиваем частоту обновлений до ~60 FPS
      if (deltaTime < 16) {
        rafIdRef.current = requestAnimationFrame(animate)
        return
      }
      
      lastUpdateTime = now
      
      // Динамический lerp factor
      const lerpFactor = isScrollingRef.current ? 0.2 : (isSnappingRef.current ? 0.12 : 0.08)
      
      // Интерполяция
      const oldFrame = currentFrameRef.current
      currentFrameRef.current = lerp(currentFrameRef.current, targetFrameRef.current, lerpFactor)
      
      // Проверка достижения цели при снэппинге
      const distanceToTarget = Math.abs(targetFrameRef.current - currentFrameRef.current)
      if (isSnappingRef.current && distanceToTarget < 0.3) {
        currentFrameRef.current = targetFrameRef.current
        isSnappingRef.current = false
      }
      
      // Обновляем состояние только если кадр реально изменился
      const roundedFrame = Math.round(currentFrameRef.current)
      const oldRoundedFrame = Math.round(oldFrame)
      
      if (roundedFrame !== oldRoundedFrame && roundedFrame >= 1 && roundedFrame <= totalFrames) {
        setCurrentFrame(roundedFrame)
      }
      
      rafIdRef.current = requestAnimationFrame(animate)
    }
    
    rafIdRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [lerp])

  // Обработка прокрутки - ОПТИМИЗИРОВАНА
  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (isSnappingRef.current) {
            ticking = false
            return
          }
          
          const scrollTop = window.scrollY
          const docHeight = document.documentElement.scrollHeight - window.innerHeight
          const scrollFraction = scrollTop / docHeight
          
          const targetFrame = Math.min(
            totalFrames,
            Math.max(1, 1 + scrollFraction * (totalFrames - 1))
          )
          
          targetFrameRef.current = targetFrame
          isScrollingRef.current = true
          
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current)
          }
          
          scrollTimeoutRef.current = setTimeout(() => {
            isScrollingRef.current = false
            
            const snapPoint = findNearestSnapPoint(currentFrameRef.current)
            if (snapPoint !== null && !isSnappingRef.current) {
              isSnappingRef.current = true
              targetFrameRef.current = snapPoint
              
              setTimeout(() => {
                scrollToFrame(snapPoint)
              }, 50)
            }
          }, 150)
          
          ticking = false
        })
        
        ticking = true
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [findNearestSnapPoint, scrollToFrame])

  const getFramePath = useCallback((frame) => {
    return `/frames/frame_${String(frame).padStart(4, '0')}.webp`
  }, [])

  const logoSrc = currentFrame >= 408 ? '/images/logo_site_white.png' : '/images/logo_site_black.png'
  
  const getLogoOpacity = useCallback(() => {
    if (currentFrame >= 1 && currentFrame < 102) return 1
    if (currentFrame >= 102 && currentFrame < 408) return 0
    if (currentFrame >= 408) return 1
    return 0
  }, [currentFrame])

  const sectionNames = ['Главная', 'О нас', 'Услуги', 'Навыки', 'Контакты']

  return (
    <div className="app" ref={containerRef}>
      {/* Логотип */}
      <img 
        src={logoSrc} 
        alt="Moon Monk" 
        className="logo"
        style={{ opacity: getLogoOpacity() }}
      />

      {/* Навигация */}
      <nav className="page-navigation">
        {snapPoints.map((point, index) => (
          <div 
            key={index}
            className={`nav-item ${activeSection === index ? 'active' : ''}`}
            onClick={() => navigateToSection(index)}
            data-section={index}
          >
            <div className="nav-dot"></div>
            <div className="nav-label">{sectionNames[index]}</div>
          </div>
        ))}
      </nav>

      {/* Фиксированный фон */}
      <div 
        className="background-frame"
        style={{
          backgroundImage: `url(${getFramePath(currentFrame)})`
        }}
      />

      {/* Контейнер для контента */}
      <div className="content-container">
        <Section1 isVisible={currentFrame >= 1 && currentFrame < 102} />
        <Section2 isVisible={currentFrame >= 102 && currentFrame < 204} />
        <Section3 isVisible={currentFrame >= 204 && currentFrame < 306} />
        <Section4 isVisible={currentFrame >= 306 && currentFrame < 408} />
        <Section5 isVisible={currentFrame >= 408} />
      </div>
    </div>
  )
}

export default App