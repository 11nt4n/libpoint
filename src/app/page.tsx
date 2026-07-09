'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { X } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Register Modal State
  const [showRegister, setShowRegister] = useState(false);
  const [isMahasiswa, setIsMahasiswa] = useState(true);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regData, setRegData] = useState({
    namaPanggilan: '',
    namaLengkap: '',
    npm: '',
    email: '',
    programStudi: 'Rekayasa Keamanan Siber'
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (profile?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError('Terjadi kesalahan saat login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');
    setRegSuccess('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: regData.email,
        password: regData.npm, // Menggunakan NPM/NIP sebagai password
        options: {
          data: {
            nama_panggilan: regData.namaPanggilan,
            nama_lengkap: regData.namaLengkap,
            npm: regData.npm,
            program_studi: isMahasiswa ? regData.programStudi : null,
            is_mahasiswa: isMahasiswa
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Simpan ke tabel profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              user_id: regData.npm,
              nama_lengkap: regData.namaLengkap,
              email: regData.email,
              npm: regData.npm,
              role: 'user'
            }
          ]);
        
        if (profileError) {
          console.error("Gagal menyimpan ke profil:", profileError);
        }

        setRegSuccess('Pendaftaran berhasil! Silakan login dengan Email dan NPM/NIP Anda.');
        setRegData({
          namaPanggilan: '',
          namaLengkap: '',
          npm: '',
          email: '',
          programStudi: 'Rekayasa Keamanan Siber'
        });
        setTimeout(() => setShowRegister(false), 3000);
      }
    } catch (err: any) {
      setRegError(err.message || 'Terjadi kesalahan saat pendaftaran.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 md:p-10 lg:p-16">
      
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/1.jpg" 
          alt="Background" 
          fill 
          className="object-cover object-[center_75%]" 
          priority 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
      </div>
      
      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-12">
        
        {/* Left Content */}
        <div className="w-full md:w-3/5 flex flex-col items-start text-left">
          <div className="flex items-center gap-3 mb-8">
            <div className="relative w-10 h-10 md:w-12 md:h-12">
              <Image src="/2.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">LibPoint</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-[#1c2b36] leading-[1.15] mb-5 tracking-tight">
            Sistem Informasi <br/> Perpustakaan <br/> <span className="text-primary">Modern</span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 max-w-lg leading-relaxed font-medium">
            Platform digital terpadu untuk manajemen perpustakaan. Satu sistem, banyak manfaat untuk kemudahan sirkulasi buku dan akses informasi yang lebih baik.
          </p>
        </div>

        {/* Right Form Card */}
        <div className="w-full md:w-2/5 max-w-md flex justify-end">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Login</h2>
              <p className="text-xs text-gray-500">Masuk untuk mengakses layanan perpustakaan.</p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 block ml-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm text-gray-800 placeholder-gray-400"
                  placeholder="contoh.intan@gmail.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 block ml-1">NPM / NIP</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm text-gray-800 placeholder-gray-400"
                  placeholder="Masukkan NPM Anda"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>
              </div>
              
              <div className="text-center pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowRegister(true)} 
                  className="text-xs text-gray-500 font-medium hover:text-primary transition-colors"
                >
                  Belum punya akun? <span className="font-bold text-primary">Buat akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Register Modal Popup */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowRegister(false)} 
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-1"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold text-center text-[#2A3744] mb-6">Buat Akun</h2>
            
            {/* Messages */}
            {regError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">
                {regError}
              </div>
            )}
            {regSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm text-center">
                {regSuccess}
              </div>
            )}
            
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Toggle Role */}
              <div className="flex gap-6 justify-center mb-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${isMahasiswa ? 'border-primary' : 'border-gray-300'}`}>
                    {isMahasiswa && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <input type="radio" checked={isMahasiswa} onChange={() => setIsMahasiswa(true)} className="hidden" />
                  <span className={`text-sm font-semibold transition-colors ${isMahasiswa ? 'text-gray-800' : 'text-gray-500 group-hover:text-gray-700'}`}>Mahasiswa</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${!isMahasiswa ? 'border-primary' : 'border-gray-300'}`}>
                    {!isMahasiswa && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <input type="radio" checked={!isMahasiswa} onChange={() => setIsMahasiswa(false)} className="hidden" />
                  <span className={`text-sm font-semibold transition-colors ${!isMahasiswa ? 'text-gray-800' : 'text-gray-500 group-hover:text-gray-700'}`}>Non-Mahasiswa</span>
                </label>
              </div>

              <div className="flex gap-4">
                <div className="w-2/5 space-y-1">
                  <label className="text-xs font-semibold text-gray-600 block">Nama Panggilan</label>
                  <input 
                    type="text" 
                    value={regData.namaPanggilan}
                    onChange={e => setRegData({...regData, namaPanggilan: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[1.25rem] focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm text-gray-800 placeholder-gray-400" 
                    placeholder="Intan" 
                    required
                  />
                </div>
                <div className="w-3/5 space-y-1">
                  <label className="text-xs font-semibold text-gray-600 block">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={regData.namaLengkap}
                    onChange={e => setRegData({...regData, namaLengkap: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[1.25rem] focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm text-gray-800 placeholder-gray-400" 
                    placeholder="Intan Bella" 
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 block">
                  {isMahasiswa ? 'NPM' : 'NIP'}
                </label>
                <input 
                  type="text" 
                  value={regData.npm}
                  onChange={e => setRegData({...regData, npm: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[1.25rem] focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm text-gray-800 placeholder-gray-400" 
                  placeholder={isMahasiswa ? "Contoh: 2322101..." : "Contoh: 19800101..."} 
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 block">Email</label>
                <input 
                  type="email" 
                  value={regData.email}
                  onChange={e => setRegData({...regData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[1.25rem] focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm text-gray-800 placeholder-gray-400" 
                  placeholder="nama@email.com" 
                  required
                />
              </div>

              {isMahasiswa && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 block">Program Studi</label>
                  <div className="relative">
                    <select 
                      value={regData.programStudi}
                      onChange={e => setRegData({...regData, programStudi: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[1.25rem] focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm text-gray-800 appearance-none cursor-pointer"
                    >
                      <option value="Rekayasa Keamanan Siber">Rekayasa Keamanan Siber</option>
                      <option value="Rekayasa Kriptografi">Rekayasa Kriptografi</option>
                      <option value="Rekayasa Perangkat Keras Kriptografi">Rekayasa Perangkat Keras Kriptografi</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={regLoading}
                  className="w-full py-3.5 px-4 bg-white border border-gray-200 hover:border-primary hover:text-primary text-gray-800 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {regLoading ? 'Memproses...' : 'Daftar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
