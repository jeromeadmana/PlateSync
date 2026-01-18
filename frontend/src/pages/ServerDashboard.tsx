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
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#333' }}>Server Dashboard</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#666' }}>Welcome, {user?.name}</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Clock Out
        </button>
      </div>

      <div style={{ padding: '2rem' }}>
        {/* Pending Reviews */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>
            Tables Ready to Order ({pendingCarts.length})
          </h2>

          {pendingCarts.length === 0 ? (
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#999'
            }}>
              No tables waiting for service
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {pendingCarts.map(cart => (
                <div
                  key={cart.id}
                  style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '2px solid #ff9800'
                  }}
                >
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#ff9800' }}>
                    Table {cart.table_id}
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
                    {cart.items?.length || 0} items - ${cart.total_amount.toFixed(2)}
                  </p>
                  <button
                    onClick={() => handleViewCart(cart.id)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
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
          <h2 style={{ marginBottom: '1rem' }}>Active Orders ({activeOrders.length})</h2>

          {activeOrders.length === 0 ? (
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#999'
            }}>
              No active orders
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {activeOrders.map(order => (
                <div
                  key={order.id}
                  style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>Order #{order.order_number}</h3>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                    Table {order.table_number}
                  </p>
                  <p style={{ margin: 0, color: '#666' }}>
                    {order.items.length} items - ${order.total_amount.toFixed(2)}
                  </p>
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.5rem',
                    background: '#fff3cd',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#856404'
                  }}>
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>Review Order - Table {selectedCart.table_id}</h2>

            <div style={{ marginBottom: '1.5rem' }}>
              {selectedCart.items.map((item) => (
                <div key={item.id} style={{
                  padding: '1rem',
                  background: '#f9f9f9',
                  borderRadius: '6px',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{item.name}</strong>
                    <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    Quantity: {item.quantity} × ${item.unit_price.toFixed(2)}
                  </div>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                      Modifiers: {item.modifiers.map(mod => mod.name).join(', ')}
                    </div>
                  )}
                  {item.special_instructions && (
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#ff9800',
                      marginTop: '0.25rem',
                      fontStyle: 'italic'
                    }}>
                      Note: {item.special_instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
              padding: '1rem',
              background: '#f0f0f0',
              borderRadius: '6px'
            }}>
              Total: ${selectedCart.total_amount.toFixed(2)}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setSelectedCart(null)}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: '#e0e0e0',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitToKitchen}
                disabled={isLoading}
                style={{
                  flex: 2,
                  padding: '1rem',
                  background: isLoading ? '#999' : '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
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
