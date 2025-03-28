
import { 
  User, AppSettings, MoneySource, Category, Expense, 
  BalanceHistory, ExpenseHistory, ExchangeRate,
  DashboardOverview, ExpenseTrend, ExpenseComposition, BudgetComparison, AuthResponse
} from '../types/api';

// Constants
const API_URL = 'https://api.expensegrove.com'; // Replace with your actual API URL
const TOKEN_KEY = 'expense_grove_token';
const REFRESH_TOKEN_KEY = 'expense_grove_refresh_token';

// Helper functions
const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);
const saveTokens = (token: string, refreshToken: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};
const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const getHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Request function with automatic token refresh
const request = async <T>(
  endpoint: string,
  method: string = 'GET',
  data?: any,
  includeAuth: boolean = true
): Promise<T> => {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: getHeaders(includeAuth),
      body: data ? JSON.stringify(data) : undefined,
    });

    // If unauthorized and we have a refresh token, try to refresh
    if (response.status === 401 && getRefreshToken() && includeAuth) {
      try {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: getRefreshToken() }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          saveTokens(refreshData.token, refreshData.refreshToken);
          
          // Retry the original request with new token
          return request<T>(endpoint, method, data, includeAuth);
        } else {
          // If refresh failed, clear tokens and redirect to login
          clearTokens();
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
      } catch (error) {
        clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Something went wrong');
    }

    // For endpoints that don't return JSON
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: (email: string, password: string, name: string): Promise<AuthResponse> => 
    request<AuthResponse>('/auth/register', 'POST', { email, password, name }, false),
  
  login: (email: string, password: string): Promise<AuthResponse> => 
    request<AuthResponse>('/auth/login', 'POST', { email, password }, false).then(data => {
      saveTokens(data.token, data.refreshToken);
      return data;
    }),
  
  logout: (): Promise<void> => 
    request<void>('/auth/logout', 'POST').then(() => {
      clearTokens();
    }),
  
  refreshToken: (): Promise<AuthResponse> => 
    request<AuthResponse>('/auth/refresh', 'POST', { refreshToken: getRefreshToken() }, false),
  
  getCurrentUser: (): Promise<User> => 
    request<User>('/auth/me'),
  
  changePassword: (currentPassword: string, newPassword: string): Promise<void> => 
    request<void>('/auth/change-password', 'PATCH', { currentPassword, newPassword }),
  
  isAuthenticated: (): boolean => !!getToken(),
};

// User API
export const userAPI = {
  getProfile: (): Promise<User> => 
    request<User>('/users'),
  
  updateProfile: (data: Partial<User>): Promise<User> => 
    request<User>('/users', 'PATCH', data),
  
  deleteProfile: (): Promise<void> => 
    request<void>('/users', 'DELETE'),
};

// App Settings API
export const appSettingsAPI = {
  getSettings: (): Promise<AppSettings> => 
    request<AppSettings>('/app-settings'),
  
  updateSettings: (settings: Partial<AppSettings>): Promise<AppSettings> => 
    request<AppSettings>('/app-settings', 'PATCH', settings),
  
  resetSettings: (): Promise<void> => 
    request<void>('/app-settings', 'DELETE'),
};

// Money Sources API
export const moneySourcesAPI = {
  getAll: (): Promise<MoneySource[]> => 
    request<MoneySource[]>('/money-sources'),
  
  create: (data: Omit<MoneySource, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<MoneySource> => 
    request<MoneySource>('/money-sources', 'POST', data),
  
  getById: (id: string): Promise<MoneySource> => 
    request<MoneySource>(`/money-sources/${id}`),
  
  update: (id: string, data: Partial<MoneySource>): Promise<MoneySource> => 
    request<MoneySource>(`/money-sources/${id}`, 'PATCH', data),
  
  delete: (id: string): Promise<void> => 
    request<void>(`/money-sources/${id}`, 'DELETE'),
};

// Expenses API
export const expensesAPI = {
  getAll: (filters?: Record<string, any>): Promise<Expense[]> => {
    const queryParams = filters 
      ? '?' + new URLSearchParams(filters as Record<string, string>).toString() 
      : '';
    return request<Expense[]>(`/expenses${queryParams}`);
  },
  
  create: (data: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Expense> => 
    request<Expense>('/expenses', 'POST', data),
  
  getById: (id: string): Promise<Expense> => 
    request<Expense>(`/expenses/${id}`),
  
  update: (id: string, data: Partial<Expense>): Promise<Expense> => 
    request<Expense>(`/expenses/${id}`, 'PATCH', data),
  
  delete: (id: string): Promise<void> => 
    request<void>(`/expenses/${id}`, 'DELETE'),
};

// Categories API
export const categoriesAPI = {
  getAll: (): Promise<Category[]> => 
    request<Category[]>('/categories'),
  
  create: (data: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Category> => 
    request<Category>('/categories', 'POST', data),
  
  getById: (id: string): Promise<Category> => 
    request<Category>(`/categories/${id}`),
  
  update: (id: string, data: Partial<Category>): Promise<Category> => 
    request<Category>(`/categories/${id}`, 'PATCH', data),
  
  delete: (id: string): Promise<void> => 
    request<void>(`/categories/${id}`, 'DELETE'),
};

// Balance History API
export const balanceHistoryAPI = {
  getAll: (): Promise<BalanceHistory[]> => 
    request<BalanceHistory[]>('/balance-history'),
  
  create: (data: Omit<BalanceHistory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<BalanceHistory> => 
    request<BalanceHistory>('/balance-history', 'POST', data),
  
  getById: (id: string): Promise<BalanceHistory> => 
    request<BalanceHistory>(`/balance-history/${id}`),
  
  update: (id: string, data: Partial<BalanceHistory>): Promise<BalanceHistory> => 
    request<BalanceHistory>(`/balance-history/${id}`, 'PATCH', data),
  
  delete: (id: string): Promise<void> => 
    request<void>(`/balance-history/${id}`, 'DELETE'),
};

// Expense History API
export const expenseHistoryAPI = {
  getAll: (): Promise<ExpenseHistory[]> => 
    request<ExpenseHistory[]>('/expense-history'),
  
  getById: (id: string): Promise<ExpenseHistory> => 
    request<ExpenseHistory>(`/expense-history/${id}`),
};

// Data Export/Import API
export const dataAPI = {
  exportData: (): Promise<Blob> => 
    fetch(`${API_URL}/data/export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    }).then(response => {
      if (!response.ok) throw new Error('Export failed');
      return response.blob();
    }),
  
  importData: (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetch(`${API_URL}/data/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
      body: formData,
    }).then(response => {
      if (!response.ok) throw new Error('Import failed');
      return;
    });
  },
};

// Exchange Rates API - Focus on this as requested
export const exchangeRatesAPI = {
  getAll: (): Promise<ExchangeRate[]> => 
    request<ExchangeRate[]>('/exchange-rates'),
  
  getByCode: (code: string): Promise<ExchangeRate> => 
    request<ExchangeRate>(`/exchange-rates/${code}`),
  
  // Helper function to convert amounts between currencies
  convertCurrency: async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
    if (fromCurrency === toCurrency) return amount;
    
    try {
      const [fromRate, toRate] = await Promise.all([
        request<ExchangeRate>(`/exchange-rates/${fromCurrency}`),
        request<ExchangeRate>(`/exchange-rates/${toCurrency}`),
      ]);
      
      // Convert to base currency (usually USD) and then to target currency
      return (amount / fromRate.rate) * toRate.rate;
    } catch (error) {
      console.error('Currency conversion failed:', error);
      return amount; // Return original amount if conversion fails
    }
  },
};

// Dashboard API
export const dashboardAPI = {
  getOverview: (): Promise<DashboardOverview> => 
    request<DashboardOverview>('/dashboard/overview'),
  
  getTrends: (period?: string): Promise<ExpenseTrend[]> => {
    const queryParams = period ? `?period=${period}` : '';
    return request<ExpenseTrend[]>(`/dashboard/trends${queryParams}`);
  },
  
  getExpenseComposition: (): Promise<ExpenseComposition[]> => 
    request<ExpenseComposition[]>('/dashboard/expense-composition'),
  
  getBudgetComparison: (): Promise<BudgetComparison[]> => 
    request<BudgetComparison[]>('/dashboard/budget-comparison'),
  
  getExpensesOverview: (): Promise<any> => 
    request<any>('/dashboard/expenses-overview'),
  
  getTotalBalance: (): Promise<{ totalBalance: number, currency: string }> => 
    request<{ totalBalance: number, currency: string }>('/dashboard/total-balance'),
};
