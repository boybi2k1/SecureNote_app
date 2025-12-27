import api from './api';
import { Statistics } from '../types/statistics.types';

export const statisticsService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStatistics(): Promise<Statistics> {
    try {
      const response = await api.get('/statistics/dashboard');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  },
};



