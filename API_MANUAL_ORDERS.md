# Manual Order Creation API

**Endpoint:** `POST /api/orders`
**Authentication:** Required (Server role)
**Purpose:** Create orders directly without customer cart (for servers taking phone orders, walk-ins, etc.)

---

## Request

### Headers
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Body
```json
{
  "tableId": 1,
  "items": [
    {
      "menuItemId": 3,
      "quantity": 2,
      "modifiers": [
        {
          "id": 1,
          "name": "Extra Cheese",
          "extra_price": 1.50
        }
      ],
      "specialInstructions": "Well done please"
    },
    {
      "menuItemId": 5,
      "quantity": 1,
      "modifiers": [],
      "specialInstructions": ""
    }
  ]
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tableId` | number | Yes | ID of the table for this order |
| `items` | array | Yes | Array of order items (must have at least 1) |
| `items[].menuItemId` | number | Yes | ID of the menu item |
| `items[].quantity` | number | Yes | Quantity to order |
| `items[].modifiers` | array | No | Array of modifiers (add-ons) |
| `items[].modifiers[].id` | number | Yes* | Modifier ID (*if modifiers present) |
| `items[].modifiers[].name` | string | Yes* | Modifier name |
| `items[].modifiers[].extra_price` | number | Yes* | Additional cost |
| `items[].specialInstructions` | string | No | Special cooking instructions |

---

## Response

### Success (201 Created)
```json
{
  "success": true,
  "data": {
    "orderId": 1,
    "orderNumber": "20260119-001",
    "totalAmount": 31.97
  },
  "message": "Order created and sent to kitchen"
}
```

### Error Responses

#### 400 Bad Request - Missing Table ID
```json
{
  "error": "Validation failed",
  "message": "Table ID is required",
  "code": "MISSING_FIELDS"
}
```

#### 400 Bad Request - Missing or Empty Items
```json
{
  "error": "Validation failed",
  "message": "Items array is required and must not be empty",
  "code": "MISSING_FIELDS"
}
```

#### 401 Unauthorized
```json
{
  "error": "Authentication failed",
  "message": "No token provided",
  "code": "NO_TOKEN"
}
```

#### 403 Forbidden (Not Server Role)
```json
{
  "error": "Authorization failed",
  "message": "Access denied. Requires server role.",
  "code": "FORBIDDEN"
}
```

#### 500 Internal Server Error - Menu Item Not Found
```json
{
  "error": "Internal server error",
  "message": "Menu item {id} not found"
}
```

---

## How It Works

1. **Authentication**: Validates JWT token and checks for server role
2. **Validation**: Ensures `tableId` and `items` array are provided
3. **Price Calculation**:
   - Fetches base price from menu items
   - Adds modifier prices
   - Calculates total: `(base_price + modifiers) × quantity`
4. **Order Number Generation**: Format `YYYYMMDD-XXX` (auto-increments daily)
5. **Database Insert**:
   - Creates order record with status `received`
   - Creates order items with status `pending`
   - Links to table and server
6. **Returns**: Order ID, order number, and total amount

---

## Example Usage

### cURL Example
```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"server@demo.com","password":"admin123"}' \
  | jq -r '.data.token')

# 2. Create manual order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "tableId": 5,
    "items": [
      {
        "menuItemId": 3,
        "quantity": 1,
        "modifiers": [
          {"id": 1, "name": "Extra Cheese", "extra_price": 1.50}
        ],
        "specialInstructions": "No onions"
      }
    ]
  }'
```

### JavaScript Example (Frontend)
```javascript
import { ordersApi } from './api/orders';

async function createManualOrder(tableId, items) {
  try {
    const response = await ordersApi.createManualOrder({
      tableId,
      items: items.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
        modifiers: item.selectedModifiers,
        specialInstructions: item.notes || ''
      }))
    });

    console.log('Order created:', response.data.orderNumber);
    return response.data;
  } catch (error) {
    console.error('Failed to create order:', error);
    throw error;
  }
}

// Usage
await createManualOrder(5, [
  {
    id: 3,
    quantity: 1,
    selectedModifiers: [
      { id: 1, name: 'Extra Cheese', extra_price: 1.50 }
    ],
    notes: 'No onions'
  }
]);
```

---

## Use Cases

1. **Phone Orders**: Server takes order over phone and enters manually
2. **Walk-in Customers**: Direct table service without kiosk
3. **Quick Orders**: Faster than having customer use tablet
4. **Order Modifications**: Add items to existing table
5. **Special Events**: Bulk orders for groups

---

## Differences from Cart-Based Orders

| Feature | Manual Order | Cart-Based Order |
|---------|--------------|------------------|
| Endpoint | `POST /api/orders` | `POST /api/orders/cart/:cartId/submit` |
| Workflow | Direct entry by server | Customer fills cart → Server reviews |
| Cart Record | None (`customer_cart_id` is null) | Links to cart |
| Use Case | Phone/walk-in orders | Self-service kiosks |
| Authentication | Required (server) | Cart creation: none, Submit: required |

---

## Testing

### Test Account (Server Role)
- **Email:** server@demo.com
- **Password:** admin123
- **Employee ID:** 2001
- **Role:** server

### Sample Test Data
```bash
# Get menu items first
curl http://localhost:3000/api/customer/menu/1

# Use menu item IDs in your order
# Example menu item IDs from seed data:
# 1 - Mozzarella Sticks
# 2 - Chicken Wings
# 3 - Classic Burger
# 4 - Grilled Salmon
# 5 - Soft Drink
# 6 - Coffee
# 7 - Chocolate Cake
# 8 - Ice Cream
```

---

## Related Endpoints

- `GET /api/orders` - List all orders
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/kitchen` - Kitchen display (cook role)
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/items/:itemId/status` - Update item status (cook role)
- `POST /api/orders/cart/:cartId/submit` - Create order from customer cart

---

**Last Updated:** 2026-01-19
**Version:** 1.0
