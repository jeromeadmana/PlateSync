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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white p-12 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Clock In</h1>
        <p className="text-gray-600 mb-8">Enter your Employee ID</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-4 py-4 text-2xl text-center tracking-widest font-mono border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="0000"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full py-4 text-lg font-semibold text-white rounded-lg
              transition-all duration-200
              ${isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
              }
            `}
          >
            {isLoading ? 'Verifying...' : 'Clock In'}
          </button>
        </form>

        {employees.length > 0 && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Available Staff:
            </p>
            <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
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
