import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const TaskManager = () => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        progress: 0,
        hours_per_week: 0,
        load_per_month: 0
    });
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/tasks');
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            alert('Error fetching tasks: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const createTask = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await api.post('/api/tasks', newTask);
            
            setTasks(prevTasks => [response.data, ...prevTasks]);
            
            setNewTask({
                title: '',
                description: '',
                progress: 0,
                hours_per_week: 0,
                load_per_month: 0
            });
            
            // Дополнительно обновляем с сервера для гарантии
            setTimeout(() => {
                fetchTasks();
            }, 100);
            
        } catch (error) {
            console.error('Ошибка в создании задачи:', error);
            alert('Ошибка в создании задачи: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const updateProgress = async (taskId, progress) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            await api.put(`/api/tasks/${taskId}`, {
                ...task,
                progress
            });
            
            setTasks(prevTasks => 
                prevTasks.map(t => 
                    t.id === taskId ? { ...t, progress } : t
                )
            );
            
        } catch (error) {
            console.error('Ошибка в обновлении задачи:', error);
            alert('Ошибка в обновлении задачи: ' + (error.response?.data?.error || error.message));
        }
    };

    const deleteTask = async (taskId) => {
        if (!window.confirm('Вы уверены, что хотите удалить задачу ?')) {
            return;
        }

        try {
            await api.delete(`/api/tasks/${taskId}`);
            
            setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
            
        } catch (error) {
            console.error('Ошибка в удалении задачи:', error);
            alert('Ошибка в удалении задачи: ' + (error.response?.data?.error || error.message));
        }
    };

    const canDeleteTask = (task) => {
        if (user.role === 'admin') return true;
        if (user.role === 'manager' && task.department === user.department) return true;
        return task.user_id === user.id;
    };

    return (
        <div className="task-manager">
            <h2>Nexus TM (DEMO)</h2>
            
            <form onSubmit={createTask} className="task-form">
                <h3>Создать задачу</h3>
                <input
                    type="text"
                    placeholder="Название"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    required
                    disabled={loading}
                />
                <textarea
                    placeholder="Описание"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    disabled={loading}
                />
                <div className="form-group">
                    <label>Прогресс: {newTask.progress}%</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={newTask.progress}
                        onChange={(e) => setNewTask({...newTask, progress: parseInt(e.target.value)})}
                        disabled={loading}
                    />
                </div>
                <input
                    type="number"
                    placeholder="Часов потрачено"
                    value={newTask.hours_per_week}
                    onChange={(e) => setNewTask({...newTask, hours_per_week: parseFloat(e.target.value)})}
                    step="0.5"
                    min="0"
                    disabled={loading}
                />
                <input
                    type="number"
                    placeholder="Нагрузка от задачи на месяц в %"
                    value={newTask.load_per_month}
                    onChange={(e) => setNewTask({...newTask, load_per_month: parseInt(e.target.value)})}
                    min="0"
                    max="100"
                    disabled={loading}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Создание...' : 'Создать задачу'}
                </button>
            </form>

            <div className="tasks-list">
                <h3>Задачи {loading && '(Загрузка...)'}</h3>
                
                {tasks.length === 0 && !loading ? (
                    <p>Задачи не найдены. Создайте первую</p>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className="task-card">
                            <div className="task-header">
                                <h4>{task.title}</h4>
                                <div className="task-actions">
                                    {(user.role === 'admin' || user.role === 'manager') && (
                                        <span className="task-meta">by {task.username} ({task.department})</span>
                                    )}
                                    {canDeleteTask(task) && (
                                        <button 
                                            className="delete-btn"
                                            onClick={() => deleteTask(task.id)}
                                            disabled={loading}
                                        >
                                            Удалить
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p>{task.description}</p>
                            <div className="task-progress">
                                <label>Прогресс: {task.progress}%</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={task.progress}
                                    onChange={(e) => updateProgress(task.id, parseInt(e.target.value))}
                                    disabled={loading}
                                />
                            </div>
                            <div className="task-stats">
                                <span>Часов: {task.hours_per_week}</span>
                                <span>Нагрузка: {task.load_per_month}%</span>
                                <span>Создана: {new Date(task.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TaskManager;