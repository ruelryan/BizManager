import { useStore } from '../store/useStore';
import { useCurrencyConverter } from '../utils/currency';

export const useCurrency = () => {
  const { user, userSettings } = useStore();
  const userCurrency = userSettings?.currency || user?.currency || 'PHP';
  
  return useCurrencyConverter(userCurrency);
};