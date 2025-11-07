import React, { useState } from 'react';
import api from '../utils/api'; // Импортируем api
import { useAuth } from '../contexts/AuthContext';

const BackupManager = () => {
    const [restoreFile, setRestoreFile] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { user } = useAuth();

    const downloadBackup = async () => {
        try {
            const response = await api.get('/api/backup', { // Используем api
                responseType: 'blob'
            });


            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            link.setAttribute('download', `tasks_backup_${timestamp}.db`);
            
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            setMessage('Backup downloaded successfully');
            setError('');
        } catch (error) {
            console.error('Error downloading backup:', error);
            setError('Error downloading backup: ' + (error.response?.data?.error || error.message));
            setMessage('');
        }
    };

    const handleRestore = async (e) => {
        e.preventDefault();
        if (!restoreFile) {
            setError('Please select a database file');
            return;
        }

        if (!window.confirm('WARNING: This will replace the current database. Are you sure you want to continue?')) {
            return;
        }

        try {
            const formData = new FormData();
            formData.append('database', restoreFile);

            const response = await api.post('/api/restore', formData, { // Используем api
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage(response.data.message || 'Database restored successfully.');
            setError('');
            setRestoreFile(null);
            document.getElementById('restore-file').value = '';
        } catch (error) {
            console.error('Error restoring backup:', error);
            setError('Error restoring backup: ' + (error.response?.data?.error || error.message));
            setMessage('');
        }
    };

    if (user.role !== 'admin') {
        return (
            <div className="backup-section">
                <h2>Database Backup & Restore</h2>
                <p>Access denied. Admin privileges required.</p>
            </div>
        );
    }

    return (
        <div className="backup-section">
            <h2>Database Backup & Restore</h2>
            
            <div className="backup-options">
                <div className="backup-card">
                    <h3>Download Backup</h3>
                    <p>Create a backup of the current database.</p>
                    <button 
                        className="btn btn-primary"
                        onClick={downloadBackup}
                    >
                        Download Database Backup
                    </button>
                </div>

                <div className="backup-card">
                    <h3>Restore Backup</h3>
                    <p>Restore database from a backup file (.db format only).</p>
                    
                    <form onSubmit={handleRestore} className="restore-form">
                        <div className="form-group">
                            <input
                                id="restore-file"
                                type="file"
                                accept=".db"
                                onChange={(e) => setRestoreFile(e.target.files[0])}
                            />
                            <small>Only .db files are allowed</small>
                        </div>
                        
                        <button 
                            type="submit" 
                            className="btn btn-warning"
                            disabled={!restoreFile}
                        >
                            Restore Database
                        </button>
                    </form>
                </div>
            </div>

            {message && (
                <div className="alert alert-success">
                    {message}
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}
        </div>
    );
};

export default BackupManager;