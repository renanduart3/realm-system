import React, { useEffect, useState } from 'react';
import { ProductService } from '../model/types';
import { getAllProducts } from '../utils/dataLoader';
import { Pencil, Trash2 } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { productService } from '../services/productService';

interface ProductListProps {
  isManager: boolean;
  searchTerm?: string;
  onEdit?: (product: ProductService) => void;
  onProductUpdated?: () => void;
  refreshTrigger?: number;
}

const ProductList = ({ isManager, searchTerm = '', onEdit, onProductUpdated, refreshTrigger }: ProductListProps) => {
  const [products, setProducts] = useState<ProductService[] | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductService | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadProducts();
    }
  }, [refreshTrigger]);

  const loadProducts = async () => {
    try {
      const loadedProducts = await getAllProducts();
      setProducts(loadedProducts);
    } catch (error) {
      showToast('Erro ao carregar produtos', 'error');
    }
  };

  const handleEdit = (product: ProductService) => {
    try {
      if (onEdit) {
        onEdit(product);
        showToast('Produto carregado para edição', 'success');
      }
    } catch (error) {
      showToast('Erro ao carregar produto para edição', 'error');
    }
  };

  const handleDelete = async (product: ProductService) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const success = await productService.deleteProduct(productToDelete.id);
      if (success) {
        showToast('Produto excluído com sucesso', 'success');
        // Recarregar a lista de produtos
        await loadProducts();
        if (onProductUpdated) {
          onProductUpdated();
        }
      } else {
        showToast('Erro ao excluir produto', 'error');
      }
    } catch (error) {
      showToast('Erro ao excluir produto', 'error');
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  // Filter products based on search term
  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  if (!products) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (products.length === 0) {
    return <p className="text-gray-500 text-center py-4">Nenhum produto ou serviço registrado</p>;
  }

  if (filteredProducts.length === 0 && searchTerm) {
    return <p className="text-gray-500 text-center py-4">Nenhum produto encontrado para "{searchTerm}"</p>;
  }

  // Mobile card view for small screens
  const mobileView = (
    <div className="space-y-4 md:hidden">
      {filteredProducts.map((product) => (
        <div 
          key={product.id}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
            {isManager && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleEdit(product)}
                  className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                  title="Editar produto"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => handleDelete(product)}
                  className="text-red-600 hover:text-red-800 p-1 transition-colors"
                  title="Excluir produto"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Categoria:</span>
              <span className="text-gray-900 dark:text-white">{product.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
              <span className="text-gray-900 dark:text-white">{product.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Preço:</span>
              <span className="text-gray-900 dark:text-white">R$ {product.price.toFixed(2)}</span>
            </div>
            {product.type === 'Product' && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Quantidade:</span>
                <span className="text-gray-900 dark:text-white">{product.quantity}</span>
              </div>
            )}
            {product.description && (
              <div className="pt-2">
                <span className="text-gray-500 dark:text-gray-400 block mb-1">Descrição:</span>
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preço</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantidade</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
            {isManager && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {filteredProducts.map((product) => (
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
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                      title="Editar produto"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(product)}
                      className="text-red-600 hover:text-red-800 p-1 transition-colors"
                      title="Excluir produto"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
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

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o produto "${productToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
      />
    </>
  );
};

export default ProductList;
