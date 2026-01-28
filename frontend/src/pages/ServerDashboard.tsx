import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { ordersApi } from '../api/orders';
import ManualOrderModal from '../components/ManualOrderModal';
import CartReviewModal from '../components/CartReviewModal';
import EditOrderModal from '../components/EditOrderModal';
import type { Cart, Order } from '../types';
import { SOCKET_EVENTS } from '../types';

const ServerDashboard: React.FC = () => {
  const [pendingCarts, setPendingCarts] = useState<Cart[]>([]);
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);

  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'server') {
      navigate('/quick-login');
      return;
    }

    loadData();
  }, [user, navigate]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for customer calling server
    socket.on(SOCKET_EVENTS.CART_READY_FOR_REVIEW, (cart: Cart) => {
      console.log('Customer called server at table:', cart.table_number);
      setPendingCarts(prev => [...prev, cart]);
      // Show browser notification
      showNotification(`Table ${cart.table_number} needs attention!`);
    });

    // Listen for order status changes
    socket.on(SOCKET_EVENTS.ORDER_STATUS_CHANGE, (updatedOrder: Order) => {
      setActiveOrders(prev =>
        prev.map(o => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    });

    return () => {
      socket.off(SOCKET_EVENTS.CART_READY_FOR_REVIEW);
      socket.off(SOCKET_EVENTS.ORDER_STATUS_CHANGE);
    };
  }, [socket, isConnected]);

  const showNotification = (message: string) => {
    // Request browser notification permission if not granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('PlateSync - Server Alert', {
        body: message,
        icon: '/favicon.ico'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('PlateSync - Server Alert', {
            body: message,
            icon: '/favicon.ico'
          });
        }
      });
    }
  };

  const loadData = async () => {
    try {
      setError(null);
      const [carts, orders] = await Promise.all([
        ordersApi.getPendingReviews(),
        ordersApi.getOrders({ status: 'received' })
      ]);
      setPendingCarts(carts || []);
      setActiveOrders(orders || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setPendingCarts([]);
      setActiveOrders([]);
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

  const handleLogout = async () => {
    await logout();
    navigate('/quick-login');
  };

  const handleManualOrderSuccess = (orderNumber: string) => {
    alert(`Order ${orderNumber} created successfully!`);
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-6 py-6 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Server Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome, {user?.name}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowManualOrderModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            + Create New Order
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Clock Out
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

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
                    {order.items?.length || order.item_count || 0} items - ${order.total_amount?.toFixed(2) || '0.00'}
                  </p>
                  <div className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded text-sm font-semibold text-center mb-3">
                    Status: {order.status}
                  </div>
                  {order.status === 'received' && (
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Edit Order
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Review Modal */}
      <CartReviewModal
        cart={selectedCart}
        isOpen={!!selectedCart}
        onClose={() => setSelectedCart(null)}
        onSubmit={() => {
          setSelectedCart(null);
          loadData();
        }}
      />

      {/* Manual Order Modal */}
      <ManualOrderModal
        isOpen={showManualOrderModal}
        onClose={() => setShowManualOrderModal(false)}
        onSuccess={handleManualOrderSuccess}
      />

      {/* Edit Order Modal */}
      <EditOrderModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onSuccess={() => {
          setSelectedOrder(null);
          loadData();
        }}
      />
    </div>
  );
};

export default ServerDashboard;
