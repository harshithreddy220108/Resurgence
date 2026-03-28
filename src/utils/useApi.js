import { useState } from 'react';
import { useAuthStore } from '../utils/useAuth';

export function useApi() {
  const token = useAuthStore((state) => state.token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const API_BASE = import.meta.env.VITE_API_BASE || '';
      const response = await fetch(`${API_BASE}${endpoint}`, {

        ...options,
        headers,
      });

      if (!response.ok) {
        let errMessage = 'An error occurred';
        try {
            const errData = await response.json();
            errMessage = errData.detail || errMessage;
        } catch(e) {}
        throw new Error(errMessage);
      }

      if (response.status === 204) return null;
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { request, loading, error };
}
