/**
 * Super Admin Dashboard Main Page
 */

import { Suspense } from 'react';
import { SuperAdminSidebar } from '@/components/layout/SuperAdminSidebar';
import { SuperAdminHeader } from '@/components/layout/SuperAdminHeader';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { SystemHealth } from '@/components/system/SystemHealth';
import { ActiveUsers } from '@/components/analytics/ActiveUsers';
import { RevenueAnalytics } from '@/components/analytics/RevenueAnalytics';
import { PlatformStatistics } from '@/components/analytics/PlatformStatistics';
import { RecentActivity } from '@/components/activity/RecentActivity';
import { SystemAlerts } from '@/components/alerts/SystemAlerts';
import { QuickActions } from '@/components/actions/QuickActions';

export default function SuperAdminDashboard() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <SuperAdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <SuperAdminHeader />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Super Admin Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Complete platform management and oversight
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <QuickActions />
            </div>

            {/* System Health */}
            <div className="mb-8">
              <SystemHealth />
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {/* Dashboard Overview */}
              <div className="lg:col-span-2 xl:col-span-4">
                <DashboardOverview />
              </div>

              {/* Active Users */}
              <div className="lg:col-span-2 xl:col-span-2">
                <ActiveUsers />
              </div>

              {/* Revenue Analytics */}
              <div className="lg:col-span-2 xl:col-span-2">
                <RevenueAnalytics />
              </div>
            </div>

            {/* Platform Statistics */}
            <div className="mb-8">
              <PlatformStatistics />
            </div>

            {/* Recent Activity & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivity />
              <SystemAlerts />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}