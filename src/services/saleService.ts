import { db } from '../db/AppDatabase';
import { Sale } from '../model/types'; // Ensure correct imports
import { v4 as uuidv4 } from 'uuid';

export const saleService = {
  async createSale(
    date: string,
    time: string,
    value: number,
    client_id?: string,
    person_id?: string,
    description?: string,
    organizationType?: string
  ): Promise<Sale | null> {
    try {
      if (organizationType && organizationType !== 'profit') {
        throw new Error('Vendas não são permitidas para organizações sem fins lucrativos');
      }

      const newSale: Sale = {
        id: uuidv4(),
        date,
        time,
        value,
        client_id,
        person_id,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await db.sales.add(newSale);
      return newSale;
    } catch (error) {
      console.error("Error creating new sale", error);
      throw error;
    }
  },

  async createQuickSale(
    quickSaleData: { product: string; quantity: number; client?: string; description?: string },
    userId?: string
  ): Promise<Sale | null> {
    try {
      // Placeholder for value calculation - in a real app, fetch product price
      // const productDetails = await db.products.get(quickSaleData.product);
      // const value = productDetails ? productDetails.price * quickSaleData.quantity : 0;
      
      const newSale: Sale = {
        id: uuidv4(),
        date: new Date().toISOString().split('T')[0], // Current date
        time: new Date().toISOString().split('T')[1].split('.')[0], // Current time
        value: 0, // Placeholder value
        client_id: quickSaleData.client,
        // Construct a meaningful description for the quick sale
        description: `Product ID: ${quickSaleData.product}, Quantity: ${quickSaleData.quantity}. Notes: ${quickSaleData.description || 'N/A'}`,
        userId: userId, // Include userId
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await db.sales.add(newSale);
      return newSale;
    } catch (error) {
      console.error("Error creating new quick sale", error);
      return null;
    }
  },

  async getSaleById(id: string): Promise<Sale | null> {
    try {
      const sale = await db.sales.get(id);
      return sale || null;
    } catch (error) {
      console.error("Error getting sale", error);
      return null;
    }
  },

  async getAllSales(): Promise<Sale[]> {
    try {
      const sales = await db.sales.toArray();
      return sales;
    } catch (error) {
      console.error("Error getting all sales", error);
      return [];
    }
  },

  async editSale(sale: Sale): Promise<Sale | null> {
    try {
      const updatedSale = {
        ...sale,
        updated_at: new Date().toISOString()
      };
      
      await db.sales.put(updatedSale);
      return updatedSale;
    } catch (error) {
      console.error("Error editing sale", error);
      return null;
    }
  },

  async deleteSale(id: string): Promise<boolean> {
    try {
      await db.sales.delete(id);
      return true;
    } catch (error) {
      console.error("Error deleting sale", error);
      return false;
    }
  }
};

export default saleService;
