import React from 'react'

function Section4({ isVisible }) {
  const skills = [
    'Web Development',
    'UI/UX Design',
    'Mobile Development',
    'Branding',
    'Marketing',
    'SEO Optimization',
    'Content Creation',
    'Analytics'
  ]

  return (
    <div className={`section ${isVisible ? 'visible' : ''}`}>
      <div className="section-content section4-content">
        <h2 className="section4-title">Какие у нас навыки</h2>
        <div className="skills-list">
          {skills.map((skill, index) => (
            <div key={index} className="skill-item">
              {skill}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Section4