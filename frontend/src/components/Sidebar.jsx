import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <nav className="cyber-sidebar">
      <div className="sidebar-header">
        <div className="logo-glitch">AI_HUB</div>
      </div>
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="icon">🏠</span> HOME
        </NavLink>
        <NavLink to="/soc" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="icon">🛡️</span> SECURITY OPS
        </NavLink>
        <NavLink to="/meetings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="icon">🎙️</span> MEETINGS
        </NavLink>
      </div>
      <div className="sidebar-footer">
        <div className="system-load">LOAD: 14%</div>
      </div>
    </nav>
  );
};

export default Sidebar;
