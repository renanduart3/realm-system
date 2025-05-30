import React, { useEffect, useState } from 'react';
import { ProductService } from '../model/types';
import { getAllProducts } from '../utils/dataLoader';
import { Pencil } from 'lucide-react';

interface ProductListProps {
  isManager: boolean;
}

const ProductList = ({ isManager }: ProductListProps) => {
  const [products, setProducts] = useState<ProductService[] | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      const loadedProducts = await getAllProducts();
      setProducts(loadedProducts);
    };
    loadProducts();
  }, []);

  if (!products) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (products.length === 0) {
    return <p className="text-gray-500 text-center py-4">No products or services registered yet</p>;
  }

  // Mobile card view for small screens
  const mobileView = (
    <div className="space-y-4 md:hidden">
      {products.map((product) => (
        <div 
          key={product.id}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
            {isManager && (
              <button className="text-blue-600 hover:text-blue-800 p-1">
                <Pencil className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Category:</span>
              <span className="text-gray-900 dark:text-white">{product.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Type:</span>
              <span className="text-gray-900 dark:text-white">{product.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Price:</span>
              <span className="text-gray-900 dark:text-white">R$ {product.price.toFixed(2)}</span>
            </div>
            {product.type === 'Product' && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Quantity:</span>
                <span className="text-gray-900 dark:text-white">{product.quantity}</span>
              </div>
            )}
            {product.description && (
              <div className="pt-2">
                <span className="text-gray-500 dark:text-gray-400 block mb-1">Description:</span>
                <span className="text-gray-900 dark:text-white">{product.description}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Desktop table view
  const desktopView = (
    <div className="hidden md:block overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
            {isManager && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{product.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{product.category}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{product.type}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">R$ {product.price.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {product.type === 'Product' ? product.quantity : '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white truncate max-w-xs">{product.description}</td>
              {isManager && (
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button className="text-blue-600 hover:text-blue-800 p-1">
                    <Pencil className="h-5 w-5" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      {mobileView}
      {desktopView}
    </>
  );
};

export default ProductList;
