import { db } from '../db/AppDatabase';
import { SystemConfig, OrganizationSetup } from '../model/types';

let isInitialized = false;

export const systemConfigService = {
  async initialize() {
    console.log('Initializing systemConfigService...');
    if (!isInitialized) {
      try {
        console.log('Opening database...');
        await db.open();
        isInitialized = true;
        console.log('Database opened successfully');
      } catch (error) {
        console.error('Error initializing database:', error);
        // Try to close and reopen the database
        try {
          await db.close();
          await db.open();
          isInitialized = true;
          console.log('Database reopened successfully');
        } catch (retryError) {
          console.error('Failed to reopen database:', retryError);
          throw error;
        }
      }
    } else {
      console.log('Database already initialized');
    }
  },

  async getConfig(): Promise<OrganizationSetup | null> {
    try {
      console.log('Getting system config...');
      await this.initialize();
      
      const config = await db.systemConfig.get('system-config');
      console.log('Current config:', config);
      
      if (!config) {
        console.log('No config found, creating default config...');
        const defaultConfig: OrganizationSetup = {
          id: 'system-config',
          organization_type: 'profit',
          organization_name: 'Minha Organização',
          currency: 'BRL',
          theme: 'light',
          require_auth: true,
          google_sync_enabled: false,
          is_configured: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await db.systemConfig.put(defaultConfig);
        console.log('Default config created:', defaultConfig);
        return defaultConfig;
      }
      return config as OrganizationSetup;
    } catch (error) {
      console.error('Error getting config (likely database deleted):', error);
      // Return null if database doesn't exist (after reset)
      return null;
    }
  },

  async saveConfig(config: Partial<OrganizationSetup>): Promise<boolean> {
    try {
      console.log('Saving config:', config);
      await this.initialize();
      
      const currentConfig = await this.getConfig();
      if (!currentConfig) {
        console.error('No current config found');
        return false;
      }

      // Garantir que todos os campos obrigatórios estejam presentes
      const updatedConfig: OrganizationSetup = {
        ...currentConfig,
        ...config,
        id: 'system-config', // Garantir que o ID está correto
        updated_at: new Date().toISOString()
      };

      console.log('Saving updated config:', updatedConfig);
      
      // Limpar a tabela antes de salvar
      await db.systemConfig.clear();
      
      // Salvar a nova configuração
      await db.systemConfig.put(updatedConfig);
      
      // Verificar se a configuração foi salva corretamente
      const savedConfig = await db.systemConfig.get('system-config');
      console.log('Saved config:', savedConfig);
      
      if (!savedConfig) {
        console.error('Config not found after saving');
        return false;
      }

      // Verificar se is_configured foi atualizado corretamente
      if (config.is_configured !== undefined && savedConfig.is_configured !== config.is_configured) {
        console.error('is_configured not updated correctly');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  },

  async updateSheetId(year: number, sheetId: string): Promise<boolean> {
    try {
      console.log('Updating sheet ID for year:', year);
      const config = await this.getConfig();
      if (!config) return false;

      const updatedConfig = {
        ...config,
        sheet_ids: {
          ...config.sheet_ids,
          [year]: sheetId
        },
        updated_at: new Date().toISOString()
      };

      await db.systemConfig.put(updatedConfig);
      console.log('Sheet ID updated successfully');
      return true;
    } catch (error) {
      console.error("Error updating sheet id:", error);
      return false;
    }
  }
};
