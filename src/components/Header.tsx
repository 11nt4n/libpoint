'use client';

import { Bell, Search, User } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  user: any;
  profile: any;
}

export default function Header({ user, profile }: HeaderProps) {
  return (
    <header className="sticky top-6 z-50 w-full flex justify-end px-8 h-0 overflow-visible pointer-events-none">
      {/* Right Actions */}
      <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md px-4 py-8 rounded-[1.5rem] border border-gray-100 shadow-md pointer-events-auto">
        
        {/* Notifications */}
        <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <div className="w-px h-6 bg-gray-200"></div>

        {/* Profile Dropdown */}
        <Link href={profile?.role === 'admin' ? '/admin/profile' : '/dashboard/profile'} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800">{profile?.nama_panggilan || profile?.nama_lengkap || 'User'}</p>
            <p className="text-xs text-primary font-semibold">
              {profile?.role === 'admin' ? 'Administrator' : `${profile?.total_points || 0} Poin`}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-primary to-primary-light p-[2px]">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
