import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [savingDepartments, setSavingDepartments] = useState({});
    const [departmentChanges, setDepartmentChanges] = useState({});
    const [deletingUsers, setDeletingUsers] = useState({});
    const { user: currentUser } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/users');
            setUsers(response.data);
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
        setDepartmentChanges(prev => ({
            ...prev,
            [userId]: newDepartment
        }));
    };

    const saveDepartment = async (userId) => {
        const newDepartment = departmentChanges[userId];
        
        if (!newDepartment || newDepartment.trim() === '') {
            alert('Отдел не может быть пустым');
            return;
        }

        try {
            setSavingDepartments(prev => ({ ...prev, [userId]: true }));
            
            await api.put(`/api/users/${userId}/department`, { 
                department: newDepartment.trim()
            });
            
            setUsers(prevUsers => 
                prevUsers.map(u => 
                    u.id === userId ? { ...u, department: newDepartment.trim() } : u
                )
            );
            
            setDepartmentChanges(prev => {
                const newChanges = { ...prev };
                delete newChanges[userId];
                return newChanges;
            });
            
        } catch (error) {
            console.error('Ошибка в обновлении отдела:', error);
            alert('Ошибка в обновлении отдела: ' + (error.response?.data?.error || 'Unknown error'));
        } finally {
            setSavingDepartments(prev => ({ ...prev, [userId]: false }));
        }
    };

    const cancelDepartmentChange = (userId) => {
        setDepartmentChanges(prev => {
            const newChanges = { ...prev };
            delete newChanges[userId];
            return newChanges;
        });
    };

    const deleteUser = async (userId, username) => {
        if (!window.confirm(`Вы уверены, что хотите удалить пользователя "${username}"? Это действие нельзя отменить.`)) {
            return;
        }

        try {
            setDeletingUsers(prev => ({ ...prev, [userId]: true }));
            
            const response = await api.delete(`/api/users/${userId}`);
            
            alert(response.data.message || `Пользователь ${username} успешно удалён`);
            
            // Удаляем пользователя из списка
            setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
            
        } catch (error) {
            console.error('Ошибка удаления пользователя:', error);
            const errorMessage = error.response?.data?.error || 'Unknown error';
            alert('Ошибка удаления пользователя: ' + errorMessage);
        } finally {
            setDeletingUsers(prev => ({ ...prev, [userId]: false }));
        }
    };

    const getCurrentDepartment = (userItem) => {
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

    // Нельзя удалить самого себя
    const canDeleteUser = (userItem) => {
        return userItem.id !== currentUser.id;
    };

    return (
        <div>
            <h2>Настройка пользователей {loading && '(Загрузка...)'}</h2>
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
                                        {userItem.role}
                                    </span>
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={getCurrentDepartment(userItem)}
                                        onChange={(e) => handleDepartmentChange(userItem.id, e.target.value)}
                                        placeholder="Настройка отдела"
                                        style={{padding: '5px', marginRight: '10px', width: '150px'}}
                                        disabled={loading}
                                    />
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
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
                                                    {savingDepartments[userItem.id] ? 'Сохранение...' : 'Save'}
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
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                        {canDeleteUser(userItem) && (
                                            <button 
                                                className="btn-delete"
                                                onClick={() => deleteUser(userItem.id, userItem.username)}
                                                disabled={deletingUsers[userItem.id]}
                                                style={{
                                                    padding: '3px 8px',
                                                    fontSize: '12px',
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    cursor: deletingUsers[userItem.id] ? 'not-allowed' : 'pointer',
                                                    marginTop: '5px'
                                                }}
                                            >
                                                {deletingUsers[userItem.id] ? 'Удаление...' : 'Delete'}
                                            </button>
                                        )}
                                        {!canDeleteUser(userItem) && (
                                            <span style={{ fontSize: '12px', color: '#6c757d' }}>
                                                Current user
                                            </span>
                                        )}
                                    </div>
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