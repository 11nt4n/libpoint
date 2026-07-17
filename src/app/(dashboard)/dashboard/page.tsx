'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { Book, Trophy, Target, Award, BookOpen, CheckCircle2, Wifi, Users, BookMarked, Coffee, Presentation, Landmark, ChevronRight, ChevronLeft, Building2, Shield, ImageIcon, X, User } from 'lucide-react';
import Link from 'next/link';

function PopUp({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      });
    }, { threshold: 0.1 });
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-90'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function ImageCarousel() {
  const [galleryData, setGalleryData] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  // Modal state
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchGallery = async () => {
      const { data, error } = await supabase
        .from('gallery_activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setGalleryData(data);
      } else {
        // Fallback to static if empty
        setGalleryData([
          { id: -1, image_url: '/1.jpg', title: 'Diskusi', subtitle: 'Ruang Kolaborasi', article_content: 'Acara diskusi mingguan untuk membahas inovasi dan literasi terkini bersama mahasiswa dan pengajar.' },
          { id: -2, image_url: '/2.png', title: 'Literasi', subtitle: 'Kunjungan Taruna', article_content: 'Kunjungan rutin taruna ke perpustakaan untuk memperluas wawasan keamanan siber dan kriptografi.' },
          { id: -3, image_url: '/hero-illustration.png', title: 'Koleksi', subtitle: 'Buku Terbaru', article_content: 'Pembaruan koleksi buku-buku referensi internasional yang menunjang perkuliahan.' },
          { id: -4, image_url: '/1.jpg', title: 'Fasilitas', subtitle: 'Kenyamanan Membaca', article_content: 'Peningkatan fasilitas baca dengan pencahayaan dan kursi ergonomis.' },
          { id: -5, image_url: '/2.png', title: 'Event', subtitle: 'Seminar Nasional', article_content: 'Seminar nasional bertajuk "Tantangan Siber di Era AI" dengan pembicara ahli dari BSSN.' },
        ]);
      }
    };
    fetchGallery();
  }, []);

  const handleImageError = (id: number) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  const openModal = (item: any) => {
    setSelectedArticle(item);
    setIsModalOpen(true);
  };

  if (galleryData.length === 0) return null;

  return (
    <>
      <div className="relative w-full h-[450px] md:h-[600px] flex items-center justify-center overflow-visible">
        {/* Container for slides */}
        <div className="relative w-full max-w-5xl h-full flex items-center justify-center">
          {galleryData.map((item, index) => {
            let offset = (index - currentIndex) % galleryData.length;
            if (offset < 0) offset += galleryData.length;
            if (offset > galleryData.length / 2) offset -= galleryData.length;

            let zIndex = 10;
            let transform = 'translateX(0) scale(1)';
            let opacity = 1;

            if (offset === 0) {
              zIndex = 30;
              transform = 'translateX(0) scale(1)';
              opacity = 1;
            } else if (offset === -1 || (offset < 0 && offset > -2)) { // Left 1
              zIndex = 20;
              transform = 'translateX(-70%) scale(0.85)';
              opacity = 0.8;
            } else if (offset === 1 || (offset > 0 && offset < 2)) { // Right 1
              zIndex = 20;
              transform = 'translateX(70%) scale(0.85)';
              opacity = 0.8;
            } else if (offset === -2 || (offset < 0 && offset <= -2)) { // Left 2
              zIndex = 10;
              transform = 'translateX(-130%) scale(0.7)';
              opacity = 0.4;
            } else if (offset === 2 || (offset > 0 && offset >= 2)) { // Right 2
              zIndex = 10;
              transform = 'translateX(130%) scale(0.7)';
              opacity = 0.4;
            } else {
              zIndex = 0;
              transform = 'translateX(0) scale(0.5)';
              opacity = 0;
            }

            const isActive = offset === 0;

            return (
              <div
                key={item.id}
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)] cursor-pointer"
                style={{ transform, zIndex, opacity }}
                onClick={() => {
                  if (!isActive) setCurrentIndex(index);
                }}
              >
                <div className="relative group">
                  {/* White background frame (only visible on active) */}
                  <div className={`absolute -inset-4 md:-inset-6 md:-bottom-24 -bottom-20 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}></div>

                  {/* Image Wrapper */}
                  <div className={`relative w-[240px] h-[320px] md:w-[340px] md:h-[440px] overflow-hidden z-10 shadow-lg bg-slate-100 transition-all duration-700 ${isActive ? 'shadow-none' : 'shadow-lg'}`}>
                    {imgErrors[item.id] || !item.image_url ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                        <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                        <span className="text-sm font-semibold opacity-70">No Image Available</span>
                      </div>
                    ) : (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" onError={() => handleImageError(item.id)} />
                    )}

                    {/* Dark gradient overlay for text */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>

                    {/* Text Overlay */}
                    <div className={`absolute bottom-6 left-6 text-white transition-all duration-700 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                      <h3 className="text-3xl md:text-5xl font-bold mb-1 tracking-tight drop-shadow-md">{item.title}</h3>
                      <p className="text-sm md:text-lg text-slate-200 drop-shadow-md">{item.subtitle}</p>
                    </div>
                  </div>

                  {/* Discover More Bottom Section */}
                  <div
                    onClick={() => {
                      if (isActive) openModal(item);
                    }}
                    className={`absolute -bottom-16 left-0 w-full flex flex-col items-center justify-center text-slate-500 hover:text-primary transition-all duration-700 z-10 ${isActive ? 'opacity-100 translate-y-0 cursor-pointer' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                  >
                    <span className="text-xs font-bold tracking-widest uppercase mb-1 text-center">Discover More</span>
                    <ChevronRight className="w-6 h-6 rotate-90 transition-transform duration-300 hover:translate-y-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Article Modal Overlay (Portaled to root for full screen blur) */}
      {mounted && isModalOpen && selectedArticle && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[85vh] overflow-y-auto relative z-10 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors z-20 backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full h-64 md:h-80 relative shrink-0">
              <img src={selectedArticle.image_url} alt={selectedArticle.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              <div className="absolute bottom-8 left-8 md:left-10 text-white pr-8">
                <h2 className="text-3xl md:text-5xl font-black mb-2 drop-shadow-lg">{selectedArticle.title}</h2>
                <p className="text-lg text-slate-200 font-medium">{selectedArticle.subtitle}</p>
              </div>
            </div>
            <div className="p-8 md:p-10">
              <div className="prose prose-slate prose-lg max-w-none">
                {selectedArticle.article_content ? (
                  <div className="text-slate-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: selectedArticle.article_content.replace(/\n/g, '<br/>') }} />
                ) : (
                  <p className="text-slate-500 italic">Artikel belum tersedia untuk kegiatan ini.</p>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

const PlusPattern = ({ className = "" }: { className?: string }) => (
  <svg className={`absolute pointer-events-none opacity-40 ${className}`} width="168" height="264" fill="none" viewBox="0 0 168 264">
    <pattern id="plus-pattern" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M12 6v12M6 12h12" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
    </pattern>
    <rect width="100%" height="100%" fill="url(#plus-pattern)" />
  </svg>
);


export default function UserDashboard() {
  const [totalPoints, setTotalPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelName, setLevelName] = useState('Pemula');

  useEffect(() => {
    async function fetchPoints() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('total_points').eq('id', session.user.id).single();
        if (data) {
          const pts = data.total_points || 0;
          setTotalPoints(pts);
          if (pts > 1000) { setLevel(4); setLevelName('Master'); }
          else if (pts > 500) { setLevel(3); setLevelName('Kutu Buku'); }
          else if (pts > 200) { setLevel(2); setLevelName('Aktif'); }
        }
      }
    }
    fetchPoints();
  }, []);

  const fasilitas = [
    { name: 'Ruang Baca di Tempat', icon: BookOpen, bg: 'bg-blue-50', text: 'text-blue-600', hoverBg: 'group-hover:bg-blue-500', borderColor: 'border-blue-200' },
    { name: 'Ruang Baca Lesehan', icon: Coffee, bg: 'bg-amber-50', text: 'text-amber-600', hoverBg: 'group-hover:bg-amber-500', borderColor: 'border-amber-200' },
    { name: 'Ruang Rapat Terbatas', icon: Users, bg: 'bg-emerald-50', text: 'text-emerald-600', hoverBg: 'group-hover:bg-emerald-500', borderColor: 'border-emerald-200' },
    { name: 'Ruang Pembelajaran', icon: Presentation, bg: 'bg-purple-50', text: 'text-purple-600', hoverBg: 'group-hover:bg-purple-500', borderColor: 'border-purple-200' },
    { name: 'Mushola', icon: Landmark, bg: 'bg-indigo-50', text: 'text-indigo-600', hoverBg: 'group-hover:bg-indigo-500', borderColor: 'border-indigo-200' },
    { name: 'Koneksi WiFi', icon: Wifi, bg: 'bg-rose-50', text: 'text-rose-600', hoverBg: 'group-hover:bg-rose-500', borderColor: 'border-rose-200' },
  ];

  return (
    <div className="space-y-12 pb-12 font-sans">
      {/* FIRST SCREEN WRAPPER */}
      <div className="relative -mt-4 sm:-mt-8 -mx-4 sm:-mx-8 px-8 md:px-12 pt-20 md:pt-24 pb-12 min-h-[calc(100vh-5rem)] flex flex-col justify-start gap-8 overflow-hidden">

        {/* Background Image bg1.png */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src="/bg1.png" alt="Background" className="w-full h-full object-cover object-center" />
        </div>

        {/* HEADER BANNER SECTION */}
        <div className="flex-1 flex flex-col items-center justify-start text-center relative z-10 space-y-4 md:space-y-6 w-full max-w-4xl mx-auto pt-0 md:pt-4 pb-10">
          <PopUp delay={0}>
            <div className="flex justify-center w-full mb-1 md:mb-2">
              <img src="/3.png" alt="LibPoint Mascot" className="h-24 md:h-32 w-auto object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" />
            </div>
          </PopUp>
          <PopUp delay={100}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-[#0B2C4A]">
              Selamat Datang di <span className="text-primary">LibPoint!</span>
            </h1>
          </PopUp>

          <PopUp delay={200}>
            <p className="text-slate-800 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
              Tingkatkan pengalaman belajarmu dengan Perpustakaan Digital. Akses ribuan koleksi e-book, jurnal, dan pustaka ilmiah secara instan, di mana saja dan kapan saja.
            </p>
          </PopUp>

          <PopUp delay={350}>
            <div className="mt-4 text-white font-extrabold text-2xl inline-block drop-shadow-sm">
              #PerpustakaanBisaBanget
            </div>
          </PopUp>
        </div>
      </div>

      {/* VISI MISI SECTION */}
      <section className="relative z-20 w-full shrink-0 mb-20 overflow-hidden lg:overflow-visible">
        {/* Decorative Patterns */}
        <PlusPattern className="-top-10 -left-10 md:left-0 opacity-30" />
        <PlusPattern className="top-32 md:top-48 -right-10 md:right-0 opacity-30" />

        <div className="relative px-4 md:px-12 max-w-7xl mx-auto">
          <div className="relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-8">

            {/* VISI (Left Column) */}
            <div className="flex flex-col items-center">
              <PopUp delay={0}>
                <div className="mb-6 flex justify-center w-full">
                  <img src="/visi.png" alt="VISI KAMI" className="h-16 md:h-24 w-auto object-contain" />
                </div>
              </PopUp>
              <PopUp delay={150}>
                <p className="text-slate-600 leading-relaxed text-base md:text-lg font-medium text-justify">
                  &quot;Menjadi perpustakaan yang <strong className="text-[#0B2C4A] font-bold">pintar, profesional dan unggul</strong> sebagai pusat penyedia <strong className="text-[#0B2C4A] font-bold">informasi ilmiah</strong> di bidang <strong className="text-primary font-black">keamanan siber dan kriptografi</strong> tingkat nasional.&quot;
                </p>
              </PopUp>
            </div>

            {/* MISI (Right Column) */}
            <div className="flex flex-col items-center">
              <PopUp delay={200}>
                <div className="mb-6 flex justify-center w-full">
                  <img src="/misi.png" alt="MISI KAMI" className="h-16 md:h-24 w-auto object-contain" />
                </div>
              </PopUp>
              <ul className="text-slate-600 font-medium text-base md:text-lg space-y-3">
                <PopUp delay={350}>
                  <li className="flex items-start gap-4">
                    <span className="text-primary font-black text-xl shrink-0">1.</span>
                    <span className="leading-relaxed text-justify">Memfasilitasi sivitas akademika Poltek SSN dalam melaksanakan <strong className="text-[#0B2C4A] font-bold">pendidikan, penelitian, dan pengabdian kepada masyarakat</strong> yang <strong className="text-primary font-black">berkualitas dan berkelanjutan</strong>;</span>
                  </li>
                </PopUp>
                <PopUp delay={500}>
                  <li className="flex items-start gap-4">
                    <span className="text-primary font-black text-xl shrink-0">2.</span>
                    <span className="leading-relaxed text-justify">Menyediakan <strong className="text-[#0B2C4A] font-bold">layanan informasi ilmiah</strong> di bidang <strong className="text-primary font-black">keamanan siber dan kriptografi</strong> yang menjadi <strong className="text-[#0B2C4A] font-bold">rujukan nasional</strong>;</span>
                  </li>
                </PopUp>
                <PopUp delay={650}>
                  <li className="flex items-start gap-4">
                    <span className="text-primary font-black text-xl shrink-0">3.</span>
                    <span className="leading-relaxed text-justify">Menyelenggarakan <strong className="text-[#0B2C4A] font-bold">tata kelola perpustakaan</strong> sesuai <strong className="text-primary font-black">standar nasional</strong> perpustakaan perguruan tinggi yang <strong className="text-[#0B2C4A] font-bold">unggul</strong>.</span>
                  </li>
                </PopUp>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* SEJARAH SECTION */}
      <section className="bg-gradient-to-r from-teal-500 to-primary w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] py-16 px-4 md:px-12 shadow-lg mt-32 mb-20">
        <PopUp>
          <div className="flex justify-center mb-16 relative group">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white/80 via-white to-white/80 animate-shine text-center tracking-tight [filter:drop-shadow(0_0_15px_rgba(255,255,255,0.8))]">
              Sejarah Perpustakaan
            </h2>
          </div>
        </PopUp>

        {/* History Grid */}
        <div className="relative max-w-7xl mx-auto">
          {/* Connecting Dashed Line */}
          <div className="hidden md:block absolute top-[11px] left-[16.6%] right-[16.6%] h-0 border-t-[3px] border-dashed border-white/40 z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative z-10">
            {/* Item 1 */}
            <PopUp delay={0}>
              <div className="flex flex-col items-center text-center group">
                <div className="w-6 h-6 rounded-full bg-white border-[5px] border-teal-200 shadow-sm mb-6 group-hover:scale-150 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-all duration-300 z-10"></div>
                <h2 className="text-5xl font-black text-white mb-2 tracking-tight group-hover:-translate-y-1 transition-transform drop-shadow-md">1975</h2>
                <h4 className="text-lg font-bold text-teal-50 mb-3">Perpustakaan ASN</h4>
                <p className="text-white/90 text-sm leading-relaxed font-medium">Berdiri sebagai langkah awal penyediaan literasi untuk institusi persandian negara.</p>
              </div>
            </PopUp>

            {/* Item 2 */}
            <PopUp delay={150}>
              <div className="flex flex-col items-center text-center group">
                <div className="w-6 h-6 rounded-full bg-white border-[5px] border-teal-200 shadow-sm mb-6 group-hover:scale-150 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-all duration-300 z-10"></div>
                <h2 className="text-5xl font-black text-white mb-2 tracking-tight group-hover:-translate-y-1 transition-transform drop-shadow-md">2004</h2>
                <h4 className="text-lg font-bold text-teal-50 mb-3">Perpustakaan STSN</h4>
                <p className="text-white/90 text-sm leading-relaxed font-medium">Berubah seiring pembentukan Sekolah Tinggi Sandi Negara (Keputusan Lemsaneg No. OT.101/KEP.77.A/2004).</p>
              </div>
            </PopUp>

            {/* Item 3 */}
            <PopUp delay={300}>
              <div className="flex flex-col items-center text-center group">
                <div className="w-6 h-6 rounded-full bg-white border-[5px] border-teal-200 shadow-sm mb-6 group-hover:scale-150 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-all duration-300 z-10"></div>
                <h2 className="text-5xl font-black text-white mb-2 tracking-tight group-hover:-translate-y-1 transition-transform drop-shadow-md">2019</h2>
                <h4 className="text-lg font-bold text-teal-50 mb-3">Perpustakaan Poltek SSN</h4>
                <p className="text-white/90 text-sm leading-relaxed font-medium">Bertransformasi menjadi Politeknik Siber dan Sandi Negara (Peraturan BSSN no. 12/2019).</p>
              </div>
            </PopUp>
          </div>
        </div>
      </section>

      {/* STRUKTUR ORGANISASI SECTION */}
      <section className="bg-slate-50 rounded-[2.5rem] p-8 md:p-12 shadow-lg shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>
        <PopUp>
          <h3 className="text-3xl font-extrabold text-[#0B2C4A] mb-12 text-center relative z-10">
            Struktur Organisasi
          </h3>
        </PopUp>

        <div className="relative flex flex-col items-center">
          {/* Level 1: Direktur */}
          <PopUp delay={0}>
            <div className="relative pb-8 flex flex-col items-center">
              <div className="bg-white px-8 py-3 rounded-xl shadow-md border-t-4 border-slate-400 text-center relative z-10 w-fit hover:scale-105 transition-transform">
                <h5 className="font-bold text-slate-700">Direktur</h5>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-slate-300"></div>
            </div>
          </PopUp>

          {/* Level 2: Kepala Unit */}
          <PopUp delay={150}>
            <div className="relative pb-8 flex flex-col items-center">
              <div className="bg-white px-8 py-4 rounded-xl shadow-md border-t-4 border-primary text-center relative z-10 w-fit hover:scale-105 transition-transform">
                <h5 className="font-extrabold text-[#0B2C4A] mb-2">Kepala Unit Perpustakaan</h5>
                <div className="flex items-center justify-center gap-2 text-slate-600">
                  <User className="w-4 h-4" />
                  <p className="text-sm font-medium">Yeni Farida, S.Stat., M.Si.</p>
                </div>
              </div>
              <div className="hidden lg:block absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-slate-300"></div>
            </div>
          </PopUp>

          {/* Level 3: Sub Units */}
          <div className="relative w-full z-10">
            {/* Horizontal connecting line (only on lg+) */}
            <div className="hidden lg:block absolute top-0 left-[12.5%] right-[12.5%] h-[2px] bg-slate-300"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-0 lg:pt-8">
              {/* Unit 1 */}
              <PopUp delay={300}>
                <div className="relative flex flex-col items-center h-full">
                  <div className="hidden lg:block absolute -top-8 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-slate-300"></div>
                  <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-[#38BDF8] text-center w-full h-full relative z-10 hover:-translate-y-1 transition-transform">
                    <h5 className="font-bold text-[#0B2C4A] mb-4 text-sm">Layanan Pemustaka</h5>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2 text-slate-600 text-left">
                        <User className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                        <p className="text-xs font-medium leading-tight">Nur Praptiwi Mita Hapsari, S.I.Pust.</p>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600 text-left">
                        <User className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                        <p className="text-xs font-medium leading-tight">Mochamad Febriansyah, S.I.Pust.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </PopUp>

              {/* Unit 2 */}
              <PopUp delay={450}>
                <div className="relative flex flex-col items-center h-full">
                  <div className="hidden lg:block absolute -top-8 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-slate-300"></div>
                  <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-[#FBBF24] text-center w-full h-full relative z-10 hover:-translate-y-1 transition-transform">
                    <h5 className="font-bold text-[#0B2C4A] mb-4 text-sm">Layanan Teknis</h5>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2 text-slate-600 text-left">
                        <User className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                        <p className="text-xs font-medium leading-tight">Agoes Miswan, S.E.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </PopUp>

              {/* Unit 3 */}
              <PopUp delay={600}>
                <div className="relative flex flex-col items-center h-full">
                  <div className="hidden lg:block absolute -top-8 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-slate-300"></div>
                  <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-[#4ADE80] text-center w-full h-full relative z-10 hover:-translate-y-1 transition-transform">
                    <h5 className="font-bold text-[#0B2C4A] mb-4 text-sm">Teknologi Informasi dan Komunikasi</h5>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2 text-slate-600 text-left">
                        <User className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                        <p className="text-xs font-medium leading-tight">Yulandi, S.T.</p>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600 text-left">
                        <User className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                        <p className="text-xs font-medium leading-tight">Mochamad Febriansyah, S.I.Pust.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </PopUp>

              {/* Unit 4 */}
              <PopUp delay={750}>
                <div className="relative flex flex-col items-center h-full">
                  <div className="hidden lg:block absolute -top-8 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-slate-300"></div>
                  <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-[#C084FC] text-center w-full h-full relative z-10 hover:-translate-y-1 transition-transform">
                    <h5 className="font-bold text-[#0B2C4A] mb-4 text-sm">Tata Usaha & Humas</h5>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2 text-slate-600 text-left">
                        <User className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                        <p className="text-xs font-medium leading-tight">Irfan Herwandi, S.IP.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </PopUp>
            </div>
          </div>
        </div>
      </section>

      {/* FASILITAS SECTION */}
      <section className="w-full relative flex flex-col items-center py-4">
        <PopUp>
          <div className="text-center max-w-2xl mx-auto mb-2">
            <h2 className="text-3xl font-extrabold text-[#0B2C4A] mb-4">Fasilitas Perpustakaan</h2>
            <p className="text-slate-500 font-medium">Kenyamanan Anda adalah prioritas kami dalam menyediakan lingkungan belajar yang kondusif.</p>
          </div>
        </PopUp>

        <PopUp delay={150}>
          {/* MacBook Dock Style Container */}
          <div className="flex justify-center w-full px-2 overflow-x-auto pb-10 pt-16 hide-scrollbar">
            <div className="flex items-end justify-center gap-3 sm:gap-5 bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[2rem] px-6 sm:px-8 py-4 relative mx-auto w-max min-w-min">
              {/* Inner reflection */}
              <div className="absolute inset-0 rounded-[2rem] border border-white pointer-events-none"></div>

              {fasilitas.map((fas, idx) => {
                const Icon = fas.icon;
                return (
                  <div key={idx} className="relative group flex flex-col items-center shrink-0">
                    {/* Tooltip */}
                    <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20 flex flex-col items-center scale-95 group-hover:scale-100">
                      <div className="bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl whitespace-nowrap shadow-xl border border-slate-700">
                        {fas.name}
                      </div>
                      {/* Tooltip Arrow */}
                      <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-slate-800 -mt-[1px]"></div>
                    </div>

                    {/* Dock Icon */}
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 ${fas.bg} border-2 ${fas.borderColor} rounded-[1.2rem] flex items-center justify-center cursor-pointer shadow-sm origin-bottom hover:scale-[1.4] sm:hover:scale-[1.5] hover:mx-3 sm:hover:mx-5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:z-10 transition-all duration-300 ease-out ${fas.hoverBg}`}>
                      <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${fas.text} group-hover:text-white transition-colors duration-300`} />
                    </div>

                    {/* Active Dot (Mac style) */}
                    <div className="w-1 h-1 bg-slate-300 group-hover:bg-primary rounded-full absolute -bottom-2.5 transition-colors duration-300"></div>
                  </div>
                );
              })}
            </div>
          </div>
        </PopUp>
      </section>

      {/* GALERI KEGIATAN SECTION */}
      <section className="w-full relative overflow-hidden py-4">
        <PopUp>
          <h3 className="text-3xl font-extrabold text-[#0B2C4A] mb-10 text-center relative z-10">Galeri Kegiatan</h3>
        </PopUp>

        <PopUp delay={150}>
          <ImageCarousel />
        </PopUp>
      </section>

    </div>
  );
}
