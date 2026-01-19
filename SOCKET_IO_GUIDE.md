# Socket.IO Real-Time Updates - Implementation Guide

**Status:** ✅ Implemented
**Version:** 1.0
**Last Updated:** 2026-01-19

---

## Overview

PlateSync uses Socket.IO for real-time communication between kitchen displays, server tablets, customer kiosks, and cashier stations. All updates happen instantly without page refresh.

---

## Connection Setup

### Backend (Already Configured)

The Socket.IO server is initialized in `backend/src/server.js`:
```javascript
import { initializeSocket } from './sockets/index.js';

const httpServer = createServer(app);
initializeSocket(httpServer);
```

Server runs on: **http://localhost:3000**

### Frontend Connection (To Implement)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Join room based on role
const storeId = 1; // From user context
socket.emit('join:kitchen', storeId);
```

---

## Room Structure

Socket.IO uses rooms for targeted messaging:

| Room | Purpose | Who Joins |
|------|---------|-----------|
| `store:{storeId}` | All store events | Everyone in store |
| `kitchen:{storeId}` | Kitchen-specific | Cooks |
| `server:{storeId}` | Server-specific | Waiters/servers |
| `cashier:{storeId}` | Cashier-specific | Cashiers |
| `table:{tableId}` | Table-specific | Customer tablets |

---

## Events Reference

### Event Types

All events are defined in `backend/src/config/constants.js`:

```javascript
export const SOCKET_EVENTS = {
  // Order Events
  ORDER_NEW: 'order:new',
  ORDER_STATUS_CHANGE: 'order:statusChange',
  ORDER_ITEM_STATUS_CHANGE: 'orderItem:statusChange',

  // Cart Events
  CART_READY_FOR_REVIEW: 'cart:readyForReview',

  // Customer Notifications
  ORDER_SUBMITTED: 'order:submitted',
  ORDER_PREPARING: 'order:preparing',
  ORDER_READY: 'order:ready',
  ORDER_SERVED: 'order:served',

  // Other
  TABLE_STATUS_CHANGE: 'table:statusChange',
  MENU_UPDATE: 'menu:update',
  DEVICE_ONLINE: 'device:online',
  DEVICE_OFFLINE: 'device:offline'
};
```

---

## Event Details

### 1. ORDER_NEW (`order:new`)

**Triggered:** When a new order is created (manual or from cart)

**Rooms:** `kitchen:{storeId}`

**Payload:**
```javascript
{
  id: 1,
  store_id: 1,
  server_id: 3,
  table_id: 5,
  order_number: "20260119-001",
  status: "received",
  total_amount: 31.97,
  order_time: "2026-01-19 03:55:55",
  table_number: "5",
  server_name: "John Server",
  items: [
    {
      id: 1,
      menu_item_id: 3,
      name: "Classic Burger",
      quantity: 2,
      unit_price: 12.99,
      status: "pending",
      modifiers: [
        { id: 1, name: "Extra Cheese", extra_price: 1.50 }
      ],
      special_instructions: "Well done please"
    }
  ]
}
```

**Frontend Example:**
```javascript
socket.on('order:new', (order) => {
  console.log('New order received:', order.order_number);
  // Add to kitchen display queue
  addOrderToKitchenDisplay(order);
  // Play notification sound
  playNotificationSound();
});
```

---

### 2. CART_READY_FOR_REVIEW (`cart:readyForReview`)

**Triggered:** When customer clicks "Call Server"

**Rooms:** `server:{storeId}`

**Payload:**
```javascript
{
  id: 1,
  table_id: 5,
  store_id: 1,
  status: "ready_for_review",
  total_amount: 25.97,
  table_number: "5",
  items: [
    {
      id: 1,
      menu_item_id: 3,
      name: "Classic Burger",
      quantity: 1,
      modifiers_json: "[{\"id\":1,\"name\":\"Extra Cheese\"}]",
      modifiers: [{ id: 1, name: "Extra Cheese" }]
    }
  ]
}
```

**Frontend Example:**
```javascript
socket.on('cart:readyForReview', (cart) => {
  console.log('Table', cart.table_number, 'needs attention!');
  // Show notification badge
  showServerNotification(cart.table_number);
  // Add to pending reviews list
  addToPendingReviews(cart);
});
```

---

### 3. ORDER_STATUS_CHANGE (`order:statusChange`)

**Triggered:** When order status changes (received → preparing → ready → served)

**Rooms:** `kitchen:{storeId}`, `server:{storeId}`

**Payload:**
```javascript
{
  id: 1,
  order_number: "20260119-001",
  status: "preparing", // or "ready", "served", "paid"
  table_number: "5",
  // ... full order object
}
```

**Frontend Example:**
```javascript
socket.on('order:statusChange', (order) => {
  console.log('Order', order.order_number, 'is now', order.status);
  // Update order card status
  updateOrderStatus(order.id, order.status);

  if (order.status === 'ready') {
    // Notify server to deliver food
    notifyServer(order);
  }
});
```

---

### 4. ORDER_ITEM_STATUS_CHANGE (`orderItem:statusChange`)

**Triggered:** When cook updates individual item status

**Rooms:** `kitchen:{storeId}`, `server:{storeId}`

**Payload:**
```javascript
{
  orderItemId: 1,
  status: "preparing", // or "ready"
  order: {
    id: 1,
    order_number: "20260119-001",
    items: [...] // All items with updated statuses
  }
}
```

**Frontend Example:**
```javascript
socket.on('orderItem:statusChange', ({ orderItemId, status, order }) => {
  console.log('Item', orderItemId, 'is now', status);
  // Update specific item status in kitchen display
  updateItemStatus(orderItemId, status);
});
```

---

### 5. ORDER_SUBMITTED (`order:submitted`)

**Triggered:** When server submits cart to kitchen

**Rooms:** `table:{tableId}`

**Payload:**
```javascript
{
  orderId: 1,
  orderNumber: "20260119-001"
}
```

**Frontend Example (Customer Tablet):**
```javascript
socket.on('order:submitted', ({ orderNumber }) => {
  console.log('Your order', orderNumber, 'has been sent to kitchen');
  // Show success message
  showMessage(`Order ${orderNumber} submitted! We'll bring it to your table soon.`);
  // Clear cart
  clearCart();
});
```

---

### 6. ORDER_READY (`order:ready`)

**Triggered:** When all items in order are ready

**Rooms:** `table:{tableId}`

**Payload:**
```javascript
{
  id: 1,
  order_number: "20260119-001",
  status: "ready",
  // ... full order object
}
```

**Frontend Example (Customer Tablet):**
```javascript
socket.on('order:ready', (order) => {
  console.log('Your order is ready!');
  // Show notification
  showMessage('Your food is ready! Server will bring it shortly.');
});
```

---

## Frontend Integration Guide

### 1. Create Socket Context (React)

```javascript
// src/contexts/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      autoConnect: true,
      reconnection: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);

      // Join appropriate rooms based on user role
      if (user) {
        if (user.role === 'cook') {
          newSocket.emit('join:kitchen', user.storeId);
        } else if (user.role === 'server') {
          newSocket.emit('join:server', user.storeId);
        } else if (user.role === 'cashier') {
          newSocket.emit('join:cashier', user.storeId);
        }
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
```

### 2. Use in Kitchen Display

```javascript
// src/pages/KitchenDisplay.tsx
import { useSocket } from '../contexts/SocketContext';
import { SOCKET_EVENTS } from '../types';

const KitchenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for new orders
    socket.on(SOCKET_EVENTS.ORDER_NEW, (order) => {
      setOrders(prev => [order, ...prev]);
      playNotificationSound();
    });

    // Listen for status changes
    socket.on(SOCKET_EVENTS.ORDER_STATUS_CHANGE, (updatedOrder) => {
      setOrders(prev =>
        prev.map(o => o.id === updatedOrder.id ? updatedOrder : o)
      );
    });

    return () => {
      socket.off(SOCKET_EVENTS.ORDER_NEW);
      socket.off(SOCKET_EVENTS.ORDER_STATUS_CHANGE);
    };
  }, [socket]);

  // Rest of component...
};
```

### 3. Use in Server Dashboard

```javascript
// src/pages/ServerDashboard.tsx
const ServerDashboard = () => {
  const [pendingCarts, setPendingCarts] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(SOCKET_EVENTS.CART_READY_FOR_REVIEW, (cart) => {
      setPendingCarts(prev => [...prev, cart]);
      // Show browser notification
      showBrowserNotification(`Table ${cart.table_number} needs attention!`);
    });

    return () => {
      socket.off(SOCKET_EVENTS.CART_READY_FOR_REVIEW);
    };
  }, [socket]);

  // Rest of component...
};
```

### 4. Use in Customer Kiosk

```javascript
// src/pages/CustomerKiosk.tsx
const CustomerKiosk = () => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { socket } = useSocket();
  const tableId = useParams().tableId;

  useEffect(() => {
    if (!socket || !tableId) return;

    // Join table room
    socket.emit('join:table', tableId);

    // Listen for order submission confirmation
    socket.on(SOCKET_EVENTS.ORDER_SUBMITTED, ({ orderNumber }) => {
      setShowSuccessMessage(true);
      showToast(`Order ${orderNumber} submitted to kitchen!`);
    });

    // Listen for order ready notification
    socket.on(SOCKET_EVENTS.ORDER_READY, () => {
      showToast('Your food is ready! Server will bring it shortly.');
    });

    return () => {
      socket.off(SOCKET_EVENTS.ORDER_SUBMITTED);
      socket.off(SOCKET_EVENTS.ORDER_READY);
    };
  }, [socket, tableId]);

  // Rest of component...
};
```

---

## Testing Socket.IO

### 1. Test with Browser Console

```javascript
// Open browser console at http://localhost:5173
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected:', socket.id);

  // Join kitchen room
  socket.emit('join:kitchen', 1);

  // Listen for new orders
  socket.on('order:new', (order) => {
    console.log('New order received:', order);
  });
});
```

### 2. Test with Postman/cURL

Create an order and watch for socket events:

```bash
# Terminal 1: Watch backend logs
cd backend && npm run dev

# Terminal 2: Create order via API
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": 1,
    "items": [{"menuItemId": 3, "quantity": 1}]
  }'

# Check backend logs for:
# "Emitted order:new to kitchen:1"
```

---

## Benefits of Real-Time Updates

✅ **Kitchen Display** - New orders appear instantly
✅ **Server Dashboard** - Immediate notification when customer calls
✅ **Customer Tablets** - Live order status updates
✅ **No Page Refresh** - All updates are automatic
✅ **Better UX** - Faster service, less waiting
✅ **Reduced Errors** - Everyone sees latest status immediately

---

## Next Steps

1. ✅ Backend Socket.IO implemented
2. ⏳ Frontend Socket.IO integration (to do)
3. ⏳ Add sound notifications
4. ⏳ Add browser notifications
5. ⏳ Test full workflow

---

**Status:** Backend complete, frontend integration pending
