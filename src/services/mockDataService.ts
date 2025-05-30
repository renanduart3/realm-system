import { appConfig } from '../config/app.config';
import { db, INSIGHT_TYPES, InsightType } from '../db/AppDatabase';
import mockData from '../mocks/dataMock.json';
import { v4 as uuidv4 } from 'uuid';
import { 
  SystemConfig, 
  ProductService, 
  Transaction, 
  Client, 
  SystemUser, 
  ExpenseCategory,
  Income,
  Sale,
  Donor
} from '../model/types';

export const mockDataService = {
  async initializeMockData() {
    if (!appConfig.useMockData) {
      return;
    }

    try {
      // Check if data is already initialized
      const existingData = await db.systemConfig.get('system-config');
      if (existingData) {
        console.log('Mock data already initialized');
        return;
      }

      // Initialize system config
      const systemConfig: SystemConfig = {
        ...mockData.systemConfig,
        organization_type: 'profit',
        theme: 'light'
      };
      await db.systemConfig.put(systemConfig);

      // Initialize products
      for (const product of mockData.products) {
        const productService: ProductService = {
          ...product,
          id: uuidv4(),
          type: 'Product' as const,
          active: true
        };
        await db.products.add(productService);
      }

      // Initialize sales
      for (const sale of mockData.sales) {
        const saleData: Sale = {
          ...sale,
          id: uuidv4(),
          date: sale.date,
          time: sale.time || new Date().toTimeString().split(' ')[0],
          value: sale.value,
          client_id: sale.client_id
        };
        await db.sales.add(saleData);
      }

      // Initialize income
      for (const income of mockData.income) {
        const incomeData: Income = {
          id: uuidv4(),
          description: income.description,
          amount: income.amount,
          date: income.date,
          category: income.category,
          type: 'other',
          is_recurring: income.is_recurring,
          status: 'completed',
          created_at: income.created_at,
          updated_at: income.updated_at
        };
        await db.income.add(incomeData);
      }

      // Initialize donors
      for (const donor of mockData.donors) {
        const donorData: Donor = {
          ...donor,
          id: uuidv4(),
          type: donor.type as 'individual' | 'company' | 'organization'
        };
        await db.donors.add(donorData);
      }

      // Initialize expense transactions
      for (const expense of mockData.expense.topExpenses) {
        const transaction: Transaction = {
          id: uuidv4(),
          category: 'others',
          value: expense.amount,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0],
          description: `${expense.category} expense`,
          status: 'pending',
          is_recurring: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await db.transactions.add(transaction);
      }

      // Initialize clients
      for (const client of mockData.clients) {
        const clientData: Client = {
          ...client,
          id: uuidv4()
        };
        await db.clients.add(clientData);
      }

      // Initialize users
      for (const user of mockData.systemUsers) {
        const userData: SystemUser = {
          ...user,
          id: uuidv4(),
          role: 'master',
          nature_type: 'profit'
        };
        await db.systemUsers.add(userData);
      }

      // Add some additional mock expenses with different statuses and dates
      const mockExpenses: Partial<Transaction>[] = [
        {
          category: 'services',
          value: 500,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0],
          description: 'Electricity Bill',
          status: 'pending',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          is_recurring: true
        },
        {
          category: 'consume',
          value: 2000,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0],
          description: 'Office Rent',
          status: 'paid',
          is_recurring: true
        },
        {
          category: 'others',
          value: 300,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0],
          description: 'Office Supplies',
          status: 'pending',
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          is_recurring: false
        }
      ];

      for (const expense of mockExpenses) {
        const transaction: Transaction = {
          ...expense,
          id: uuidv4(),
          category: expense.category as ExpenseCategory,
          value: expense.value!,
          date: expense.date!,
          time: expense.time!,
          status: expense.status!,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await db.transactions.add(transaction);
      }

      // Initialize insights with correct types
      const insightMap: Record<string, InsightType> = {
        demand: INSIGHT_TYPES.DEMAND,
        sentiment: INSIGHT_TYPES.SENTIMENT,
        expense: INSIGHT_TYPES.EXPENSE,
        sales: INSIGHT_TYPES.SALES,
        fidelization: INSIGHT_TYPES.FIDELIZATION
      };

      const insights = {
        demand: mockData.demand,
        sentiment: mockData.sentiment,
        expense: mockData.expense,
        sales: mockData.salesPerformance,
        fidelization: mockData.fidelization
      };

      for (const [key, data] of Object.entries(insights)) {
        await db.insights.add({
          id: uuidv4(),
          type: insightMap[key],
          data,
          timestamp: new Date().toISOString(),
          year: new Date().getFullYear(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      console.log('Mock data initialized successfully');
    } catch (error) {
      console.error('Error initializing mock data:', error);
    }
  }
};
