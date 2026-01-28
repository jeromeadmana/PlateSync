import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tablesApi } from '../api/tables';
import { ordersApi } from '../api/orders';
import MenuBrowser from './MenuBrowser';
import type { Table, MenuItem } from '../types';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderNumber: string) => void;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  modifiers: Array<{ id: number; name: string; extra_price: number }>;
  specialInstructions: string;
}

const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user?.store_id) {
      loadTables();
    }
  }, [isOpen, user]);

  const loadTables = async () => {
    try {
      const allTables = await tablesApi.getTables();
      setTables(allTables);
    } catch (err) {
      console.error('Failed to load tables:', err);
      setError('Failed to load tables');
    }
  };

  const handleAddItem = (
    menuItem: MenuItem,
    quantity: number,
    modifierIds: number[],
    specialInstructions: string
  ) => {
    const modifiers = menuItem.modifiers
      ? menuItem.modifiers.filter(m => modifierIds.includes(m.id))
      : [];

    const newItem: OrderItem = {
      menuItem,
      quantity,
      modifiers,
      specialInstructions
    };

    setOrderItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateItemTotal = (item: OrderItem): number => {
    const basePrice = item.menuItem.base_price * item.quantity;
    const modifiersPrice = item.modifiers.reduce(
      (sum, mod) => sum + mod.extra_price * item.quantity,
      0
    );
    return basePrice + modifiersPrice;
  };

  const calculateTotal = (): number => {
    return orderItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const handleSubmitOrder = async () => {
    if (!selectedTableId) {
      setError('Please select a table');
      return;
    }

    if (orderItems.length === 0) {
      setError('Please add at least one item');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const items = orderItems.map(item => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        modifiers: item.modifiers.length > 0 ? item.modifiers : undefined,
        specialInstructions: item.specialInstructions || undefined
      }));

      const result = await ordersApi.createManualOrder(selectedTableId, items);
      onSuccess(result.orderNumber);
      handleClose();
    } catch (err) {
      console.error('Failed to create order:', err);
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedTableId(null);
    setOrderItems([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Create New Order</h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Table Selection */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Select Table</label>
            <select
              value={selectedTableId || ''}
              onChange={(e) => setSelectedTableId(Number(e.target.value))}
              disabled={loading}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Choose a table...</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  Table {table.table_number} - {table.status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-8 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Menu Browser */}
          <div className="flex-1 p-8 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Browse Menu</h3>
            {user?.store_id && (
              <MenuBrowser storeId={user.store_id} onSelectItem={handleAddItem} />
            )}
          </div>

          {/* Order Summary */}
          <div className="w-96 border-l p-6 flex flex-col">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>

            {orderItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                No items added yet
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {orderItems.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <strong className="flex-1">{item.menuItem.name}</strong>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        disabled={loading}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      Quantity: {item.quantity} × ${item.menuItem.base_price.toFixed(2)}
                    </div>
                    {item.modifiers.length > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        Add-ons: {item.modifiers.map(m => m.name).join(', ')}
                      </div>
                    )}
                    {item.specialInstructions && (
                      <div className="text-sm text-orange-600 mt-1 italic">
                        Note: {item.specialInstructions}
                      </div>
                    )}
                    <div className="text-right font-semibold mt-2 text-indigo-600">
                      ${calculateItemTotal(item).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span className="text-indigo-600">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitOrder}
              disabled={loading || !selectedTableId || orderItems.length === 0}
              className={`
                w-full py-3 rounded-lg font-semibold transition-colors
                ${loading || !selectedTableId || orderItems.length === 0
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-green-500 hover:bg-green-600 text-white'
                }
              `}
            >
              {loading ? 'Submitting...' : 'Submit to Kitchen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualOrderModal;
