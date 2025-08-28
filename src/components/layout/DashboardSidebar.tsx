import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Video,
  Puzzle,
  BarChart3,
  Users,
  CreditCard,
  HelpCircle
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Meetings',
    url: '/dashboard/meetings',
    icon: Video,
  },
  {
    title: 'Integrations',
    url: '/dashboard/integrations',
    icon: Puzzle,
  },
  {
    title: 'Analytics',
    url: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Team',
    url: '/dashboard/team',
    icon: Users,
  },
  {
    title: 'Billing',
    url: '/dashboard/billing',
    icon: CreditCard,
  },
  {
    title: 'Support',
    url: '/dashboard/support',
    icon: HelpCircle,
  },
];

const DashboardSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={isCollapsed ? 'w-16' : 'w-64'} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : ''}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className={({ isActive: routeActive }) => 
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          routeActive || isActive(item.url)
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default DashboardSidebar;