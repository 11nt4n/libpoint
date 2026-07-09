import { Users, Wrench } from 'lucide-react';

export default function AdminMembersPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[70vh] text-center px-4">
      <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
        <Users className="w-12 h-12" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Data Anggota</h1>
      <p className="text-gray-500 max-w-md text-lg mb-8">
        Kelola data profil seluruh anggota perpustakaan, riwayat pendaftaran, serta status keaktifan akun.
      </p>
      
      <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-xl flex items-center gap-3">
        <Wrench className="w-5 h-5 text-amber-600" />
        <span className="font-medium">Modul admin ini sedang dalam tahap pengembangan. Segera hadir!</span>
      </div>
    </div>
  );
}
