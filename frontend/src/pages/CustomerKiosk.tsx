import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { customerApi } from '../api/customer';
import { useCartStore } from '../store/cartStore';
import type { MenuItem } from '../types';

const CustomerKiosk: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<number[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { cart, loadCart, addItem, removeItem, callServer } = useCartStore();

  const tableNumber = parseInt(tableId || '0', 10);

  useEffect(() => {
    if (tableNumber) {
      loadMenu();
      loadCart(tableNumber);
    }
  }, [tableNumber]);

  const loadMenu = async () => {
    try {
      const data = await customerApi.getMenu(tableNumber);
      setMenuItems(data);
    } catch (error) {
      console.error('Failed to load menu:', error);
    }
  };

  const groupedByCategory = menuItems.reduce((acc, item) => {
    const catId = item.category_id?.toString() || 'uncategorized';
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const handleAddToCart = async () => {
    if (!selectedItem) return;

    const modifiers = selectedItem.modifiers
      ?.filter(mod => selectedModifiers.includes(mod.id))
      .map(mod => ({
        id: mod.id,
        name: mod.name,
        extra_price: mod.extra_price
      })) || [];

    try {
      await addItem(tableNumber, selectedItem.id, quantity, modifiers, specialInstructions);
      setSelectedItem(null);
      setQuantity(1);
      setSelectedModifiers([]);
      setSpecialInstructions('');
      setShowCart(true);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleCallServer = async () => {
    try {
      await callServer(tableNumber);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to call server:', error);
    }
  };

  const cartTotal = cart?.total_amount || 0;
  const cartItemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#333' }}>
            Welcome! Table {tableId}
          </h1>
          <button
            onClick={() => setShowCart(!showCart)}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            Cart ({cartItemCount}) - ${cartTotal.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#4caf50',
          color: 'white',
          padding: '2rem 3rem',
          borderRadius: '12px',
          fontSize: '1.5rem',
          fontWeight: 600,
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          Server has been notified!
        </div>
      )}

      {/* Cart Panel */}
      {showCart && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '400px',
          background: 'white',
          boxShadow: '-4px 0 12px rgba(0,0,0,0.2)',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Your Cart</h2>
            <button
              onClick={() => setShowCart(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
            {cart?.items.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', marginTop: '2rem' }}>Your cart is empty</p>
            ) : (
              cart?.items.map(item => (
                <div key={item.id} style={{
                  padding: '1rem',
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{item.name}</strong>
                    <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                    Quantity: {item.quantity} × ${item.unit_price.toFixed(2)}
                  </div>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                      {item.modifiers.map(mod => mod.name).join(', ')}
                    </div>
                  )}
                  <button
                    onClick={() => removeItem(tableNumber, item.id)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '1.5rem', borderTop: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
              Total: ${cartTotal.toFixed(2)}
            </div>
            <button
              onClick={handleCallServer}
              disabled={cartItemCount === 0}
              style={{
                width: '100%',
                padding: '1rem',
                background: cartItemCount === 0 ? '#ccc' : '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.125rem',
                fontWeight: 600,
                cursor: cartItemCount === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Call Server
            </button>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div style={{ padding: '1.5rem' }}>
        {Object.entries(groupedByCategory).map(([catId, items]) => (
          <div key={catId} style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', color: '#333' }}>
              {items[0]?.category_id || 'Other Items'}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {items.filter(item => item.status === 'active').map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                >
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{item.name}</h3>
                  <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.875rem' }}>
                    {item.description}
                  </p>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#667eea' }}>
                    ${item.base_price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
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
          zIndex: 300
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>{selectedItem.name}</h2>
            <p style={{ color: '#666' }}>{selectedItem.description}</p>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#667eea', marginBottom: '1.5rem' }}>
              ${selectedItem.base_price.toFixed(2)}
            </div>

            {selectedItem.modifiers && selectedItem.modifiers.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3>Modifiers:</h3>
                {selectedItem.modifiers.map(mod => (
                  <label key={mod.id} style={{ display: 'block', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedModifiers.includes(mod.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedModifiers([...selectedModifiers, mod.id]);
                        } else {
                          setSelectedModifiers(selectedModifiers.filter(id => id !== mod.id));
                        }
                      }}
                    />
                    {' '}{mod.name} (+${mod.extra_price.toFixed(2)})
                  </label>
                ))}
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Special Instructions:
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="No onions, extra sauce, etc."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  resize: 'vertical',
                  minHeight: '80px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Quantity:
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                style={{
                  padding: '0.75rem',
                  fontSize: '1.125rem',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  width: '100px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setQuantity(1);
                  setSelectedModifiers([]);
                  setSpecialInstructions('');
                }}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: '#e0e0e0',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCart}
                style={{
                  flex: 2,
                  padding: '0.875rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerKiosk;
