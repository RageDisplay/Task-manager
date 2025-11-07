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
            
            setMessage('Выгрузка бекапа завершена');
            setError('');
        } catch (error) {
            console.error('Ошибка в скачивании бекапа:', error);
            setError('Ошибка в скачивании бекапа: ' + (error.response?.data?.error || error.message));
            setMessage('');
        }
    };

    const handleRestore = async (e) => {
        e.preventDefault();
        if (!restoreFile) {
            setError('Выберите файл бекапа');
            return;
        }

        if (!window.confirm('Внимание! Это перезапишет текущую конфигурацию. Вы уверены в этом?')) {
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

            setMessage(response.data.message || 'База данных восстановлена.');
            setError('');
            setRestoreFile(null);
            document.getElementById('restore-file').value = '';
        } catch (error) {
            console.error('Ошибка в восстановлении из бекапа:', error);
            setError('Ошибка в восстановлении из бекапа: ' + (error.response?.data?.error || error.message));
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
            <h2>Система создания и восстановления из бекапа</h2>
            
            <div className="backup-options">
                <div className="backup-card">
                    <h3>Скачать файл бекапа</h3>
                    <p>Создать бекап.</p>
                    <button 
                        className="btn btn-primary"
                        onClick={downloadBackup}
                    >
                        Скачать файл бекапа
                    </button>
                </div>

                <div className="backup-card">
                    <h3>Восстановление из бекапа</h3>
                    <p>Восстановление из бекапа (.db формат только).</p>
                    
                    <form onSubmit={handleRestore} className="restore-form">
                        <div className="form-group">
                            <input
                                id="restore-file"
                                type="file"
                                accept=".db"
                                onChange={(e) => setRestoreFile(e.target.files[0])}
                            />
                            <small>Только .db файлы допустимы</small>
                        </div>
                        
                        <button 
                            type="submit" 
                            className="btn btn-warning"
                            disabled={!restoreFile}
                        >
                            Восстановить
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