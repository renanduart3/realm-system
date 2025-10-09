import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import QuickSale from './QuickSale';
import Breadcrumb from '../components/Breadcrumb';
import saleService from '../services/saleService'; // Import the sale service
import clientService from '../services/clientService';
import { Sale, Client } from '../model/types'; // Import the Sale type
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const Sales = () => {
    const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
    const [sales, setSales] = useState<Sale[]>([]);
    const [clients, setClients] = useState<{ [key: string]: Client }>({});
    const [loading, setLoading] = useState(true);
    const { organizationType } = useAuth();
    const navigate = useNavigate();

    const handleCloseQuickSale = () => {
        setIsQuickSaleOpen(false);
    };

    const loadSales = async () => {
        try {
            const allSales = await saleService.getAllSales();
            setSales(allSales);

            // Buscar informações dos clientes
            const clientIds = allSales
                .filter(sale => sale.client_id)
                .map(sale => sale.client_id as string);

            const uniqueClientIds = [...new Set(clientIds)];
            const clientsMap: { [key: string]: Client } = {};

            for (const clientId of uniqueClientIds) {
                const client = await clientService.getClientById(clientId);
                if (client) {
                    clientsMap[clientId] = client;
                }
            }

            setClients(clientsMap);
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
            toast.error('Erro ao carregar vendas. Por favor, tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (organizationType !== 'profit') {
            navigate('/income');
            return;
        }
        loadSales();
    }, [organizationType, navigate]);

    if (organizationType !== 'profit') {
        return null;
    }

    return (
        <div className="p-6">
            <Breadcrumb />
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendas</h1>
                <div className="space-x-2">
                    <Link
                        to="/sales/full"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Venda Completa
                    </Link>
                    <button
                        onClick={() => setIsQuickSaleOpen(true)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Venda Rápida
                    </button>
                </div>
            </div>

            {/* Lista de vendas aqui */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                {loading ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                        Carregando vendas...
                    </p>
                ) : sales.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                        Nenhuma venda registrada ainda
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {sales.map(sale => (
                                    <tr key={sale.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                            {new Date(sale.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                            R$ {sale.value.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                            {sale.client_id ? clients[sale.client_id]?.name || 'Cliente não encontrado' : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isQuickSaleOpen && (
                <QuickSale 
                    onClose={handleCloseQuickSale} 
                    onSaleComplete={loadSales}
                />
            )}
        </div>
    );
};

export default Sales;
