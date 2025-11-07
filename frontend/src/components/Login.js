import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

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
      setError(error.response?.data?.error || 'Что-то пошло не так.. обратитесь к администратору');
    }
  };

  return (
    <div className="login-container">
      <h2>{isLogin ? 'Логин' : 'Регистрация'}</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>
        {error && <div className="error" style={{color: 'red'}}>{error}</div>}
        <button type="submit" className="btn btn-primary">
          {isLogin ? 'Логин' : 'Регистрация'}
        </button>
      </form>
      <p>
        {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт ? "}
        <button 
          type="button" 
          className="btn-link"
          onClick={() => setIsLogin(!isLogin)}
          style={{background: 'none', border: 'none', color: '#3498db', cursor: 'pointer'}}
        >
          {isLogin ? 'Регистрация' : 'Логин'}
        </button>
      </p>
    </div>
  );
};

export default Login;