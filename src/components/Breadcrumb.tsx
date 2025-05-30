import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const Breadcrumb = () => {
  const location = useLocation();
  const { organizationType } = useAuth();

  const getPathItems = (): BreadcrumbItem[] => {
    const paths = location.pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [
      { label: 'Início', path: '/' }
    ];

    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      let label = path.charAt(0).toUpperCase() + path.slice(1);
      
      // Mapeamento específico de rótulos
      switch (path) {
        case 'sales':
          label = organizationType === 'profit' ? 'Vendas' : 'Entradas';
          break;
        case 'full':
          if (paths[index - 1] === 'sales') {
            label = 'Venda Completa';
          }
          break;
        case 'people':
        case 'clients':
        case 'persons':
          label = organizationType === 'profit' ? 'Clientes' : 'Pessoas';
          break;
        case 'products':
          label = 'Produtos';
          break;
        case 'expenses':
          label = 'Despesas';
          break;
        case 'settings':
          label = 'Configurações';
          break;
      }

      items.push({ label, path: currentPath });
    });

    return items;
  };

  const items = getPathItems();

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
      {items.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          {index === items.length - 1 ? (
            <span className="text-gray-900 dark:text-white font-medium">
              {item.label}
            </span>
          ) : (
            <Link
              to={item.path}
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
