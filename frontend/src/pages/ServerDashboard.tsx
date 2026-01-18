import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi } from '../api/orders';
import type { Cart, Order } from '../types';

const ServerDashboard: React.FC = () => {
  const [pendingCarts, setPendingCarts] = useState<Cart[]>([]);
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'server') {
      navigate('/quick-login');
      return;
    }

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [carts, orders] = await Promise.all([
        ordersApi.getPendingReviews(),
        ordersApi.getOrders({ status: 'received' })
      ]);
      setPendingCarts(carts);
      setActiveOrders(orders);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleViewCart = async (cartId: number) => {
    try {
      const cart = await ordersApi.getCartForReview(cartId);
      setSelectedCart(cart);
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  };

  const handleSubmitToKitchen = async () => {
    if (!selectedCart) return;

    setIsLoading(true);
    try {
      await ordersApi.submitToKitchen(selectedCart.id);
      setSelectedCart(null);
      loadData();
    } catch (error) {
      console.error('Failed to submit order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/quick-login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-6 py-6 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Server Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome, {user?.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
        >
          Clock Out
        </button>
      </div>

      <div className="p-8">
        {/* Pending Reviews */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Tables Ready to Order ({pendingCarts.length})
          </h2>

          {pendingCarts.length === 0 ? (
            <div className="bg-white p-8 rounded-lg text-center text-gray-400">
              No tables waiting for service
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingCarts.map(cart => (
                <div
                  key={cart.id}
                  className="bg-white p-6 rounded-lg shadow-md border-2 border-orange-500"
                >
                  <h3 className="text-xl font-bold text-orange-500 mb-2">
                    Table {cart.table_id}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {cart.items?.length || 0} items - ${cart.total_amount.toFixed(2)}
                  </p>
                  <button
                    onClick={() => handleViewCart(cart.id)}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Review Order
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Orders */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Active Orders ({activeOrders.length})
          </h2>

          {activeOrders.length === 0 ? (
            <div className="bg-white p-8 rounded-lg text-center text-gray-400">
              No active orders
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-white p-6 rounded-lg shadow-md"
                >
                  <h3 className="text-lg font-bold mb-1">
                    Order #{order.order_number}
                  </h3>
                  <p className="text-gray-600 mb-1">
                    Table {order.table_number}
                  </p>
                  <p className="text-gray-600 mb-3">
                    {order.items.length} items - ${order.total_amount.toFixed(2)}
                  </p>
                  <div className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded text-sm font-semibold text-center">
                    Status: {order.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Review Modal */}
      {selectedCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <h2 className="text-2xl font-bold mb-6">
              Review Order - Table {selectedCart.table_id}
            </h2>

            <div className="space-y-3 mb-6">
              {selectedCart.items.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <strong className="text-lg">{item.name}</strong>
                    <span className="font-semibold text-indigo-600">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Quantity: {item.quantity} × ${item.unit_price.toFixed(2)}
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

            <div className="text-xl font-bold mb-6 p-4 bg-gray-100 rounded-lg">
              Total: ${selectedCart.total_amount.toFixed(2)}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedCart(null)}
                disabled={isLoading}
                className={`
                  flex-1 py-3 bg-gray-200 rounded-lg font-medium
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}
                  transition-colors
                `}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitToKitchen}
                disabled={isLoading}
                className={`
                  flex-[2] py-3 text-white rounded-lg font-semibold transition-colors
                  ${isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600'
                  }
                `}
              >
                {isLoading ? 'Submitting...' : 'Submit to Kitchen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerDashboard;
