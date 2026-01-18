import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import CustomerKiosk from './pages/CustomerKiosk';
import Login from './pages/Login';
import QuickLogin from './pages/QuickLogin';
import ServerDashboard from './pages/ServerDashboard';
import KitchenDisplay from './pages/KitchenDisplay';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Customer routes (no auth) */}
          <Route path="/table/:tableId" element={<CustomerKiosk />} />

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/quick-login" element={<QuickLogin />} />

          {/* Staff routes */}
          <Route path="/server" element={<ServerDashboard />} />
          <Route path="/kitchen" element={<KitchenDisplay />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
