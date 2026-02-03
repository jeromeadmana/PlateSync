import React, { useState, useEffect } from 'react';
import { menuApi } from '../api/menu';
import { adminApi } from '../api/admin';
import type { Category, MenuItem } from '../types';

const MenuManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [categorySortOrder, setCategorySortOrder] = useState(0);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState<number | null>(null);
  const [itemStatus, setItemStatus] = useState<'active' | 'inactive' | 'sold_out'>('active');

  useEffect(() => {
    loadCategories();
    loadMenuItems();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await menuApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories');
    }
  };

  const loadMenuItems = async () => {
    try {
      const data = await adminApi.getMenuItems();
      setMenuItems(data);
    } catch (err) {
      console.error('Failed to load menu items:', err);
      setError('Failed to load menu items');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await adminApi.createCategory({
        name: categoryName,
        sortOrder: categorySortOrder
      });

      await loadCategories();
      setShowCategoryForm(false);
      setCategoryName('');
      setCategorySortOrder(0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setLoading(true);
    setError(null);

    try {
      await adminApi.updateCategory(editingCategory.id, {
        name: categoryName,
        sortOrder: categorySortOrder
      });

      await loadCategories();
      setEditingCategory(null);
      setCategoryName('');
      setCategorySortOrder(0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await adminApi.deleteCategory(categoryId);
      await loadCategories();
      if (selectedCategory === categoryId) {
        setSelectedCategory(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/menu/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          name: itemName,
          description: itemDescription,
          basePrice: parseFloat(itemPrice),
          categoryId: itemCategoryId,
          status: itemStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create menu item');
      }

      await loadMenuItems();
      setShowItemForm(false);
      resetItemForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3000/api/menu/items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          name: itemName,
          description: itemDescription,
          basePrice: parseFloat(itemPrice),
          categoryId: itemCategoryId,
          status: itemStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update menu item');
      }

      await loadMenuItems();
      setEditingItem(null);
      resetItemForm();
    } catch (err: any) {
      setError(err.message || 'Failed to update menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMenuItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3000/api/menu/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete menu item');
      }

      await loadMenuItems();
    } catch (err: any) {
      setError(err.message || 'Failed to delete menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (itemId: number, newStatus: string) => {
    setLoading(true);
    setError(null);

    try {
      await adminApi.updateMenuItemStatus(itemId, newStatus);
      await loadMenuItems();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const resetItemForm = () => {
    setItemName('');
    setItemDescription('');
    setItemPrice('');
    setItemCategoryId(null);
    setItemStatus('active');
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategorySortOrder(category.sort_order);
    setShowCategoryForm(false);
  };

  const startEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDescription(item.description || '');
    setItemPrice(item.base_price.toString());
    setItemCategoryId(item.category_id);
    setItemStatus(item.status as 'active' | 'inactive' | 'sold_out');
    setShowItemForm(false);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditingItem(null);
    setCategoryName('');
    setCategorySortOrder(0);
    resetItemForm();
  };

  const filteredItems = selectedCategory
    ? menuItems.filter(item => item.category_id === selectedCategory)
    : menuItems;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Categories Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Categories</h2>
          <button
            onClick={() => {
              setShowCategoryForm(true);
              setEditingCategory(null);
              setCategoryName('');
              setCategorySortOrder(0);
            }}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            + Add
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {(showCategoryForm || editingCategory) && (
          <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <input
                  type="number"
                  value={categorySortOrder}
                  onChange={(e) => setCategorySortOrder(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    cancelEdit();
                  }}
                  disabled={loading}
                  className="flex-1 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              selectedCategory === null ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            All Items
          </button>
          {categories.map((category) => (
            <div key={category.id} className="flex gap-2">
              <button
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-1 text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedCategory === category.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
              <button
                onClick={() => startEditCategory(category)}
                disabled={loading}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                title="Edit"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                disabled={loading}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Items Section */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Menu Items {selectedCategory && `(${categories.find(c => c.id === selectedCategory)?.name})`}
          </h2>
          <button
            onClick={() => {
              setShowItemForm(true);
              setEditingItem(null);
              resetItemForm();
            }}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            + Add Item
          </button>
        </div>

        {(showItemForm || editingItem) && (
          <form onSubmit={editingItem ? handleUpdateMenuItem : handleCreateMenuItem} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">{editingItem ? 'Edit Menu Item' : 'New Menu Item'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={itemCategoryId || ''}
                  onChange={(e) => setItemCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={itemStatus}
                  onChange={(e) => setItemStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="sold_out">Sold Out</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="col-span-2 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowItemForm(false);
                    cancelEdit();
                  }}
                  disabled={loading}
                  className="flex-1 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredItems.map((item) => (
            <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  <p className="text-indigo-600 font-semibold mt-2">${item.base_price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Category: {item.category_name || 'None'}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <select
                    value={item.status}
                    onChange={(e) => handleQuickStatusChange(item.id, e.target.value)}
                    disabled={loading}
                    className={`px-3 py-1 rounded-lg font-medium text-sm border ${
                      item.status === 'active'
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : item.status === 'sold_out'
                        ? 'bg-orange-100 text-orange-800 border-orange-300'
                        : 'bg-gray-100 text-gray-800 border-gray-300'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                  <button
                    onClick={() => startEditItem(item)}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMenuItem(item.id)}
                    disabled={loading}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No menu items found. Add your first item to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuManagement;
