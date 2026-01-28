import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi } from '../api/orders';
import MenuBrowser from './MenuBrowser';
import type { Order, MenuItem } from '../types';

interface EditOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [showAddItems, setShowAddItems] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      loadOrder();
    }
  }, [order]);

  const loadOrder = async () => {
    if (!order) return;
    try {
      const fullOrder = await ordersApi.getOrder(order.id);
      setCurrentOrder(fullOrder);
    } catch (err) {
      console.error('Failed to load order:', err);
      setError('Failed to load order details');
    }
  };

  if (!isOpen || !order) return null;

  const canEdit = order.status === 'received';

  const handleAddItem = async (
    menuItem: MenuItem,
    quantity: number,
    modifierIds: number[],
    specialInstructions: string
  ) => {
    if (!order) return;

    try {
      setIsLoading(true);
      setError(null);

      const modifiers = menuItem.modifiers
        ? menuItem.modifiers.filter(m => modifierIds.includes(m.id))
        : [];

      await fetch(`http://localhost:3000/api/orders/${order.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          menuItemId: menuItem.id,
          quantity,
          modifiers: modifiers.length > 0 ? modifiers : undefined,
          specialInstructions: specialInstructions || undefined
        })
      });

      await loadOrder();
      setShowAddItems(false);
    } catch (err) {
      console.error('Failed to add item:', err);
      setError('Failed to add item to order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!order) return;

    if (!confirm('Are you sure you want to remove this item from the order?')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await fetch(`http://localhost:3000/api/orders/${order.id}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      await loadOrder();
    } catch (err) {
      console.error('Failed to remove item:', err);
      setError('Failed to remove item from order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      setIsLoading(true);
      setError(null);

      await fetch(`http://localhost:3000/api/orders/${order.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ reason: cancelReason })
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setError('Failed to cancel order');
    } finally {
      setIsLoading(false);
      setShowCancelConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Edit Order #{order.order_number}</h2>
              <p className="text-gray-600 mt-1">
                Table {order.table_number} • Status: {order.status}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!canEdit && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg">
              This order cannot be edited because it is already being prepared.
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-8 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {showAddItems && canEdit ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Add Items</h3>
                <button
                  onClick={() => setShowAddItems(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Back to Order
                </button>
              </div>
              {user?.store_id && (
                <MenuBrowser storeId={user.store_id} onSelectItem={handleAddItem} />
              )}
            </div>
          ) : showCancelConfirm ? (
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-bold mb-4 text-red-600">Cancel Order?</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Reason for cancellation (optional)</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="e.g., Customer changed mind, wrong order, etc."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelConfirm(false);
                    setCancelReason('');
                  }}
                  disabled={isLoading}
                  className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={isLoading}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  {isLoading ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {currentOrder?.items?.map((item) => (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <strong className="text-lg flex-1">{item.name}</strong>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-indigo-600">
                          ${(item.unit_price * item.quantity).toFixed(2)}
                        </span>
                        {canEdit && item.status === 'pending' && (
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isLoading}
                            className="text-red-500 hover:text-red-700"
                            title="Remove item"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      Quantity: {item.quantity} × ${item.unit_price.toFixed(2)} • Status: {item.status}
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        Modifiers: {item.modifiers.map(mod => mod.name).join(', ')}
                      </div>
                    )}
                    {item.special_instructions && (
                      <div className="text-sm text-orange-600 mt-1 italic">
                        Note: {item.special_instructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {canEdit && (
                <button
                  onClick={() => setShowAddItems(true)}
                  disabled={isLoading}
                  className="w-full py-3 mb-4 bg-indigo-100 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-200 transition-colors"
                >
                  + Add More Items
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!showAddItems && !showCancelConfirm && (
          <div className="px-8 py-6 border-t">
            <div className="text-xl font-bold mb-6 p-4 bg-gray-100 rounded-lg">
              Total: ${currentOrder?.total_amount?.toFixed(2) || order.total_amount.toFixed(2)}
            </div>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 bg-gray-200 rounded-lg font-medium hover:bg-gray-300"
              >
                Close
              </button>
              {canEdit && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
                >
                  Cancel Order
                </button>
              )}
              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                disabled={isLoading}
                className="flex-[2] py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditOrderModal;
