'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import KnowledgeBaseModal from '@/components/KnowledgeBaseModal';
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

interface SubMenu {
  name: string;
  href: string;
  icon: any;
  description?: string;
  category?: string;
  action?: string;
}

interface Menu {
  name: string;
  href: string;
  icon: any;
  submenu?: SubMenu[];
}

export default function Navbar({ role, profile }: NavbarProps) {
  const pathname = usePathname();
  const [showKbModal, setShowKbModal] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      window.location.href = '/';
    }
  };

  const adminFeatures: SubMenu[] = [
    { name: 'Data Buku', href: '/admin/books', icon: Book, category: 'Manajemen Koleksi', description: 'Kelola seluruh katalog buku, kategori, dan stok fisik.' },
    { name: 'Knowledge Base', href: '#', action: 'open_kb', icon: Database, category: 'Manajemen Koleksi', description: 'Atur dokumen referensi untuk kecerdasan buatan LibPoint AI.' },
    
    { name: 'Anggota', href: '/admin/members', icon: Users, category: 'Pengguna & Interaksi', description: 'Kelola data pengguna, hak akses, dan profil taruna.' },
    { name: 'Pengumuman', href: '/admin/announcements', icon: Bell, category: 'Pengguna & Interaksi', description: 'Sebarkan informasi terbaru secara global ke seluruh pengguna.' },
    
    { name: 'Poin', href: '/admin/points', icon: Trophy, category: 'Gamifikasi & Reward', description: 'Sistem pengaturan poin dan reward aktivitas literasi.' },
    { name: 'Penukaran', href: '/admin/redemptions', icon: Gift, category: 'Gamifikasi & Reward', description: 'Setujui atau tolak permintaan penukaran poin hadiah.' },
  ];

  const userMenus: Menu[] = [
    { name: 'Home', href: role === 'admin' ? '/admin' : '/dashboard', icon: LayoutDashboard },
    { 
      name: 'LibCircu', 
      href: '#', 
      icon: Book,
      submenu: [
        { name: 'Katalog Buku', href: '/dashboard/books', icon: Book, description: 'Cari, baca, dan jelajahi koleksi e-book maupun buku fisik Perpustakaan.' },
        { name: 'Catatan Peminjaman', href: '/dashboard/books/records', icon: List, description: 'Pantau status buku yang sedang Anda pinjam, riwayat, dan tenggat waktu.' },
      ]
    },
    { name: 'LibLog', href: '/dashboard/points', icon: Trophy },
    { name: 'LibMerch', href: '/dashboard/rewards', icon: ShoppingBag },
    { name: 'LibChat', href: '/dashboard/chat', icon: MessageSquare },
  ];

  const menusToRender = role === 'admin' ? [...userMenus, { name: 'Admin', href: '#', icon: Users, submenu: adminFeatures }] : userMenus;

  return (
    <>
    <nav className="w-full bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-[100] shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo Section */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 relative">
            <img src="/2.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight hidden lg:block">LibPoint</span>
        </div>

        {/* Center Menus */}
        <div className="flex-1 flex justify-center overflow-visible py-2">
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
                    <div className="absolute top-full left-0 w-full h-4"></div>
                    <div className="absolute top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 w-[400px] bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] py-4 z-[110] opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 translate-y-2 transition-all duration-300 ease-out">
                      {(() => {
                        const categories = [...new Set(menu.submenu.map(item => item.category || 'Lainnya'))];
                        return categories.map((cat, catIdx) => (
                          <div key={cat} className={`${catIdx > 0 ? 'mt-4 pt-4 border-t border-gray-50' : ''}`}>
                            {cat !== 'Lainnya' && (
                              <div className="px-6 mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                {cat}
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              {menu.submenu!.filter(item => (item.category || 'Lainnya') === cat).map(sub => (
                                <Link 
                                  key={sub.name} 
                                  href={sub.href}
                                  onClick={(e) => {
                                    if (sub.action === 'open_kb') {
                                      e.preventDefault();
                                      setShowKbModal(true);
                                    }
                                  }}
                                  className="flex items-start gap-4 px-6 py-2.5 hover:bg-slate-50 transition-colors group/item relative"
                                >
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary rounded-r-full transition-all duration-300 group-hover/item:h-8"></div>
                                  <div className="flex-shrink-0 w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover/item:bg-blue-100 group-hover/item:text-blue-600 transition-colors">
                                    <sub.icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-[15px] font-bold text-slate-700 group-hover/item:text-blue-700 transition-colors leading-tight mb-1">{sub.name}</h4>
                                    {sub.description && (
                                      <p className="text-[13px] text-slate-500 leading-snug line-clamp-2">{sub.description}</p>
                                    )}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
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
    {showKbModal && <KnowledgeBaseModal onClose={() => setShowKbModal(false)} />}
    </>
  );
}
