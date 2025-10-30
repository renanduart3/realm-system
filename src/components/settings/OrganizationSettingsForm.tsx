import React from 'react';
import { Save, Loader2, Pencil } from 'lucide-react';
import { OrganizationSetup } from '../../model/types';

interface Props {
  config: Partial<OrganizationSetup>;
  onChange: (field: keyof OrganizationSetup, value: any) => void;
  isEditMode: boolean;
  onToggleEdit: () => void;
  onCancelEdit: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
  // PIX handlers
  onAddPixKey?: () => void;
  onUpdatePixKey?: (id: string, field: string, value: string) => void;
  onRemovePixKey?: (id: string) => void;
}

const OrganizationSettingsForm: React.FC<Props> = ({
  config,
  onChange,
  isEditMode,
  onToggleEdit,
  onCancelEdit,
  onSubmit,
  isSaving,
  onAddPixKey,
  onUpdatePixKey,
  onRemovePixKey
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Configurações da Organização</h2>
          {!isEditMode && (<span className="text-sm text-gray-500 dark:text-gray-400">(Somente leitura)</span>)}
        </div>
        <div className="flex items-center gap-2">
          {!isEditMode ? (
            <button type="button" onClick={onToggleEdit} className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
              <Pencil className="w-4 h-4 mr-1" />Editar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button type="button" onClick={onCancelEdit} className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Cancelar</button>
              <button type="submit" disabled={isSaving} className={`inline-flex items-center px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}>
                {isSaving ? (<><Loader2 className="w-4 h-4 mr-1 animate-spin" />Salvando...</>) : (<><Save className="w-4 h-4 mr-1" />Salvar</>)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tipo de organização (somente leitura) */}
      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tipo de Organização
        </label>
        <div className="flex items-center justify-between">
          <span className="text-gray-900 dark:text-white font-medium">
            {config.organization_type === 'nonprofit' ? 'Sem fins lucrativos' : 'Com fins lucrativos'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Para alterar, use a opção "Resetar Sistema"
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Organização *</label>
          <input type="text" value={config.organization_name || ''} onChange={(e) => onChange('organization_name', e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''}`} required readOnly={!isEditMode} disabled={!isEditMode} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label>
          <input type="tel" value={config.commercial_phone || ''} onChange={(e) => onChange('commercial_phone', e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''}`} readOnly={!isEditMode} disabled={!isEditMode} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
          <input type="url" value={config.website || ''} onChange={(e) => onChange('website', e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''}`} readOnly={!isEditMode} disabled={!isEditMode} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Endereço</label>
        <input type="text" value={config.address || ''} onChange={(e) => onChange('address', e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''}`} readOnly={!isEditMode} disabled={!isEditMode} />
      </div>

      {/* Redes sociais */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Redes Sociais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Facebook</label>
            <input type="url" value={config.social_media?.facebook || ''} onChange={(e) => onChange('social_media', { ...config.social_media, facebook: e.target.value })} className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''}`} readOnly={!isEditMode} disabled={!isEditMode} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instagram</label>
            <input type="url" value={config.social_media?.instagram || ''} onChange={(e) => onChange('social_media', { ...config.social_media, instagram: e.target.value })} className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''}`} readOnly={!isEditMode} disabled={!isEditMode} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn</label>
            <input type="url" value={config.social_media?.linkedin || ''} onChange={(e) => onChange('social_media', { ...config.social_media, linkedin: e.target.value })} className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''}`} readOnly={!isEditMode} disabled={!isEditMode} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Twitter</label>
            <input type="url" value={config.social_media?.twitter || ''} onChange={(e) => onChange('social_media', { ...config.social_media, twitter: e.target.value })} className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${!isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''}`} readOnly={!isEditMode} disabled={!isEditMode} />
          </div>
        </div>
      </div>

      {/* PIX Keys - até 4 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Chaves PIX</h3>
          {isEditMode && (
            <button type="button" onClick={onAddPixKey} disabled={(config.pix_keys?.length || 0) >= 4} className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30">
              Adicionar Chave
            </button>
          )}
        </div>
        {(config.pix_keys && config.pix_keys.length > 0) ? (
          <div className="space-y-3">
            {config.pix_keys!.map((k) => (
              <div key={k.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border p-3 rounded-lg">
                <div>
                  <label className="block text-xs font-medium">Tipo</label>
                  <select className="input mt-1" value={k.type} disabled={!isEditMode} onChange={(e) => onUpdatePixKey?.(k.id, 'type', e.target.value)}>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">Email</option>
                    <option value="phone">Telefone</option>
                    <option value="random">Aleatória</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium">Chave</label>
                  <input className="input mt-1" value={k.key} readOnly={!isEditMode} onChange={(e) => onUpdatePixKey?.(k.id, 'key', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium">Banco</label>
                  <input className="input mt-1" value={k.bank_name || ''} readOnly={!isEditMode} onChange={(e) => onUpdatePixKey?.(k.id, 'bank_name', e.target.value)} />
                </div>
                <div className="flex gap-2">
                  {isEditMode && (
                    <button type="button" onClick={() => onRemovePixKey?.(k.id)} className="btn-secondary inline-flex items-center gap-1">
                      Remover
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhuma chave adicionada. Você pode cadastrar até 4.</p>
        )}
      </div>
    </form>
  );
};

export default OrganizationSettingsForm;
