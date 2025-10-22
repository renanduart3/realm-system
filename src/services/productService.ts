import { getDbEngine } from '../db/engine';
import { ProductService } from '../model/types';
import { v4 as uuidv4 } from 'uuid';

export const productService = {
  async createProduct(
    name: string, 
    category: string, 
    price: number, 
    quantity: number,
    type: 'Product' | 'Service', // Added type parameter
    description: string // Added description parameter
  ): Promise<ProductService | null> {
    try {
      const newProduct: ProductService = {
        id: uuidv4(),
        name,
        category,
        price,
        quantity,
        type, // Set the type
        description, // Set the description
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const engine = getDbEngine();
      await engine.upsertProduct(newProduct);
      return newProduct;
    } catch (error) {
      console.error("Error creating new Product", error);
      return null;
    }
  },

  async getProductById(id: string): Promise<ProductService | null> {
    try {
      const engine = getDbEngine();
      const product = await engine.getProductById(id);
      return product || null;
    } catch (error) {
      console.error("Error getting product", error);
      return null;
    }
  },

  async getAllProducts(): Promise<ProductService[]> {
    try {
      const engine = getDbEngine();
      const products = await engine.listProducts();
      return products;
    } catch (error) {
      console.error("Error getting all products", error);
      return [];
    }
  },

  async editProduct(product: ProductService): Promise<ProductService | null> {
    try {
      const updatedProduct = {
        ...product,
        updated_at: new Date().toISOString()
      };
      
      const engine = getDbEngine();
      await engine.upsertProduct(updatedProduct);
      return updatedProduct;
    } catch (error) {
      console.error("Error editing Product", error);
      return null;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const engine = getDbEngine();
      await engine.deleteProduct(id);
      return true;
    } catch (error) {
      console.error("Error deleting product", error);
      return false;
    }
  }
};

// Exporting the productService
export default productService;
