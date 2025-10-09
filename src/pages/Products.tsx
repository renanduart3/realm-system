import React, { useState } from 'react';
import ProductList from '../components/ProductList';
import { productService } from '../services/productService';
import { Search } from 'lucide-react';
import { ProductService } from '../model/types';
import { useToast } from '../hooks/useToast';

const Products = () => {
  const [productType, setProductType] = useState<'Product' | 'Service'>('Product');
  const [isManager] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    quantity: '0'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductService | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showToast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (product: ProductService) => {
    try {
      setEditingProduct(product);
      setProductType(product.type as 'Product' | 'Service');
      setFormData({
        name: product.name,
        price: product.price.toString(),
        description: product.description || '',
        quantity: product.type === 'Product' ? product.quantity.toString() : '0'
      });
    } catch (error) {
      showToast('Erro ao carregar produto para edição', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      quantity: '0'
    });
    setEditingProduct(null);
    setProductType('Product');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const price = parseFloat(formData.price);
      const quantity = productType === 'Product' ? parseInt(formData.quantity) : 0;

      if (!formData.name || isNaN(price)) {
        throw new Error('Por favor, preencha todos os campos obrigatórios corretamente');
      }

      if (editingProduct) {
        // Atualizar produto existente
        const updatedProduct = {
          ...editingProduct,
          name: formData.name,
          category: 'General',
          price: price,
          quantity: quantity,
          type: productType,
          description: formData.description
        };

        const result = await productService.editProduct(updatedProduct);

        if (!result) {
          throw new Error('Erro ao atualizar produto');
        }
        showToast('Produto atualizado com sucesso', 'success');
      } else {
        // Criar novo produto
        const result = await productService.createProduct(
          formData.name,
          'General',
          price,
          quantity,
          productType,
          formData.description
        );

        if (!result) {
          throw new Error('Erro ao criar produto');
        }
        showToast('Produto criado com sucesso', 'success');
      }

      resetForm();
      handleProductUpdated(); // Recarregar apenas a lista de produtos
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro ao salvar o produto';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error('Erro ao salvar produto:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductUpdated = () => {
    // Atualizar a lista de produtos após uma operação
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
        Cadastro de Produtos/Serviços
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {editingProduct ? 'Editar Produto/Serviço' : 'Adicionar Novo Produto/Serviço'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                Nome
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">
                Tipo
              </label>
              <select 
                className="form-select"
                onChange={(e) => {
                  setProductType(e.target.value as 'Product' | 'Service');
                  handleInputChange(e);
                }}
                value={productType}
                name="type"
              >
                <option value="Product">Produto</option>
                <option value="Service">Serviço</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                Preço
              </label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            {productType === 'Product' && (
              <div>
                <label className="form-label">
                  Quantidade
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
            )}
          </div>

          <div>
            <label className="form-label">
              Descrição
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-lg text-white font-medium transition-colors
                ${isSubmitting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }
              `}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  <span>Salvando...</span>
                </div>
              ) : (
                editingProduct ? 'Atualizar Produto/Serviço' : 'Adicionar Produto/Serviço'
              )}
            </button>

            {editingProduct && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar Edição
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Lista de Produtos/Serviços
        </h2>
        
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar produto/serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>

        <ProductList 
          isManager={isManager} 
          searchTerm={searchTerm} 
          onEdit={handleEdit}
          onProductUpdated={handleProductUpdated}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
};

export default Products;