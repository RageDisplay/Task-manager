import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    department: ''
  });
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // Список доступных отделов
  const departments = [
    { value: '', label: 'Выбор отдела', disabled: true },
    { value: 'ОП', label: 'ОП' },
    { value: 'ОВ', label: 'ОВ' },
    { value: 'РП', label: 'РП' },
    { value: 'ГИП', label: 'ГИП' },
    { value: 'ПС', label: 'ПС' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const response = await api.post(endpoint, formData);
      
      if (response.data.token) {
        login(response.data.user, response.data.token);
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Something went wrong');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      department: ''
    });
    setError('');
  };

  return (
    <div className="login-container">
      <h2>{isLogin ? 'Авторизация' : 'Регистрация'}</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label>Имя пользователя</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Пароль</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>
        
        {/* Поле отдела только для регистрации */}
        {!isLogin && (
          <div className="form-group">
            <label>Отдел</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              required={!isLogin}
            >
              {departments.map(dept => (
                <option 
                  key={dept.value} 
                  value={dept.value} 
                  disabled={dept.disabled}
                >
                  {dept.label}
                </option>
              ))}
            </select>
            <small className="form-help">
              Пожалуйста, выберите свой отдел
            </small>
          </div>
        )}
        
        {error && <div className="error">{error}</div>}
        <button type="submit" className="btn btn-primary">
          {isLogin ? 'Авторизация' : 'Регистрация'}
        </button>
      </form>
      <p>
        {isLogin ? "Нет аккаунта ? " : "Уже есть аккаунт ? "}
        <button 
          type="button" 
          className="btn-link"
          onClick={() => {
            setIsLogin(!isLogin);
            resetForm();
          }}
        >
          {isLogin ? 'Регистрация' : 'Авторизация'}
        </button>
      </p>
    </div>
  );
};

export default Login;