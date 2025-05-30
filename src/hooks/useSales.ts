import { useEffect, useState } from 'react';
import saleService from '../services/saleService';
import { Sale } from '../model/types';

const useSales = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const todaysSales = await saleService.getTodaysSales();
                setSales(todaysSales);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchSales();
    }, []);

    return { sales, loading, error };
};

export default useSales;
