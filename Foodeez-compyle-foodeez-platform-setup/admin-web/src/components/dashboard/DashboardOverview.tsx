'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Store,
  Users,
  Truck,
  ShoppingCart,
  DollarSign,
  CreditCard,
  Headphones,
  Calendar,
  AlertCircle,
  Shield,
  Activity,
  Users2,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { analyticsAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';

export function DashboardOverview() {
  const [timeRange, setTimeRange] = useState('today');

  // Fetch dashboard data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['platform-analytics', timeRange],
    queryFn: async () => {
      const params = timeRange === 'today' ? {} : {
        startDate: timeRange === 'week' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      };
      const response = await analyticsAPI.getPlatformOverview(params);
      return response.data;
    },
  });

  const statsCards = analytics?.overview ? [
    {
      title: 'Total Restaurants',
      value: analytics.overview.totalRestaurants.toLocaleString(),
      active: analytics.overview.activeRestaurants.toLocaleString(),
      change: '+12.5%',
      changeType: 'increase',
      icon: Store,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Active restaurants',
    },
    {
      title: 'Total Customers',
      value: analytics.overview.totalCustomers.toLocaleString(),
      active: null,
      change: '+15.3%',
      changeType: 'increase',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Registered users',
    },
    {
      title: 'Delivery Partners',
      value: analytics.overview.totalDeliveryPartners.toLocaleString(),
      active: analytics.overview.activeDeliveryPartners.toLocaleString(),
      change: '+8.7%',
      changeType: 'increase',
      icon: Truck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Active partners',
    },
    {
      title: 'Total Orders',
      value: analytics.overview.totalOrders.toLocaleString(),
      active: null,
      change: '+22.1%',
      changeType: 'increase',
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'All time orders',
    },
    {
      title: 'Total Revenue',
      value: `₹${analytics.overview.totalRevenue.toLocaleString()}`,
      active: null,
      change: '+18.2%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      description: 'Platform revenue',
    },
    {
      title: 'Platform Commission',
      value: `₹${analytics.overview.totalCommission.toLocaleString()}`,
      active: null,
      change: '+15.6%',
      changeType: 'increase',
      icon: CreditCard,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      description: 'Commission earned',
    },
  ] : [];

  if (analyticsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 h-32 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
          <p className="text-gray-600 mt-1">Complete overview of Foodeez platform performance.</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          {['today', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-admin-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="stats-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      {stat.active && (
                        <p className="text-xs text-gray-500">{stat.active} active</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  {stat.changeType === 'increase' ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Stats */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-gray-600" />
              Order Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Orders</span>
                <span className="font-medium text-gray-900">
                  {analytics?.overview.totalOrders?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Delivered</span>
                <span className="font-medium text-success-600">
                  {analytics?.overview.deliveredOrders?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="font-medium text-gray-900">
                  {analytics?.overview.completionRate?.toFixed(1) || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-gray-600" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="font-medium text-gray-900">
                  ₹{analytics?.revenue?.totalRevenue?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Restaurant Earnings</span>
                <span className="font-medium text-gray-900">
                  ₹{analytics?.revenue?.restaurantEarnings?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Platform Earnings</span>
                <span className="font-medium text-admin-600">
                  ₹{analytics?.revenue?.platformEarnings?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Delivery Fees</span>
                <span className="font-medium text-gray-900">
                  ₹{analytics?.revenue?.deliveryFees?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-gray-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button size="sm" className="w-full">
                <Headphones className="w-4 h-4 mr-2" />
                Support
              </Button>
              <Button size="sm" variant="outline" className="w-full">
                <Activity className="w-4 h-4 mr-2" />
                Logs
              </Button>
              <Button size="sm" variant="outline" className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Button>
              <Button size="sm" variant="outline" className="w-full">
                <Users2 className="w-4 h-4 mr-2" />
                Users
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-green-600" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">API Server</p>
                <p className="text-xs text-green-700">Operational</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">Database</p>
                <p className="text-xs text-green-700">Connected</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">Redis Cache</p>
                <p className="text-xs text-green-700">Running</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">Email Service</p>
                <p className="text-xs text-green-700">Active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}