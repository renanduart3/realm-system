// src/hooks/useCurrentNatureType.ts
import { useState, useEffect } from 'react';
import { getItem } from '../utils/localStorageUtils';

const useCurrentNatureType = () => {
    const [natureType, setNatureType] = useState<'profit' | 'nonprofit'>('profit');

    useEffect(() => {
        const systemConfig = getItem<{ nature_type: 'profit' | 'nonprofit' }>("system_config");
        if(systemConfig && systemConfig.nature_type){
            setNatureType(systemConfig.nature_type);
           return;
        }
        const systemUser = getItem<{nature_type: 'profit' | 'nonprofit'}>("system_users")
        if(systemUser && systemUser.length > 0 && systemUser[0].nature_type){
           setNatureType(systemUser[0].nature_type);
            return;
        }
     }, []);

    return natureType;
  };

  export default useCurrentNatureType;