import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <nav className="navigation">
      <div className="nav-content">
        <div className="nav-brand">
          Task Management System
        </div>
        <div className="nav-links">
          {user ? (
            <>
              <span className="nav-user">Hello, {user.username} ({user.role})</span>
              <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
                Dashboard
              </Link>
              <Link to="/tasks" className={location.pathname === '/tasks' ? 'active' : ''}>
                Tasks
              </Link>
              <Link to="/reports" className={location.pathname === '/reports' ? 'active' : ''}>
                Reports
              </Link>
              {user.role === 'admin' && (
                <Link to="/users" className={location.pathname === '/users' ? 'active' : ''}>
                  User Management
                </Link>
              )}
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;