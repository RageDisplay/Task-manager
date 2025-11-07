import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.username}!</p>
      <div className="dashboard">
        <div className="dashboard-card">
          <h3>Your Role</h3>
          <div className="number">{user?.role}</div>
        </div>
        <div className="dashboard-card">
          <h3>Department</h3>
          <div className="number">{user?.department || 'Not assigned'}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;