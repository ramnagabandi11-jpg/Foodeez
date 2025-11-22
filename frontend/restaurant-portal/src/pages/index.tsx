import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
  TrendingUpIcon,
  FireIcon,
} from '@heroicons/react/outline';
import {
  ChartBarIcon as ChartBarIconSolid,
  TrendingUpIcon as TrendingUpIconSolid,
} from '@heroicons/react/solid';
import Layout from '@/components/Layout';
import DashboardStats from '@/components/DashboardStats';
import RecentOrders from '@/components/RecentOrders';
import QuickActions from '@/components/QuickActions';
import RevenueChart from '@/components/RevenueChart';
import PopularItems from '@/components/PopularItems';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  return (
    <>
      <Head>
        <title>Dashboard - Foodeez Restaurant Portal</title>
        <meta name="description" content="Restaurant management dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Here's your restaurant's overview.</p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-sm font-medium text-gray-700">Time Range:</span>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                  timeRange === '7d'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${
                  timeRange === '30d'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeRange('90d')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-b border-r ${
                  timeRange === '90d'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                90 Days
              </button>
            </div>
          </div>

          {/* Dashboard Stats Grid */}
          <DashboardStats timeRange={timeRange} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Left Column - Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Revenue Chart */}
              <RevenueChart timeRange={timeRange} />

              {/* Popular Items */}
              <PopularItems timeRange={timeRange} />
            </div>

            {/* Right Column - Orders & Actions */}
            <div className="space-y-6">
              {/* Recent Orders */}
              <RecentOrders />

              {/* Quick Actions */}
              <QuickActions />
            </div>
          </div>

          {/* Additional Analytics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {/* Peak Hours */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <ClockIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">Peak Hours</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Lunch (12-2pm)</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Dinner (7-9pm)</span>
                  <span className="text-sm font-medium">55%</span>
                </div>
              </div>
            </div>

            {/* Average Order Value */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">Avg. Order Value</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900">₹342</div>
              <div className="flex items-center mt-2">
                <TrendingUpIconSolid className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12% from last month</span>
              </div>
            </div>

            {/* Customer Retention */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <UsersIcon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">Repeat Customers</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900">68%</div>
              <div className="flex items-center mt-2">
                <TrendingUpIconSolid className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+5% from last month</span>
              </div>
            </div>

            {/* Rating Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <ChartBarIconSolid className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">Rating</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900">4.6⭐</div>
              <div className="text-sm text-gray-600 mt-2">324 reviews this month</div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Check authentication
  const token = context.req.cookies.accessToken;

  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {}, // will be passed to the page component as props
  };
};