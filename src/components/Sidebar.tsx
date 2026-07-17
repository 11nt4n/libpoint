'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Book, 
  Users, 
  Trophy, 
  Gift, 
  LogOut, 
  Bell,
  CheckSquare,
  History,
  ShoppingBag,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Heart,
  List,
  Database
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  role: 'admin' | 'user';
}

interface Menu {
  name: string;
  href: string;
  icon: any;
  submenu?: { name: string; href: string; icon: any }[];
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

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
    { name: 'Anggota', href: '/admin/members', icon: Users },
    { name: 'Manajemen Poin', href: '/admin/points', icon: Trophy },
    { name: 'Pengumuman', href: '/admin/announcements', icon: Bell },
    { name: 'Approval Penukaran', href: '/admin/redemptions', icon: Gift },
    { name: 'Manajemen AI Materi', href: '/admin/knowledge-base', icon: Database },
  ];

  const userMenus: Menu[] = [
    { name: 'Dashboard', href: role === 'admin' ? '/admin' : '/dashboard', icon: LayoutDashboard },
    { 
      name: 'LibCircu', 
      href: '/dashboard/books', 
      icon: Book,
      submenu: [
        { name: 'Katalog Buku', href: '/dashboard/books', icon: Book },
        { name: 'Wishlist', href: '/dashboard/books/wishlist', icon: Heart },
        { name: 'Catatan Peminjaman', href: '/dashboard/books/records', icon: List }
      ]
    },
    { name: 'Peminjaman Saya', href: '/dashboard/loans', icon: History },
    { name: 'LibLog', href: '/dashboard/points', icon: Trophy },
    { name: 'LibMerch', href: '/dashboard/rewards', icon: ShoppingBag },
    { name: 'AI Assistant', href: '/dashboard/chat', icon: MessageSquare },
  ];

  const renderMenu = (menu: Menu) => {
    const isDashboard = menu.href === '/admin' || menu.href === '/dashboard';
    const isExactActive = pathname === menu.href;
    const isChildActive = menu.submenu?.some(sub => pathname === sub.href);
    const isActive = isDashboard ? isExactActive : (pathname.startsWith(menu.href) || isChildActive);
    
    const Icon = menu.icon;
    const isExpanded = expandedMenu === menu.name || (isActive && expandedMenu === null && !!menu.submenu);

    return (
      <div key={menu.href} className="flex flex-col gap-1">
        {menu.submenu ? (
          <button
            onClick={() => setExpandedMenu(isExpanded ? "" : menu.name)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              isActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
              <span className="text-sm">{menu.name}</span>
            </div>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <Link
            href={menu.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              isActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
            <span className="text-sm">{menu.name}</span>
          </Link>
        )}

        {/* Submenu rendering */}
        {menu.submenu && isExpanded && (
          <div className="ml-9 flex flex-col gap-1 mt-1 border-l-2 border-gray-100 pl-2">
            {menu.submenu.map((sub) => {
              const isSubActive = pathname === sub.href;
              const SubIcon = sub.icon;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    isSubActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 text-sm'
                  }`}
                >
                  <SubIcon className={`w-4 h-4 ${isSubActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-sm">{sub.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-1.5">
          <div className="relative w-12 h-12">
            <img src="/2.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            LibPoint
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
        {userMenus.map(renderMenu)}

        {role === 'admin' && (
          <div className="pt-4 mt-4 border-t border-gray-100">
            <div className="px-3 mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Fitur Admin
              </span>
            </div>
            {adminFeatures.map(renderMenu)}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Keluar</span>
        </button>
      </div>
    </aside>
  );
}

