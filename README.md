# PlateSync

**Multi-Tenant Restaurant Order Management System**

A complete LAN-based restaurant POS system with customer self-ordering tablets, real-time kitchen displays, and staff management interfaces.

---

## Current Status: Backend Complete ✅

**Backend:** Fully implemented and ready for testing
**Frontend:** Not started yet
**Next Step:** Install Node.js and test backend API

---

## Quick Start

### Prerequisites
- Node.js v18+ (NOT INSTALLED YET)
- npm v9+

### Setup

```cmd
# 1. Install Node.js from https://nodejs.org

# 2. Install backend dependencies
cd backend
npm install

# 3. Run migrations
npm run migrate

# 4. Seed test data
npm run seed

# 5. Start server
npm run dev
```

**Server runs on:** `http://localhost:3000`

### Test It
```cmd
curl http://localhost:3000/api/health
```

---

## Project Structure

```
PlateSync/
├── README.md                   # This file
├── ARCHITECTURE.md             # Complete system design
├── project.md                  # Original requirements
├── docs/
│   ├── CURRENT_STATE.md        # What's built and working
│   ├── NEXT_STEPS.md           # Step-by-step guide to continue
│   └── DEPLOYMENT.md           # LAN deployment and tablet lockdown
├── backend/                    # ✅ Complete
│   ├── src/
│   │   ├── config/             # Configuration
│   │   ├── db/                 # Database (SQLite3 + migrations)
│   │   ├── middleware/         # Auth, permissions, error handling
│   │   ├── routes/             # API endpoints
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Utilities
│   │   └── server.js           # Express entry point
│   ├── data/                   # SQLite database (created on migrate)
│   ├── uploads/                # Theme & menu images
│   ├── package.json
│   └── .env                    # Environment config
└── frontend/                   # ⏳ Not started yet
```

---

## Features

### ✅ Implemented (Backend)

#### Multi-Tenancy
- Company and store hierarchies
- Data isolation per tenant
- Role-based access control

#### Authentication
- Email + password login → JWT token
- Employee ID quick login (4-6 digit PIN)
- Long-lived tokens (30 days) for device persistence

#### Customer Self-Ordering
- Anonymous cart per table (no login)
- Browse menu with categories
- Add items with modifiers
- Special instructions
- "Call Server" button

#### Server Workflow
- View pending cart reviews
- Review customer orders
- Add/modify items
- Submit to kitchen

#### Kitchen Display
- View active orders
- Update item status (preparing, ready)
- Auto-update order status

#### Menu Management
- Categories and items
- Modifiers (add-ons)
- Price management
- Sold-out status

#### Database
- 16 tables with full relationships
- SQLite3 (current)
- Supabase-ready (future migration)
- Migrations and seed data

### ⏳ Pending (Frontend)

- React customer kiosk UI
- Server dashboard
- Kitchen display screen
- Cashier POS interface
- Admin management panel
- Real-time Socket.IO updates
- Theme customization UI

---

## Test Accounts

After running `npm run seed`:

| Role          | Email              | Password | Employee ID |
|---------------|--------------------|----------|-------------|
| Super Admin   | admin@demo.com     | admin123 | 0000        |
| Store Manager | manager@demo.com   | admin123 | 1001        |
| Server        | server@demo.com    | admin123 | 2001        |
| Cook          | cook@demo.com      | admin123 | 3001        |
| Cashier       | cashier@demo.com   | admin123 | 4001        |

---

## API Endpoints

### Public (No Auth)
- `GET /api/health` - Health check
- `GET /api/customer/menu/:tableId` - Get menu
- `GET /api/customer/cart/:tableId` - Get cart
- `POST /api/customer/cart/:tableId/items` - Add to cart
- `PUT /api/customer/cart/:tableId/items/:itemId` - Update item
- `DELETE /api/customer/cart/:tableId/items/:itemId` - Remove item
- `POST /api/customer/cart/:tableId/call-server` - Request server

### Authentication
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/quick-login` - Employee ID login
- `GET /api/auth/me` - Current user
- `GET /api/auth/employees` - Employee list

### Server (Auth Required)
- `GET /api/orders/pending-reviews` - Carts waiting for review
- `GET /api/orders/cart/:cartId` - Cart details
- `POST /api/orders/cart/:cartId/submit` - Submit to kitchen

### Kitchen (Auth Required)
- `GET /api/orders/kitchen` - Active orders
- `PUT /api/orders/items/:itemId/status` - Update item status

### Orders (Auth Required)
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Order details
- `PUT /api/orders/:id/status` - Update status

### Menu (Auth Required - Admin)
- `GET /api/menu/categories` - List categories
- `POST /api/menu/categories` - Create category
- `GET /api/menu/items` - List items
- `POST /api/menu/items` - Create item
- `GET /api/menu/items/:id` - Get item
- `PUT /api/menu/items/:id` - Update item
- `POST /api/menu/items/:id/modifiers` - Add modifier

---

## Technology Stack

### Backend
- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Database:** SQLite3 (Supabase-ready)
- **Auth:** JWT + bcrypt
- **Real-time:** Socket.IO (structure ready)

### Frontend (Planned)
- **Framework:** React 18+
- **Build:** Vite
- **Routing:** React Router v6
- **State:** Zustand + React Query
- **Real-time:** Socket.IO Client
- **UI:** Custom components (mobile-first)

---

## Architecture Highlights

### LAN-First Design
- Works on local network without internet
- Backend on LAN server (e.g., 192.168.1.100:3000)
- All devices connect via WiFi/Ethernet
- Optional cloud backup to Supabase

### Customer Tablet Security
- **CRITICAL:** Tablets must use kiosk mode software
- Prevents closing browser or accessing other apps
- Recommended: Fully Kiosk Browser (Android), Guided Access (iOS)
- See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for setup

### Database Migration Path
```
SQLite3 (Current)
    ↓ Zero code changes
Supabase PostgreSQL (Future)
```

Just change `DATABASE_TYPE=supabase` in .env

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Complete system design, database schema, API structure |
| [CURRENT_STATE.md](./docs/CURRENT_STATE.md) | What's built, what works, test accounts |
| [NEXT_STEPS.md](./docs/NEXT_STEPS.md) | Step-by-step guide to continue development |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | LAN server setup, tablet lockdown, network config |

---

## Workflow Example

### Customer Orders (Table 5)

1. **Customer** browses menu on table tablet
2. **Customer** adds burger + fries with modifiers
3. **Customer** taps "Call Server"
4. **Server** receives notification on tablet
5. **Server** reviews cart, adds drink
6. **Server** submits to kitchen
7. **Kitchen** sees new order, starts cooking
8. **Kitchen** marks items as "preparing" then "ready"
9. **Server** delivers food, marks as "served"
10. **Cashier** processes payment
11. **Table** status reset to available

All updates happen in **real-time** via Socket.IO (when implemented).

---

## Development Timeline

### Phase 1: Backend Foundation ✅ DONE
- Database schema
- Authentication
- API endpoints
- Business logic services
- **Status:** Ready for testing

### Phase 2: Frontend Development ⏳ NEXT
- React setup
- Customer kiosk UI
- Server dashboard
- Kitchen display
- Admin panel
- **Estimate:** 2-3 weeks

### Phase 3: Real-Time Features
- Socket.IO integration
- Live order updates
- Kitchen alerts
- **Estimate:** 1 week

### Phase 4: Deployment
- LAN server setup
- Tablet configuration
- Browser lockdown
- Testing
- **Estimate:** 1 week

### Phase 5: Future Enhancements
- Supabase migration
- Advanced reporting
- Inventory tracking
- Multi-language
- **Timeline:** TBD

---

## Contributing

This is a custom project under active development.

---

## License

MIT

---

## Contact

For questions about this project, refer to the documentation in `docs/` directory.

---

## Next Steps

**You are here:** Backend complete, Node.js not installed yet

**Next:** Read [NEXT_STEPS.md](./docs/NEXT_STEPS.md) for detailed instructions to:
1. Install Node.js
2. Test backend API
3. Build React frontend
4. Deploy to LAN

**Questions?** Check [CURRENT_STATE.md](./docs/CURRENT_STATE.md) for what's working now.

---

**Last Updated:** 2026-01-17
**Version:** 0.1.0 (Backend Foundation)
