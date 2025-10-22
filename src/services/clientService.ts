import { getDbEngine } from '../db/engine';
import { Client } from '../model/types';
import { v4 as uuidv4 } from 'uuid';

export const clientService = {
  async createClient(
    name: string,
    email: string,
    phone: string,
    document: string,
    address?: string,
    isWhatsApp?: boolean
  ): Promise<Client | null> {
    try {
      // Normalize helpers
      const normalizeDoc = (d?: string) => (d || '').replace(/\D/g, '').trim();
      const normalizePhone = (p?: string) => (p || '').replace(/\D/g, '').trim();

      const docNorm = normalizeDoc(document);
      const phoneNorm = normalizePhone(phone);

      // Check duplicates by document or phone
      const engine = getDbEngine();
      const all = await engine.listClients();
      const duplicate = all.find(c => {
        const cDoc = normalizeDoc(c.document);
        const cPhone = normalizePhone(c.phone);
        return (docNorm && cDoc && cDoc === docNorm) || (phoneNorm && cPhone && cPhone === phoneNorm);
      });
      if (duplicate) {
        throw new Error('Cliente já existe com o mesmo documento ou telefone.');
      }
      const newClient: Client = {
        id: uuidv4(),
        name,
        email,
        phone,
        document,
        address,
        isWhatsApp,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await engine.upsertClient(newClient);
      return newClient;
    } catch (error) {
      console.error("ClientService - Error creating new client", error);
      return null;
    }
  },

  async getClientById(id: string): Promise<Client | null> {
    try {
      const engine = getDbEngine();
      const client = await engine.getClientById(id);
      return client || null;
    } catch (error) {
      console.error("ClientService - Error getting client", error);
      return null;
    }
  },

  async getAllClients(): Promise<Client[]> {
    try {
      const engine = getDbEngine();
      const clients = await engine.listClients();
      return clients;
    } catch (error) {
      console.error("ClientService - Error getting all clients", error);
      return [];
    }
  },

  async editClient(client: Client): Promise<Client | null> {
    try {
      // Prevent duplicates on edit
      const normalizeDoc = (d?: string) => (d || '').replace(/\D/g, '').trim();
      const normalizePhone = (p?: string) => (p || '').replace(/\D/g, '').trim();
      const docNorm = normalizeDoc(client.document);
      const phoneNorm = normalizePhone(client.phone);
      const engine = getDbEngine();
      const all = await engine.listClients();
      const duplicate = all.find(c => c.id !== client.id && (
        (docNorm && normalizeDoc(c.document) === docNorm) ||
        (phoneNorm && normalizePhone(c.phone) === phoneNorm)
      ));
      if (duplicate) {
        throw new Error('Já existe outro cliente com o mesmo documento ou telefone.');
      }

      const updatedClient = {
        ...client,
        isWhatsApp: Boolean(client.isWhatsApp),
        updated_at: new Date().toISOString()
      };
      
      await engine.upsertClient(updatedClient);
      return updatedClient;
    } catch (error) {
      console.error("ClientService - Error editing client", error);
      return null;
    }
  },

  async deleteClient(id: string): Promise<boolean> {
    try {
      const engine = getDbEngine();
      await engine.deleteClient(id);
      return true;
    } catch (error) {
      console.error("ClientService - Error deleting client", error);
      return false;
    }
  }
}; 

export default clientService;
