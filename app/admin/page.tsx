"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase"; // Sesuaikan path jika file firebase.js kamu beda folder
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";

export default function AdminDashboard() {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  // 1. CEK LOGIN ADMIN (Email harus sesuai)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Ganti dengan email admin yang kamu pakai login
        if (user.email !== "admin@optikaaliyah.com" && user.email !== "admin@gmail.com") {
           alert("Anda bukan admin!");
           router.push("/");
        }
      } else {
        router.push("/?login=true"); // Lempar ke home kalau belum login sama sekali
      }
    });
    return () => unsub();
  }, [router]);

  // 2. AMBIL DATA ANALISA & PEMBELIAN (REAL-TIME)
  useEffect(() => {
    // Membaca koleksi "analyses"
    const q = query(collection(db, "analyses"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnalyses(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).then(() => router.push("/"));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* NAVBAR ADMIN */}
      <nav className="border-b border-zinc-200 bg-white px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-black text-xl tracking-tighter uppercase italic">OPTIK AALIYAH <span className="text-red-600">ADMIN</span></Link>
          <div className="hidden md:flex gap-4 ml-8">
            <Link href="/" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black">Beranda Web</Link>
            <Link href="/koleksi" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black">Kelola Katalog</Link>
          </div>
        </div>
        <button onClick={handleLogout} className="text-[10px] font-bold bg-black text-white px-4 py-2 uppercase tracking-widest hover:bg-red-600 transition-colors">Logout</button>
      </nav>

      {/* TABEL DATA */}
      <main className="p-8 max-w-7xl mx-auto w-full">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Analisa & Pembelian</h1>
          <p className="text-zinc-400 font-medium">Data hasil scan wajah AI dan histori pesanan customer.</p>
        </div>

        <div className="border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Customer</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Bentuk Wajah</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Rekomendasi AI</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Barang Dibeli</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center font-bold animate-pulse text-zinc-300">MEMUAT DATA...</td></tr>
              ) : analyses.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-zinc-400 italic">Belum ada data analisa yang masuk.</td></tr>
              ) : (
                analyses.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <td className="p-4 text-sm font-bold">{item.userEmail || "Guest"}</td>
                    <td className="p-4">
                       <span className="bg-black text-white px-2 py-1 text-[10px] font-bold uppercase tracking-tighter italic">{item.faceShape}</span>
                    </td>
                    <td className="p-4 text-sm text-zinc-600">{item.recommendedModel}</td>
                    <td className="p-4">
                      {item.purchasedItem ? (
                        <span className="text-green-600 font-black text-xs uppercase italic tracking-tighter">✓ {item.purchasedItem}</span>
                      ) : (
                        <span className="text-zinc-300 text-xs italic tracking-tighter">Hanya Scan</span>
                      )}
                    </td>
                    <td className="p-4 text-[10px] font-medium text-zinc-400 uppercase">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}