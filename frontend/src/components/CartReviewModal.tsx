import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { cartApi } from '../api/cart';
import { ordersApi } from '../api/orders';
import MenuBrowser from './MenuBrowser';
import type { Cart, CartItem, MenuItem } from '../types';

interface CartReviewModalProps {
  cart: Cart | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const CartReviewModal: React.FC<CartReviewModalProps> = ({ cart, isOpen, onClose, onSubmit }) => {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [showAddItems, setShowAddItems] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cart) {
      setCartItems(cart.items);
      setCartTotal(cart.total_amount);
    }
  }, [cart]);

  if (!isOpen || !cart) return null;

  const handleQuantityChange = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      setIsLoading(true);
      setError(null);
      await cartApi.updateItem(cart.id, item.id, { quantity: newQuantity });

      // Reload cart to get updated total
      const updatedCart = await cartApi.getCart(cart.id);
      setCartItems(updatedCart.items);
      setCartTotal(updatedCart.total_amount);
    } catch (err) {
      console.error('Failed to update quantity:', err);
      setError('Failed to update quantity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await cartApi.removeItem(cart.id, itemId);

      // Reload cart to get updated items and total
      const updatedCart = await cartApi.getCart(cart.id);
      setCartItems(updatedCart.items);
      setCartTotal(updatedCart.total_amount);
    } catch (err) {
      console.error('Failed to remove item:', err);
      setError('Failed to remove item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (
    menuItem: MenuItem,
    quantity: number,
    modifierIds: number[],
    specialInstructions: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const modifiers = menuItem.modifiers
        ? menuItem.modifiers.filter(m => modifierIds.includes(m.id))
        : [];

      await cartApi.addItem(cart.id, {
        menuItemId: menuItem.id,
        quantity,
        modifiers: modifiers.length > 0 ? modifiers : undefined,
        specialInstructions: specialInstructions || undefined
      });

      // Reload cart
      const updatedCart = await cartApi.getCart(cart.id);
      setCartItems(updatedCart.items);
      setCartTotal(updatedCart.total_amount);
      setShowAddItems(false);
    } catch (err) {
      console.error('Failed to add item:', err);
      setError('Failed to add item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitToKitchen = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await ordersApi.submitToKitchen(cart.id);
      onSubmit();
    } catch (err) {
      console.error('Failed to submit order:', err);
      setError('Failed to submit order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              Review Order - Table {cart.table_number || cart.table_id}
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditMode(!editMode)}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  editMode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {editMode ? 'Done Editing' : 'Edit Cart'}
              </button>
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
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-8 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {showAddItems && editMode ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Add Items</h3>
                <button
                  onClick={() => setShowAddItems(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Back to Cart
                </button>
              </div>
              {user?.store_id && (
                <MenuBrowser storeId={user.store_id} onSelectItem={handleAddItem} />
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <strong className="text-lg flex-1">{item.name}</strong>
                      {editMode && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isLoading}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      {editMode ? (
                        <>
                          <span>Quantity:</span>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            disabled={isLoading || item.quantity <= 1}
                            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            disabled={isLoading}
                            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            +
                          </button>
                          <span>× ${item.unit_price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span>Quantity: {item.quantity} × ${item.unit_price.toFixed(2)}</span>
                      )}
                      <span className="ml-auto font-semibold text-indigo-600">
                        ${(item.unit_price * item.quantity).toFixed(2)}
                      </span>
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

              {editMode && (
                <button
                  onClick={() => setShowAddItems(true)}
                  disabled={isLoading}
                  className="w-full py-3 mb-6 bg-indigo-100 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-200 transition-colors"
                >
                  + Add More Items
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!showAddItems && (
          <div className="px-8 py-6 border-t">
            <div className="text-xl font-bold mb-6 p-4 bg-gray-100 rounded-lg">
              Total: ${cartTotal.toFixed(2)}
            </div>

            <div className="flex gap-4">
              <button
                onClick={onClose}
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
                disabled={isLoading || editMode}
                className={`
                  flex-[2] py-3 text-white rounded-lg font-semibold transition-colors
                  ${isLoading || editMode
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600'
                  }
                `}
              >
                {isLoading ? 'Submitting...' : editMode ? 'Finish Editing to Submit' : 'Submit to Kitchen'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartReviewModal;
