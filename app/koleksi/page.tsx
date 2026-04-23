"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { db, auth } from "../../lib/firebase";
import { collection, addDoc, deleteDoc, doc, updateDoc, setDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";

const ADMIN_EMAIL = "admin@optikaaliyah.com";

export default function KoleksiPage() {
  const [products, setProducts]       = useState<any[]>([]);
  const [user, setUser]               = useState<User | null>(null);
  const [isAdmin, setIsAdmin]         = useState(false);
  const [showAuthModal, setShowAuth]  = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [newName, setNewName]         = useState("");
  const [newPrice, setNewPrice]       = useState("");
  const [newDesc, setNewDesc]         = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [isEditOpen, setIsEditOpen]   = useState(false);
  const [editingId, setEditingId]     = useState("");
  const [editName, setEditName]       = useState("");
  const [editPrice, setEditPrice]     = useState("");
  const [editDesc, setEditDesc]       = useState("");
  const [editImg, setEditImg]         = useState("");
  const [heroBase64, setHeroBase64]   = useState("");
  const [searchQuery, setSearch]      = useState("");
  const [toastMsg, setToastMsg]       = useState("");
  const [activeFilter, setFilter]     = useState("Semua");
  const [scrollY, setScrollY]         = useState(0);
  const [vis, setVis]                 = useState(false);
  const curRef                        = useRef(0);
  const rafRef                        = useRef<number>(0);
  const gridRef                       = useRef<HTMLDivElement>(null);

  const waNumber = "6282264774367";
  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = () => { curRef.current = lerp(curRef.current, window.scrollY, 0.08); setScrollY(curRef.current); rafRef.current = requestAnimationFrame(tick); };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.06 });
    if (gridRef.current) obs.observe(gridRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => { const u = onAuthStateChanged(auth, (cu) => { setUser(cu); setIsAdmin(cu?.email === ADMIN_EMAIL); }); return u; }, []);
  useEffect(() => { const q = query(collection(db, "kacamata"), orderBy("nama", "asc")); return onSnapshot(q, (s) => setProducts(s.docs.map((d) => ({ id: d.id, ...d.data() })))); }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("login") === "true") setShowAuth(true);
    }
  }, []);

  const handleFileToBase64 = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) { showToast("GAGAL: Ukuran foto maksimal 800 KB!"); e.target.value = ""; return; }
    const r = new FileReader(); r.onloadend = () => setter(r.result as string); r.readAsDataURL(file);
  };

  const handleUpdateHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroBase64) return;
    try { await setDoc(doc(db, "pengaturan", "beranda"), { url_foto_utama: heroBase64 }, { merge: true }); showToast("FOTO BERANDA DIPERBARUI"); setHeroBase64(""); (document.getElementById("hero-upload") as HTMLInputElement).value = ""; }
    catch { showToast("GAGAL MENGUBAH FOTO"); }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice || !newDesc || !imageBase64) return;
    try { await addDoc(collection(db, "kacamata"), { nama: newName, harga: Number(newPrice), deskripsi: newDesc, gambar: imageBase64 }); showToast("PRODUK DITAMBAHKAN"); setNewName(""); setNewPrice(""); setNewDesc(""); setImageBase64(""); (document.getElementById("product-upload") as HTMLInputElement).value = ""; }
    catch { showToast("GAGAL MENAMBAHKAN"); }
  };

  const openEdit = (item: any) => { setEditingId(item.id); setEditName(item.nama); setEditPrice(item.harga.toString()); setEditDesc(item.deskripsi); setEditImg(item.gambar); setIsEditOpen(true); };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await updateDoc(doc(db, "kacamata", editingId), { nama: editName, harga: Number(editPrice), deskripsi: editDesc, gambar: editImg }); setIsEditOpen(false); showToast("REVISI DISIMPAN"); }
    catch { showToast("GAGAL MENYIMPAN"); }
  };

  const handleDelete = async (id: string) => { if (confirm("Hapus item ini secara permanen?")) { await deleteDoc(doc(db, "kacamata", id)); showToast("PRODUK DIHAPUS"); } };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLoginMode) { await signInWithEmailAndPassword(auth, email, password); showToast("BERHASIL MASUK"); }
      else { await createUserWithEmailAndPassword(auth, email, password); showToast("AKUN DIBUAT"); }
      setShowAuth(false); setEmail(""); setPassword("");
    } catch (err: any) { showToast("GAGAL: " + err.message); }
  };

  const handleLogout = async () => { await signOut(auth); showToast("BERHASIL KELUAR"); };

  const buyViaWhatsApp = (nama: string) => {
    if (!user) { showToast("SILAKAN MASUK DAHULU"); setShowAuth(true); return; }
    const text = `Halo Optik Aaliyah, saya tertarik dengan koleksi: *${nama}*.`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const FILTERS = ["Semua", "Square", "Round", "Aviator", "Oval"];
  const filtered = products.filter(p => {
    const ms = p.nama.toLowerCase().includes(searchQuery.toLowerCase());
    const mf = activeFilter === "Semua" || p.nama.toLowerCase().includes(activeFilter.toLowerCase()) || p.deskripsi?.toLowerCase().includes(activeFilter.toLowerCase());
    return ms && mf;
  });

  const navScrolled = scrollY > 40;
  const heroOpacity = Math.max(0, 1 - scrollY / 380);
  const heroBgY     = scrollY * 0.3;

  return (
    <main style={{ background:"#f7f3ee", color:"#1a1410", fontFamily:"'Cormorant Garamond','Georgia',serif", minHeight:"100vh", overflowX:"hidden" }}>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-track{background:#f7f3ee}::-webkit-scrollbar-thumb{background:#b09878}
        ::selection{background:#1a1410;color:#f7f3ee}

        @keyframes fadeInUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes heroLine{from{transform:translateY(110%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes dotPulse{0%,100%{box-shadow:0 0 0 0 rgba(176,152,120,.5)}50%{box-shadow:0 0 0 10px rgba(176,152,120,0)}}
        @keyframes spinAnim{to{transform:rotate(360deg)}}
        @keyframes scanAnim{0%{top:0;opacity:0}8%{opacity:1}92%{opacity:1}100%{top:100%;opacity:0}}

        .h-line{overflow:hidden;display:block;line-height:1.05}
        .h-line-inner{display:block;animation:heroLine 1s cubic-bezier(.16,1,.3,1) both;opacity:0}
        .l0{animation-delay:.08s}.l1{animation-delay:.24s}.l2{animation-delay:.4s}

        .reveal{opacity:0;transform:translateY(32px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1)}
        .reveal.in{opacity:1;transform:translateY(0)}
        .d1{transition-delay:.05s}.d2{transition-delay:.14s}.d3{transition-delay:.23s}.d4{transition-delay:.32s}.d5{transition-delay:.44s}.d6{transition-delay:.56s}

        .nav-a{position:relative;font-family:'Jost',sans-serif;font-size:11px;font-weight:400;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;color:rgba(26,20,16,.45);transition:color .3s;background:none;border:none;cursor:pointer}
        .nav-a::after{content:'';position:absolute;bottom:-3px;left:0;width:0;height:1px;background:#8a6a44;transition:width .3s}
        .nav-a:hover{color:#8a6a44}.nav-a:hover::after{width:100%}

        .eyebrow{font-family:'Jost',sans-serif;font-size:10px;font-weight:400;letter-spacing:.45em;text-transform:uppercase;color:#b09878;display:flex;align-items:center;gap:14px}
        .eyebrow::before{content:'';width:28px;height:1px;background:#b09878;flex-shrink:0}

        .btn-dark{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#1a1410;color:#f7f3ee;font-family:'Jost',sans-serif;font-size:11px;font-weight:500;letter-spacing:.3em;text-transform:uppercase;border:none;padding:14px 32px;cursor:pointer;transition:background .3s,transform .2s;width:100%}
        .btn-dark:hover{background:#2e251e;transform:translateY(-1px)}
        .btn-dark:disabled{background:#c5bdb4;cursor:not-allowed;transform:none}

        .btn-outline{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:transparent;color:#1a1410;font-family:'Jost',sans-serif;font-size:11px;font-weight:400;letter-spacing:.3em;text-transform:uppercase;border:1px solid rgba(26,20,16,.25);padding:13px 28px;cursor:pointer;transition:all .3s;width:100%}
        .btn-outline:hover{background:#1a1410;color:#f7f3ee}

        .btn-edit-sm{display:inline-flex;align-items:center;justify-content:center;font-family:'Jost',sans-serif;font-size:10px;font-weight:400;letter-spacing:.25em;text-transform:uppercase;border:1px solid rgba(26,20,16,.15);padding:11px;cursor:pointer;background:transparent;color:rgba(26,20,16,.55);transition:all .3s;width:100%}
        .btn-edit-sm:hover{background:#1a1410;color:#f7f3ee;border-color:#1a1410}

        .btn-del-sm{display:inline-flex;align-items:center;justify-content:center;font-family:'Jost',sans-serif;font-size:10px;font-weight:400;letter-spacing:.25em;text-transform:uppercase;border:1px solid rgba(185,28,28,.2);padding:11px;cursor:pointer;background:rgba(185,28,28,.04);color:rgba(185,28,28,.6);transition:all .3s;width:100%}
        .btn-del-sm:hover{background:rgba(185,28,28,.08);border-color:rgba(185,28,28,.4);color:#dc2626}

        .filter-btn{font-family:'Jost',sans-serif;font-size:10px;font-weight:400;letter-spacing:.3em;text-transform:uppercase;background:transparent;border:1px solid rgba(26,20,16,.15);color:rgba(26,20,16,.4);padding:8px 18px;cursor:pointer;transition:all .3s}
        .filter-btn:hover{border-color:rgba(26,20,16,.3);color:rgba(26,20,16,.7)}
        .filter-btn.active{background:#1a1410;border-color:#1a1410;color:#f7f3ee}

        .prod-card{transition:transform .5s cubic-bezier(.16,1,.3,1),box-shadow .4s;border:1px solid rgba(26,20,16,.08);background:#fff}
        .prod-card:hover{transform:translateY(-8px);box-shadow:0 20px 48px rgba(26,20,16,.1)}
        .prod-card:hover .prod-img-inner{transform:scale(1.05)}
        .prod-img-inner{transition:transform .6s cubic-bezier(.16,1,.3,1)}

        .admin-input{width:100%;padding:11px 14px;background:#fff;border:1px solid rgba(26,20,16,.15);color:#1a1410;font-family:'Jost',sans-serif;font-size:13px;font-weight:300;outline:none;transition:border-color .3s}
        .admin-input:focus{border-color:#8a6a44}
        .admin-input::placeholder{color:rgba(26,20,16,.25)}
        .admin-label{font-family:'Jost',sans-serif;font-size:9px;font-weight:500;letter-spacing:.4em;text-transform:uppercase;color:rgba(26,20,16,.4);display:block;margin-bottom:8px}

        .search-input{font-family:'Jost',sans-serif;font-size:12px;font-weight:300;letter-spacing:.08em;background:transparent;border:none;border-bottom:1px solid rgba(26,20,16,.2);color:#1a1410;padding:8px 8px 8px 30px;outline:none;width:220px;transition:border-color .3s}
        .search-input:focus{border-bottom-color:#8a6a44}
        .search-input::placeholder{color:rgba(26,20,16,.28)}

        .sep{height:1px;background:linear-gradient(to right,transparent,rgba(26,20,16,.12),transparent)}
        .ornament{position:absolute;pointer-events:none}
        .bg-ghost{position:absolute;pointer-events:none;user-select:none;font-family:'Cormorant Garamond',serif;font-weight:700;line-height:1;color:transparent;-webkit-text-stroke:1px rgba(26,20,16,.04);white-space:nowrap}
        .grain{position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:.02;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")}

        .modal-overlay{position:fixed;inset:0;background:rgba(26,20,16,.45);backdrop-filter:blur(10px);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px}
        .modal-box{background:#faf7f2;border:1px solid rgba(26,20,16,.1);width:100%;position:relative;animation:fadeInUp .35s ease;padding:48px;max-height:90vh;overflow-y:auto;box-shadow:0 32px 80px rgba(26,20,16,.12)}
        .modal-box::-webkit-scrollbar{width:2px}.modal-box::-webkit-scrollbar-thumb{background:#b09878}
        .admin-panel{background:#fff;border:1px solid rgba(26,20,16,.1);padding:36px;position:relative;box-shadow:0 4px 20px rgba(26,20,16,.05)}
        .admin-panel-label{position:absolute;top:-1px;left:28px;background:#1a1410;color:#f7f3ee;font-family:'Jost',sans-serif;font-size:8px;font-weight:600;letter-spacing:.3em;padding:4px 12px;text-transform:uppercase}

        .dot-pulse{animation:dotPulse 2s infinite}
      `}} />

      <div className="grain" />

      {/* Toast */}
      {toastMsg && (
        <div style={{ position:"fixed",bottom:28,right:28,zIndex:300,background:"#1a1410",color:"#f7f3ee",padding:"12px 24px",fontFamily:"'Jost',sans-serif",fontSize:11,fontWeight:500,letterSpacing:".25em",textTransform:"uppercase",animation:"fadeInUp .3s ease",display:"flex",alignItems:"center",gap:10,boxShadow:"0 8px 32px rgba(26,20,16,.2)" }}>
          <div className="dot-pulse" style={{ width:6,height:6,borderRadius:"50%",background:"#b09878" }}/>
          {toastMsg}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════════════════ */}
      <nav style={{ position:"fixed",top:0,left:0,right:0,zIndex:100,padding:navScrolled?"15px 48px":"26px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",background:navScrolled?"rgba(247,243,238,.96)":"transparent",backdropFilter:navScrolled?"blur(16px)":"none",borderBottom:navScrolled?"1px solid rgba(26,20,16,.08)":"1px solid transparent",transition:"all .5s cubic-bezier(.16,1,.3,1)" }}>
        <div style={{ display:"flex",gap:36,alignItems:"center" }}>
          <Link href="/" className="nav-a">Beranda</Link>
          <Link href="/koleksi" className="nav-a" style={{ color:"#8a6a44" }}>Katalog</Link>
        </div>

        <Link href="/" style={{ textDecoration:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
          <svg width="30" height="15" viewBox="0 0 30 15" fill="none">
            <rect x=".5" y=".5" width="12" height="14" rx="6" stroke="#8a6a44" strokeWidth="1"/>
            <rect x="17.5" y=".5" width="12" height="14" rx="6" stroke="#8a6a44" strokeWidth="1"/>
            <line x1="12" y1="7.5" x2="18" y2="7.5" stroke="#8a6a44" strokeWidth="1"/>
          </svg>
          <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600,letterSpacing:".18em",color:"#1a1410",textTransform:"uppercase" }}>Optik Aaliyah</span>
        </Link>

        <div style={{ display:"flex",gap:36,alignItems:"center" }}>
          {user ? (
            <>
              <span className="nav-a" style={{ cursor:"default",color:"#b09878" }}>{isAdmin?"Admin":user.email?.split("@")[0]}</span>
              <button onClick={handleLogout} className="nav-a">Keluar</button>
            </>
          ) : (
            <>
              <button onClick={() => setShowAuth(true)} className="nav-a">Masuk</button>
              <button onClick={() => { setIsLoginMode(false); setShowAuth(true); }} className="nav-a">Daftar</button>
            </>
          )}
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          HERO HEADER
      ══════════════════════════════════════════════════════════ */}
      <section style={{ position:"relative",minHeight:"52vh",display:"flex",alignItems:"flex-end",overflow:"hidden",paddingBottom:72,background:"#f0ebe3" }}>
        <div style={{ position:"absolute",inset:"-10%",backgroundImage:"url('https://images.unsplash.com/photo-1509695507497-903c140c43b0?q=80&w=2073')",backgroundSize:"cover",backgroundPosition:"center 30%",transform:`translateY(${heroBgY}px)`,opacity:.08,filter:"sepia(1)",transition:"none" }}/>
        <div style={{ position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(240,235,227,.5) 0%,rgba(240,235,227,.98) 100%)" }}/>

        {/* Ornament left */}
        <svg className="ornament" style={{ left:"-20px",top:"15%",width:220,opacity:.1,transform:`translateY(${scrollY*.07}px)` }} viewBox="0 0 220 130" fill="none">
          <rect x="2" y="2" width="84" height="68" rx="34" stroke="#8a6a44" strokeWidth="1.1"/>
          <rect x="134" y="2" width="84" height="68" rx="34" stroke="#8a6a44" strokeWidth="1.1"/>
          <line x1="86" y1="36" x2="134" y2="36" stroke="#8a6a44" strokeWidth="1.1"/>
          <line x1="2" y1="36" x2="-24" y2="58" stroke="#8a6a44" strokeWidth="1"/>
          <line x1="218" y1="36" x2="242" y2="58" stroke="#8a6a44" strokeWidth="1"/>
        </svg>

        {/* Ornament right */}
        <svg className="ornament" style={{ right:"4%",top:"10%",width:150,opacity:.09,transform:`translateY(${scrollY*-.05}px)` }} viewBox="0 0 150 150" fill="none">
          <circle cx="75" cy="75" r="65" stroke="#8a6a44" strokeWidth="1" fill="none"/>
          <circle cx="75" cy="75" r="45" stroke="#8a6a44" strokeWidth=".5" fill="none" strokeDasharray="3 6"/>
          <circle cx="75" cy="75" r="3" fill="#8a6a44"/>
          <line x1="75" y1="10" x2="75" y2="30" stroke="#8a6a44" strokeWidth=".8"/>
          <line x1="75" y1="120" x2="75" y2="140" stroke="#8a6a44" strokeWidth=".8"/>
          <line x1="10" y1="75" x2="30" y2="75" stroke="#8a6a44" strokeWidth=".8"/>
          <line x1="120" y1="75" x2="140" y2="75" stroke="#8a6a44" strokeWidth=".8"/>
        </svg>

        <div style={{ position:"relative",zIndex:10,maxWidth:1160,margin:"0 auto",padding:"0 48px",width:"100%",opacity:heroOpacity,transition:"none" }}>
          <p className="eyebrow" style={{ marginBottom:24,animation:"fadeInUp .8s .05s both" }}>
            {isAdmin ? "Panel Manajemen" : "Koleksi Eksklusif"}
          </p>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(48px,7vw,88px)",fontWeight:300,lineHeight:.92,letterSpacing:"-.02em",marginBottom:20 }}>
            <span className="h-line"><span className="h-line-inner l0" style={{ color:"#1a1410" }}>{isAdmin ? "Dashboard" : "Katalog"}</span></span>
            <span className="h-line"><span className="h-line-inner l1" style={{ color:"#8a6a44",fontStyle:"italic" }}>{isAdmin ? "Manajemen." : "Frame"}</span></span>
            {!isAdmin && <span className="h-line"><span className="h-line-inner l2" style={{ color:"#1a1410" }}>Premium.</span></span>}
          </h1>
          <p style={{ fontFamily:"'Jost',sans-serif",fontSize:14,fontWeight:300,color:"rgba(26,20,16,.45)",maxWidth:480,marginTop:18,lineHeight:1.8,animation:"fadeInUp .9s .55s both" }}>
            {isAdmin ? "Kelola inventaris dan tampilan website Optik Aaliyah secara real-time." : "Eksplorasi koleksi frame yang menyempurnakan proporsi wajah dan merepresentasikan karakter personalmu."}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TOOLBAR — search + filter
      ══════════════════════════════════════════════════════════ */}
      <div style={{ borderTop:"1px solid rgba(26,20,16,.08)",borderBottom:"1px solid rgba(26,20,16,.08)",background:"rgba(247,243,238,.97)",backdropFilter:"blur(12px)",padding:"18px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:24,flexWrap:"wrap",position:"sticky",top:navScrolled ? 56 : 72,zIndex:50,transition:"top .5s" }}>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`filter-btn${activeFilter===f?" active":""}`}>{f}</button>
          ))}
        </div>
        <div style={{ position:"relative" }}>
          <svg style={{ position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:15,height:15,color:"rgba(26,20,16,.35)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" placeholder="Cari koleksi..." value={searchQuery} onChange={e => setSearch(e.target.value)} className="search-input"/>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          ADMIN PANELS
      ══════════════════════════════════════════════════════════ */}
      {isAdmin && (
        <div style={{ maxWidth:1160,margin:"0 auto",padding:"56px 48px 0",display:"grid",gridTemplateColumns:"1fr 2fr",gap:28 }}>
          {/* Hero image update */}
          <div className="admin-panel">
            <div className="admin-panel-label">Foto Beranda</div>
            <p style={{ fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:300,color:"rgba(26,20,16,.4)",lineHeight:1.7,marginBottom:22 }}>Upload PNG transparan untuk tampil di halaman utama.</p>
            <form onSubmit={handleUpdateHero} style={{ display:"flex",flexDirection:"column",gap:16 }}>
              <div>
                <label className="admin-label">File Gambar (Maks 800KB)</label>
                <input type="file" id="hero-upload" accept="image/*" onChange={e => handleFileToBase64(e, setHeroBase64)} style={{ fontFamily:"'Jost',sans-serif",fontSize:11,color:"rgba(26,20,16,.45)",width:"100%" }} required/>
              </div>
              <button type="submit" className="btn-dark">Update Foto</button>
            </form>
          </div>

          {/* Add product */}
          <div className="admin-panel">
            <div className="admin-panel-label">Tambah Produk</div>
            <form onSubmit={handleAddProduct} style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18 }}>
              <div>
                <label className="admin-label">Nama Frame</label>
                <input className="admin-input" type="text" placeholder="Moscot Lemtosh" value={newName} onChange={e => setNewName(e.target.value)} required
                  onFocus={e => (e.currentTarget.style.borderColor="#8a6a44")}
                  onBlur={e => (e.currentTarget.style.borderColor="rgba(26,20,16,.15)")}/>
              </div>
              <div>
                <label className="admin-label">Harga (IDR)</label>
                <input className="admin-input" type="number" placeholder="450000" value={newPrice} onChange={e => setNewPrice(e.target.value)} required
                  onFocus={e => (e.currentTarget.style.borderColor="#8a6a44")}
                  onBlur={e => (e.currentTarget.style.borderColor="rgba(26,20,16,.15)")}/>
              </div>
              <div style={{ gridColumn:"span 2" }}>
                <label className="admin-label">Deskripsi</label>
                <input className="admin-input" type="text" placeholder="Material asetat premium dengan siluet klasik..." value={newDesc} onChange={e => setNewDesc(e.target.value)} required
                  onFocus={e => (e.currentTarget.style.borderColor="#8a6a44")}
                  onBlur={e => (e.currentTarget.style.borderColor="rgba(26,20,16,.15)")}/>
              </div>
              <div style={{ gridColumn:"span 2",display:"grid",gridTemplateColumns:"1fr auto",gap:16,alignItems:"flex-end" }}>
                <div>
                  <label className="admin-label">Foto Produk (Maks 800KB)</label>
                  <input type="file" id="product-upload" accept="image/*" onChange={e => handleFileToBase64(e, setImageBase64)} style={{ fontFamily:"'Jost',sans-serif",fontSize:11,color:"rgba(26,20,16,.45)",width:"100%" }} required/>
                </div>
                <button type="submit" className="btn-dark" style={{ width:"auto",padding:"13px 28px",whiteSpace:"nowrap" }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PRODUCT GRID
      ══════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth:1160,margin:"0 auto",padding:"56px 48px 112px" }} ref={gridRef}>

        {/* Count bar */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:44,paddingBottom:22,borderBottom:"1px solid rgba(26,20,16,.1)" }}>
          <p style={{ fontFamily:"'Jost',sans-serif",fontSize:11,letterSpacing:".35em",textTransform:"uppercase",color:"rgba(26,20,16,.35)" }}>
            {filtered.length} <span style={{ color:"#b09878" }}>Frame</span> Ditemukan
          </p>
          {searchQuery && (
            <button onClick={() => setSearch("")} style={{ fontFamily:"'Jost',sans-serif",fontSize:10,letterSpacing:".3em",textTransform:"uppercase",color:"rgba(26,20,16,.3)",background:"none",border:"none",cursor:"pointer",transition:"color .3s" }}
              onMouseEnter={e => (e.currentTarget.style.color="#8a6a44")}
              onMouseLeave={e => (e.currentTarget.style.color="rgba(26,20,16,.3)")}
            >Hapus Filter ×</button>
          )}
        </div>

        {/* Cards */}
        {filtered.length > 0 ? (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"36px 24px" }}>
            {filtered.map((item, i) => (
              <div key={item.id} className={`prod-card reveal d${(i%6)+1} ${vis?"in":""}`} style={{ display:"flex",flexDirection:"column",cursor:"default" }}>

                {/* Image */}
                <div style={{ background:"#e8e0d4",overflow:"hidden",aspectRatio:"4/3",position:"relative",flexShrink:0 }}>
                  <img src={item.gambar} alt={item.nama} className="prod-img-inner" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block",mixBlendMode:"multiply" }}/>
                  {/* hover shine */}
                  <div style={{ position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(255,255,255,.1) 0%,transparent 60%)",pointerEvents:"none" }}/>
                </div>

                {/* Info */}
                <div style={{ padding:"20px 22px 22px",display:"flex",flexDirection:"column",flexGrow:1,borderLeft:"1px solid rgba(26,20,16,.08)",borderRight:"1px solid rgba(26,20,16,.08)",borderBottom:"1px solid rgba(26,20,16,.08)" }}>
                  <div style={{ fontFamily:"'Jost',sans-serif",fontSize:9,letterSpacing:".4em",textTransform:"uppercase",color:"#b09878",marginBottom:7 }}>Optik Aaliyah</div>
                  <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:400,color:"#1a1410",marginBottom:4,lineHeight:1.1 }}>{item.nama}</h3>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontStyle:"italic",color:"#8a6a44",marginBottom:10 }}>
                    Rp {item.harga?.toLocaleString("id-ID")}
                  </p>
                  <p style={{ fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:300,color:"rgba(26,20,16,.42)",lineHeight:1.75,marginBottom:18,flexGrow:1,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>
                    {item.deskripsi}
                  </p>

                  {isAdmin ? (
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,borderTop:"1px solid rgba(26,20,16,.08)",paddingTop:14,marginTop:"auto" }}>
                      <button onClick={() => openEdit(item)} className="btn-edit-sm">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="btn-del-sm">Hapus</button>
                    </div>
                  ) : (
                    <button onClick={() => buyViaWhatsApp(item.nama)} className="btn-dark" style={{ marginTop:"auto" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink:0 }}>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M5.507 21.5c1.988 1.093 4.253 1.724 6.683 1.694 7.133-.09 12.882-5.904 12.812-13.037-.07-7.123-5.932-12.861-13.055-12.791C4.823-2.564-1.017 3.37 1.069 10.54c.464 1.615 1.302 3.09 2.438 4.316L2.076 20.5l3.431 1z" fillRule="evenodd"/>
                      </svg>
                      Pesan via WhatsApp
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign:"center",padding:"80px 24px",border:"1px solid rgba(26,20,16,.1)",background:"#fff" }}>
            <svg style={{ width:44,height:44,margin:"0 auto 18px",opacity:.18 }} fill="none" stroke="#8a6a44" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:300,color:"rgba(26,20,16,.5)",marginBottom:8 }}>Koleksi Tidak Ditemukan</p>
            <p style={{ fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:300,color:"rgba(26,20,16,.3)",letterSpacing:".1em" }}>Coba gunakan kata kunci yang berbeda</p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer style={{ background:"#1a1410",borderTop:"1px solid rgba(26,20,16,.2)",padding:"68px 48px 36px" }}>
        <div style={{ maxWidth:1160,margin:"0 auto" }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:56,marginBottom:48,paddingBottom:44,borderBottom:"1px solid rgba(247,243,238,.1)" }}>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:300,letterSpacing:".05em",color:"#f7f3ee",marginBottom:5 }}>
                Optik <span style={{ color:"#b09878",fontStyle:"italic" }}>Aaliyah.</span>
              </div>
              <p style={{ fontFamily:"'Jost',sans-serif",fontSize:11,letterSpacing:".25em",textTransform:"uppercase",color:"rgba(247,243,238,.22)",marginBottom:28 }}>Eyewear Premium · Sidoarjo, ID</p>
              <p style={{ fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:300,color:"rgba(247,243,238,.28)",lineHeight:1.8,maxWidth:300 }}>Mendefinisikan ulang gaya kacamata dengan kurasi frame premium berkualitas tinggi.</p>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20 }}>
              {[{ h:"Navigasi",l:["Beranda","Katalog","AI Try-On"] },{ h:"Info",l:["Tentang Kami","Panduan Frame","Perawatan"] },{ h:"Kontak",l:["Puri Indah Df 19","Sidoarjo, Jawa Timur","+62 822-6477-4367"] }].map(g => (
                <div key={g.h}>
                  <div style={{ fontFamily:"'Jost',sans-serif",fontSize:9,fontWeight:500,letterSpacing:".4em",textTransform:"uppercase",color:"rgba(176,152,120,.55)",marginBottom:18 }}>{g.h}</div>
                  <ul style={{ listStyle:"none",display:"flex",flexDirection:"column",gap:10 }}>
                    {g.l.map(li => (
                      <li key={li} style={{ fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:300,color:"rgba(247,243,238,.26)",cursor:"pointer",transition:"color .25s" }}
                        onMouseEnter={e => (e.currentTarget.style.color="#b09878")}
                        onMouseLeave={e => (e.currentTarget.style.color="rgba(247,243,238,.26)")}
                      >{li}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:36,overflow:"hidden",border:"1px solid rgba(247,243,238,.08)" }}>
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3956.102594091213!2d112.6823516760512!3d-7.453901273464231!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7e591ba40e1f9%3A0x1ee871e6ac517c61!2sOptik%20Aaliyah!5e0!3m2!1sid!2sid!4v1776056666993!5m2!1sid!2sid"
              width="100%" height="190" style={{ border:0,display:"block",filter:"grayscale(1) brightness(.7)" }}
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <p style={{ fontFamily:"'Jost',sans-serif",fontSize:10,letterSpacing:".25em",textTransform:"uppercase",color:"rgba(247,243,238,.16)" }}>© 2026 Optik Aaliyah. All rights reserved.</p>
            <div style={{ display:"flex",alignItems:"center",gap:8,fontFamily:"'Jost',sans-serif",fontSize:10,letterSpacing:".25em",textTransform:"uppercase",color:"rgba(176,152,120,.38)" }}>
              <div className="dot" style={{ width:5,height:5,borderRadius:"50%",background:"#b09878" }}/>
              Sidoarjo, ID
            </div>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════
          MODAL: AUTH
      ══════════════════════════════════════════════════════════ */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuth(false)}>
          <div className="modal-box" style={{ maxWidth:440 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAuth(false)} style={{ position:"absolute",top:18,right:18,background:"transparent",border:"none",cursor:"pointer",color:"rgba(26,20,16,.3)" }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <p className="eyebrow" style={{ marginBottom:14,fontSize:9 }}>{isLoginMode?"Masuk Akun":"Buat Akun Baru"}</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:300,color:"#1a1410",marginBottom:36,lineHeight:1.08 }}>
              {isLoginMode ? <><span>Selamat</span><br/><em style={{ fontStyle:"italic",color:"#8a6a44" }}>Datang Kembali.</em></> : <><span>Bergabung</span><br/><em style={{ fontStyle:"italic",color:"#8a6a44" }}>Bersama Kami.</em></>}
            </h2>
            <form onSubmit={handleAuth} style={{ display:"flex",flexDirection:"column",gap:18 }}>
              {[{ l:"Email",t:"email",v:email,s:setEmail },{ l:"Password",t:"password",v:password,s:setPassword }].map(f => (
                <div key={f.l}>
                  <label className="admin-label">{f.l}</label>
                  <input type={f.t} value={f.v} onChange={e => f.s(e.target.value)} required minLength={f.t==="password"?6:undefined} className="admin-input"
                    onFocus={e => (e.currentTarget.style.borderColor="#8a6a44")}
                    onBlur={e => (e.currentTarget.style.borderColor="rgba(26,20,16,.15)")}/>
                </div>
              ))}
              <button type="submit" className="btn-dark" style={{ marginTop:6 }}>{isLoginMode?"Masuk Sekarang":"Daftar Sekarang"}</button>
            </form>
            <div style={{ marginTop:22,paddingTop:18,borderTop:"1px solid rgba(26,20,16,.08)",textAlign:"center" }}>
              <button onClick={() => setIsLoginMode(!isLoginMode)} style={{ background:"none",border:"none",cursor:"pointer",fontFamily:"'Jost',sans-serif",fontSize:10,fontWeight:400,letterSpacing:".3em",textTransform:"uppercase",color:"rgba(26,20,16,.3)",transition:"color .3s" }}
                onMouseEnter={e => (e.currentTarget.style.color="#8a6a44")}
                onMouseLeave={e => (e.currentTarget.style.color="rgba(26,20,16,.3)")}
              >{isLoginMode?"Belum punya akun? Daftar →":"Sudah punya akun? Masuk →"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: EDIT PRODUK
      ══════════════════════════════════════════════════════════ */}
      {isEditOpen && (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal-box" style={{ maxWidth:500 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsEditOpen(false)} style={{ position:"absolute",top:18,right:18,background:"transparent",border:"none",cursor:"pointer",color:"rgba(26,20,16,.3)" }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <p className="eyebrow" style={{ marginBottom:14,fontSize:9 }}>Admin Panel</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:300,color:"#1a1410",marginBottom:34,lineHeight:1.08 }}>
              Revisi<br/><em style={{ fontStyle:"italic",color:"#8a6a44" }}>Data Produk.</em>
            </h2>
            <form onSubmit={handleUpdateProduct} style={{ display:"flex",flexDirection:"column",gap:18 }}>
              {[{ l:"Nama Frame",t:"text",v:editName,s:setEditName },{ l:"Harga (IDR)",t:"number",v:editPrice,s:setEditPrice }].map(f => (
                <div key={f.l}>
                  <label className="admin-label">{f.l}</label>
                  <input type={f.t} value={f.v} onChange={e => f.s(e.target.value)} required className="admin-input"
                    onFocus={e => (e.currentTarget.style.borderColor="#8a6a44")}
                    onBlur={e => (e.currentTarget.style.borderColor="rgba(26,20,16,.15)")}/>
                </div>
              ))}
              <div>
                <label className="admin-label">Deskripsi</label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} required
                  style={{ width:"100%",padding:"11px 14px",background:"#fff",border:"1px solid rgba(26,20,16,.15)",color:"#1a1410",fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:300,outline:"none",transition:"border-color .3s",resize:"none",height:90 }}
                  onFocus={e => (e.currentTarget.style.borderColor="#8a6a44")}
                  onBlur={e => (e.currentTarget.style.borderColor="rgba(26,20,16,.15)")}/>
              </div>
              <div>
                <label className="admin-label">Ganti Foto (Opsional)</label>
                <input type="file" accept="image/*" onChange={e => handleFileToBase64(e, setEditImg)}
                  style={{ fontFamily:"'Jost',sans-serif",fontSize:11,color:"rgba(26,20,16,.45)",width:"100%" }}/>
              </div>
              <button type="submit" className="btn-dark" style={{ marginTop:6 }}>Simpan Revisi</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}