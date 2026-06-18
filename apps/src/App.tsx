import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './context/WalletContext';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNav from './components/BottomNav';
import ConnectPage from './pages/ConnectPage';
import DashboardPage from './pages/DashboardPage';
import SendPage from './pages/SendPage';
import SwapPage from './pages/SwapPage';
import RequestPage from './pages/RequestPage';
import PayPage from './pages/PayPage';
import SchedulePage from './pages/SchedulePage';

function Layout() {
  const location = useLocation();
  const hideNav = ['/', '/pay'].includes(location.pathname);
  return (
    <>
      <Routes>
        <Route path="/" element={<ConnectPage />} />
        <Route path="/pay" element={<PayPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/send" element={<ProtectedRoute><SendPage /></ProtectedRoute>} />
        <Route path="/swap" element={<ProtectedRoute><SwapPage /></ProtectedRoute>} />
        <Route path="/request" element={<ProtectedRoute><RequestPage /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
      </Routes>
      {!hideNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Layout />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#162030',
              color: '#e8f4f6',
              border: '1px solid #1e2e40',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#47b8c8', secondary: '#0f1923' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#0f1923' } },
          }}
        />
      </BrowserRouter>
    </WalletProvider>
  );
}
