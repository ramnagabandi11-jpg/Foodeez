'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  DollarSign,
  Clock,
  Star,
  AlertCircle,
  Eye,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { restaurantAPI, orderAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';

export function DashboardOverview() {
  const [timeRange, setTimeRange] = useState('today');

  // Fetch dashboard data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['restaurant-analytics', timeRange],
    queryFn: async () => {
      const params = timeRange === 'today' ? {} : {
        startDate: timeRange === 'week' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      };
      const response = await restaurantAPI.getAnalytics(params);
      return response.data;
    },
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const response = await orderAPI.getOrders({ limit: 5 });
      return response.data;
    },
  });

  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const response = await restaurantAPI.getSubscriptionStatus();
      return response.data;
    },
  });

  const statsCards = analytics?.overview ? [
    {
      title: 'Total Revenue',
      value: `₹${analytics.overview.revenue.toLocaleString()}`,
      change: '+12.5%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Orders',
      value: analytics.overview.totalOrders.toLocaleString(),
      change: '+8.2%',
      changeType: 'increase',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Customers',
      value: analytics.overview.customerCount.toLocaleString(),
      change: '+15.3%',
      changeType: 'increase',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Avg Order Value',
      value: `₹${Math.round(analytics.overview.avgOrderValue)}`,
      change: '-2.1%',
      changeType: 'decrease',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ] : [];

  const orderStats = analytics?.orderStats ? [
    {
      label: 'Pending',
      value: orderStats.pending,
      color: 'bg-yellow-100 text-yellow-800',
      icon: Clock,
    },
    {
      label: 'Preparing',
      value: orderStats.preparing,
      color: 'bg-blue-100 text-blue-800',
      icon: Package,
    },
    {
      label: 'Ready',
      value: orderStats.ready,
      color: 'bg-green-100 text-green-800',
      icon: Eye,
    },
    {
      label: 'Completed',
      value: orderStats.completed,
      color: 'bg-green-600 text-white',
      icon: ShoppingCart,
    },
  ] : [];

  if (analyticsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your restaurant overview.</p>
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

      {/* Alert for Subscription */}
      {subscriptionStatus && !subscriptionStatus.subscriptionFeeWaived && (
        <div className="bg-accent-50 border border-accent-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-accent-600" />
            <div>
              <h3 className="font-medium text-accent-900">Subscription Fee Due</h3>
              <p className="text-sm text-accent-700 mt-1">
                Your daily subscription fee of ₹{subscriptionStatus.dailyFee} is due. Keep your restaurant active on Foodeez!
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline">
            Pay Now
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="stats-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="flex items-center mt-4">
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

      {/* Order Status Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {orderStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-10 h-10 ${stat.color} rounded-full flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topSellingItems.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.totalSold} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">₹{item.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button variant="outline" size="sm">
            View All Orders
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders?.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">
                      {order.customer?.name} • {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹{order.totalAmount}</p>
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'status-pending';
    case 'restaurant_accepted':
      return 'status-accepted';
    case 'preparing':
      return 'status-preparing';
    case 'ready_for_pickup':
      return 'status-ready';
    case 'delivered':
      return 'status-delivered';
    case 'cancelled_by_customer':
    case 'cancelled_by_restaurant':
    case 'cancelled_by_admin':
      return 'status-cancelled';
    default:
      return '';
  }
}

function formatStatus(status: string): string {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}