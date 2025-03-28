import { useQuery } from '@tanstack/react-query';
import { dashboardAPI, moneySourcesAPI, categoriesAPI, expensesAPI } from '@/services/api';
import { useExchangeRates } from '@/contexts/ExchangeRatesContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, PieChart } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Plus, CreditCard, Wallet, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { settings } = useSettings();
  const { formatCurrency } = useExchangeRates();

  // Fetch dashboard data
  const { data: overviewData, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['dashboardOverview'],
    queryFn: dashboardAPI.getOverview,
  });

  const { data: moneySources, isLoading: isMoneySourcesLoading } = useQuery({
    queryKey: ['moneySources'],
    queryFn: moneySourcesAPI.getAll,
  });

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesAPI.getAll,
  });

  const { data: recentExpenses, isLoading: isExpensesLoading } = useQuery({
    queryKey: ['recentExpenses'],
    queryFn: expensesAPI.getAll,
  });

  const isLoading = isOverviewLoading || isMoneySourcesLoading || isCategoriesLoading || isExpensesLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Track your finances and expenses at a glance.</p>
        </div>
        <Button asChild>
          <Link to="/expenses/new">
            <Plus className="mr-2 h-4 w-4" />
            New Expense
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overviewData?.netBalance || 0, settings?.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all accounts
            </p>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Income
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-income" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-income">
              {formatCurrency(overviewData?.totalIncome || 0, settings?.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {overviewData?.period || 'This month'}
            </p>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Expenses
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-expense" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-expense">
              {formatCurrency(overviewData?.totalExpenses || 0, settings?.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {overviewData?.period || 'This month'}
            </p>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Savings
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-saving" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-saving">
              {formatCurrency(overviewData?.totalSavings || 0, settings?.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {overviewData?.period || 'This month'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {recentExpenses && recentExpenses.length > 0 ? (
                    recentExpenses.map((expense) => (
                      <div key={expense.id} className="flex items-center">
                        <div className={`rounded-full p-2 ${
                          expense.category?.type === 'EXPENSE' 
                            ? 'bg-expense/10' 
                            : expense.category?.type === 'INCOME' 
                              ? 'bg-income/10' 
                              : 'bg-saving/10'
                        }`}>
                          <CreditCard className={`h-4 w-4 ${
                            expense.category?.type === 'EXPENSE' 
                              ? 'text-expense' 
                              : expense.category?.type === 'INCOME' 
                                ? 'text-income' 
                                : 'text-saving'
                          }`} />
                        </div>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {expense.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(expense.date).toLocaleDateString()} · {expense.category?.name}
                          </p>
                        </div>
                        <div className={`ml-auto font-medium ${
                          expense.category?.type === 'EXPENSE' 
                            ? 'text-expense' 
                            : expense.category?.type === 'INCOME' 
                              ? 'text-income' 
                              : 'text-saving'
                        }`}>
                          {expense.category?.type === 'EXPENSE' ? '-' : '+'}
                          {formatCurrency(expense.amount, expense.moneySource?.currency || settings?.currency)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No recent transactions.</p>
                      <Button variant="link" asChild className="mt-2">
                        <Link to="/expenses/new">Add your first expense</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>
                  Top expense categories for {overviewData?.period || 'this month'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[230px] flex items-center justify-center">
                  <div className="text-center">
                    <PieChartIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-2 text-lg font-semibold">Analytics Coming Soon</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Track your expense breakdown with detailed charts.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="accounts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {moneySources && moneySources.length > 0 ? (
              moneySources.map((source) => (
                <Card key={source.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {source.name}
                    </CardTitle>
                    <CardDescription>{source.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(source.balance, source.currency)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {source.currency}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>No Money Sources</CardTitle>
                  <CardDescription>
                    You haven't added any money sources yet.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button asChild>
                    <Link to="/sources/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Money Source
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Trends</CardTitle>
              <CardDescription>
                Monthly expense breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-2 text-lg font-semibold">Charts Coming Soon</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Track your expense trends over time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
