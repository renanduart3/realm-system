import { db } from '../db/AppDatabase';

export async function resetDatabase(): Promise<boolean> {
  try {
    console.log('🔄 Resetting database...');
    
    // Close the database
    await db.close();
    
    // Delete the database
    await db.delete();
    
    console.log('✅ Database reset successfully');
    return true;
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    return false;
  }
}

export async function forceDatabaseReopen(): Promise<boolean> {
  try {
    console.log('🔄 Force reopening database...');
    
    // Close the database
    await db.close();
    
    // Reopen the database
    await db.open();
    
    console.log('✅ Database reopened successfully');
    return true;
  } catch (error) {
    console.error('❌ Error reopening database:', error);
    return false;
  }
}
