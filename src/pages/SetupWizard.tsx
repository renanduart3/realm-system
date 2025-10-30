import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { systemConfigService } from '../services/systemConfigService';
import { OrganizationSetup } from '../model/types';
import { resetDatabase } from '../utils/resetDatabase';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2 } from 'lucide-react';

export default function SetupWizard() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth() as { user: any; isAuthenticated: boolean };
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<any>({});
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    // Enforce authentication before showing wizard
    if (!isAuthenticated) {
      try { localStorage.setItem('postLoginRedirect', '/setup'); } catch {}
      navigate('/login');
      return;
    }

    const loadInitialConfig = async () => {
      const currentConfig = await systemConfigService.getConfig();
      if (currentConfig?.is_configured) {
        navigate('/');
      } else {
        setConfig({
          organization_type: 'profit',
          organization_name: '',
          currency: 'BRL',
          theme: 'light',
          require_auth: true,
          google_sync_enabled: false,
          is_configured: false,
          address: '',
          commercial_phone: '',
          website: '',
          pix_keys: []
        });
      }
    };
    loadInitialConfig();
  }, [navigate, isAuthenticated]);

  const handleResetDatabase = async () => {
    if (window.confirm('Tem certeza que deseja resetar o banco de dados? Esta ação irá apagar todos os dados e não pode ser desfeita.')) {
      setIsResetting(true);
      try {
        const success = await resetDatabase();
        if (success) {
          alert('Banco de dados resetado com sucesso! A página será recarregada.');
          window.location.reload();
        } else {
          alert('Erro ao resetar o banco de dados.');
        }
      } catch (error) {
        console.error('Erro ao resetar banco:', error);
        alert('Erro ao resetar o banco de dados.');
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleFinish = async () => {
  try {
    const basicConfig: Partial<OrganizationSetup> = {
      id: 'system-config',
      organization_type: config.organization_type || 'profit',
      organization_name: config.organization_name || '',
      currency: config.currency || 'BRL',
      theme: config.theme || 'light',
      require_auth: config.require_auth || true,
      google_sync_enabled: config.google_sync_enabled || false,
      is_configured: true,
      configured_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      address: (config as any).address,
      commercial_phone: (config as any).commercial_phone,
      website: (config as any).website,
      cnpj: (config as any).cnpj,
      social_media: (config as any).social_media,
      pix_keys: (config as any).pix_keys
    };

    const basicSuccess = await systemConfigService.saveConfig(basicConfig);
    if (!basicSuccess) {
      console.error('Erro ao salvar configura��o b�sica');
      return;
    }

    const subscriptionConfig: Partial<OrganizationSetup> = {
      id: 'system-config',
      subscription: {
        plan: 'free',
        billing: 'monthly',
        payment_status: 'pending',
        is_early_user: !localStorage.getItem('not_early_user')
      }
    };

    const subscriptionSuccess = await systemConfigService.saveConfig(subscriptionConfig);
    if (subscriptionSuccess) {
      window.location.href = '/';
    } else {
      console.error('Erro ao salvar configura��o de assinatura');
    }
  } catch (error) {
    console.error('Erro ao finalizar configura��o:', error);
  }
  };

  // Helpers PIX
  const addPixKey = () => {
    setConfig((prev: any) => {
      const current = prev.pix_keys || [];
      if (current.length >= 4) return prev;
      return {
        ...prev,
        pix_keys: [
          ...current,
          { id: uuidv4(), type: 'random', key: '', description: '', bank_name: '', beneficiary_name: '' }
        ]
      };
    });
  };

  const updatePixKey = (id: string, field: string, value: string) => {
    setConfig((prev: any) => ({
      ...prev,
      pix_keys: (prev.pix_keys || []).map((k: any) => (k.id === id ? { ...k, [field]: value } : k))
    }));
  };

  const removePixKey = (id: string) => {
    setConfig((prev: any) => ({
      ...prev,
      pix_keys: (prev.pix_keys || []).filter((k: any) => k.id !== id)
    }));
  };

  // UI Steps
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Tipo de Organização</label>
                <select
                  className="input mt-1"
                  value={config.organization_type || 'profit'}
                  onChange={(e) => setConfig((c: any) => ({ ...c, organization_type: e.target.value }))}
                >
                  <option value="profit">Com fins lucrativos</option>
                  <option value="nonprofit">Sem fins lucrativos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Nome da organização</label>
                <input
                  className="input mt-1"
                  placeholder="Ex.: ACME Ltda"
                  value={config.organization_name || ''}
                  onChange={(e) => setConfig((c: any) => ({ ...c, organization_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Telefone</label>
                <input
                  className="input mt-1"
                  placeholder="(00) 00000-0000"
                  value={config.commercial_phone || ''}
                  onChange={(e) => setConfig((c: any) => ({ ...c, commercial_phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Website</label>
                <input
                  className="input mt-1"
                  placeholder="https://suaempresa.com"
                  value={config.website || ''}
                  onChange={(e) => setConfig((c: any) => ({ ...c, website: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Endereço</label>
              <input
                className="input mt-1"
                placeholder="Rua, número, bairro, cidade, UF"
                value={config.address || ''}
                onChange={(e) => setConfig((c: any) => ({ ...c, address: e.target.value }))}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Chaves PIX</h3>
              <button type="button" onClick={addPixKey} disabled={(config.pix_keys?.length || 0) >= 4} className="btn-secondary inline-flex items-center gap-2">
                <Plus className="w-4 h-4"/>
                Adicionar Chave
              </button>
            </div>
            {(config.pix_keys || []).length === 0 && (
              <p className="text-sm text-gray-500">Nenhuma chave adicionada. Você pode cadastrar até 4.</p>
            )}
            <div className="space-y-3">
              {(config.pix_keys || []).map((k: any) => (
                <div key={k.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border p-3 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium">Tipo</label>
                    <select className="input mt-1" value={k.type} onChange={(e) => updatePixKey(k.id, 'type', e.target.value)}>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">Email</option>
                      <option value="phone">Telefone</option>
                      <option value="random">Aleatória</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium">Chave</label>
                    <input className="input mt-1" value={k.key} onChange={(e) => updatePixKey(k.id, 'key', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Banco</label>
                    <input className="input mt-1" value={k.bank_name || ''} onChange={(e) => updatePixKey(k.id, 'bank_name', e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => removePixKey(k.id)} className="btn-secondary inline-flex items-center gap-1">
                      <Trash2 className="w-4 h-4"/>
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Revisar e finalizar</h3>
            <p>Revise suas informações e conclua a configuração.</p>
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Revisar e finalizar</h3>
            <p>Tudo pronto para começar a usar o app.</p>
          </div>
        );
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Configuração Inicial
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              {[1, 2, 3].map(step => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === step ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (currentStep < 3) {
              setCurrentStep(prev => prev + 1);
            } else {
              handleFinish();
            }
          }}>
            {renderStep()}

            <div className="mt-8 flex justify-between">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="btn-secondary"
                >
                  Anterior
                </button>
              )}
              
              <button
                type="submit"
                className={`btn-primary ${
                  currentStep === 3 ? 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : ''
                }`}
              >
                {currentStep === 3 ? 'Finalizar' : 'Próximo'}
              </button>
            </div>
          </form>
          
          {/* Botão de Emergência */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Problemas com o banco de dados?
              </p>
              <button
                type="button"
                onClick={handleResetDatabase}
                disabled={isResetting}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 transition-colors disabled:opacity-50"
              >
                {isResetting ? 'Resetando...' : 'Resetar Banco de Dados'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 






