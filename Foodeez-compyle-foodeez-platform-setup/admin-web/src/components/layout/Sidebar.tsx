'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Store,
  Users,
  Truck,
  Star,
  DollarSign,
  Headphones,
  Settings,
  Users2,
  TrendingUp,
  CreditCard,
  Calendar,
  ClipboardList,
  Menu,
  X,
  Shield,
  FileText
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSidebar } from '@/providers/SidebarProvider';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

const menuItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Platform overview',
    roles: ['super_admin', 'manager'],
  },
  {
    name: 'Restaurants',
    href: '/restaurants',
    icon: Store,
    description: 'Restaurant management',
    roles: ['super_admin', 'manager', 'area_manager'],
  },
  {
    name: 'Delivery Partners',
    href: '/delivery-partners',
    icon: Truck,
    description: 'Delivery operations',
    roles: ['super_admin', 'manager', 'area_manager'],
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Users,
    description: 'Customer management',
    roles: ['super_admin', 'manager', 'support'],
  },
  {
    name: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
    description: 'Order management',
    roles: ['super_admin', 'manager', 'support'],
  },
  {
    name: 'Finance',
    href: '/finance',
    icon: DollarSign,
    description: 'Financial operations',
    roles: ['super_admin', 'finance'],
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: TrendingUp,
    description: 'Business insights',
    roles: ['super_admin', 'manager'],
  },
  {
    name: 'Support',
    href: '/support',
    icon: Headphones,
    description: 'Customer support',
    roles: ['super_admin', 'manager', 'support'],
  },
  {
    name: 'HR Management',
    href: '/hr',
    icon: Users2,
    description: 'Employee management',
    roles: ['super_admin', 'hr'],
  },
  {
    name: 'Field Visits',
    href: '/field-visits',
    icon: Shield,
    description: 'On-site operations',
    roles: ['super_admin', 'manager', 'area_manager'],
  },
  {
    name: 'Advertisements',
    href: '/advertisements',
    icon: CreditCard,
    description: 'Marketing campaigns',
    roles: ['super_admin', 'manager'],
  },
  {
    name: 'Activity Logs',
    href: '/activity-logs',
    icon: FileText,
    description: 'System logs',
    roles: ['super_admin', 'manager'],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'System settings',
    roles: ['super_admin'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const hasPermission = (requiredRoles: string[]) => {
    if (!user) return false;
    return requiredRoles.includes(user.role);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
    setIsMobileMenuOpen(false);
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMobileMenuOpen(false);
    closeSidebar();
  };

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => hasPermission(item.roles));

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          size="sm"
          className="bg-white shadow-md"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'admin-sidebar bg-white border-r border-gray-200',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Toggle */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-admin-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Foodeez</h1>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>

            {/* Desktop Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation(item.href);
                  }}
                  className={cn(
                    'group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-admin-100 text-admin-700 border-l-4 border-admin-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  title={isSidebarOpen ? undefined : item.description}
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  {isSidebarOpen && (
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {!isActive && (
                        <div className="text-xs text-gray-500">{item.description}</div>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-gray-200 p-4">
            {user && (
              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {isSidebarOpen && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(user.role)}`}>
                          {formatRole(user.role)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className={cn(
                    'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:bg-red-50 hover:text-red-600',
                    !isSidebarOpen && 'justify-center'
                  )}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4 4m4-4H3m8 0H9a2 2 0 01-2 2v6a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-1m-6 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h1" />
                  </svg>
                </button>
                {isSidebarOpen && 'Logout'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transform transition-transform',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-admin-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Foodeez</h1>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation(item.href);
                  }}
                  className={cn(
                    'group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-admin-100 text-admin-700 border-l-4 border-admin-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-gray-200 p-4">
            {user && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(user.role)}`}>
                        {formatRole(user.role)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:bg-red-50 hover:text-red-600"
                >
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4 4m4-4H3m8 0H9a2 2 0 01-2 2v6a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-1m-6 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'super_admin':
      return 'bg-purple-100 text-purple-800';
    case 'manager':
      return 'bg-admin-100 text-admin-800';
    case 'finance':
      return 'bg-yellow-100 text-yellow-800';
    case 'hr':
      return 'bg-pink-100 text-pink-800';
    case 'area_manager':
      return 'bg-blue-100 text-blue-800';
    case 'team_lead':
      return 'bg-indigo-100 text-indigo-800';
    case 'support':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatRole(role: string): string {
  return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}