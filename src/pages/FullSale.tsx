import React, { useState, useEffect } from 'react';
import { Plus, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useClients from '../hooks/useClients';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useProducts } from '../hooks/useProducts';
import saleService from '../services/saleService';
import Breadcrumb from '../components/Breadcrumb';
import { ProductService, Client } from '../model/types'; // Combined Client import
import { clientService } from '../services/clientService';
// import { Client } from '../model/types'; // Already imported above
import { useAuth } from '../contexts/AuthContext'; // Added

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

  const handleAddItem = () => setItems([...items, { product: '', quantity: 1 }]);
  
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    calculateTotal();
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
    calculateTotal();
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    setItems(newItems);
    calculateTotal();
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

  return (
    <div className="p-6">
      <Breadcrumb />
      
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white text-center">Venda Completa</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</label>
              <select
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Selecione um cliente</option>
                {clients.map((client: Client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg shadow-sm">
                <select
                  value={item.product}
                  onChange={(e) => handleProductChange(index, e.target.value)}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Selecione um produto</option>
                  {products.map((product: ProductService) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                  className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />

                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash className="h-5 w-5" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg shadow-md transition"
            >
              <Plus className="h-5 w-5 mr-2" /> Adicionar Item
            </button>

            <div className="text-lg font-semibold text-gray-900 dark:text-white text-center">
              Total: R$ {total.toFixed(2)}
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg shadow-md transition text-lg"
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
