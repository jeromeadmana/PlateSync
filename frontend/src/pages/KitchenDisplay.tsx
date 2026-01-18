import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi } from '../api/orders';
import type { Order } from '../types';

const KitchenDisplay: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'cook') {
      navigate('/quick-login');
      return;
    }

    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const loadOrders = async () => {
    try {
      const data = await ordersApi.getKitchenOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const handleItemStatusChange = async (itemId: number, status: string) => {
    try {
      await ordersApi.updateOrderItemStatus(itemId, status);
      loadOrders();
    } catch (error) {
      console.error('Failed to update item status:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/quick-login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'preparing': return '#2196f3';
      case 'ready': return '#4caf50';
      default: return '#999';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a', color: 'white' }}>
      {/* Header */}
      <div style={{
        background: '#2a2a2a',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Kitchen Display</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#aaa' }}>
            {orders.length} active orders
          </p>
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

      {/* Orders Grid */}
      <div style={{ padding: '2rem' }}>
        {orders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem',
            fontSize: '1.5rem',
            color: '#666'
          }}>
            No orders in queue
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {orders.map(order => (
              <div
                key={order.id}
                style={{
                  background: '#2a2a2a',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  border: '2px solid #444'
                }}
              >
                {/* Order Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #444'
                }}>
                  <div>
                    <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
                      #{order.order_number}
                    </h2>
                    <p style={{ margin: 0, color: '#aaa', fontSize: '1rem' }}>
                      Table {order.table_number}
                    </p>
                  </div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: getStatusColor(order.status),
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}>
                    {order.status.toUpperCase()}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  {order.items.map(item => (
                    <div
                      key={item.id}
                      style={{
                        marginBottom: '1rem',
                        padding: '1rem',
                        background: '#1a1a1a',
                        borderRadius: '8px',
                        border: `2px solid ${getStatusColor(item.status)}`
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem'
                      }}>
                        <div>
                          <strong style={{ fontSize: '1.125rem' }}>
                            {item.quantity}× {item.name}
                          </strong>
                        </div>
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          background: getStatusColor(item.status),
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {item.status}
                        </div>
                      </div>

                      {item.modifiers && item.modifiers.length > 0 && (
                        <div style={{
                          fontSize: '0.875rem',
                          color: '#ffeb3b',
                          marginBottom: '0.5rem'
                        }}>
                          <strong>Modifiers:</strong> {item.modifiers.map(mod => mod.name).join(', ')}
                        </div>
                      )}

                      {item.special_instructions && (
                        <div style={{
                          fontSize: '0.875rem',
                          color: '#ff9800',
                          marginBottom: '0.75rem',
                          padding: '0.5rem',
                          background: 'rgba(255, 152, 0, 0.1)',
                          borderRadius: '4px',
                          fontStyle: 'italic'
                        }}>
                          <strong>Note:</strong> {item.special_instructions}
                        </div>
                      )}

                      {/* Item Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {item.status === 'pending' && (
                          <button
                            onClick={() => handleItemStatusChange(item.id, 'preparing')}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              background: '#2196f3',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Start Cooking
                          </button>
                        )}

                        {item.status === 'preparing' && (
                          <button
                            onClick={() => handleItemStatusChange(item.id, 'ready')}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              background: '#4caf50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Mark Ready
                          </button>
                        )}

                        {item.status === 'ready' && (
                          <div style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: '#4caf50',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}>
                            ✓ Ready to Serve
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Timer */}
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: '#1a1a1a',
                  borderRadius: '6px',
                  textAlign: 'center',
                  color: '#aaa',
                  fontSize: '0.875rem'
                }}>
                  Order placed: {new Date(order.order_time).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;
