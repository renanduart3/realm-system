import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import saleService from '../services/saleService';
import { clientService } from '../services/clientService';
import { Client } from '../model/types';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // Added
import { ProductService } from '../model/types'; // Added
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


interface QuickSaleProps {
    onClose: () => void;
    onSaleComplete?: () => void;
}

const QuickSale: React.FC<QuickSaleProps> = ({ onClose, onSaleComplete }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [selectedClient, setSelectedClient] = useState('');
    const { products } = useProducts();
    const { organizationType } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);

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

    const handleClose = () => {
        setIsOpen(false);
        setSelectedProduct('');
        setQuantity(1);
        setSelectedClient('');
        onClose();
    };

    const handleQuickSaleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const currentDate = new Date().toISOString().split('T')[0];
            const currentTime = new Date().toISOString().split('T')[1].split('.')[0];
            const product = products.find(p => p.id === selectedProduct);
            
            if (!product) {
                toast.error('Produto não encontrado');
                return;
            }

            const total = product.price * quantity;
            const description = `Venda rápida: ${product.name} x${quantity}`;

            await saleService.createSale(
                currentDate,
                currentTime,
                total,
                selectedClient || undefined,
                undefined,
                description,
                organizationType
            );

            toast.success('Venda rápida realizada com sucesso!');
            handleClose();
            
            if (onSaleComplete) {
                onSaleComplete();
            }
        } catch (error) {
            console.error('Erro ao processar venda rápida:', error);
            toast.error('Erro ao processar venda rápida. Por favor, tente novamente.');
        }
    };

    return (
        <div>
            {isOpen && (
                <div className="modal fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
                    <div className="modal-content bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-xl relative">
                        {/* Close button positioned absolutely in the top-right corner */}
                        <button
                            onClick={handleClose}
                            className="absolute -top-3 -right-3 p-2 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Venda Rápida</h2>
                        
                        <form onSubmit={handleQuickSaleSubmit} className="space-y-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Produto/Serviço:
                                </label>
                                <select 
                                    className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" 
                                    value={selectedProduct} 
                                    onChange={(e) => setSelectedProduct(e.target.value)} 
                                    required
                                >
                                    <option value="">Select a product/service</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>{product.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Quantidade:
                                </label>
                                <input 
                                    type="number" 
                                    className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" 
                                    value={quantity} 
                                    onChange={(e) => setQuantity(Number(e.target.value))} 
                                    min="1" 
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Cliente (opcional):
                                </label>
                                <select 
                                    className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" 
                                    value={selectedClient} 
                                    onChange={(e) => setSelectedClient(e.target.value)}
                                >
                                    <option value="">Selecione um cliente</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button 
                                type="submit" 
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                            >
                                Finalizar Venda Rápida
                            </button>
                        </form>
                    </div>
                </div>
            )}
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

export default QuickSale;
