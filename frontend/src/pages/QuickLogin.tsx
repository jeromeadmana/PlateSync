import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth';
import type { User } from '../types';

const QuickLogin: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [employees, setEmployees] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user, quickLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadEmployees = async () => {
      try {
        const data = await authApi.getEmployees(user.company_id, user.store_id || undefined);
        setEmployees(data);
      } catch (err) {
        console.error('Failed to load employees:', err);
      }
    };

    loadEmployees();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setIsLoading(true);

    try {
      await quickLogin(user.company_id, employeeId);

      const updatedUser = employees.find(emp => emp.employee_id === employeeId);
      if (updatedUser) {
        switch (updatedUser.role) {
          case 'server':
            navigate('/server');
            break;
          case 'cook':
            navigate('/kitchen');
            break;
          default:
            navigate('/server');
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', color: '#333' }}>Clock In</h1>
        <p style={{ marginBottom: '2rem', color: '#666' }}>Enter your Employee ID</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#333' }}>
              Employee ID
            </label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              autoFocus
              maxLength={6}
              pattern="[0-9]{4,6}"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.5rem',
                textAlign: 'center',
                letterSpacing: '0.25rem',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                boxSizing: 'border-box',
                fontFamily: 'monospace'
              }}
              placeholder="0000"
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '6px',
              color: '#c33',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'white',
              background: isLoading ? '#999' : '#667eea',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {isLoading ? 'Verifying...' : 'Clock In'}
          </button>
        </form>

        {employees.length > 0 && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '6px' }}>
            <p style={{ fontSize: '0.875rem', color: '#666', fontWeight: 500, marginBottom: '0.5rem' }}>
              Available Staff:
            </p>
            <ul style={{ fontSize: '0.8rem', color: '#888', margin: 0, paddingLeft: '1.5rem' }}>
              {employees.slice(0, 5).map(emp => (
                <li key={emp.id}>
                  {emp.name} ({emp.employee_id}) - {emp.role}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickLogin;
