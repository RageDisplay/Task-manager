import React from 'react';
import api from '../utils/api'; // Импортируем api
import { useAuth } from '../contexts/AuthContext';

const Reports = () => {
    const { user } = useAuth();

    const downloadReport = async (type) => {
        try {
            const response = await api.get(`/api/reports/${type}`, { // Используем api
                responseType: 'blob'
            });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      let filename = '';
      switch (type) {
        case 'my-tasks':
          filename = 'my_tasks.xlsx';
          break;
        case 'department-tasks':
          filename = 'department_tasks.xlsx';
          break;
        case 'all-tasks':
          filename = 'all_tasks.xlsx';
          break;
        default:
          filename = 'report.xlsx';
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
            console.error('Error downloading report:', error);
            alert('Error downloading report: ' + (error.response?.data?.error || error.message));
        }
    };

  return (
    <div className="reports-section">
      <h2>Reports</h2>
      <p>Download task reports in Excel format.</p>
      
      <div className="report-options">
        <button 
          className="btn btn-primary"
          onClick={() => downloadReport('my-tasks')}
        >
          Download My Tasks
        </button>

        {(user.role === 'manager' || user.role === 'admin') && (
          <button 
            className="btn btn-secondary"
            onClick={() => downloadReport('department-tasks')}
          >
            Download Department Tasks
          </button>
        )}

        {user.role === 'admin' && (
          <button 
            className="btn btn-secondary"
            onClick={() => downloadReport('all-tasks')}
          >
            Download All Tasks
          </button>
        )}
      </div>
    </div>
  );
};

export default Reports;