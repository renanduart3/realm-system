import mockData from '../mocks/dataMock.json';
import { appConfig } from '../config/app.config';
import { db } from '../db/AppDatabase';
import { 
  SystemConfig, 
  Income, 
  Donor, 
  FinancialCategory, 
  SystemUser,
  TransactionType,
  ProductService
} from '../model/types';

const shouldUseMockData = () => {
  return appConfig.isDevelopment && appConfig.useMockData;
};

const convertMockData = {
  systemConfig: (data: any): SystemConfig => ({
    ...data,
    organization_type: data.organization_type as "profit" | "nonprofit",
  }),
  products: (data: any[]): ProductService[] => data.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
    unit: item.unit,
    quantity: item.quantity,
    created_at: item.created_at,
    updated_at: item.updated_at,
    type: item.type as "Product" | "Service",
    description: item.description,
  })),
  income: (data: any[]): Income[] => data.map(item => ({
    id: item.id,
    date: item.date,
    value: item.value,
    description: item.description,
    amount: item.amount,
    category: item.category,
    type: item.type,
    is_recurring: item.is_recurring,
    status: item.status || 'pending', // Added status property
    created_at: item.created_at,
    updated_at: item.updated_at,
  })),
  donors: (data: any[]): Donor[] => data.map(item => ({
    id: item.id,
    name: item.name,
    amount: item.amount,
    date: item.date,
    type: item.type,
    created_at: item.created_at,
    updated_at: item.updated_at,
  })),
  financialCategories: (data: any[]): FinancialCategory[] => data.map(item => ({
    id: item.id,
    name: item.name,
    type: item.type,
    created_at: item.created_at,
    updated_at: item.updated_at,
  })),
  systemUsers: (data: any[]): SystemUser[] => data.map(item => ({
    ...item,
    role: item.role as "master" | "seller",
    nature_type: item.nature_type as "profit" | "nonprofit",
  })),
};

export const loadInitialMockData = async () => {
  if (!shouldUseMockData()) return;

  try {
    const existingConfig = await db.systemConfig.get('system-config');
    if (existingConfig) {
      console.log('Database already initialized');
      return;
    }

    await db.systemConfig.put(convertMockData.systemConfig(mockData.systemConfig));
    await db.products.bulkPut(convertMockData.products(mockData.products));
    await db.income.bulkPut(convertMockData.income(mockData.income));
    await db.donors.bulkPut(convertMockData.donors(mockData.donors));
    await db.financialCategories.bulkPut(convertMockData.financialCategories(mockData.financialCategories));
    await db.systemUsers.bulkPut(convertMockData.systemUsers(mockData.systemUsers));

    console.log('Mock data loaded successfully');
  } catch (error) {
    console.error('Error loading mock data:', error);
  }
};

export const getMockData = async <T>(tableName: string): Promise<T> => {
  if (!shouldUseMockData()) return {} as T;
  return (mockData as any)[tableName] || {} as T;
};
