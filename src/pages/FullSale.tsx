
import React, { useState, useEffect } from 'react';
import { Plus, Trash, Package, User, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useClients from '../hooks/useClients';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useProducts } from '../hooks/useProducts';
import saleService from '../services/saleService';
import Breadcrumb from '../components/Breadcrumb';
import SearchableSelect from '../components/SearchableSelect';
import { ProductService, Client } from '../model/types';
import { clientService } from '../services/clientService';
import { useAuth } from '../contexts/AuthContext';

interface SaleItem {
  product: string;
  quantity: number;
}

const FullSale = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const navigate = useNavigate();
  const { products } = useProducts();
  const [items, setItems] = useState<SaleItem[]>([{ product: '', quantity: 1 }]);
  const [customer, setCustomer] = useState('');
  const [total, setTotal] = useState(0);
  const { user, organizationType } = useAuth();

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsList = await clientService.getAllClients();
        setClients(clientsList);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        toast.error('Erro ao carregar lista de clientes');
      }
    };

    loadClients();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [items, products]);

  const handleAddItem = () => setItems([...items, { product: '', quantity: 1 }]);
  
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const newTotal = items.reduce((acc, item) => {
      const product = products.find(p => p.id === item.product);
      return acc + (product ? product.price * item.quantity : 0);
    }, 0);
    setTotal(newTotal);
  };

  const handleProductChange = (index: number, productId: string) => {
    const newItems = [...items];
    newItems[index].product = productId;
    setItems(newItems);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toISOString().split('T')[1].split('.')[0];
      
      await saleService.createSale(
        currentDate,
        currentTime,
        total,
        customer,
        undefined,
        undefined,
        organizationType
      );
      
      toast.success('Venda realizada com sucesso!');
      navigate('/sales');
    } catch (error) {
      console.error('Erro ao processar a venda:', error);
      toast.error('Erro ao processar a venda. Por favor, tente novamente.');
    }
  };

  const getProductPrice = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.price : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Breadcrumb />
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Venda Completa</h1>
                <p className="text-blue-100">Configure os detalhes da venda</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Client Selection */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informações do Cliente</h3>
              </div>
              <SearchableSelect
                options={clients}
                value={customer}
                onChange={setCustomer}
                placeholder="Selecione um cliente"
                label="Cliente"
                required
              />
            </div>

            {/* Products Section */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Produtos/Serviços</h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar Item</span>
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-6">
                        <SearchableSelect
                          options={products}
                          value={item.product}
                          onChange={(productId) => handleProductChange(index, productId)}
                          placeholder="Selecione um produto/serviço"
                          label="Produto/Serviço"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quantidade
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          required
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Subtotal
                        </label>
                        <div className="p-3 bg-gray-100 dark:bg-gray-600 rounded-lg border">
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            R$ {(getProductPrice(item.product) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="md:col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                          disabled={items.length === 1}
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-700">
              <div className="text-center">
                <p className="text-sm text-green-600 dark:text-green-400 mb-1">Total da Venda</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  R$ {total.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg font-semibold"
            >
              Finalizar Venda
            </button>
          </form>
        </div>
      </div>

      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default FullSale;
