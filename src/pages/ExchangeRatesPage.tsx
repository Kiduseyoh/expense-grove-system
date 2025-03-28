
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExchangeRate } from '@/types/api';
import { useExchangeRates } from '@/contexts/ExchangeRatesContext';
import { exchangeRatesAPI } from '@/services/api';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCcw, Search, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ExchangeRatesPage = () => {
  const { settings } = useSettings();
  const { rates, refreshRates, isLoading: isContextLoading } = useExchangeRates();
  const { toast } = useToast();
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState(settings?.currency || 'USD');
  const [toCurrency, setToCurrency] = useState('');
  const [convertedAmounts, setConvertedAmounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'ascending' | 'descending' }>({
    key: 'code',
    direction: 'ascending'
  });

  // Fetch rates using React Query for better caching and refetching
  const { data: fetchedRates, isLoading } = useQuery({
    queryKey: ['exchangeRates'],
    queryFn: exchangeRatesAPI.getAll,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const allRates = fetchedRates || rates;

  useEffect(() => {
    if (allRates.length > 0 && !toCurrency) {
      const defaultTo = allRates.find(r => r.code !== fromCurrency)?.code || 'EUR';
      setToCurrency(defaultTo);
    }
  }, [allRates, fromCurrency, toCurrency]);

  // Convert a single amount
  const handleConvert = async () => {
    if (!amount || !fromCurrency || !toCurrency) {
      toast({
        title: "Conversion Error",
        description: "Please fill in all fields to convert.",
        variant: "destructive",
      });
      return;
    }

    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum)) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid number.",
          variant: "destructive",
        });
        return;
      }

      const result = await exchangeRatesAPI.convertCurrency(amountNum, fromCurrency, toCurrency);
      
      toast({
        title: "Conversion Result",
        description: `${amountNum} ${fromCurrency} = ${result.toFixed(2)} ${toCurrency}`,
      });
    } catch (error) {
      toast({
        title: "Conversion Failed",
        description: "Unable to convert currencies. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Convert amount to all currencies for the table
  useEffect(() => {
    const convertAll = async () => {
      if (!amount || !fromCurrency || allRates.length === 0) return;
      
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum)) return;
      
      const results: Record<string, number> = {};
      
      for (const rate of allRates) {
        if (rate.code === fromCurrency) {
          results[rate.code] = amountNum;
        } else {
          try {
            const result = await exchangeRatesAPI.convertCurrency(amountNum, fromCurrency, rate.code);
            results[rate.code] = result;
          } catch (error) {
            console.error(`Failed to convert to ${rate.code}:`, error);
            results[rate.code] = 0;
          }
        }
      }
      
      setConvertedAmounts(results);
    };
    
    convertAll();
  }, [amount, fromCurrency, allRates]);

  // Sorting function for the table
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const filteredRates = allRates
    .filter(rate => 
      rate.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      rate.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortConfig.key === 'code') {
        return sortConfig.direction === 'ascending' 
          ? a.code.localeCompare(b.code)
          : b.code.localeCompare(a.code);
      } else if (sortConfig.key === 'name') {
        return sortConfig.direction === 'ascending' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortConfig.key === 'rate') {
        return sortConfig.direction === 'ascending' 
          ? a.rate - b.rate
          : b.rate - a.rate;
      } else if (sortConfig.key === 'convertedAmount') {
        const amountA = convertedAmounts[a.code] || 0;
        const amountB = convertedAmounts[b.code] || 0;
        return sortConfig.direction === 'ascending' 
          ? amountA - amountB
          : amountB - amountA;
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exchange Rates</h1>
          <p className="text-muted-foreground">Convert between currencies and view latest exchange rates.</p>
        </div>
        <Button onClick={refreshRates} disabled={isLoading || isContextLoading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh Rates
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Currency Converter</CardTitle>
            <CardDescription>Convert between different currencies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block" htmlFor="amount">Amount</label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="currency-input"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">From</label>
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {allRates.map((rate) => (
                      <SelectItem key={`from-${rate.code}`} value={rate.code}>
                        {rate.code} - {rate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">To</label>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {allRates.map((rate) => (
                      <SelectItem key={`to-${rate.code}`} value={rate.code}>
                        {rate.code} - {rate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleConvert} 
              className="w-full"
              disabled={!amount || !fromCurrency || !toCurrency}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Convert
            </Button>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 h-full">
          <CardHeader>
            <CardTitle>Latest Exchange Rates</CardTitle>
            <CardDescription>Based on {fromCurrency || 'USD'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading || isContextLoading ? (
                <div className="flex justify-center p-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                allRates.length > 0 ? (
                  <ul className="space-y-2">
                    {allRates
                      .filter(rate => rate.code !== fromCurrency)
                      .sort((a, b) => a.code.localeCompare(b.code))
                      .slice(0, 5)
                      .map(rate => {
                        const amountNum = parseFloat(amount);
                        const convertedAmount = convertedAmounts[rate.code] || 0;
                        return (
                          <li key={rate.code} className="flex justify-between items-center p-2 border-b">
                            <span className="font-medium">{rate.code}</span>
                            <span className="flex items-center">
                              {!isNaN(amountNum) ? convertedAmount.toFixed(2) : '—'}
                              <span className="text-muted-foreground ml-2 text-xs">{rate.code}</span>
                            </span>
                          </li>
                        );
                      })
                    }
                  </ul>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No exchange rates available.
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Exchange Rates</CardTitle>
          <div className="flex items-center justify-between pt-2">
            <CardDescription>
              {filteredRates.length} currencies
            </CardDescription>
            <div className="relative w-full md:w-64">
              <Input
                placeholder="Search currencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-8"
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || isContextLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:text-primary"
                      onClick={() => requestSort('code')}
                    >
                      <div className="flex items-center">
                        Code
                        {sortConfig.key === 'code' && (
                          sortConfig.direction === 'ascending' 
                            ? <TrendingUp className="ml-1 h-4 w-4" /> 
                            : <TrendingDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-primary"
                      onClick={() => requestSort('name')}
                    >
                      <div className="flex items-center">
                        Name
                        {sortConfig.key === 'name' && (
                          sortConfig.direction === 'ascending' 
                            ? <TrendingUp className="ml-1 h-4 w-4" /> 
                            : <TrendingDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-primary text-right"
                      onClick={() => requestSort('rate')}
                    >
                      <div className="flex items-center justify-end">
                        Rate
                        {sortConfig.key === 'rate' && (
                          sortConfig.direction === 'ascending' 
                            ? <TrendingUp className="ml-1 h-4 w-4" /> 
                            : <TrendingDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-primary text-right"
                      onClick={() => requestSort('convertedAmount')}
                    >
                      <div className="flex items-center justify-end">
                        {amount} {fromCurrency}
                        {sortConfig.key === 'convertedAmount' && (
                          sortConfig.direction === 'ascending' 
                            ? <TrendingUp className="ml-1 h-4 w-4" /> 
                            : <TrendingDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRates.length > 0 ? (
                    filteredRates.map((rate) => (
                      <TableRow key={rate.code}>
                        <TableCell className="font-medium">{rate.code}</TableCell>
                        <TableCell>{rate.name}</TableCell>
                        <TableCell className="text-right">
                          {rate.rate.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right">
                          {convertedAmounts[rate.code]?.toFixed(2) || '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No results found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExchangeRatesPage;
