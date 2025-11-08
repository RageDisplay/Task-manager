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
    const [editingTask, setEditingTask] = useState(null);
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
            
            await fetchTasks();

            setNewTask({
                title: '',
                description: '',
                progress: 0,
                hours_per_week: 0,
                load_per_month: 0
            });
            
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Error creating task: ' + (error.response?.data?.error || error.message));
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
            console.error('Error updating task progress:', error);
            alert('Error updating task progress: ' + (error.response?.data?.error || error.message));
        }
    };

    const updateHoursPerWeek = async (taskId, hoursPerWeek) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            await api.put(`/api/tasks/${taskId}`, {
                ...task,
                hours_per_week: parseFloat(hoursPerWeek) || 0
            });
            
            setTasks(prevTasks => 
                prevTasks.map(t => 
                    t.id === taskId ? { ...t, hours_per_week: parseFloat(hoursPerWeek) || 0 } : t
                )
            );
            
        } catch (error) {
            console.error('Error updating hours per week:', error);
            alert('Error updating hours per week: ' + (error.response?.data?.error || error.message));
        }
    };

    const updateLoadPerMonth = async (taskId, loadPerMonth) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            await api.put(`/api/tasks/${taskId}`, {
                ...task,
                load_per_month: parseInt(loadPerMonth) || 0
            });
            
            setTasks(prevTasks => 
                prevTasks.map(t => 
                    t.id === taskId ? { ...t, load_per_month: parseInt(loadPerMonth) || 0 } : t
                )
            );
            
        } catch (error) {
            console.error('Error updating load per month:', error);
            alert('Error updating load per month: ' + (error.response?.data?.error || error.message));
        }
    };

    const startEditing = (task) => {
        setEditingTask({ ...task });
    };

    const cancelEditing = () => {
        setEditingTask(null);
    };

    const saveTask = async (taskId) => {
        if (!editingTask) return;

        try {
            await api.put(`/api/tasks/${taskId}`, editingTask);
            
            setTasks(prevTasks => 
                prevTasks.map(t => 
                    t.id === taskId ? { ...t, ...editingTask } : t
                )
            );
            
            setEditingTask(null);
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Error updating task: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleEditChange = (field, value) => {
        setEditingTask(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const deleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            await api.delete(`/api/tasks/${taskId}`);
            setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Error deleting task: ' + (error.response?.data?.error || error.message));
        }
    };

    const canDeleteTask = (task) => {
        if (user.role === 'admin') return true;
        if (user.role === 'manager' && task.department === user.department) return true;
        return task.user_id === user.id;
    };

    const canEditTask = (task) => {
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
                    disabled={loading}
                />
                <textarea
                    placeholder="Description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    disabled={loading}
                />
                <div className="form-group">
                    <label>Progress: {newTask.progress}%</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={newTask.progress}
                        onChange={(e) => setNewTask({...newTask, progress: parseInt(e.target.value)})}
                        disabled={loading}
                    />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Hours per Week</label>
                        <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={newTask.hours_per_week}
                            onChange={(e) => setNewTask({...newTask, hours_per_week: parseFloat(e.target.value) || 0})}
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Load per Month (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={newTask.load_per_month}
                            onChange={(e) => setNewTask({...newTask, load_per_month: parseInt(e.target.value) || 0})}
                            disabled={loading}
                        />
                    </div>
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Task'}
                </button>
            </form>

            <div className="tasks-list">
                <h3>Tasks {loading && '(Loading...)'}</h3>
                
                {tasks.length === 0 && !loading ? (
                    <p>No tasks found. Create your first task!</p>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className="task-card">
                            <div className="task-header">
                                {editingTask && editingTask.id === task.id ? (
                                    <input
                                        type="text"
                                        value={editingTask.title}
                                        onChange={(e) => handleEditChange('title', e.target.value)}
                                        className="edit-input"
                                    />
                                ) : (
                                    <h4>{task.title}</h4>
                                )}
                                <div className="task-actions">
                                    {(user.role === 'admin' || user.role === 'manager') && (
                                        <span className="task-meta">by {task.username} ({task.department})</span>
                                    )}
                                    {canEditTask(task) && (
                                        <>
                                            {editingTask && editingTask.id === task.id ? (
                                                <>
                                                    <button 
                                                        className="btn-save"
                                                        onClick={() => saveTask(task.id)}
                                                    >
                                                        Save
                                                    </button>
                                                    <button 
                                                        className="btn-cancel"
                                                        onClick={cancelEditing}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    className="btn-edit"
                                                    onClick={() => startEditing(task)}
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {canDeleteTask(task) && (
                                        <button 
                                            className="delete-btn"
                                            onClick={() => deleteTask(task.id)}
                                            disabled={loading}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {editingTask && editingTask.id === task.id ? (
                                <textarea
                                    value={editingTask.description}
                                    onChange={(e) => handleEditChange('description', e.target.value)}
                                    className="edit-textarea"
                                />
                            ) : (
                                <p>{task.description}</p>
                            )}
                            
                            <div className="task-progress">
                                <label>Progress: {task.progress}%</label>
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
                                <div className="stat-item">
                                    <label>Hours/Week: </label>
                                    {editingTask && editingTask.id === task.id ? (
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            value={editingTask.hours_per_week}
                                            onChange={(e) => handleEditChange('hours_per_week', parseFloat(e.target.value) || 0)}
                                            className="edit-number"
                                        />
                                    ) : (
                                        <span 
                                            className="editable-field"
                                            onClick={() => canEditTask(task) && startEditing(task)}
                                            title={canEditTask(task) ? "Click to edit" : ""}
                                        >
                                            {task.hours_per_week}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="stat-item">
                                    <label>Monthly Load: </label>
                                    {editingTask && editingTask.id === task.id ? (
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={editingTask.load_per_month}
                                            onChange={(e) => handleEditChange('load_per_month', parseInt(e.target.value) || 0)}
                                            className="edit-number"
                                        />
                                    ) : (
                                        <span 
                                            className="editable-field"
                                            onClick={() => canEditTask(task) && startEditing(task)}
                                            title={canEditTask(task) ? "Click to edit" : ""}
                                        >
                                            {task.load_per_month}%
                                        </span>
                                    )}
                                </div>
                                
                                <div className="stat-item">
                                    <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TaskManager;