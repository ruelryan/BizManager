import { useStore } from '../store/useStore';
import { useCurrencyConverter } from '../utils/currency';

export const useCurrency = () => {
  const { userSettings } = useStore();
  const userCurrency = userSettings?.currency || 'PHP';
  
  return useCurrencyConverter(userCurrency);
};