import { 
  User, AppSettings, MoneySource, Category, Expense, 
  BalanceHistory, ExpenseHistory, ExchangeRate,
  DashboardOverview, ExpenseTrend, ExpenseComposition, BudgetComparison, AuthResponse
} from '../types/api';

// Constants
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

// Mock data
const mockUsers: Record<string, User> = {
  'jane@example.com': {
    id: '1',
    email: 'jane@example.com',
    name: 'Jane Doe',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'john@example.com': {
    id: '2',
    email: 'john@example.com',
    name: 'John Smith',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
};

const mockPasswords: Record<string, string> = {
  'jane@example.com': 'password123',
  'john@example.com': 'password123',
};

const mockExchangeRates: ExchangeRate[] = [
  { code: 'USD', name: 'US Dollar', rate: 1.0, date: new Date().toISOString() },
  { code: 'EUR', name: 'Euro', rate: 0.91, date: new Date().toISOString() },
  { code: 'GBP', name: 'British Pound', rate: 0.78, date: new Date().toISOString() },
  { code: 'JPY', name: 'Japanese Yen', rate: 149.82, date: new Date().toISOString() },
  { code: 'CAD', name: 'Canadian Dollar', rate: 1.35, date: new Date().toISOString() },
  { code: 'AUD', name: 'Australian Dollar', rate: 1.52, date: new Date().toISOString() },
  { code: 'CHF', name: 'Swiss Franc', rate: 0.89, date: new Date().toISOString() },
  { code: 'CNY', name: 'Chinese Yuan', rate: 7.23, date: new Date().toISOString() },
  { code: 'INR', name: 'Indian Rupee', rate: 83.41, date: new Date().toISOString() },
  { code: 'BRL', name: 'Brazilian Real', rate: 5.04, date: new Date().toISOString() },
];

// Mock API helper (simulates network delay)
const mockApiResponse = <T>(data: T, delay: number = 500): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

// Auth API
export const authAPI = {
  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    // Check if user already exists
    if (mockUsers[email]) {
      return mockApiResponse(
        Promise.reject(new Error('User already exists')),
        500
      );
    }

    // Create new user
    const newUser: User = {
      id: `${Object.keys(mockUsers).length + 1}`,
      email,
      name,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockUsers[email] = newUser;
    mockPasswords[email] = password;

    // Generate tokens
    const token = `mock-token-${Date.now()}`;
    const refreshToken = `mock-refresh-${Date.now()}`;

    return mockApiResponse({
      token,
      refreshToken,
      user: newUser,
    });
  },
  
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const user = mockUsers[email];
    const storedPassword = mockPasswords[email];

    if (!user || storedPassword !== password) {
      return mockApiResponse(
        Promise.reject(new Error('Invalid email or password')),
        500
      );
    }

    // Generate tokens
    const token = `mock-token-${Date.now()}`;
    const refreshToken = `mock-refresh-${Date.now()}`;
    
    // Save tokens to localStorage
    saveTokens(token, refreshToken);
    
    return mockApiResponse({
      token,
      refreshToken,
      user,
    });
  },
  
  logout: async (): Promise<void> => {
    clearTokens();
    return mockApiResponse(void 0);
  },
  
  refreshToken: async (): Promise<AuthResponse> => {
    const refreshToken = getRefreshToken();
    
    if (!refreshToken) {
      return mockApiResponse(
        Promise.reject(new Error('No refresh token')),
        500
      );
    }
    
    // Get current user from token
    const currentEmail = Object.keys(mockUsers).find(email => 
      mockUsers[email].name.toLowerCase().includes(refreshToken.split('-')[1])
    ) || Object.keys(mockUsers)[0];
    
    const user = mockUsers[currentEmail];
    
    // Generate new tokens
    const newToken = `mock-token-${Date.now()}`;
    const newRefreshToken = `mock-refresh-${Date.now()}`;
    
    return mockApiResponse({
      token: newToken,
      refreshToken: newRefreshToken,
      user,
    });
  },
  
  getCurrentUser: async (): Promise<User> => {
    const token = getToken();
    
    if (!token) {
      return mockApiResponse(
        Promise.reject(new Error('Not authenticated')),
        500
      );
    }
    
    // In a real app, we'd decode the token to get the user ID
    // Here we just return a default user
    return mockApiResponse(mockUsers['jane@example.com']);
  },
  
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const token = getToken();
    
    if (!token) {
      return mockApiResponse(
        Promise.reject(new Error('Not authenticated')),
        500
      );
    }
    
    // Get current user email
    const currentEmail = 'jane@example.com'; // In reality, we'd get this from the token
    
    // Verify current password
    if (mockPasswords[currentEmail] !== currentPassword) {
      return mockApiResponse(
        Promise.reject(new Error('Current password is incorrect')),
        500
      );
    }
    
    // Update password
    mockPasswords[currentEmail] = newPassword;
    
    return mockApiResponse(void 0);
  },
  
  isAuthenticated: (): boolean => !!getToken(),
};

// User API
export const userAPI = {
  getProfile: async (): Promise<User> => {
    const token = getToken();
    
    if (!token) {
      return mockApiResponse(
        Promise.reject(new Error('Not authenticated')),
        500
      );
    }
    
    return mockApiResponse(mockUsers['jane@example.com']);
  },
  
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const token = getToken();
    
    if (!token) {
      return mockApiResponse(
        Promise.reject(new Error('Not authenticated')),
        500
      );
    }
    
    const currentEmail = 'jane@example.com'; // In reality, we'd get this from the token
    const updatedUser = {
      ...mockUsers[currentEmail],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    mockUsers[currentEmail] = updatedUser;
    
    return mockApiResponse(updatedUser);
  },
  
  deleteProfile: async (): Promise<void> => {
    const token = getToken();
    
    if (!token) {
      return mockApiResponse(
        Promise.reject(new Error('Not authenticated')),
        500
      );
    }
    
    // In a real app, we'd delete the user from the database
    // Here we'll just log them out
    clearTokens();
    
    return mockApiResponse(void 0);
  },
};

// Export all other APIs with mock implementations
// ... keep existing code

// Exchange Rates API
export const exchangeRatesAPI = {
  getAll: async (): Promise<ExchangeRate[]> => {
    return mockApiResponse(mockExchangeRates);
  },
  
  getByCode: async (code: string): Promise<ExchangeRate> => {
    const rate = mockExchangeRates.find(r => r.code === code);
    
    if (!rate) {
      return mockApiResponse(
        Promise.reject(new Error(`Currency ${code} not found`)),
        500
      );
    }
    
    return mockApiResponse(rate);
  },
  
  // Helper function to convert amounts between currencies
  convertCurrency: async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
    if (fromCurrency === toCurrency) return amount;
    
    const fromRate = mockExchangeRates.find(r => r.code === fromCurrency);
    const toRate = mockExchangeRates.find(r => r.code === toCurrency);
    
    if (!fromRate || !toRate) {
      console.error('Currency not found');
      return amount;
    }
    
    // Convert to base currency (USD) and then to target currency
    return (amount / fromRate.rate) * toRate.rate;
  },
};

// Dashboard API with mock implementations
export const dashboardAPI = {
  getOverview: async (): Promise<DashboardOverview> => {
    return mockApiResponse({
      totalExpenses: 1850.25,
      totalIncome: 3500.00,
      totalSavings: 1000.00,
      netBalance: 5240.75,
      period: 'This month',
      currency: 'USD',
      savingsRate: 28.5
    });
  },
  
  getTrends: async (period?: string): Promise<ExpenseTrend[]> => {
    return mockApiResponse([
      { period: '2023-01', expenses: 1250.50, income: 3000.00, savings: 800.00, date: '2023-01', amount: 1250.50, category: 'Housing' },
      { period: '2023-02', expenses: 1320.75, income: 3100.00, savings: 850.00, date: '2023-02', amount: 1320.75, category: 'Housing' },
      { period: '2023-03', expenses: 1425.30, income: 3200.00, savings: 900.00, date: '2023-03', amount: 1425.30, category: 'Housing' },
    ]);
  },
  
  getExpenseComposition: async (): Promise<ExpenseComposition[]> => {
    return mockApiResponse([
      { categoryId: '1', categoryName: 'Housing', amount: 1200, percentage: 48, category: 'Housing' },
      { categoryId: '2', categoryName: 'Food', amount: 500, percentage: 20, category: 'Food' },
      { categoryId: '3', categoryName: 'Transportation', amount: 300, percentage: 12, category: 'Transportation' },
      { categoryId: '4', categoryName: 'Entertainment', amount: 200, percentage: 8, category: 'Entertainment' },
      { categoryId: '5', categoryName: 'Utilities', amount: 150, percentage: 6, category: 'Utilities' },
      { categoryId: '6', categoryName: 'Other', amount: 150, percentage: 6, category: 'Other' },
    ]);
  },
  
  getBudgetComparison: async (): Promise<BudgetComparison[]> => {
    return mockApiResponse([
      { categoryId: '1', categoryName: 'Housing', budget: 1200, actual: 1150, difference: 50, percentageUsed: 95.8, budgeted: 1200, category: 'Housing' },
      { categoryId: '2', categoryName: 'Food', budget: 500, actual: 520, difference: -20, percentageUsed: 104, budgeted: 500, category: 'Food' },
      { categoryId: '3', categoryName: 'Transportation', budget: 300, actual: 280, difference: 20, percentageUsed: 93.3, budgeted: 300, category: 'Transportation' },
      { categoryId: '4', categoryName: 'Entertainment', budget: 200, actual: 250, difference: -50, percentageUsed: 125, budgeted: 200, category: 'Entertainment' },
      { categoryId: '5', categoryName: 'Utilities', budget: 150, actual: 145, difference: 5, percentageUsed: 96.7, budgeted: 150, category: 'Utilities' },
      { categoryId: '6', categoryName: 'Other', budget: 150, actual: 120, difference: 30, percentageUsed: 80, budgeted: 150, category: 'Other' },
    ]);
  },
  
  getExpensesOverview: async (): Promise<any> => {
    return mockApiResponse({
      total: 2465,
      average: 82.17,
      highest: 1150,
      lowest: 25,
      currency: 'USD'
    });
  },
  
  getTotalBalance: async (): Promise<{ totalBalance: number, currency: string }> => {
    return mockApiResponse({ totalBalance: 5240.75, currency: 'USD' });
  },
};

// Mock implementations for other APIs
export const appSettingsAPI = {
  getSettings: async (): Promise<AppSettings> => {
    return mockApiResponse({
      id: '1',
      userId: '1',
      currency: 'USD',
      theme: 'light',
      language: 'en',
      notificationsEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
  
  updateSettings: async (settings: Partial<AppSettings>): Promise<AppSettings> => {
    return mockApiResponse({
      id: '1',
      userId: '1',
      currency: settings.currency || 'USD',
      theme: settings.theme || 'light',
      language: settings.language || 'en',
      notificationsEnabled: settings.notificationsEnabled !== undefined ? settings.notificationsEnabled : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
  
  resetSettings: async (): Promise<void> => {
    return mockApiResponse(void 0);
  },
};

// Mock implementations for other APIs
export const moneySourcesAPI = {
  getAll: async (): Promise<MoneySource[]> => {
    return mockApiResponse([
      {
        id: '1',
        userId: '1',
        name: 'Bank Account',
        type: 'BANK',
        balance: 4200.50,
        currency: 'USD',
        isDefault: true,
        isArchived: false,
        color: '#4CAF50',
        icon: 'bank',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: '1',
        name: 'Credit Card',
        type: 'CREDIT_CARD',
        balance: -320.25,
        currency: 'USD',
        isDefault: false,
        isArchived: false,
        color: '#F44336',
        icon: 'credit-card',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        userId: '1',
        name: 'Savings',
        type: 'BANK',
        balance: 1360.50,
        currency: 'USD',
        isDefault: false,
        isArchived: false,
        color: '#2196F3',
        icon: 'savings',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  },
  
  create: async (data: Omit<MoneySource, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<MoneySource> => {
    return mockApiResponse({
      id: `${Date.now()}`,
      userId: '1',
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
  
  getById: async (id: string): Promise<MoneySource> => {
    const sources = await moneySourcesAPI.getAll();
    const source = sources.find(s => s.id === id);
    
    if (!source) {
      return mockApiResponse(
        Promise.reject(new Error(`Money source ${id} not found`)),
        500
      );
    }
    
    return mockApiResponse(source);
  },
  
  update: async (id: string, data: Partial<MoneySource>): Promise<MoneySource> => {
    const sources = await moneySourcesAPI.getAll();
    const sourceIndex = sources.findIndex(s => s.id === id);
    
    if (sourceIndex === -1) {
      return mockApiResponse(
        Promise.reject(new Error(`Money source ${id} not found`)),
        500
      );
    }
    
    const updatedSource = {
      ...sources[sourceIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    return mockApiResponse(updatedSource);
  },
  
  delete: async (id: string): Promise<void> => {
    return mockApiResponse(void 0);
  },
};

// Mock implementations for other APIs
export const categoriesAPI = {
  getAll: async (): Promise<Category[]> => {
    return mockApiResponse([
      {
        id: '1',
        userId: '1',
        name: 'Housing',
        type: 'EXPENSE',
        color: '#4CAF50',
        icon: 'home',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: '1',
        name: 'Food',
        type: 'EXPENSE',
        color: '#F44336',
        icon: 'restaurant',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        userId: '1',
        name: 'Transportation',
        type: 'EXPENSE',
        color: '#2196F3',
        icon: 'car',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '4',
        userId: '1',
        name: 'Entertainment',
        type: 'EXPENSE',
        color: '#9C27B0',
        icon: 'movie',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '5',
        userId: '1',
        name: 'Utilities',
        type: 'EXPENSE',
        color: '#FF9800',
        icon: 'bolt',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '6',
        userId: '1',
        name: 'Other',
        type: 'EXPENSE',
        color: '#607D8B',
        icon: 'shopping-bag',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  },
  
  create: async (data: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
    return mockApiResponse({
      id: `${Date.now()}`,
      userId: '1',
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
  
  getById: async (id: string): Promise<Category> => {
    const categories = await categoriesAPI.getAll();
    const category = categories.find(c => c.id === id);
    
    if (!category) {
      return mockApiResponse(
        Promise.reject(new Error(`Category ${id} not found`)),
        500
      );
    }
    
    return mockApiResponse(category);
  },
  
  update: async (id: string, data: Partial<Category>): Promise<Category> => {
    const categories = await categoriesAPI.getAll();
    const categoryIndex = categories.findIndex(c => c.id === id);
    
    if (categoryIndex === -1) {
      return mockApiResponse(
        Promise.reject(new Error(`Category ${id} not found`)),
        500
      );
    }
    
    const updatedCategory = {
      ...categories[categoryIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    return mockApiResponse(updatedCategory);
  },
  
  delete: async (id: string): Promise<void> => {
    return mockApiResponse(void 0);
  },
};

// Simpler mock implementations for remaining APIs
export const expensesAPI = {
  getAll: async (): Promise<Expense[]> => {
    return mockApiResponse([
      {
        id: '1',
        userId: '1',
        amount: 1150,
        description: 'Monthly rent',
        date: '2023-03-01T00:00:00.000Z',
        categoryId: '1',
        moneySourceId: '1',
        currency: 'USD',
        isRecurring: true,
        recurringInterval: 'monthly',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: '1',
        amount: 85.5,
        description: 'Grocery shopping',
        date: '2023-03-05T00:00:00.000Z',
        categoryId: '2',
        moneySourceId: '1',
        currency: 'USD',
        isRecurring: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        userId: '1',
        amount: 45.75,
        description: 'Fuel',
        date: '2023-03-08T00:00:00.000Z',
        categoryId: '3',
        moneySourceId: '2',
        currency: 'USD',
        isRecurring: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  },
  
  create: async (data: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Expense> => {
    return mockApiResponse({
      id: `${Date.now()}`,
      userId: '1',
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
  
  getById: async (id: string): Promise<Expense> => {
    const expenses = await expensesAPI.getAll();
    const expense = expenses.find(e => e.id === id);
    
    if (!expense) {
      return mockApiResponse(
        Promise.reject(new Error(`Expense ${id} not found`)),
        500
      );
    }
    
    return mockApiResponse(expense);
  },
  
  update: async (id: string, data: Partial<Expense>): Promise<Expense> => {
    const expenses = await expensesAPI.getAll();
    const expenseIndex = expenses.findIndex(e => e.id === id);
    
    if (expenseIndex === -1) {
      return mockApiResponse(
        Promise.reject(new Error(`Expense ${id} not found`)),
        500
      );
    }
    
    const updatedExpense = {
      ...expenses[expenseIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    return mockApiResponse(updatedExpense);
  },
  
  delete: async (id: string): Promise<void> => {
    return mockApiResponse(void 0);
  },
};

// Simple mock implementations for remaining APIs
export const balanceHistoryAPI = {
  getAll: async (): Promise<BalanceHistory[]> => {
    return mockApiResponse([
      {
        id: '1',
        userId: '1',
        moneySourceId: '1',
        amount: 200.25,
        balanceAfter: 4200.50,
        date: '2023-03-01T00:00:00.000Z',
        reason: 'Deposit',
        previousBalance: 4000.25,
        newBalance: 4200.50,
        changeAmount: 200.25,
        changeReason: 'Deposit',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: '1',
        moneySourceId: '2',
        amount: -69.50,
        balanceAfter: -320.25,
        date: '2023-03-05T00:00:00.000Z',
        reason: 'Purchase',
        previousBalance: -250.75,
        newBalance: -320.25,
        changeAmount: -69.50,
        changeReason: 'Purchase',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  },
  
  create: async (data: Omit<BalanceHistory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<BalanceHistory> => {
    return mockApiResponse({
      id: `${Date.now()}`,
      userId: '1',
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
  
  getById: async (id: string): Promise<BalanceHistory> => {
    const histories = await balanceHistoryAPI.getAll();
    const history = histories.find(h => h.id === id);
    
    if (!history) {
      return mockApiResponse(
        Promise.reject(new Error(`Balance history ${id} not found`)),
        500
      );
    }
    
    return mockApiResponse(history);
  },
  
  update: async (id: string, data: Partial<BalanceHistory>): Promise<BalanceHistory> => {
    const histories = await balanceHistoryAPI.getAll();
    const historyIndex = histories.findIndex(h => h.id === id);
    
    if (historyIndex === -1) {
      return mockApiResponse(
        Promise.reject(new Error(`Balance history ${id} not found`)),
        500
      );
    }
    
    const updatedHistory = {
      ...histories[historyIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    return mockApiResponse(updatedHistory);
  },
  
  delete: async (id: string): Promise<void> => {
    return mockApiResponse(void 0);
  },
};

export const expenseHistoryAPI = {
  getAll: async (): Promise<ExpenseHistory[]> => {
    return mockApiResponse([
      {
        id: '1',
        userId: '1',
        expenseId: '1',
        changeType: 'UPDATE',
        previousAmount: 1100,
        newAmount: 1150,
        changeReason: 'Rent increase',
        date: '2023-03-01T00:00:00.000Z',
        previousData: { amount: 1100 },
        newData: { amount: 1150 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  },
  
  getById: async (id: string): Promise<ExpenseHistory> => {
    const histories = await expenseHistoryAPI.getAll();
    const history = histories.find(h => h.id === id);
    
    if (!history) {
      return mockApiResponse(
        Promise.reject(new Error(`Expense history ${id} not found`)),
        500
      );
    }
    
    return mockApiResponse(history);
  },
};

export const dataAPI = {
  exportData: async (): Promise<Blob> => {
    // In a real app, we'd create a file with all the user's data
    const mockData = {
      user: mockUsers['jane@example.com'],
      expenses: await expensesAPI.getAll(),
      categories: await categoriesAPI.getAll(),
      moneySources: await moneySourcesAPI.getAll(),
    };
    
    const blob = new Blob([JSON.stringify(mockData, null, 2)], { type: 'application/json' });
    return Promise.resolve(blob);
  },
  
  importData: async (file: File): Promise<void> => {
    // In a real app, we'd process the file and import the data
    // Here we'll just resolve successfully
    return mockApiResponse(void 0);
  },
};
