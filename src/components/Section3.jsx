import React from 'react'

function Section3({ isVisible }) {
  return (
    <div className={`section ${isVisible ? 'visible' : ''}`}>
      <div className="section-content section3-content">
        <h2 className="section3-title">Что мы делаем</h2>
        <div className="landings-grid">
          <div className="landing-card"><span>Лендинг 1</span></div>
          <div className="landing-card"><span>Лендинг 2</span></div>
          <div className="landing-card"><span>Лендинг 3</span></div>
          <div className="landing-card"><span>Лендинг 4</span></div>
        </div>
      </div>
    </div>
  )
}

export default Section3