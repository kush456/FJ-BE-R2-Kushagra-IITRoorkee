"use client"
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useNotifications } from '@/lib/context/NotificationContext';
import { LogOut, BarChart3 } from 'lucide-react';

export default function Navbar() {
  const { pendingRequestsCount } = useNotifications();

  return (
    <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
      <div className="mx-auto px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-white text-xl font-semibold tracking-tight">
              FinTrack
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            <Link 
              href="/dashboard" 
              className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all duration-200 font-medium"
            >
              Dashboard
            </Link>
            <Link 
              href="/transactions" 
              className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all duration-200 font-medium"
            >
              Transactions
            </Link>
            <Link 
              href="/budget" 
              className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all duration-200 font-medium"
            >
              Budget
            </Link>
            <Link 
              href="/friends" 
              className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all duration-200 font-medium relative"
            >
              Friends
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-xs text-white font-semibold shadow-lg animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </Link>
            
            {/* Divider */}
            <div className="h-6 w-px bg-slate-700 mx-2" />
            
            {/* Logout Button */}
            <button 
              onClick={() => signOut({ callbackUrl: "/" })} 
              className="flex items-center space-x-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all duration-200 font-medium group"
            >
              <span>Log Out</span>
              <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}