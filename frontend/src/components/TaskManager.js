import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/tasks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const createTask = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8080/api/tasks', newTask, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewTask({
                title: '',
                description: '',
                progress: 0,
                hours_per_week: 0,
                load_per_month: 0
            });
            fetchTasks();
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Error creating task: ' + error.response?.data?.error || error.message);
        }
    };

    const updateProgress = async (taskId, progress) => {
        try {
            const token = localStorage.getItem('token');
            const task = tasks.find(t => t.id === taskId);
            await axios.put(`http://localhost:8080/api/tasks/${taskId}`, {
                ...task,
                progress
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTasks();
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Error updating task: ' + error.response?.data?.error || error.message);
        }
    };

    const deleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8080/api/tasks/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Error deleting task: ' + error.response?.data?.error || error.message);
        }
    };

    const canDeleteTask = (task) => {
        // Пользователь может удалять только свои задачи, если он не админ или менеджер
        if (user.role === 'admin') return true;
        if (user.role === 'manager' && task.department === user.department) return true;
        return task.user_id === user.id;
    };

    return (
        <div className="task-manager">
            <h2>Task Management</h2>
            
            {/* Форма создания задачи */}
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

            {/* Список задач */}
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