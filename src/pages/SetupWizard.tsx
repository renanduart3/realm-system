import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { systemConfigService } from '../services/systemConfigService';
import { OrganizationSetup } from '../model/types';
import { appConfig } from '../config/app.config';
import { resetDatabase } from '../utils/resetDatabase';

export default function SetupWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<Partial<OrganizationSetup>>({});
  const [selectedPlan, setSelectedPlan] = useState<{
    type: 'free' | 'premium';
    billing?: 'monthly' | 'yearly';
    price?: number;
  }>({ type: 'free' });
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
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
          is_configured: false
        });
      }
    };
    loadInitialConfig();
  }, [navigate]);

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
      // Primeiro, vamos salvar a configuração básica
      const basicConfig = {
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
        address: config.address,
        commercial_phone: config.commercial_phone,
        website: config.website,
        cnpj: config.cnpj,
        social_media: config.social_media,
        pix_key: config.pix_key
      };

      console.log('Salvando configuração básica:', basicConfig);
      const basicSuccess = await systemConfigService.saveConfig(basicConfig);
      
      if (!basicSuccess) {
        console.error('Erro ao salvar configuração básica');
        return;
      }

      // Depois, vamos salvar a configuração de assinatura
      const subscriptionConfig = {
        id: 'system-config',
        subscription: {
          plan: selectedPlan.type,
          billing: selectedPlan.billing || 'monthly',
          payment_status: 'pending' as const,
          is_early_user: !localStorage.getItem('not_early_user')
        }
      };

      console.log('Salvando configuração de assinatura:', subscriptionConfig);
      const subscriptionSuccess = await systemConfigService.saveConfig(subscriptionConfig);

      if (subscriptionSuccess) {
        console.log('Configuração salva com sucesso');
        window.location.href = '/';
      } else {
        console.error('Erro ao salvar configuração de assinatura');
      }
    } catch (error) {
      console.error('Erro ao finalizar configuração:', error);
    }
  };

  const handlePlanSelection = (plan: 'free' | 'premium', billing?: 'monthly' | 'yearly') => {
    let price = 0;
    if (plan === 'premium') {
      const isEarlyUser = !localStorage.getItem('not_early_user');
      if (billing === 'monthly') {
        price = isEarlyUser ? 19.90 : 29.90;
      } else {
        price = isEarlyUser ? 199.90 : 299.90;
      }
    }
    setSelectedPlan({ type: plan, billing, price });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Informações da Organização</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Organização *</label>
              <input
                type="text"
                required
                value={config.organization_name || ''}
                onChange={e => setConfig(prev => ({ ...prev, organization_name: e.target.value }))}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Endereço</label>
              <input
                type="text"
                value={config.address || ''}
                onChange={e => setConfig(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Telefone Comercial</label>
              <input
                type="tel"
                value={config.commercial_phone || ''}
                onChange={e => setConfig(prev => ({ ...prev, commercial_phone: e.target.value }))}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="url"
                value={config.website || ''}
                onChange={e => setConfig(prev => ({ ...prev, website: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">CNPJ</label>
              <input
                type="text"
                value={config.cnpj || ''}
                onChange={e => setConfig(prev => ({ ...prev, cnpj: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Organização *</label>
              <select
                required
                value={config.organization_type || ''}
                onChange={e => setConfig(prev => ({ 
                  ...prev, 
                  organization_type: e.target.value as 'profit' | 'nonprofit' 
                }))}
                className="w-full p-2 border rounded"
              >
                <option value="">Selecione...</option>
                <option value="profit">Com fins lucrativos</option>
                <option value="nonprofit">Sem fins lucrativos</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Redes Sociais</label>
              
              <div>
                <input
                  type="url"
                  value={config.social_media?.facebook || ''}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    social_media: { ...prev.social_media, facebook: e.target.value }
                  }))}
                  className="w-full p-2 border rounded"
                  placeholder="Facebook URL"
                />
              </div>

              <div>
                <input
                  type="url"
                  value={config.social_media?.instagram || ''}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    social_media: { ...prev.social_media, instagram: e.target.value }
                  }))}
                  className="w-full p-2 border rounded"
                  placeholder="Instagram URL"
                />
              </div>

              <div>
                <input
                  type="url"
                  value={config.social_media?.linkedin || ''}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    social_media: { ...prev.social_media, linkedin: e.target.value }
                  }))}
                  className="w-full p-2 border rounded"
                  placeholder="LinkedIn URL"
                />
              </div>

              <div>
                <input
                  type="url"
                  value={config.social_media?.twitter || ''}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    social_media: { ...prev.social_media, twitter: e.target.value }
                  }))}
                  className="w-full p-2 border rounded"
                  placeholder="Twitter URL"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Integrações</h2>
            
            <button
              type="button"
              onClick={() => {/* Implementar integração com Google */}}
              className="w-full p-2 border rounded bg-white hover:bg-gray-50"
            >
              Conectar conta Google
            </button>

            <button
              type="button"
              onClick={() => {/* Implementar integração com OpenAI */}}
              className="w-full p-2 border rounded bg-white hover:bg-gray-50"
            >
              Conectar conta OpenAI
            </button>

            <button
              type="button"
              onClick={() => {/* Implementar integração com Supabase */}}
              className="w-full p-2 border rounded bg-white hover:bg-gray-50"
            >
              Conectar conta Supabase
            </button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Configuração do PIX</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Chave PIX</label>
              <select
                value={config.pix_key?.type || ''}
                onChange={e => setConfig(prev => ({
                  ...prev,
                  pix_key: { 
                    type: e.target.value as 'cnpj' | 'email' | 'phone' | 'random',
                    key: prev.pix_key?.key || ''
                  }
                }))}
                className="w-full p-2 border rounded"
              >
                <option value="">Selecione...</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="phone">Telefone</option>
                <option value="random">Chave Aleatória</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Chave PIX</label>
              <input
                type="text"
                value={config.pix_key?.key || ''}
                onChange={e => setConfig(prev => ({
                  ...prev,
                  pix_key: { 
                    type: prev.pix_key?.type || 'random',
                    key: e.target.value
                  }
                }))}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Assinatura</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`border p-4 rounded text-center ${selectedPlan.type === 'free' ? 'ring-2 ring-blue-500' : ''}`}>
                <h3 className="font-bold">Free</h3>
                <p className="text-2xl font-bold">R$ 0</p>
                <button
                  type="button"
                  onClick={() => handlePlanSelection('free')}
                  className="mt-4 w-full p-2 bg-blue-500 text-white rounded"
                >
                  {selectedPlan.type === 'free' ? 'Selecionado' : 'Selecionar'}
                </button>
              </div>

              <div className={`border p-4 rounded text-center ${selectedPlan.type === 'premium' && selectedPlan.billing === 'monthly' ? 'ring-2 ring-blue-500' : ''}`}>
                <h3 className="font-bold">Premium Mensal</h3>
                <p className="text-2xl font-bold">
                  R$ {localStorage.getItem('not_early_user') ? '29,90' : '19,90'}
                </p>
                <p className="text-sm text-gray-500">Early Users: R$ 19,90</p>
                <button
                  type="button"
                  onClick={() => handlePlanSelection('premium', 'monthly')}
                  className="mt-4 w-full p-2 bg-blue-500 text-white rounded"
                >
                  {selectedPlan.type === 'premium' && selectedPlan.billing === 'monthly' ? 'Selecionado' : 'Selecionar'}
                </button>
              </div>

              <div className={`border p-4 rounded text-center ${selectedPlan.type === 'premium' && selectedPlan.billing === 'yearly' ? 'ring-2 ring-blue-500' : ''}`}>
                <h3 className="font-bold">Premium Anual</h3>
                <p className="text-2xl font-bold">
                  R$ {localStorage.getItem('not_early_user') ? '299,90' : '199,90'}
                </p>
                <p className="text-sm text-gray-500">Early Users: R$ 199,90</p>
                <button
                  type="button"
                  onClick={() => handlePlanSelection('premium', 'yearly')}
                  className="mt-4 w-full p-2 bg-blue-500 text-white rounded"
                >
                  {selectedPlan.type === 'premium' && selectedPlan.billing === 'yearly' ? 'Selecionado' : 'Selecionar'}
                </button>
              </div>
            </div>

            {selectedPlan.type === 'premium' && (
              <div className="mt-8 p-4 bg-gray-50 rounded">
                <p className="text-center text-gray-600">
                  Plano selecionado: Premium {selectedPlan.billing === 'yearly' ? 'Anual' : 'Mensal'}
                  <br />
                  Valor: R$ {selectedPlan.price?.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Configuração Inicial
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              {[1, 2, 3, 4].map(step => (
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
            if (currentStep < 4) {
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
                  currentStep === 4 ? 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : ''
                }`}
              >
                {currentStep === 4 ? 'Finalizar' : 'Próximo'}
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