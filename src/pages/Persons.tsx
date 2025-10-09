import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, ExternalLink } from 'lucide-react';
import { personService } from '../services/personService';
import { Person } from '../model/types';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { systemConfigService } from '../services/systemConfigService';

export default function Persons() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [natureType, setNatureType] = useState<'profit' | 'nonprofit'>('profit');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: '',
    familyIncome: '',
    socialPrograms: [] as string[],
    notes: '',
    isWhatsApp: false,
    birthDate: ''
  });

  useEffect(() => {
    const fetchConfig = async () => {
      const config = await systemConfigService.getSystemConfig();
      if (config) {
        setNatureType(config.organization_type);
      }
    };
    fetchConfig();
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      const data = await personService.getAllPersons();
      setPersons(data);
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error);
      toast.error('Erro ao carregar lista de pessoas');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const personData = {
        ...formData,
        familyIncome: formData.familyIncome ? Number(formData.familyIncome) : undefined,
      };

      if (editingPerson) {
        await personService.editPerson({
          ...editingPerson,
          ...personData,
        });
        toast.success('Pessoa atualizada com sucesso!');
      } else {
        await personService.createPerson(
          personData.name,
          personData.email,
          personData.phone,
          personData.document,
          personData.address,
          personData.socialPrograms,
          personData.familyIncome,
          personData.isWhatsApp,
          personData.birthDate,
          personData.notes
        );
        toast.success('Pessoa criada com sucesso!');
      }
      setIsModalOpen(false);
      setEditingPerson(null);
      resetForm();
      loadPersons();
    } catch (error) {
      console.error('Erro ao salvar pessoa:', error);
      toast.error('Erro ao salvar pessoa. Por favor, tente novamente.');
    }
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name,
      email: person.email,
      phone: person.phone,
      document: person.document,
      address: person.address || '',
      familyIncome: person.familyIncome?.toString() || '',
      socialPrograms: person.socialPrograms || [],
      notes: person.notes || '',
      isWhatsApp: person.isWhatsApp || false,
      birthDate: person.birthDate ? person.birthDate.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta pessoa?')) {
      try {
        await personService.deletePerson(id);
        toast.success('Pessoa excluída com sucesso!');
        loadPersons();
      } catch (error) {
        console.error('Erro ao excluir pessoa:', error);
        toast.error('Erro ao excluir pessoa. Por favor, tente novamente.');
      }
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
      notes: '',
      isWhatsApp: false,
      birthDate: ''
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

  const filteredPersons = persons.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.document.includes(searchTerm)
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pessoas</h1>
        <button
          onClick={() => {
            setEditingPerson(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Pessoa
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar pessoas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
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
              {natureType === 'nonprofit' ? (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data de Nasc.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Telefone
                  </th>
                </>
              ) : (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Renda Familiar
                  </th>
                </>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Programas Sociais
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPersons.map((person) => (
              <tr key={person.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {person.name}
                </td>
                {natureType === 'nonprofit' ? (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {person.birthDate ? new Date(person.birthDate).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <div className="flex items-center">
                        {person.phone}
                        {person.isWhatsApp && (
                          <a href={`https://wa.me/${person.phone}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-green-500 hover:text-green-700">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {person.document}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {person.familyIncome ? formatCurrency(person.familyIncome) : '-'}
                    </td>
                  </>
                )}
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                  {person.socialPrograms?.join(', ') || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(person)}
                    className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 mr-3"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(person.id)}
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
              {editingPerson ? 'Editar Pessoa' : 'Nova Pessoa'}
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
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">
                  Telefone
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                />
              </div>
              {natureType === 'nonprofit' ? (
                <>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isWhatsApp"
                      checked={formData.isWhatsApp}
                      onChange={(e) => setFormData({ ...formData, isWhatsApp: e.target.checked })}
                      className="form-checkbox"
                    />
                    <label htmlFor="isWhatsApp" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                      Este número possui WhatsApp
                    </label>
                  </div>
                  <div>
                    <label className="form-label">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="form-label">
                      Renda Familiar
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.familyIncome}
                      onChange={(e) => setFormData({ ...formData, familyIncome: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      Observações
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="form-textarea"
                      rows={3}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="form-label">
                  Documento
                </label>
                <input
                  type="text"
                  required={natureType === 'profit'}
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label mb-2">
                  Programas Sociais
                </label>
                <div className="space-y-2">
                  {socialProgramOptions.map((program) => (
                    <label key={program} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.socialPrograms.includes(program)}
                        onChange={() => handleSocialProgramChange(program)}
                        className="form-checkbox"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{program}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPerson(null);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingPerson ? 'Salvar' : 'Criar'}
                </button>
              </div>
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
} 