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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-6 py-6 shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome! Table {tableId}
          </h1>
          <button
            onClick={() => setShowCart(!showCart)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
          >
            Cart ({cartItemCount}) - ${cartTotal.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-12 py-8 rounded-xl text-2xl font-semibold z-[1000] shadow-2xl">
          Server has been notified!
        </div>
      )}

      {/* Cart Panel */}
      {showCart && (
        <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[200] flex flex-col">
          <div className="px-6 py-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
            <button
              onClick={() => setShowCart(false)}
              className="text-4xl text-gray-500 hover:text-gray-700 leading-none"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {cart?.items.length === 0 ? (
              <p className="text-center text-gray-400 mt-8">Your cart is empty</p>
            ) : (
              cart?.items.map(item => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-lg mb-3">
                  <div className="flex justify-between items-start mb-2">
                    <strong className="text-lg">{item.name}</strong>
                    <span className="font-semibold text-indigo-600">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Quantity: {item.quantity} × ${item.unit_price.toFixed(2)}
                  </div>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="text-sm text-gray-600 mb-2">
                      {item.modifiers.map(mod => mod.name).join(', ')}
                    </div>
                  )}
                  <button
                    onClick={() => removeItem(tableNumber, item.id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="px-6 py-6 border-t border-gray-200">
            <div className="text-xl font-bold mb-4">
              Total: ${cartTotal.toFixed(2)}
            </div>
            <button
              onClick={handleCallServer}
              disabled={cartItemCount === 0}
              className={`
                w-full py-4 text-lg font-semibold rounded-lg transition-colors
                ${cartItemCount === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
                }
              `}
            >
              Call Server
            </button>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="p-6">
        {Object.entries(groupedByCategory).map(([catId, items]) => (
          <div key={catId} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {items[0]?.category_id || 'Other Items'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.filter(item => item.status === 'active').map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-white rounded-xl p-6 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                >
                  <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="text-xl font-bold text-indigo-600">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[300] p-4">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full max-h-[80vh] overflow-auto">
            <h2 className="text-2xl font-bold mb-2">{selectedItem.name}</h2>
            <p className="text-gray-600 mb-4">{selectedItem.description}</p>
            <div className="text-2xl font-bold text-indigo-600 mb-6">
              ${selectedItem.base_price.toFixed(2)}
            </div>

            {selectedItem.modifiers && selectedItem.modifiers.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Modifiers:</h3>
                {selectedItem.modifiers.map(mod => (
                  <label key={mod.id} className="flex items-center mb-2 cursor-pointer">
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
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="ml-3">
                      {mod.name} (+${mod.extra_price.toFixed(2)})
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div className="mb-6">
              <label className="block font-medium mb-2">
                Special Instructions:
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="No onions, extra sauce, etc."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical min-h-[80px]"
              />
            </div>

            <div className="mb-6">
              <label className="block font-medium mb-2">
                Quantity:
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                className="px-4 py-3 text-lg border-2 border-gray-300 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setQuantity(1);
                  setSelectedModifiers([]);
                  setSpecialInstructions('');
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCart}
                className="flex-[2] py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
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
