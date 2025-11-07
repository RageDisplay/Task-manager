import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [savingDepartments, setSavingDepartments] = useState({}); // Состояние сохранения по пользователю
    const [departmentChanges, setDepartmentChanges] = useState({}); // Временные изменения
    const { user } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/users');
            setUsers(response.data);
            // Сбрасываем временные изменения при загрузке
            setDepartmentChanges({});
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Error fetching users: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (userId, newRole) => {
        try {
            setLoading(true);
            await api.put(`/api/users/${userId}/role`, { 
                role: newRole 
            });
            
            // Мгновенно обновляем роль в UI
            setUsers(prevUsers => 
                prevUsers.map(u => 
                    u.id === userId ? { ...u, role: newRole } : u
                )
            );
            
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Error updating user role: ' + error.response?.data?.error);
        } finally {
            setLoading(false);
        }
    };

    const handleDepartmentChange = (userId, newDepartment) => {
        // Сохраняем временное изменение без отправки на сервер
        setDepartmentChanges(prev => ({
            ...prev,
            [userId]: newDepartment
        }));
    };

    const saveDepartment = async (userId) => {
        const newDepartment = departmentChanges[userId];
        
        if (!newDepartment || newDepartment.trim() === '') {
            alert('Department cannot be empty');
            return;
        }

        try {
            setSavingDepartments(prev => ({ ...prev, [userId]: true }));
            
            await api.put(`/api/users/${userId}/department`, { 
                department: newDepartment.trim()
            });
            
            // Обновляем UI после успешного сохранения
            setUsers(prevUsers => 
                prevUsers.map(u => 
                    u.id === userId ? { ...u, department: newDepartment.trim() } : u
                )
            );
            
            // Убираем временное изменение
            setDepartmentChanges(prev => {
                const newChanges = { ...prev };
                delete newChanges[userId];
                return newChanges;
            });
            
        } catch (error) {
            console.error('Error updating user department:', error);
            alert('Error updating user department: ' + (error.response?.data?.error || 'Unknown error'));
        } finally {
            setSavingDepartments(prev => ({ ...prev, [userId]: false }));
        }
    };

    const cancelDepartmentChange = (userId) => {
        // Отменяем временное изменение
        setDepartmentChanges(prev => {
            const newChanges = { ...prev };
            delete newChanges[userId];
            return newChanges;
        });
    };

    const getCurrentDepartment = (userItem) => {
        // Возвращаем временное значение если есть, иначе оригинальное
        return departmentChanges[userItem.id] !== undefined 
            ? departmentChanges[userItem.id] 
            : userItem.department || '';
    };

    const hasUnsavedChanges = (userItem) => {
        return departmentChanges[userItem.id] !== undefined;
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
            <h2>Настройка пользователей {loading && '(Loading...)'}</h2>
            <div className="users-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Department</th>
                            <th>Actions</th>
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
                                        disabled={loading}
                                    >
                                        <option value="user">Сотрудник</option>
                                        <option value="manager">Руководитель</option>
                                        <option value="admin">Админ</option>
                                    </select>
                                    <span className={`role-badge ${getRoleBadgeClass(userItem.role)}`}>
                                        {"  "}
                                    </span>
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={getCurrentDepartment(userItem)}
                                        onChange={(e) => handleDepartmentChange(userItem.id, e.target.value)}
                                        placeholder="Enter department"
                                        style={{padding: '5px', marginRight: '10px', width: '150px'}}
                                        disabled={loading}
                                    />
                                </td>
                                <td>
                                    {hasUnsavedChanges(userItem) && (
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button 
                                                className="btn-save"
                                                onClick={() => saveDepartment(userItem.id)}
                                                disabled={savingDepartments[userItem.id]}
                                                style={{
                                                    padding: '3px 8px',
                                                    fontSize: '12px',
                                                    backgroundColor: '#28a745',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    cursor: savingDepartments[userItem.id] ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {savingDepartments[userItem.id] ? 'Saving...' : 'Save'}
                                            </button>
                                            <button 
                                                className="btn-cancel"
                                                onClick={() => cancelDepartmentChange(userItem.id)}
                                                disabled={savingDepartments[userItem.id]}
                                                style={{
                                                    padding: '3px 8px',
                                                    fontSize: '12px',
                                                    backgroundColor: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    cursor: savingDepartments[userItem.id] ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                Отмена
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td>{new Date(userItem.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && !loading && <p>Пользователи не найдены.</p>}
            </div>
        </div>
    );
};

export default UserManagement;