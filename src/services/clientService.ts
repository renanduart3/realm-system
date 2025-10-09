import { db } from '../db/AppDatabase';
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

      await db.clients.add(newClient);
      return newClient;
    } catch (error) {
      console.error("ClientService - Error creating new client", error);
      return null;
    }
  },

  async getClientById(id: string): Promise<Client | null> {
    try {
      const client = await db.clients.get(id);
      return client || null;
    } catch (error) {
      console.error("ClientService - Error getting client", error);
      return null;
    }
  },

  async getAllClients(): Promise<Client[]> {
    try {
      const clients = await db.clients.toArray();
      return clients;
    } catch (error) {
      console.error("ClientService - Error getting all clients", error);
      return [];
    }
  },

  async editClient(client: Client): Promise<Client | null> {
    try {
      const updatedClient = {
        ...client,
        updated_at: new Date().toISOString()
      };
      
      await db.clients.put(updatedClient);
      return updatedClient;
    } catch (error) {
      console.error("ClientService - Error editing client", error);
      return null;
    }
  },

  async deleteClient(id: string): Promise<boolean> {
    try {
      await db.clients.delete(id);
      return true;
    } catch (error) {
      console.error("ClientService - Error deleting client", error);
      return false;
    }
  }
}; 

export default clientService;