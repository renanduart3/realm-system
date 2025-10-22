import { getDbEngine } from '../db/engine';

export async function resetDatabase(): Promise<boolean> {
  try {
    console.log('?? Resetting database (engine)...');
    const engine = getDbEngine();
    await engine.reset();
    
    console.log('? Database reset successfully');
    return true;
  } catch (error) {
    console.error('? Error resetting database:', error);
    return false;
  }
}

export async function forceDatabaseReopen(): Promise<boolean> {
  try {
    console.log('?? Force reopening database (engine)...');
    const engine = getDbEngine();
    await engine.close();
    await engine.open();
    
    console.log('? Database reopened successfully');
    return true;
  } catch (error) {
    console.error('? Error reopening database:', error);
    return false;
  }
}

