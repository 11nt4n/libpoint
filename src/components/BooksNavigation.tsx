'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Book, Heart, List } from 'lucide-react';

export default function BooksNavigation() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Katalog Buku', href: '/dashboard/books', icon: Book },
    { name: 'Wishlist', href: '/dashboard/books/wishlist', icon: Heart },
    { name: 'Catatan Peminjaman', href: '/dashboard/books/records', icon: List },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mb-6 p-1 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm w-fit">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium whitespace-nowrap ${
              isActive 
                ? 'bg-primary text-white shadow-md' 
                : 'text-gray-600 hover:bg-white hover:text-primary'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
