'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BarChart3, Instagram, Settings, Users, History, LayoutDashboard, X, MessageSquare } from 'lucide-react';
import { useEffect } from 'react';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/posts', label: 'Posts', icon: BarChart3 },
  { href: '/accounts', label: 'Accounts', icon: Users },
  { href: '/runs', label: 'Runs', icon: History },
  { href: '/chat', label: 'Chat Agent', icon: MessageSquare, badge: 'Beta' },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (open) {
      setOpen(false);
    }
  }, [pathname, setOpen]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [open]);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 shadow-xl transform transition-transform duration-300 ease-in-out md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-gray-700 px-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
                <Instagram className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                OpenClaw
              </span>
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="md:hidden text-gray-400 hover:text-white"
              aria-label="Close sidebar"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs bg-purple-600/80 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center space-x-3 rounded-lg px-4 py-3 text-sm text-gray-400">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>System Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
