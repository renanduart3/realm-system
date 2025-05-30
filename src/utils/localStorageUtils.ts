    //localStorageUtils.ts

    import { ProductService, Sale, SaleItem, FinancialCategory, Transaction, SystemUser, InvitationCode } from '../model/types';

   const setItem = <T>(key: string, data: T): boolean => {
       try {
           localStorage.setItem(key, JSON.stringify(data));
          return true;
       } catch (error) {
           console.error('Error setting item to local storage', error);
           return false;
       }
   };

   const getItem = <T>(key: string): T | null => {
       try {
           const item = localStorage.getItem(key);
           return item ? JSON.parse(item) as T : null;
       } catch (error) {
          console.error('Error getting item from local storage', error);
          return null;
       }
    };

   const removeItem = (key: string): boolean => {
       try{
         localStorage.removeItem(key);
         return true;
       } catch (error) {
          console.error('Error removing item from local storage', error);
         return false;
     }
   };

   const clear = (): boolean =>{
       try{
          localStorage.clear();
          return true;
       } catch(error) {
           console.error('Error clearing local storage', error);
           return false;
        }
   }

   export { setItem, getItem, removeItem, clear };