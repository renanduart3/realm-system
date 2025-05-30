import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Settings, 
  X,
  Receipt,
  Boxes
} from 'lucide-react';
// import { systemConfigService } from '../services/systemConfigService'; // Removed
// import { SystemConfig } from '../model/types'; // Removed
import { useOrganizationType } from '../hooks/useOrganizationType'; // Corrected path

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  // const [config, setConfig] = useState<SystemConfig | null>(null); // Removed
  const location = useLocation();
  const { isProfit } = useOrganizationType(); // Added

  // useEffect(() => { // Removed
  //   loadConfig();
  // }, []);

  // const loadConfig = async () => { // Removed
  //   const savedConfig = await systemConfigService.getConfig();
  //   setConfig(savedConfig);
  // };

  const menuItems = [
    { path: '/', icon: <Home size={20} />, label: 'Dashboard' },
    { 
      path: isProfit ? '/sales' : '/income', // Updated
      icon: <DollarSign size={20} />, 
      label: isProfit ? 'Vendas' : 'Entradas' // Updated
    },
    { path: '/expenses', icon: <Receipt size={20} />, label: 'Despesas' },
    { 
      path: '/products', 
      icon: <ShoppingBag size={20} />, 
      label: 'Produtos',
      show: isProfit, // Updated,
    },
    { 
      path: isProfit ? '/clients' : '/persons', // Updated
      icon: <Users size={20} />, 
      label: isProfit ? 'Clientes' : 'Pessoas' // Updated
    },
    { path: '/settings', icon: <Settings size={20} />, label: 'Configurações' },
    { path: '/componentes', icon: <Boxes size={20} />, label: 'Componentes' }, // Kept as is, assuming it's generic
  ];

  // Mobile overlay
  const overlay = (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity md:hidden z-20
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      onClick={onClose}
    />
  );

  return (
    <>
      {overlay}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          w-64 md:w-20
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
        >
          <X size={20} />
        </button>

        <nav className="mt-6">
          {menuItems
            .filter(item => item.show !== false)
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    onClose();
                  }
                }}
                className={`flex flex-col items-center px-2 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  location.pathname === item.path
                    ? 'text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : ''
                }`}
              >
                {item.icon}
                <span className={`mt-1 text-xs md:block ${!isOpen && 'hidden'}`}>
                  {item.label}
                </span>
              </Link>
            ))}
        </nav>
      </aside>
    </>
  );
}
