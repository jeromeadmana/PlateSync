import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import CustomerKiosk from './pages/CustomerKiosk';
import Login from './pages/Login';
import QuickLogin from './pages/QuickLogin';
import ServerDashboard from './pages/ServerDashboard';
import KitchenDisplay from './pages/KitchenDisplay';
import CashierPOS from './pages/CashierPOS';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Customer routes (no auth, token-based) */}
            <Route path="/kiosk" element={<CustomerKiosk />} />
            {/* Legacy route for backward compatibility */}
            <Route path="/table/:tableId" element={<Navigate to="/kiosk" replace />} />

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/quick-login" element={<QuickLogin />} />

            {/* Staff routes */}
            <Route path="/server" element={<ServerDashboard />} />
            <Route path="/kitchen" element={<KitchenDisplay />} />
            <Route path="/cashier" element={<CashierPOS />} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
