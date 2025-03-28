
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ExchangeRate } from '../types/api';
import { exchangeRatesAPI } from '../services/api';
import { useSettings } from './SettingsContext';
import { useToast } from '@/components/ui/use-toast';

interface ExchangeRatesContextType {
  rates: ExchangeRate[];
  isLoading: boolean;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => Promise<number>;
  getRate: (currencyCode: string) => ExchangeRate | undefined;
  refreshRates: () => Promise<void>;
  formatCurrency: (amount: number, currencyCode?: string) => string;
}

const ExchangeRatesContext = createContext<ExchangeRatesContextType | undefined>(undefined);

export const ExchangeRatesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { settings } = useSettings();
  const { toast } = useToast();
  
  const fetchRates = async () => {
    try {
      setIsLoading(true);
      const exchangeRates = await exchangeRatesAPI.getAll();
      setRates(exchangeRates);
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
      toast({
        title: "Failed to load exchange rates",
        description: "Currency conversion features may not work correctly.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    
    // Refresh rates every hour
    const interval = setInterval(fetchRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getRate = (currencyCode: string): ExchangeRate | undefined => {
    return rates.find(rate => rate.code === currencyCode);
  };

  const convertAmount = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
    if (fromCurrency === toCurrency) return amount;
    
    try {
      return await exchangeRatesAPI.convertCurrency(amount, fromCurrency, toCurrency);
    } catch (error) {
      console.error('Currency conversion failed:', error);
      toast({
        title: "Currency conversion failed",
        description: "Using approximate conversion. Please try again later.",
        variant: "destructive",
      });
      
      // Fallback to local conversion if API call fails
      const fromRate = getRate(fromCurrency)?.rate || 1;
      const toRate = getRate(toCurrency)?.rate || 1;
      
      return (amount / fromRate) * toRate;
    }
  };

  const refreshRates = async () => {
    await fetchRates();
    toast({
      title: "Exchange rates updated",
      description: "Latest currency exchange rates have been loaded.",
    });
  };

  const formatCurrency = (amount: number, currencyCode?: string): string => {
    const code = currencyCode || settings?.currency || 'USD';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <ExchangeRatesContext.Provider
      value={{
        rates,
        isLoading,
        convertAmount,
        getRate,
        refreshRates,
        formatCurrency,
      }}
    >
      {children}
    </ExchangeRatesContext.Provider>
  );
};

export const useExchangeRates = () => {
  const context = useContext(ExchangeRatesContext);
  if (context === undefined) {
    throw new Error('useExchangeRates must be used within an ExchangeRatesProvider');
  }
  return context;
};
