import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">SafeGuard</h1>
          <div className="header-right">
            <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
              {connected ? '●' : '○'}
            </span>
            <span className="user-name">{user?.name}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </NavLink>
        <NavLink to="/journey" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📍</span>
          <span className="nav-label">Journey</span>
        </NavLink>
        <NavLink to="/sos" className={({ isActive }) => `nav-item sos-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🆘</span>
          <span className="nav-label">SOS</span>
        </NavLink>
        <NavLink to="/contacts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">👥</span>
          <span className="nav-label">Contacts</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;
