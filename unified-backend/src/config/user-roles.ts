/**
 * User Roles and Permissions Configuration
 */

export enum UserRole {
  // Customer Roles
  CUSTOMER = 'customer',
  PREMIUM_CUSTOMER = 'premium_customer',

  // Restaurant Roles
  RESTAURANT_OWNER = 'restaurant_owner',
  RESTAURANT_MANAGER = 'restaurant_manager',
  RESTAURANT_STAFF = 'restaurant_staff',
  CHEF = 'chef',

  // Delivery Roles
  DELIVERY_DRIVER = 'delivery_driver',
  DELIVERY_MANAGER = 'delivery_manager',
  DISPATCH_MANAGER = 'dispatch_manager',

  // Support Roles
  CUSTOMER_SUPPORT = 'customer_support',
  SUPPORT_MANAGER = 'support_manager',
  QUALITY_ANALYST = 'quality_analyst',

  // Management Roles
  AREA_MANAGER = 'area_manager',
  REGIONAL_MANAGER = 'regional_manager',
  OPERATIONS_MANAGER = 'operations_manager',
  CITY_MANAGER = 'city_manager',

  // Finance Roles
  FINANCE_STAFF = 'finance_staff',
  FINANCE_MANAGER = 'finance_manager',
  FINANCE_DIRECTOR = 'finance_director',
  ACCOUNTANT = 'accountant',

  // HR Roles
  HR_STAFF = 'hr_staff',
  HR_MANAGER = 'hr_manager',
  HR_DIRECTOR = 'hr_director',
  RECRUITMENT_SPECIALIST = 'recruitment_specialist',

  // Business Roles
  KEY_ACCOUNT_MANAGER = 'key_account_manager',
  BUSINESS_DEVELOPMENT = 'business_development',
  SALES_MANAGER = 'sales_manager',
  PARTNER_SUCCESS_MANAGER = 'partner_success_manager',

  // Admin Roles
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  SYSTEM_ADMIN = 'system_admin',

  // Technical Roles
  DEVELOPER = 'developer',
  QA_ENGINEER = 'qa_engineer',
  DEVOPS_ENGINEER = 'devops_engineer'
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  module: string;
}

export interface RolePermissions {
  [key in UserRole]: Permission[];
}

export const PERMISSIONS: Record<string, Permission> = {
  // Customer Permissions
  CUSTOMER_VIEW_RESTAURANTS: {
    id: 'CUSTOMER_VIEW_RESTAURANTS',
    name: 'View Restaurants',
    resource: 'restaurants',
    action: 'read',
    module: 'customer'
  },
  CUSTOMER_PLACE_ORDER: {
    id: 'CUSTOMER_PLACE_ORDER',
    name: 'Place Order',
    resource: 'orders',
    action: 'create',
    module: 'customer'
  },
  CUSTOMER_VIEW_ORDERS: {
    id: 'CUSTOMER_VIEW_ORDERS',
    name: 'View Orders',
    resource: 'orders',
    action: 'read',
    module: 'customer'
  },
  CUSTOMER_WRITE_REVIEWS: {
    id: 'CUSTOMER_WRITE_REVIEWS',
    name: 'Write Reviews',
    resource: 'reviews',
    action: 'create',
    module: 'customer'
  },

  // Restaurant Permissions
  RESTAURANT_MANAGE_MENU: {
    id: 'RESTAURANT_MANAGE_MENU',
    name: 'Manage Menu',
    resource: 'menu',
    action: 'crud',
    module: 'restaurant'
  },
  RESTAURANT_PROCESS_ORDERS: {
    id: 'RESTAURANT_PROCESS_ORDERS',
    name: 'Process Orders',
    resource: 'orders',
    action: 'update',
    module: 'restaurant'
  },
  RESTAURANT_VIEW_ANALYTICS: {
    id: 'RESTAURANT_VIEW_ANALYTICS',
    name: 'View Analytics',
    resource: 'analytics',
    action: 'read',
    module: 'restaurant'
  },
  RESTAURANT_MANAGE_STAFF: {
    id: 'RESTAURANT_MANAGE_STAFF',
    name: 'Manage Staff',
    resource: 'staff',
    action: 'crud',
    module: 'restaurant'
  },

  // Driver Permissions
  DRIVER_VIEW_ORDERS: {
    id: 'DRIVER_VIEW_ORDERS',
    name: 'View Orders',
    resource: 'orders',
    action: 'read',
    module: 'driver'
  },
  DRIVER_ACCEPT_ORDERS: {
    id: 'DRIVER_ACCEPT_ORDERS',
    name: 'Accept Orders',
    resource: 'orders',
    action: 'update',
    module: 'driver'
  },
  DRIVER_UPDATE_LOCATION: {
    id: 'DRIVER_UPDATE_LOCATION',
    name: 'Update Location',
    resource: 'location',
    action: 'update',
    module: 'driver'
  },
  DRIVER_VIEW_EARNINGS: {
    id: 'DRIVER_VIEW_EARNINGS',
    name: 'View Earnings',
    resource: 'earnings',
    action: 'read',
    module: 'driver'
  },

  // Admin Permissions
  ADMIN_MANAGE_USERS: {
    id: 'ADMIN_MANAGE_USERS',
    name: 'Manage Users',
    resource: 'users',
    action: 'crud',
    module: 'admin'
  },
  ADMIN_VIEW_ALL_ORDERS: {
    id: 'ADMIN_VIEW_ALL_ORDERS',
    name: 'View All Orders',
    resource: 'orders',
    action: 'read',
    module: 'admin'
  },
  ADMIN_MANAGE_RESTAURANTS: {
    id: 'ADMIN_MANAGE_RESTAURANTS',
    name: 'Manage Restaurants',
    resource: 'restaurants',
    action: 'crud',
    module: 'admin'
  },
  ADMIN_VIEW_ANALYTICS: {
    id: 'ADMIN_VIEW_ANALYTICS',
    name: 'View Analytics',
    resource: 'analytics',
    action: 'read',
    module: 'admin'
  },

  // Finance Permissions
  FINANCE_MANAGE_PAYMENTS: {
    id: 'FINANCE_MANAGE_PAYMENTS',
    name: 'Manage Payments',
    resource: 'payments',
    action: 'crud',
    module: 'finance'
  },
  FINANCE_PROCESS_REFUNDS: {
    id: 'FINANCE_PROCESS_REFUNDS',
    name: 'Process Refunds',
    resource: 'refunds',
    action: 'create',
    module: 'finance'
  },
  FINANCE_VIEW_REPORTS: {
    id: 'FINANCE_VIEW_REPORTS',
    name: 'View Financial Reports',
    resource: 'reports',
    action: 'read',
    module: 'finance'
  },
  FINANCE_MANAGE_SUBSCRIPTIONS: {
    id: 'FINANCE_MANAGE_SUBSCRIPTIONS',
    name: 'Manage Subscriptions',
    resource: 'subscriptions',
    action: 'crud',
    module: 'finance'
  },

  // HR Permissions
  HR_MANAGE_EMPLOYEES: {
    id: 'HR_MANAGE_EMPLOYEES',
    name: 'Manage Employees',
    resource: 'employees',
    action: 'crud',
    module: 'hr'
  },
  HR_PROCESS_PAYROLL: {
    id: 'HR_PROCESS_PAYROLL',
    name: 'Process Payroll',
    resource: 'payroll',
    action: 'create',
    module: 'hr'
  },
  HR_MANAGE_RECRUITMENT: {
    id: 'HR_MANAGE_RECRUITMENT',
    name: 'Manage Recruitment',
    resource: 'recruitment',
    action: 'crud',
    module: 'hr'
  },
  HR_MANAGE_PERFORMANCE: {
    id: 'HR_MANAGE_PERFORMANCE',
    name: 'Manage Performance',
    resource: 'performance',
    action: 'crud',
    module: 'hr'
  },

  // Support Permissions
  SUPPORT_VIEW_TICKETS: {
    id: 'SUPPORT_VIEW_TICKETS',
    name: 'View Support Tickets',
    resource: 'tickets',
    action: 'read',
    module: 'support'
  },
  SUPPORT_MANAGE_TICKETS: {
    id: 'SUPPORT_MANAGE_TICKETS',
    name: 'Manage Support Tickets',
    resource: 'tickets',
    action: 'crud',
    module: 'support'
  },
  SUPPORT_CHAT_WITH_CUSTOMERS: {
    id: 'SUPPORT_CHAT_WITH_CUSTOMERS',
    name: 'Chat with Customers',
    resource: 'chat',
    action: 'create',
    module: 'support'
  },

  // Area Manager Permissions
  AREA_MANAGER_MANAGE_REGION: {
    id: 'AREA_MANAGER_MANAGE_REGION',
    name: 'Manage Region',
    resource: 'region',
    action: 'update',
    module: 'area_manager'
  },
  AREA_MANAGER_VIEW_LOCAL_ANALYTICS: {
    id: 'AREA_MANAGER_VIEW_LOCAL_ANALYTICS',
    name: 'View Local Analytics',
    resource: 'analytics',
    action: 'read',
    module: 'area_manager'
  },
  AREA_MANAGER_MANAGE_LOCAL_PROMOTIONS: {
    id: 'AREA_MANAGER_MANAGE_LOCAL_PROMOTIONS',
    name: 'Manage Local Promotions',
    resource: 'promotions',
    action: 'crud',
    module: 'area_manager'
  },

  // Key Account Manager Permissions
  KAM_MANAGE_ENTERPRISE_CLIENTS: {
    id: 'KAM_MANAGE_ENTERPRISE_CLIENTS',
    name: 'Manage Enterprise Clients',
    resource: 'enterprise_clients',
    action: 'crud',
    module: 'key_account_manager'
  },
  KAM_MANAGE_CONTRACTS: {
    id: 'KAM_MANAGE_CONTRACTS',
    name: 'Manage Contracts',
    resource: 'contracts',
    action: 'crud',
    module: 'key_account_manager'
  },
  KAM_VIEW_PARTNER_ANALYTICS: {
    id: 'KAM_VIEW_PARTNER_ANALYTICS',
    name: 'View Partner Analytics',
    resource: 'analytics',
    action: 'read',
    module: 'key_account_manager'
  },

  // Super Admin Permissions
  SUPER_ADMIN_SYSTEM_CONFIG: {
    id: 'SUPER_ADMIN_SYSTEM_CONFIG',
    name: 'System Configuration',
    resource: 'system',
    action: 'crud',
    module: 'super_admin'
  },
  SUPER_ADMIN_MANAGE_ROLES: {
    id: 'SUPER_ADMIN_MANAGE_ROLES',
    name: 'Manage Roles',
    resource: 'roles',
    action: 'crud',
    module: 'super_admin'
  },
  SUPER_ADMIN_VIEW_ALL_DATA: {
    id: 'SUPER_ADMIN_VIEW_ALL_DATA',
    name: 'View All Data',
    resource: 'all',
    action: 'read',
    module: 'super_admin'
  }
};

export const ROLE_PERMISSIONS: RolePermissions = {
  // Customer Role Permissions
  [UserRole.CUSTOMER]: [
    PERMISSIONS.CUSTOMER_VIEW_RESTAURANTS,
    PERMISSIONS.CUSTOMER_PLACE_ORDER,
    PERMISSIONS.CUSTOMER_VIEW_ORDERS,
    PERMISSIONS.CUSTOMER_WRITE_REVIEWS
  ],

  [UserRole.PREMIUM_CUSTOMER]: [
    ...ROLE_PERMISSIONS?.[UserRole.CUSTOMER] || [],
    // Additional premium customer permissions
  ],

  // Restaurant Role Permissions
  [UserRole.RESTAURANT_OWNER]: [
    PERMISSIONS.RESTAURANT_MANAGE_MENU,
    PERMISSIONS.RESTAURANT_PROCESS_ORDERS,
    PERMISSIONS.RESTAURANT_VIEW_ANALYTICS,
    PERMISSIONS.RESTAURANT_MANAGE_STAFF
  ],

  [UserRole.RESTAURANT_MANAGER]: [
    PERMISSIONS.RESTAURANT_MANAGE_MENU,
    PERMISSIONS.RESTAURANT_PROCESS_ORDERS,
    PERMISSIONS.RESTAURANT_VIEW_ANALYTICS
  ],

  [UserRole.RESTAURANT_STAFF]: [
    PERMISSIONS.RESTAURANT_PROCESS_ORDERS
  ],

  // Driver Role Permissions
  [UserRole.DELIVERY_DRIVER]: [
    PERMISSIONS.DRIVER_VIEW_ORDERS,
    PERMISSIONS.DRIVER_ACCEPT_ORDERS,
    PERMISSIONS.DRIVER_UPDATE_LOCATION,
    PERMISSIONS.DRIVER_VIEW_EARNINGS
  ],

  // Admin Role Permissions
  [UserRole.ADMIN]: [
    PERMISSIONS.ADMIN_MANAGE_USERS,
    PERMISSIONS.ADMIN_VIEW_ALL_ORDERS,
    PERMISSIONS.ADMIN_MANAGE_RESTAURANTS,
    PERMISSIONS.ADMIN_VIEW_ANALYTICS,
    PERMISSIONS.SUPPORT_VIEW_TICKETS,
    PERMISSIONS.SUPPORT_MANAGE_TICKETS
  ],

  // Finance Role Permissions
  [UserRole.FINANCE_MANAGER]: [
    PERMISSIONS.FINANCE_MANAGE_PAYMENTS,
    PERMISSIONS.FINANCE_PROCESS_REFUNDS,
    PERMISSIONS.FINANCE_VIEW_REPORTS,
    PERMISSIONS.FINANCE_MANAGE_SUBSCRIPTIONS
  ],

  // HR Role Permissions
  [UserRole.HR_MANAGER]: [
    PERMISSIONS.HR_MANAGE_EMPLOYEES,
    PERMISSIONS.HR_PROCESS_PAYROLL,
    PERMISSIONS.HR_MANAGE_RECRUITMENT,
    PERMISSIONS.HR_MANAGE_PERFORMANCE
  ],

  // Support Role Permissions
  [UserRole.CUSTOMER_SUPPORT]: [
    PERMISSIONS.SUPPORT_VIEW_TICKETS,
    PERMISSIONS.SUPPORT_MANAGE_TICKETS,
    PERMISSIONS.SUPPORT_CHAT_WITH_CUSTOMERS
  ],

  // Area Manager Role Permissions
  [UserRole.AREA_MANAGER]: [
    PERMISSIONS.AREA_MANAGER_MANAGE_REGION,
    PERMISSIONS.AREA_MANAGER_VIEW_LOCAL_ANALYTICS,
    PERMISSIONS.AREA_MANAGER_MANAGE_LOCAL_PROMOTIONS,
    PERMISSIONS.ADMIN_VIEW_ALL_ORDERS
  ],

  // Key Account Manager Role Permissions
  [UserRole.KEY_ACCOUNT_MANAGER]: [
    PERMISSIONS.KAM_MANAGE_ENTERPRISE_CLIENTS,
    PERMISSIONS.KAM_MANAGE_CONTRACTS,
    PERMISSIONS.KAM_VIEW_PARTNER_ANALYTICS
  ],

  // Super Admin Role Permissions
  [UserRole.SUPER_ADMIN]: [
    PERMISSIONS.SUPER_ADMIN_SYSTEM_CONFIG,
    PERMISSIONS.SUPER_ADMIN_MANAGE_ROLES,
    PERMISSIONS.SUPER_ADMIN_VIEW_ALL_DATA,
    // Super admin has all permissions
    ...Object.values(PERMISSIONS)
  ],

  // Default empty permissions for other roles
  [UserRole.DELIVERY_MANAGER]: [],
  [UserRole.DISPATCH_MANAGER]: [],
  [UserRole.SUPPORT_MANAGER]: [],
  [UserRole.QUALITY_ANALYST]: [],
  [UserRole.REGIONAL_MANAGER]: [],
  [UserRole.OPERATIONS_MANAGER]: [],
  [UserRole.CITY_MANAGER]: [],
  [UserRole.FINANCE_STAFF]: [],
  [UserRole.FINANCE_DIRECTOR]: [],
  [UserRole.ACCOUNTANT]: [],
  [UserRole.HR_STAFF]: [],
  [UserRole.HR_DIRECTOR]: [],
  [UserRole.RECRUITMENT_SPECIALIST]: [],
  [UserRole.BUSINESS_DEVELOPMENT]: [],
  [UserRole.SALES_MANAGER]: [],
  [UserRole.PARTNER_SUCCESS_MANAGER]: [],
  [UserRole.SYSTEM_ADMIN]: [],
  [UserRole.DEVELOPER]: [],
  [UserRole.QA_ENGINEER]: [],
  [UserRole.DEVOPS_ENGINEER]: [],
  [UserRole.CHEF]: []
};

// Helper functions for permission checking
export const hasPermission = (userRole: UserRole, permissionId: string): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.some(permission => permission.id === permissionId);
};

export const hasAnyPermission = (userRole: UserRole, permissionIds: string[]): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissionIds.some(permissionId =>
    permissions.some(permission => permission.id === permissionId)
  );
};

export const hasAllPermissions = (userRole: UserRole, permissionIds: string[]): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissionIds.every(permissionId =>
    permissions.some(permission => permission.id === permissionId)
  );
};

export const getPermissionsByRole = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

export const getPermissionsByModule = (module: string): Permission[] => {
  return Object.values(PERMISSIONS).filter(permission => permission.module === module);
};