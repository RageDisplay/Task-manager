import React, { useState, useEffect } from 'react';
import api from '../utils/api'; // Импортируем api
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
    const { user } = useAuth();

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await api.get('/api/tasks'); // Используем api
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const createTask = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/tasks', newTask); // Используем api
            // ... остальной код без изменений ...
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    const updateProgress = async (taskId, progress) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            await api.put(`/api/tasks/${taskId}`, { // Используем api
                ...task,
                progress
            });
            fetchTasks();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const deleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            await api.delete(`/api/tasks/${taskId}`); // Используем api
            fetchTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const canDeleteTask = (task) => {
        if (user.role === 'admin') return true;
        if (user.role === 'manager' && task.department === user.department) return true;
        return task.user_id === user.id;
    };

    return (
        <div className="task-manager">
            <h2>Task Management</h2>
            
            <form onSubmit={createTask} className="task-form">
                <h3>Create New Task</h3>
                <input
                    type="text"
                    placeholder="Title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    required
                />
                <textarea
                    placeholder="Description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                />
                <div className="form-group">
                    <label>Progress: {newTask.progress}%</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={newTask.progress}
                        onChange={(e) => setNewTask({...newTask, progress: parseInt(e.target.value)})}
                    />
                </div>
                <input
                    type="number"
                    placeholder="Hours per Week"
                    value={newTask.hours_per_week}
                    onChange={(e) => setNewTask({...newTask, hours_per_week: parseFloat(e.target.value)})}
                    step="0.5"
                    min="0"
                />
                <input
                    type="number"
                    placeholder="Load per Month %"
                    value={newTask.load_per_month}
                    onChange={(e) => setNewTask({...newTask, load_per_month: parseInt(e.target.value)})}
                    min="0"
                    max="100"
                />
                <button type="submit">Create Task</button>
            </form>

            <div className="tasks-list">
                <h3>Tasks</h3>
                {tasks.map(task => (
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
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                        <p>{task.description}</p>
                        <div className="task-progress">
                            <label>Progress: {task.progress}%</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={task.progress}
                                onChange={(e) => updateProgress(task.id, parseInt(e.target.value))}
                            />
                        </div>
                        <div className="task-stats">
                            <span>Hours/Week: {task.hours_per_week}</span>
                            <span>Monthly Load: {task.load_per_month}%</span>
                            <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskManager;