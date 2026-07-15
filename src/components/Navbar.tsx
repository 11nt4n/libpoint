'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Book, Users, Trophy, Gift, LogOut, 
  History, ShoppingBag, MessageSquare, ChevronDown, Heart, List, Database,
  CheckSquare, Bell, User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NavbarProps {
  role: 'admin' | 'user';
  user: any;
  profile: any;
}

interface Menu {
  name: string;
  href: string;
  icon: any;
  submenu?: { name: string; href: string; icon: any }[];
}

export default function Navbar({ role, profile }: NavbarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      window.location.href = '/';
    }
  };

  const adminFeatures: Menu[] = [
    { name: 'Data Buku', href: '/admin/books', icon: Book },
    { name: 'Peminjaman', href: '/admin/loans', icon: CheckSquare },
    { name: 'Anggota', href: '/admin/members', icon: Users },
    { name: 'Poin', href: '/admin/points', icon: Trophy },
    { name: 'Pengumuman', href: '/admin/announcements', icon: Bell },
    { name: 'Penukaran', href: '/admin/redemptions', icon: Gift },
  ];

  const userMenus: Menu[] = [
    { name: 'Dashboard', href: role === 'admin' ? '/admin' : '/dashboard', icon: LayoutDashboard },
    { 
      name: 'Sirkulasi', 
      href: '/dashboard/books', 
      icon: Book
    },
    { name: 'Peminjaman', href: '/dashboard/loans', icon: History },
    { name: 'Poin', href: '/dashboard/points', icon: Trophy },
    { name: 'Tukar Poin', href: '/dashboard/rewards', icon: ShoppingBag },
    { name: 'Komunitas', href: '/dashboard/community', icon: Users },
    { name: 'AI', href: '/dashboard/chat', icon: MessageSquare },
  ];

  const menusToRender = role === 'admin' ? [...userMenus, { name: 'Admin', href: '#', icon: Users, submenu: adminFeatures }] : userMenus;

  return (
    <nav className="w-full bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo Section */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 relative">
            <img src="/2.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight hidden lg:block">LibPoint</span>
        </div>

        {/* Center Menus */}
        <div className="flex-1 flex justify-center overflow-x-auto scrollbar-hide py-2">
          <div className="flex items-center gap-1 sm:gap-2">
            {menusToRender.map((menu) => {
              const isActive = pathname === menu.href || menu.submenu?.some(sub => pathname === sub.href);
              const Icon = menu.icon;

              if (menu.submenu) {
                return (
                  <div key={menu.name} className="relative group">
                    <button className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm whitespace-nowrap ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                      <span className="hidden md:block">{menu.name}</span>
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </button>
                    {/* Invisible bridge to prevent hover loss */}
                    <div className="absolute top-full left-0 w-full h-2"></div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      {menu.submenu.map(sub => (
                        <Link key={sub.name} href={sub.href} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors">
                          <sub.icon className="w-4 h-4" />
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link key={menu.name} href={menu.href} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm whitespace-nowrap ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                  <span className="hidden md:block">{menu.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Right Section (Profile & Actions) */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Notifications */}
          <button className="relative text-gray-400 hover:text-gray-600 transition-colors hidden sm:block">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>

          <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>

          {/* Profile Dropdown Trigger */}
          <div className="relative group">
            <Link href={profile?.role === 'admin' ? '/admin/profile' : '/dashboard/profile'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-800">{profile?.nama_panggilan || profile?.nama_lengkap || 'User'}</p>
                <p className="text-[10px] text-primary font-semibold">
                  {profile?.role === 'admin' ? 'Administrator' : `${profile?.total_points || 0} Poin`}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary-light p-[2px]">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {profile?.photo_url ? (
                    <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            </Link>

            {/* Logout floating in dropdown on hover (optional, but let's just make it a button beside it) */}
          </div>

          <button onClick={handleLogout} className="flex items-center gap-1.5 px-2 py-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm ml-2">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </nav>
  );
}
