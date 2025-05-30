import React from 'react';
import logo from '../assets/img/logo.png';

const Preloader = () => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
      <div className="flex flex-col items-center">
        {/* Logo Text */}
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-8 animate-pulse">
          
        <img 
                            src={logo} 
                            alt="Logo" 
                            className="h-20 w-auto object-contain"
                        />


        </div>
        
        {/* Spinner */}
        <div className="w-12 h-12 rounded-full border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-500 animate-spin"></div>
        
        {/* Loading text */}
        <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm animate-pulse">
          Carregando...
        </p>
      </div>
    </div>
  );
};

export default Preloader;
