import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Added useNavigate
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Preloader from './Preloader';
import { useAuth } from '../contexts/AuthContext'; // Added useAuth

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // Added navigate
  const { isAuthenticated, promptPlanSelection } = useAuth(); // Added auth context values

  // Effect for route change preloader
  useEffect(() => {
    setIsRouteChanging(true);

    const timer = setTimeout(() => {
      setIsRouteChanging(false);
    }, 500); // Hide loader after a short delay

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Effect for redirecting to subscription status page if needed
  useEffect(() => {
    if (isAuthenticated && promptPlanSelection && location.pathname !== '/subscription' && location.pathname !== '/login') {
      console.log('Redirecting to /subscription due to promptPlanSelection.');
      // Optionally, show a toast message here:
      // showToast("Please select a subscription plan to continue.", "info");
      navigate('/subscription', { replace: true });
    }
  }, [isAuthenticated, promptPlanSelection, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {isRouteChanging && <Preloader />}
      
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className={`pt-16 transition-all duration-300 ${
        isSidebarOpen ? 'md:pl-20' : 'md:pl-20'
      }`}>
        {children}
      </main>
    </div>
  );
}
