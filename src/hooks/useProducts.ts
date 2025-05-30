import { useEffect, useState } from 'react';
import  productService from '../services/productService';

export const useProducts = () => {
    const [products, setProducts] = useState<ProductService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // Updated to handle string or null

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await productService.getAllProducts();
                setProducts(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred'); // Improved error handling
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    return { products, loading, error };
};
