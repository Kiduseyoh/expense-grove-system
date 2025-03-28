
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  Home,
  CreditCard,
  PieChart,
  Wallet,
  Settings,
  Tags,
  History,
  RefreshCcw,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label, end }) => {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

export default function Sidebar() {
  const isMobile = useIsMobile();
  
  // If it's mobile, we'll handle the sidebar differently in the layout
  if (isMobile) {
    return null;
  }

  return (
    <aside className="hidden md:flex md:w-64 bg-sidebar flex-col border-r border-border p-4">
      <div className="flex items-center h-12 mb-6">
        <h2 className="text-xl font-bold text-sidebar-primary">ExpenseGrove</h2>
      </div>
      
      <nav className="space-y-1 flex-1">
        <SidebarLink 
          to="/" 
          icon={<Home className="h-5 w-5" />} 
          label="Dashboard" 
          end 
        />
        <SidebarLink 
          to="/expenses" 
          icon={<CreditCard className="h-5 w-5" />} 
          label="Expenses" 
        />
        <SidebarLink 
          to="/sources" 
          icon={<Wallet className="h-5 w-5" />} 
          label="Money Sources" 
        />
        <SidebarLink 
          to="/categories" 
          icon={<Tags className="h-5 w-5" />} 
          label="Categories" 
        />
        <SidebarLink 
          to="/reports" 
          icon={<PieChart className="h-5 w-5" />} 
          label="Reports" 
        />
        <SidebarLink 
          to="/history" 
          icon={<History className="h-5 w-5" />} 
          label="History" 
        />
        <SidebarLink 
          to="/exchange-rates" 
          icon={<RefreshCcw className="h-5 w-5" />} 
          label="Exchange Rates" 
        />
        
        <Separator className="my-4 bg-sidebar-border" />
        
        <SidebarLink 
          to="/analytics" 
          icon={<BarChart3 className="h-5 w-5" />} 
          label="Analytics" 
        />
        <SidebarLink 
          to="/settings" 
          icon={<Settings className="h-5 w-5" />} 
          label="Settings" 
        />
      </nav>
    </aside>
  );
}
