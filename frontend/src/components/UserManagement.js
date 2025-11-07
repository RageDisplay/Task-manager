import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/users/${userId}/role`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error updating user role: ' + error.response?.data?.error);
    }
  };

  const updateUserDepartment = async (userId, newDepartment) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/users/${userId}/department`, 
        { department: newDepartment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (error) {
      console.error('Error updating user department:', error);
      alert('Error updating user department: ' + error.response?.data?.error);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'role-admin';
      case 'manager': return 'role-manager';
      case 'user': return 'role-user';
      default: return '';
    }
  };

  return (
    <div>
      <h2>User Management</h2>
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Department</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map(userItem => (
              <tr key={userItem.id}>
                <td>{userItem.id}</td>
                <td>{userItem.username}</td>
                <td>
                  <select 
                    value={userItem.role} 
                    onChange={(e) => updateUserRole(userItem.id, e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <span className={`role-badge ${getRoleBadgeClass(userItem.role)}`}>
                    {userItem.role}
                  </span>
                </td>
                <td>
                  <input
                    type="text"
                    value={userItem.department || ''}
                    onChange={(e) => updateUserDepartment(userItem.id, e.target.value)}
                    placeholder="Enter department"
                    style={{padding: '5px', marginRight: '10px'}}
                  />
                </td>
                <td>{new Date(userItem.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;