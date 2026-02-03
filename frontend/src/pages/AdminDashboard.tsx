import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MenuManagement from './MenuManagement';
import UserManagement from './UserManagement';
import TableManagement from './TableManagement';

type TabType = 'menu' | 'users' | 'tables';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('menu');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/quick-login');
      return;
    }

    // Check if user has admin role
    const adminRoles = ['super_admin', 'company_admin', 'store_admin'];
    if (!adminRoles.includes(user.role)) {
      navigate('/quick-login');
      return;
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/quick-login');
  };

  const tabs = [
    { id: 'menu' as TabType, label: 'Menu Management', icon: '🍽️' },
    { id: 'users' as TabType, label: 'User Management', icon: '👥' },
    { id: 'tables' as TabType, label: 'Table Management', icon: '🪑' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-6 py-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {user?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-6 py-3 font-medium transition-colors border-b-2
                ${activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {activeTab === 'menu' && <MenuManagement />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'tables' && <TableManagement />}
      </div>
    </div>
  );
};

export default AdminDashboard;
