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
          Nexus TM (DEMO)
        </div>
        <div className="nav-links">
          {user ? (
            <>
              <span className="nav-user">Привет, {user.username} ({user.role})</span>
              <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
                Дешборд
              </Link>
              <Link to="/tasks" className={location.pathname === '/tasks' ? 'active' : ''}>
                Задачи
              </Link>
              <Link to="/reports" className={location.pathname === '/reports' ? 'active' : ''}>
                Отчёты
              </Link>
              {user.role === 'admin' && (
    <>
              <Link to="/users" className={location.pathname === '/users' ? 'active' : ''}>
                  Настройка пользователей
              </Link>
              <Link to="/backup" className={location.pathname === '/backup' ? 'active' : ''}>
                  Бекап
              </Link>
    </>
          )}
              <button onClick={handleLogout} className="logout-btn">Выход</button>
            </>
          ) : (
            <Link to="/login">Вход</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;