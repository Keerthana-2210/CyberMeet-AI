import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="cyber-home">
      <div className="hero-section container">
        <div className="glitch-wrapper">
          <h1 className="glitch" data-text="ENTERPRISE_AI.v1">ENTERPRISE_AI.v1</h1>
        </div>
        <p className="hero-desc">
          The ultimate unified platform for <span className="highlight">Security Intelligence</span> and <span className="highlight">Operational Efficiency</span>.
        </p>
        
        <div className="hero-grid">
          <div className="cyber-panel module-choice">
            <div className="module-icon">🛡️</div>
            <h3>Security Center</h3>
            <p>Phishing detection, real-time threat analysis, and automated SOC incident management.</p>
            <Link to="/soc" className="btn-cyber btn-module">LAUNCH_SOC</Link>
          </div>
          
          <div className="cyber-panel module-choice">
            <div className="module-icon">🎙️</div>
            <h3>Meeting Assistant</h3>
            <p>Audio recording analysis, AI summarization, and automated task extraction for teams.</p>
            <Link to="/meetings" className="btn-cyber btn-module">LAUNCH_ASST</Link>
          </div>
        </div>

        <div className="cta-wrapper">
          <div className="system-ready">SYSTEM_STATUS: <span className="status-glow">ALL_MODULES_ONLINE</span></div>
        </div>
      </div>
      
      <div className="scanline"></div>
    </div>
  );
};

export default Home;
