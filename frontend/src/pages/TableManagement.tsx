import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/admin';
import { createTableSession } from '../middleware/tableToken';

interface Table {
  id: number;
  store_id: number;
  table_number: string;
  status: 'available' | 'occupied' | 'reserved';
  tablet_url: string | null;
  created_at: string;
  updated_at: string;
}

const TableManagement: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedTableToken, setSelectedTableToken] = useState<{ tableId: number; token: string; url: string } | null>(null);

  // Form states
  const [formTableNumber, setFormTableNumber] = useState('');
  const [formStatus, setFormStatus] = useState<'available' | 'occupied' | 'reserved'>('available');
  const [formTabletUrl, setFormTabletUrl] = useState('');

  useEffect(() => {
    loadTables();
  }, [filterStatus]);

  const loadTables = async () => {
    try {
      const data = await adminApi.getTables(filterStatus || undefined);
      setTables(data);
    } catch (err) {
      console.error('Failed to load tables:', err);
      setError('Failed to load tables');
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await adminApi.createTable({
        tableNumber: formTableNumber,
        status: formStatus,
        tabletUrl: formTabletUrl || undefined
      });

      await loadTables();
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create table');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;

    setLoading(true);
    setError(null);

    try {
      await adminApi.updateTable(editingTable.id, {
        tableNumber: formTableNumber,
        status: formStatus,
        tabletUrl: formTabletUrl || undefined
      });

      await loadTables();
      setEditingTable(null);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update table');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    if (!confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await adminApi.deleteTable(tableId);
      await loadTables();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete table');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateToken = async (tableId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3000/api/customer/table-session/${tableId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ hoursValid: 8 })
      });

      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const data = await response.json();
      const token = data.data.token;
      const url = `${window.location.origin}/kiosk?token=${token}`;

      setSelectedTableToken({
        tableId,
        token,
        url
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormTableNumber('');
    setFormStatus('available');
    setFormTabletUrl('');
  };

  const startEdit = (table: Table) => {
    setEditingTable(table);
    setFormTableNumber(table.table_number);
    setFormStatus(table.status);
    setFormTabletUrl(table.tablet_url || '');
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingTable(null);
    setShowForm(false);
    resetForm();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Table Management</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingTable(null);
            resetForm();
          }}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          + Add Table
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Filter by Status</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
        </select>
      </div>

      {/* Table Form */}
      {(showForm || editingTable) && (
        <form onSubmit={editingTable ? handleUpdateTable : handleCreateTable} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-4 text-lg">{editingTable ? 'Edit Table' : 'Create New Table'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Table Number *</label>
              <input
                type="text"
                value={formTableNumber}
                onChange={(e) => setFormTableNumber(e.target.value)}
                required
                placeholder="e.g., 1, A1, VIP-1"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status *</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                required
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Tablet URL (Optional)</label>
              <input
                type="text"
                value={formTabletUrl}
                onChange={(e) => setFormTabletUrl(e.target.value)}
                placeholder="Custom URL for this table's tablet"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={loading}
                className="flex-1 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Token Modal */}
      {selectedTableToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Table Session Token Generated</h3>
            <p className="text-gray-600 mb-4">
              This token is valid for 8 hours. Copy the URL and open it on the tablet device.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Token:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={selectedTableToken.token}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(selectedTableToken.token)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Full URL:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={selectedTableToken.url}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(selectedTableToken.url)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Copy URL
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedTableToken(null)}
              className="w-full py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <div key={table.id} className="p-4 border rounded-lg bg-gray-50">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-bold">Table {table.table_number}</h3>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-2 ${
                  table.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : table.status === 'occupied'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {table.status}
                </span>
              </div>
            </div>

            {table.tablet_url && (
              <p className="text-xs text-gray-600 mb-3 truncate">
                URL: {table.tablet_url}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleGenerateToken(table.id)}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50"
              >
                Generate Token
              </button>
              <button
                onClick={() => startEdit(table)}
                disabled={loading}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm disabled:opacity-50"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteTable(table.id)}
                disabled={loading}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No tables found. Add your first table to get started.
        </div>
      )}
    </div>
  );
};

export default TableManagement;
