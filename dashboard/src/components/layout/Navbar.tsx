'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Instagram, LogOut, Bell, Menu } from 'lucide-react';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
  const { data: session } = useSession();

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - logo and hamburger */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-gray-300 hover:bg-gray-700 rounded-lg"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
                <Instagram className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                OpenClaw Monitor
              </span>
            </Link>
          </div>

          {/* Right side - user actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications (optional) */}
            <button
              className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            {session?.user ? (
              <>
                <span className="text-sm text-gray-300 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-600 hidden sm:inline-block max-w-[150px] truncate">
                  {session.user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400 bg-gray-800 hover:bg-red-900/30 border border-gray-600 hover:border-red-500 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
