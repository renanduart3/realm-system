import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import saleService from '../services/saleService';
import { clientService } from '../services/clientService';
import { Client } from '../model/types';
import { X, Zap, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProductService } from '../model/types';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SearchableSelect from '../components/SearchableSelect';

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
    const [isLoading, setIsLoading] = useState(false);

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

        if (!selectedProduct) {
            toast.error('Produto não encontrado');
            return;
        }

        setIsLoading(true);

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
        } finally {
            setIsLoading(false);
        }
    };

    const selectedProductData = products.find(p => p.id === selectedProduct);
    const totalAmount = selectedProductData ? selectedProductData.price * quantity : 0;

    return (
        <div>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 relative">
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200"
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <Zap className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Venda Rápida</h2>
                                    <p className="text-purple-100 text-sm">Processar venda instantaneamente</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleQuickSaleSubmit} className="p-6 space-y-6">
                            {/* Product Selection */}
                            <div>
                                <SearchableSelect
                                    options={products}
                                    value={selectedProduct}
                                    onChange={setSelectedProduct}
                                    placeholder="Selecione um produto/serviço"
                                    label="Produto/Serviço"
                                    required
                                />
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Quantidade
                                </label>
                                <input 
                                    type="number" 
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200" 
                                    value={quantity} 
                                    onChange={(e) => setQuantity(Number(e.target.value))} 
                                    min="1" 
                                    required 
                                />
                            </div>

                            {/* Client Selection */}
                            <div>
                                <SearchableSelect
                                    options={clients}
                                    value={selectedClient}
                                    onChange={setSelectedClient}
                                    placeholder="Selecione um cliente (opcional)"
                                    label="Cliente (opcional)"
                                />
                            </div>

                            {/* Total Preview */}
                            {selectedProduct && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <DollarSign className="h-5 w-5 text-green-600" />
                                            <span className="text-sm font-medium text-green-700 dark:text-green-300">Total</span>
                                        </div>
                                        <span className="text-xl font-bold text-green-700 dark:text-green-300">
                                            R$ {totalAmount.toFixed(2)}
                                        </span>
                                    </div>
                                    {selectedProductData && (
                                        <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                                            {selectedProductData.name} × {quantity}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
                            >
                                <Zap className="h-5 w-5" />
                                <span>{isLoading ? 'Finalizando...' : 'Finalizar Venda Rápida'}</span>
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