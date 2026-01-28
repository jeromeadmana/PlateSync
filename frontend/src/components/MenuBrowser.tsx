import React, { useState, useEffect } from 'react';
import type { MenuItem } from '../types';

interface MenuBrowserProps {
  storeId: number;
  onSelectItem: (item: MenuItem, quantity: number, modifiers: number[], specialInstructions: string) => void;
}

const MenuBrowser: React.FC<MenuBrowserProps> = ({ storeId, onSelectItem }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<number[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMenu();
  }, [storeId]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:3000/api/customer/menu/${storeId}`);
      const data = await response.json();
      if (data.success) {
        setMenuItems(data.data);
      } else {
        setError('Failed to load menu');
      }
    } catch (err) {
      console.error('Failed to load menu:', err);
      setError('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setQuantity(1);
    setSelectedModifiers([]);
    setSpecialInstructions('');
  };

  const handleModifierToggle = (modifierId: number) => {
    setSelectedModifiers(prev =>
      prev.includes(modifierId)
        ? prev.filter(id => id !== modifierId)
        : [...prev, modifierId]
    );
  };

  const handleAddItem = () => {
    if (selectedItem) {
      onSelectItem(selectedItem, quantity, selectedModifiers, specialInstructions);
      setSelectedItem(null);
      setQuantity(1);
      setSelectedModifiers([]);
      setSpecialInstructions('');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading menu...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  // Group items by category
  const categories = menuItems.reduce((acc, item) => {
    const category = item.category_name || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="flex gap-4">
      {/* Menu Items List */}
      <div className="flex-1 max-h-96 overflow-y-auto border rounded-lg p-4">
        {Object.entries(categories).map(([category, items]) => (
          <div key={category} className="mb-6">
            <h3 className="text-lg font-bold mb-2 text-gray-700">{category}</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedItem?.id === item.id
                      ? 'bg-indigo-100 border-indigo-500'
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                      )}
                    </div>
                    <div className="font-semibold text-indigo-600">
                      ${item.base_price.toFixed(2)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Item Details Panel */}
      {selectedItem && (
        <div className="w-80 border rounded-lg p-4">
          <h3 className="text-xl font-bold mb-2">{selectedItem.name}</h3>
          <p className="text-gray-600 mb-4">{selectedItem.description}</p>
          <p className="text-lg font-semibold text-indigo-600 mb-4">
            ${selectedItem.base_price.toFixed(2)}
          </p>

          {/* Quantity */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                -
              </button>
              <span className="w-12 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                +
              </button>
            </div>
          </div>

          {/* Modifiers */}
          {selectedItem.modifiers && selectedItem.modifiers.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Add-ons</label>
              <div className="space-y-2">
                {selectedItem.modifiers.map((modifier) => (
                  <label
                    key={modifier.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedModifiers.includes(modifier.id)}
                      onChange={() => handleModifierToggle(modifier.id)}
                      className="rounded"
                    />
                    <span className="flex-1">{modifier.name}</span>
                    <span className="text-sm text-gray-600">
                      +${modifier.extra_price.toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Special Instructions</label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
              placeholder="Any special requests?"
            />
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddItem}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
          >
            Add to Order
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuBrowser;
