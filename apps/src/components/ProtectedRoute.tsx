import { Navigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import type { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isConnected } = useWallet();
  return isConnected ? <>{children}</> : <Navigate to="/" replace />;
}
