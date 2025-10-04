import React from 'react'

function Section1({ isVisible }) {
  return (
    <div className={`section ${isVisible ? 'visible' : ''}`}>
      <div className="section-content section1-content">
        <div className="section1-quote">
          То, что мы есть сегодня,— это следствие наших вчерашних мыслей, а сегодняшние мысли создают завтрашную жизнь. Жизнь — это порождение нашего разума.
        </div>
        <div className="section1-author">
          Сиддхартха Гаутама (Будда)
        </div>
        <div className="section1-title">
          <span className="line1">Наша команда</span>
          <span className="line2">для развития</span>
          <span className="line3">вашего дела</span>
        </div>
      </div>
    </div>
  )
}

export default Section1