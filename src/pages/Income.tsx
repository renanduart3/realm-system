import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Income, TransactionType } from '../model/types';
import { incomeService } from '../services/incomeService';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';

export default function Income() {
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { organizationType } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState<{
        description: string;
        amount: string;
        date: string;
        donor_id: string;
        category: string;
        type: TransactionType;
        is_recurring: boolean;
        recurrence_period: 'monthly' | 'quarterly' | 'yearly';
    }>({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        donor_id: '',
        category: '',
        type: 'donation' as TransactionType,
        is_recurring: false,
        recurrence_period: 'monthly'
    });

    useEffect(() => {
        if (organizationType !== 'nonprofit') {
            navigate('/sales');
            return;
        }
        loadIncomes();
    }, [organizationType, navigate]);

    const loadIncomes = async () => {
        const data = await incomeService.getAllIncome();
        setIncomes(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingIncome) {
                await incomeService.updateIncome(
                    editingIncome.id,
                    {
                        ...editingIncome,
                        ...formData,
                        amount: parseFloat(formData.amount)
                    }
                );
            } else {
                await incomeService.createIncome({
                    ...formData,
                    amount: parseFloat(formData.amount)
                }, organizationType);
            }
            setIsModalOpen(false);
            resetForm();
            loadIncomes();
        } catch (error) {
            console.error('Erro ao salvar entrada:', error);
            alert('Erro ao salvar entrada');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta entrada?')) {
            await incomeService.deleteIncome(id);
            loadIncomes();
        }
    };

    const resetForm = () => {
        setFormData({
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            donor_id: '',
            category: '',
            type: 'donation' as TransactionType,
            is_recurring: false,
            recurrence_period: 'monthly'
        });
        setEditingIncome(null);
    };

    const filteredIncomes = incomes.filter(income =>
        income.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (organizationType !== 'nonprofit') {
        return null;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entradas</h1>
                <button
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Entrada
                </button>
            </div>

            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar entradas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                </div>
            </div>

            {/* Modal de Formulário */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                            {editingIncome ? 'Editar Entrada' : 'Nova Entrada'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="form-label">
                                    Descrição
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="form-label">
                                    Valor
                                </label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="form-label">
                                    Data
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="form-label">
                                    Tipo
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
                                    className="form-select"
                                >
                                    <option value="donation">Doação</option>
                                    <option value="grant">Subvenção</option>
                                    <option value="other">Outro</option>
                                </select>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_recurring"
                                    checked={formData.is_recurring}
                                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                    Entrada Recorrente
                                </label>
                            </div>

                            {formData.is_recurring && (
                                <div>
                                    <label className="form-label">
                                        Período de Recorrência
                                    </label>
                                    <select
                                        value={formData.recurrence_period}
                                        onChange={(e) => setFormData({ ...formData, recurrence_period: e.target.value as 'monthly' | 'quarterly' | 'yearly' })}
                                        className="form-select"
                                    >
                                        <option value="monthly">Mensal</option>
                                        <option value="quarterly">Trimestral</option>
                                        <option value="yearly">Anual</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                                >
                                    {editingIncome ? 'Atualizar' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}