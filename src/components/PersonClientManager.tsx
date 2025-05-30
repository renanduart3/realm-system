import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { personService } from '../services/personService';
import { clientService } from '../services/clientService';
import { Person, Client } from '../model/types';
import { useAuth } from '../contexts/AuthContext';

type EntityType = Person | Client;

export default function PersonClientManager() {
  const { organizationType } = useAuth();
  const [entities, setEntities] = useState<EntityType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<EntityType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: '',
    familyIncome: '',
    socialPrograms: [] as string[],
    notes: ''
  });

  const isNonProfit = organizationType === 'nonprofit';
  const entityName = isNonProfit ? 'Pessoas' : 'Clientes';
  const service = isNonProfit ? personService : clientService;

  useEffect(() => {
    loadEntities();
  }, [organizationType]);

  const loadEntities = async () => {
    const data = isNonProfit 
      ? await personService.getAllPersons()
      : await clientService.getAllClients();
    setEntities(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEntity) {
        if (isNonProfit) {
          await personService.editPerson({
            ...editingEntity as Person,
            ...formData,
            familyIncome: Number(formData.familyIncome)
          });
        } else {
          await clientService.editClient({
            ...editingEntity as Client,
            ...formData,
          });
        }
      } else {
        if (isNonProfit) {
          await personService.createPerson(
            formData.name,
            formData.email,
            formData.phone,
            formData.document,
            formData.address,
            formData.socialPrograms,
            Number(formData.familyIncome)
          );
        } else {
          await clientService.createClient(
            formData.name,
            formData.email,
            formData.phone,
            formData.document,
            formData.address
          );
        }
      }
      setIsModalOpen(false);
      setEditingEntity(null);
      resetForm();
      loadEntities();
    } catch (error) {
      console.error(`Erro ao salvar ${isNonProfit ? 'pessoa' : 'cliente'}:`, error);
    }
  };

  const handleEdit = (entity: EntityType) => {
    setEditingEntity(entity);
    setFormData({
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      document: entity.document,
      address: entity.address || '',
      familyIncome: (entity as Person).familyIncome?.toString() || '',
      socialPrograms: (entity as Person).socialPrograms || [],
      notes: (entity as Person).notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Tem certeza que deseja excluir ${isNonProfit ? 'esta pessoa' : 'este cliente'}?`)) {
      if (isNonProfit) {
        await personService.deletePerson(id);
      } else {
        await clientService.deleteClient(id);
      }
      loadEntities();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      document: '',
      address: '',
      familyIncome: '',
      socialPrograms: [],
      notes: ''
    });
  };

  const handleSocialProgramChange = (program: string) => {
    setFormData(prev => {
      const programs = prev.socialPrograms.includes(program)
        ? prev.socialPrograms.filter(p => p !== program)
        : [...prev.socialPrograms, program];
      return { ...prev, socialPrograms: programs };
    });
  };

  const filteredEntities = entities.filter(entity =>
    entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.document.includes(searchTerm)
  );

  const socialProgramOptions = [
    'Bolsa Família',
    'BPC',
    'Auxílio Brasil',
    'Outros'
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{entityName}</h1>
        <button
          onClick={() => {
            setEditingEntity(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isNonProfit ? 'Nova Pessoa' : 'Novo Cliente'}
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={`Buscar ${entityName.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Documento
              </th>
              {isNonProfit && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Renda Familiar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Programas Sociais
                  </th>
                </>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEntities.map((entity) => (
              <tr key={entity.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {entity.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {entity.document}
                </td>
                {isNonProfit && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {(entity as Person).familyIncome ? formatCurrency(Number((entity as Person).familyIncome)) : '-'}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                      {(entity as Person).socialPrograms?.join(', ') || '-'}
                    </td>
                  </>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(entity)}
                    className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 mr-3"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(entity.id)}
                    className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Formulário */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingEntity ? `Editar ${isNonProfit ? 'Pessoa' : 'Cliente'}` : `${isNonProfit ? 'Nova Pessoa' : 'Novo Cliente'}`}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Telefone
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Documento
                </label>
                <input
                  type="text"
                  required
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              {isNonProfit && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Renda Familiar
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.familyIncome}
                      onChange={(e) => setFormData({ ...formData, familyIncome: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Programas Sociais
                    </label>
                    <div className="space-y-2">
                      {socialProgramOptions.map((program) => (
                        <label key={program} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.socialPrograms.includes(program)}
                            onChange={() => handleSocialProgramChange(program)}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{program}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Observações
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      rows={3}
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingEntity(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingEntity ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
