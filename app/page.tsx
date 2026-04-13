"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase"; 
import { collection, query, limit, onSnapshot, doc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";

const ADMIN_EMAIL = "admin@optikaaliyah.com"; 

export default function LandingPage() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [heroImage, setHeroImage] = useState("https://i.ibb.co/30Z3D2c/sunglasses-png-transparent-picture-11535787682sz9qngolow.png");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(currentUser?.email === ADMIN_EMAIL);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "kacamata"), limit(3));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeaturedProducts(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "pengaturan", "beranda"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().url_foto_utama) {
        setHeroImage(docSnap.data().url_foto_utama);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Berhasil Login!");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Berhasil Mendaftar & Login!");
      }
      setShowAuthModal(false);
      setEmail(""); setPassword("");
      setIsMobileMenuOpen(false);
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    alert("Berhasil Logout");
    setIsMobileMenuOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans text-zinc-900 flex flex-col selection:bg-zinc-900 selection:text-white">
      
      {/* NAVBAR */}
      <nav className="w-full bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <Link href="/" className="font-black text-2xl tracking-tighter text-zinc-900 uppercase">
            Optik Aaliyah.
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <Link href="/" className="text-sm font-semibold tracking-wide text-zinc-500 hover:text-zinc-900 transition-colors uppercase">Beranda</Link>
            <Link href="/koleksi" className="text-sm font-semibold tracking-wide text-zinc-500 hover:text-zinc-900 transition-colors uppercase">Katalog</Link>
            {user ? (
              <div className="flex items-center gap-6">
                <span className="text-sm font-medium text-zinc-500">
                  {isAdmin ? <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-1 rounded-sm">ADMIN</span> : user.email}
                </span>
                <button onClick={handleLogout} className="text-sm font-bold text-zinc-500 hover:text-red-600 transition-colors uppercase">Keluar</button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="text-sm bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-none font-semibold uppercase tracking-wide transition-colors">
                Masuk / Daftar
              </button>
            )}
          </div>

          <button className="md:hidden text-zinc-900 p-2" onClick={() => setIsMobileMenuOpen(true)}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </nav>

      {/* SIDEBAR HP */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-72 h-full bg-white shadow-2xl flex flex-col p-8 animate-slide-in-right">
            <button className="self-end text-zinc-400 hover:text-zinc-900 mb-8" onClick={() => setIsMobileMenuOpen(false)}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="flex flex-col gap-8 text-xl font-bold tracking-tight">
              <Link href="/" className="text-zinc-900 hover:text-zinc-500" onClick={() => setIsMobileMenuOpen(false)}>BERANDA</Link>
              <Link href="/koleksi" className="text-zinc-900 hover:text-zinc-500" onClick={() => setIsMobileMenuOpen(false)}>KATALOG</Link>
              <div className="border-t border-zinc-200 pt-8 mt-4">
                {user ? (
                  <div className="flex flex-col gap-6">
                    <span className="text-sm font-medium text-zinc-500 block break-words">
                      Akun:<br/><span className="font-bold text-zinc-900 text-base">{isAdmin ? "Administrator" : user.email}</span>
                    </span>
                    <button onClick={handleLogout} className="border border-zinc-200 text-zinc-900 py-4 font-bold hover:bg-zinc-50 transition-colors uppercase text-sm">Keluar</button>
                  </div>
                ) : (
                  <button onClick={() => { setShowAuthModal(true); setIsMobileMenuOpen(false); }} className="bg-zinc-900 text-white py-4 font-bold hover:bg-zinc-800 transition-colors uppercase text-sm w-full">
                    Masuk / Daftar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KONTEN UTAMA */}
      <div className="flex-grow">
        
        {/* HERO SECTION */}
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 flex justify-center lg:justify-start bg-zinc-100 p-10 lg:p-20 relative group">
              <img src={heroImage} alt="Koleksi Kacamata" className="w-full max-w-lg object-contain relative z-10 transition-transform duration-700 group-hover:scale-105" style={{ mixBlendMode: 'darken' }} />
            </div>
            <div className="order-1 lg:order-2 text-center lg:text-left">
              <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-zinc-900 mb-8 leading-[1.1]">
                VISI BARU.<br />GAYA ABADI.
              </h1>
              <p className="text-lg lg:text-xl text-zinc-600 mb-10 leading-relaxed font-light max-w-xl mx-auto lg:mx-0">
                Koleksi *eyewear* premium yang dirancang untuk mendefinisikan ulang proporsi wajah dan menyempurnakan karakter personalmu.
              </p>
              <Link href="/koleksi" className="inline-block bg-zinc-900 text-white font-bold text-sm tracking-widest py-4 px-10 uppercase hover:bg-zinc-800 transition-colors">
                Lihat Koleksi
              </Link>
            </div>
          </div>
        </div>

        {/* KATALOG SECTION */}
        <div className="max-w-7xl mx-auto px-6 pb-24">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200 pb-6 gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-zinc-900 uppercase">Koleksi Terkini</h2>
              <p className="text-zinc-500 mt-2 font-medium">Kurasi bingkai pilihan bulan ini.</p>
            </div>
            <Link href="/koleksi" className="text-sm font-bold text-zinc-900 hover:text-zinc-500 uppercase tracking-wide border-b border-zinc-900 pb-1 inline-block w-max">
              Lihat Semua
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {featuredProducts.map((item) => (
              <div key={item.id} className="group cursor-pointer">
                <div className="bg-zinc-100 aspect-[4/3] overflow-hidden mb-6 relative">
                  <img src={item.gambar} alt={item.nama} className="w-full h-full object-cover mix-blend-darken transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="flex flex-col items-start mb-3">
                  <h3 className="text-lg font-bold text-zinc-900 tracking-tight uppercase leading-tight mb-1">{item.nama}</h3>
                  <p className="font-bold text-zinc-500 tracking-wider">Rp {item.harga.toLocaleString('id-ID')}</p>
                </div>
                <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed font-medium">{item.deskripsi}</p>
              </div>
            ))}
          </div>
        </div>

        {/* --- BAGIAN TENTANG PERUSAHAAN (MANIFESTO) --- */}
        <div className="bg-zinc-900 text-white py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
              
              {/* Kolom Kiri: Judul Besar */}
              <div className="lg:col-span-5">
                <h2 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-[0.9]">
                  Optik <br /> Aaliyah <br /> <span className="text-zinc-500"></span>
                </h2>
              </div>

              {/* Kolom Kanan: Deskripsi & Visi */}
              <div className="lg:col-span-7">
                <p className="text-xl lg:text-2xl font-light leading-relaxed mb-12 text-zinc-300">
                  Lahir di Sidoarjo dengan semangat untuk mengubah cara dunia melihat Anda. Kami percaya bahwa kacamata bukan sekadar alat bantu penglihatan, melainkan pernyataan gaya yang mendalam dan ekstensi dari jiwa penggunanya.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="border-t border-zinc-800 pt-8">
                    <h4 className="text-xs font-bold uppercase tracking-[0.3em] mb-4 text-white">Visi Kami</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Menjadi standar baru dalam kurasi *eyewear* yang menggabungkan kualitas material superior dengan desain yang tak lekang oleh waktu.
                    </p>
                  </div>
                  <div className="border-t border-zinc-800 pt-8">
                    <h4 className="text-xs font-bold uppercase tracking-[0.3em] mb-4 text-white">Filosofi</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Setiap frame yang kami hadirkan dipilih dengan presisi tinggi, memastikan keseimbangan antara kenyamanan maksimal dan estetika modern yang tajam.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-zinc-200 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
            <div className="max-w-sm">
              <h3 className="font-black text-2xl tracking-tighter text-zinc-900 uppercase mb-6">Optik Aaliyah.</h3>
              <p className="text-zinc-500 leading-relaxed text-sm font-medium">
                Mendefinisikan ulang gaya kacamata dengan kurasi frame premium berkualitas tinggi.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-12 md:gap-24">
              <div>
                <h4 className="font-bold text-zinc-900 uppercase tracking-widest text-xs mb-6">Tautan</h4>
                <ul className="space-y-4 text-sm font-medium">
                  <li><Link href="/" className="text-zinc-500 hover:text-zinc-900 transition-colors">Beranda</Link></li>
                  <li><Link href="/koleksi" className="text-zinc-500 hover:text-zinc-900 transition-colors">Katalog Koleksi</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 uppercase tracking-widest text-xs mb-6">Kontak</h4>
                <ul className="space-y-4 text-sm font-medium text-zinc-500">
                  <li>Sidoarjo, Jawa Timur</li>
                  <li>+62 812-3456-7890</li>
                  <li>halo@optikaaliyah.com</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-zinc-400 text-xs font-bold uppercase tracking-widest">
            <p>&copy; 2026 OPTIK AALIYAH.</p>
            <p>SIDOARJO, ID</p>
          </div>
        </div>
      </footer>

      {/* MODAL LOGIN */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}></div>
          <div className="bg-white p-10 w-full max-w-md relative shadow-2xl">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-black mb-8 text-zinc-900 tracking-tight uppercase">{isLoginMode ? "Masuk" : "Daftar Akun"}</h2>
            <form onSubmit={handleAuth} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-2 block">Email</label>
                <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full p-4 bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all rounded-none" required />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-2 block">Password</label>
                <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full p-4 bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all rounded-none" required minLength={6} />
              </div>
              <button type="submit" className="bg-zinc-900 text-white font-bold py-4 mt-4 uppercase tracking-widest text-sm hover:bg-zinc-800 transition-colors">{isLoginMode ? "Masuk Sekarang" : "Daftar Sekarang"}</button>
            </form>
            <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
              <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 uppercase tracking-widest transition-colors">
                {isLoginMode ? "Belum Punya Akun? Daftar" : "Sudah Punya Akun? Masuk"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}