import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Layout({ children, navItems, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState(navItems[0]?.key);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleNav = (key) => setActive(key);
  const handleLogout = () => { logout(); navigate('/login'); };

  const activeComponent = navItems.find(n => n.key === active)?.component;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b flex items-center justify-between">
          {sidebarOpen && <span className="font-bold text-blue-700 text-sm">🏥 {title}</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-blue-600 ml-auto">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-blue-50 hover:text-blue-700
                ${active === item.key ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600 font-semibold' : 'text-gray-600'}`}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-red-500 hover:text-red-700 text-sm py-1"
          >
            <span>🚪</span>{sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        {activeComponent}
      </main>
    </div>
  );
}
