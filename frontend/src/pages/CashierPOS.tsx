import React, { useState, useEffect } from 'react';
import { paymentsApi, type UnpaidOrder, type PaymentReceipt } from '../api/payments';

const CashierPOS: React.FC = () => {
  const [unpaidOrders, setUnpaidOrders] = useState<UnpaidOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<UnpaidOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUnpaidOrders();
    // Refresh every 30 seconds
    const interval = setInterval(loadUnpaidOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnpaidOrders = async () => {
    try {
      const orders = await paymentsApi.getUnpaidOrders();
      setUnpaidOrders(orders);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load unpaid orders:', err);
      setError('Failed to load orders');
    }
  };

  const handleSelectOrder = (order: UnpaidOrder) => {
    setSelectedOrder(order);
    setAmountReceived(order.total_amount.toFixed(2));
    setTipAmount('0');
    setPaymentMethod('cash');
    setError(null);
  };

  const calculateChange = (): number => {
    if (!selectedOrder) return 0;
    const received = parseFloat(amountReceived) || 0;
    const tip = parseFloat(tipAmount) || 0;
    const total = selectedOrder.total_amount;
    return received - total - tip;
  };

  const handleProcessPayment = async () => {
    if (!selectedOrder) return;

    const received = parseFloat(amountReceived);
    const tip = parseFloat(tipAmount) || 0;
    const total = selectedOrder.total_amount;

    // Validation
    if (isNaN(received) || received <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (paymentMethod === 'cash' && received < total) {
      setError('Amount received must be at least the order total');
      return;
    }

    if (tip < 0) {
      setError('Tip amount cannot be negative');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const receiptData = await paymentsApi.processPayment(
        selectedOrder.id,
        total,
        paymentMethod,
        tip
      );

      setReceipt(receiptData);
      setShowReceipt(true);
      setSelectedOrder(null);
      loadUnpaidOrders(); // Refresh list

    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setReceipt(null);
  };

  const change = calculateChange();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Cashier - Point of Sale</h1>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Order List */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Unpaid Orders ({unpaidOrders.length})</h2>
              <button
                onClick={loadUnpaidOrders}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {unpaidOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No unpaid orders</p>
              ) : (
                unpaidOrders.map(order => (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedOrder?.id === order.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-lg">{order.order_number}</div>
                        <div className="text-sm text-gray-600">
                          Table {order.table_number} • {order.server_name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${order.total_amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.item_count} items
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.order_time).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Payment Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Process Payment</h2>

            {!selectedOrder ? (
              <p className="text-gray-500 text-center py-12">
                Select an order to process payment
              </p>
            ) : (
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-bold text-lg mb-2">
                    {selectedOrder.order_number}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Table {selectedOrder.table_number}
                  </div>

                  {/* Items List */}
                  <div className="space-y-2 mb-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-semibold">
                          ${(item.unit_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-green-600">
                        ${selectedOrder.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cash', 'card', 'mobile'] as const).map(method => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-3 rounded-lg font-medium capitalize transition-colors ${
                          paymentMethod === method
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Received (Cash only) */}
                {paymentMethod === 'cash' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Amount Received
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                )}

                {/* Tip Amount */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tip Amount (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                  <div className="flex gap-2 mt-2">
                    {[10, 15, 20].map(percent => {
                      const tip = (selectedOrder.total_amount * percent / 100).toFixed(2);
                      return (
                        <button
                          key={percent}
                          onClick={() => setTipAmount(tip)}
                          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                        >
                          {percent}% (${tip})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Change (Cash only) */}
                {paymentMethod === 'cash' && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Change Due:</span>
                      <span className={`text-2xl font-bold ${
                        change < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ${Math.abs(change).toFixed(2)}
                        {change < 0 && ' (Insufficient)'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    disabled={loading || (paymentMethod === 'cash' && change < 0)}
                    className={`flex-[2] py-3 rounded-lg font-medium text-white ${
                      loading || (paymentMethod === 'cash' && change < 0)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {loading ? 'Processing...' : 'Complete Payment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && receipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-center">Payment Complete!</h2>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <div className="text-center mb-4">
                <div className="text-sm text-gray-600">Order Number</div>
                <div className="text-2xl font-bold">{receipt.order_number}</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${receipt.subtotal.toFixed(2)}</span>
                </div>
                {receipt.tip > 0 && (
                  <div className="flex justify-between">
                    <span>Tip:</span>
                    <span>${receipt.tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total Paid:</span>
                  <span className="text-green-600">${receipt.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Payment Method:</span>
                  <span className="capitalize">{receipt.payment_method}</span>
                </div>
                {paymentMethod === 'cash' && change > 0 && (
                  <div className="flex justify-between text-yellow-700 font-medium">
                    <span>Change Given:</span>
                    <span>${change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={closeReceipt}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierPOS;
