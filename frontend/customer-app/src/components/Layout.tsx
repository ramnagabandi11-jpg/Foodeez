import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  HomeIcon,
  UserIcon,
  ShoppingCartIcon,
  MenuIcon,
  XIcon,
  LogoutIcon,
  HeartIcon,
  ClockIcon
} from '@heroicons/react/outline';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Orders', href: '/orders', icon: ClockIcon },
    { name: 'Favorites', href: '/favorites', icon: HeartIcon },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="text-2xl font-bold text-primary-600">
                🍽️ Foodeez
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Desktop Right Side */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Cart */}
              <Link href="/cart" className="relative p-2 text-gray-700 hover:text-primary-600">
                <ShoppingCartIcon className="h-6 w-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">Hi, {user.name.split(' ')[0]}</span>
                  <Link href="/profile" className="p-2 text-gray-700 hover:text-primary-600">
                    <UserIcon className="h-6 w-6" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-700 hover:text-primary-600"
                    title="Logout"
                  >
                    <LogoutIcon className="h-6 w-6" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login" className="text-gray-700 hover:text-primary-600 font-medium">
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-primary-600"
              >
                {isMobileMenuOpen ? (
                  <XIcon className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>

            <div className="pt-4 pb-3 border-t border-gray-200">
              {user ? (
                <div className="px-2 space-y-1">
                  <div className="px-3 py-2 text-sm text-gray-700">
                    Hi, {user.name}
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserIcon className="h-5 w-5" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 w-full text-left"
                  >
                    <LogoutIcon className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="px-2 space-y-1">
                  <Link
                    href="/login"
                    className="block px-3 py-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="block px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-2xl font-bold mb-4">🍽️ Foodeez</h3>
              <p className="text-gray-400 mb-4">
                Your favorite food delivery platform, bringing delicious meals to your doorstep.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  Facebook
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  Twitter
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  Instagram
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/restaurants">All Restaurants</Link></li>
                <li><Link href="/about">About Us</Link></li>
                <li><Link href="/careers">Careers</Link></li>
                <li><Link href="/blog">Blog</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Partner */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Partner with Us</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/partner/restaurant">Add Restaurant</Link></li>
                <li><Link href="/partner/delivery">Become Delivery Partner</Link></li>
                <li><Link href="/business">Business Solutions</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Foodeez. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}