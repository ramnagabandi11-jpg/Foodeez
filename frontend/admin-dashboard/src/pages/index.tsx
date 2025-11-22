import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/outline';
import {
  TrendingUpIcon as TrendingUpIconSolid,
  ChartBarIcon as ChartBarIconSolid,
} from '@heroicons/react/solid';
import Layout from '@/components/Layout';
import DashboardOverview from '@/components/DashboardOverview';
import PendingApprovals from '@/components/PendingApprovals';
import RecentActivity from '@/components/RecentActivity';
import PlatformMetrics from '@/components/PlatformMetrics';
import RevenueAnalytics from '@/components/RevenueAnalytics';

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <>
      <Head>
        <title>Admin Dashboard - Foodeez Platform</title>
        <meta name="description" content="Foodeez platform administration dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor and manage the Foodeez platform</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Users */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <UsersIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">12,543</p>
                  <div className="flex items-center mt-1">
                    <TrendingUpIconSolid className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+8.2%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Restaurants */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <BuildingStorefrontIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Restaurants</p>
                  <p className="text-2xl font-semibold text-gray-900">847</p>
                  <div className="flex items-center mt-1">
                    <TrendingUpIconSolid className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+12.1%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Orders */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <ShoppingCartIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                  <p className="text-2xl font-semibold text-gray-900">2,847</p>
                  <div className="flex items-center mt-1">
                    <TrendingUpIconSolid className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+15.3%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">₹4.2L</p>
                  <div className="flex items-center mt-1">
                    <TrendingUpIconSolid className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+18.7%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Platform Metrics */}
              <PlatformMetrics timeRange={timeRange} />

              {/* Revenue Analytics */}
              <RevenueAnalytics timeRange={timeRange} />

              {/* Recent Activity */}
              <RecentActivity />
            </div>

            {/* Right Column - Quick Actions */}
            <div className="space-y-6">
              {/* Pending Approvals */}
              <PendingApprovals />

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                    <div className="font-medium">Add New Restaurant</div>
                    <div className="text-sm">Onboard a new restaurant partner</div>
                  </button>
                  <button className="w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                    <div className="font-medium">Send Platform Notification</div>
                    <div className="text-sm">Broadcast message to all users</div>
                  </button>
                  <button className="w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                    <div className="font-medium">Generate Reports</div>
                    <div className="text-sm">Download analytics reports</div>
                  </button>
                  <button className="w-full text-left px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors">
                    <div className="font-medium">System Maintenance</div>
                    <div className="text-sm">Manage platform settings</div>
                  </button>
                </div>
              </div>

              {/* System Health */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-gray-700">API Status</span>
                    </div>
                    <span className="text-sm text-green-600">Healthy</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-gray-700">Database</span>
                    </div>
                    <span className="text-sm text-green-600">Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-gray-700">Payment Gateway</span>
                    </div>
                    <span className="text-sm text-green-600">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ExclamationCircleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="text-sm text-gray-700">Storage Usage</span>
                    </div>
                    <span className="text-sm text-yellow-600">78%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Check authentication and admin role
  const token = context.req.cookies.accessToken;

  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // You might want to validate the token and check if user has admin role here
  // For now, we'll assume the token is valid

  return {
    props: {},
  };
};