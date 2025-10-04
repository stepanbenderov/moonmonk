import React from 'react'

function Section2({ isVisible }) {
  return (
    <div className={`section ${isVisible ? 'visible' : ''}`}>
      <div className="section-content section2-content">
        <h2 className="section2-title">Кто мы</h2>
        <div className="team-photo">
          Фото команды
        </div>
      </div>
    </div>
  )
}

export default Section2