import { useLocation, useNavigate } from 'react-router-dom';
import { Wallet, ArrowLeftRight, Send, Link2, Clock } from 'lucide-react';

const tabs = [
  { path: '/dashboard', label: 'Wallet', icon: Wallet },
  { path: '/send', label: 'Send', icon: Send },
  { path: '/swap', label: 'Swap', icon: ArrowLeftRight },
  { path: '/request', label: 'Request', icon: Link2 },
  { path: '/schedule', label: 'Recurring', icon: Clock },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border z-50">
      <div className="max-w-md mx-auto flex justify-around px-1 py-2">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`nav-tab ${active ? 'active' : ''}`}
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-xs font-body ${active ? 'font-medium' : ''}`} style={{ fontSize: '10px' }}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
