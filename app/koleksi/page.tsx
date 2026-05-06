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
  const curRef    = useRef(0);
  const rafRef    = useRef<number>(0);
  const gridRef   = useRef<HTMLDivElement>(null);

  const waNumber = "6282264774367";
  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = () => { curRef.current = lerp(curRef.current, window.scrollY, 0.08); setScrollY(curRef.current); rafRef.current = requestAnimationFrame(tick); };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.05 });
    if (gridRef.current) obs.observe(gridRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => { return onAuthStateChanged(auth, (cu) => { setUser(cu); setIsAdmin(cu?.email === ADMIN_EMAIL); }); }, []);
  useEffect(() => { const q = query(collection(db,"kacamata"),orderBy("nama","asc")); return onSnapshot(q,(s) => setProducts(s.docs.map((d) => ({ id:d.id,...d.data() })))); }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("login") === "true") setShowAuth(true);
    }
  }, []);

  const handleFileToBase64 = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800*1024) { showToast("GAGAL: Ukuran foto maksimal 800 KB!"); e.target.value=""; return; }
    const r = new FileReader(); r.onloadend = () => setter(r.result as string); r.readAsDataURL(file);
  };

  const handleUpdateHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroBase64) return;
    try { await setDoc(doc(db,"pengaturan","beranda"),{ url_foto_utama:heroBase64 },{ merge:true }); showToast("FOTO BERANDA DIPERBARUI"); setHeroBase64(""); (document.getElementById("hero-upload") as HTMLInputElement).value=""; }
    catch { showToast("GAGAL MENGUBAH FOTO"); }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName||!newPrice||!newDesc||!imageBase64) return;
    try { await addDoc(collection(db,"kacamata"),{ nama:newName,harga:Number(newPrice),deskripsi:newDesc,gambar:imageBase64 }); showToast("PRODUK DITAMBAHKAN"); setNewName(""); setNewPrice(""); setNewDesc(""); setImageBase64(""); (document.getElementById("product-upload") as HTMLInputElement).value=""; }
    catch { showToast("GAGAL MENAMBAHKAN"); }
  };

  const openEdit = (item: any) => { setEditingId(item.id); setEditName(item.nama); setEditPrice(item.harga.toString()); setEditDesc(item.deskripsi); setEditImg(item.gambar); setIsEditOpen(true); };
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await updateDoc(doc(db,"kacamata",editingId),{ nama:editName,harga:Number(editPrice),deskripsi:editDesc,gambar:editImg }); setIsEditOpen(false); showToast("REVISI DISIMPAN"); }
    catch { showToast("GAGAL MENYIMPAN"); }
  };
  const handleDelete = async (id: string) => { if (confirm("Hapus item ini secara permanen?")) { await deleteDoc(doc(db,"kacamata",id)); showToast("PRODUK DIHAPUS"); } };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLoginMode) { await signInWithEmailAndPassword(auth,email,password); showToast("BERHASIL MASUK"); }
      else { await createUserWithEmailAndPassword(auth,email,password); showToast("AKUN DIBUAT"); }
      setShowAuth(false); setEmail(""); setPassword("");
    } catch (err:any) { showToast("GAGAL: "+err.message); }
  };
  const handleLogout = async () => { await signOut(auth); showToast("BERHASIL KELUAR"); };

  const buyViaWhatsApp = (nama: string) => {
    if (!user) { showToast("Silakan masuk terlebih dahulu"); setShowAuth(true); return; }
    const text = `Halo Optik Aaliyah, saya tertarik dengan koleksi: *${nama}*.`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`,"_blank");
  };

  const FILTERS = ["Semua","Square","Round","Aviator","Oval","Cat-Eye"];
  const filtered = products.filter(p => {
    const ms = p.nama.toLowerCase().includes(searchQuery.toLowerCase()) || p.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase());
    const mf = activeFilter==="Semua" || p.nama.toLowerCase().includes(activeFilter.toLowerCase()) || p.deskripsi?.toLowerCase().includes(activeFilter.toLowerCase());
    return ms && mf;
  });

  const navScrolled = scrollY > 40;
  const heroOpacity = Math.max(0, 1-scrollY/380);
  const heroBgY     = scrollY * 0.3;

  return (
    <main style={{background:"#f7f3ee",color:"#1a1410",fontFamily:"'Cormorant Garamond','Georgia',serif",minHeight:"100vh",overflowX:"hidden"}}>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#f7f3ee}::-webkit-scrollbar-thumb{background:#b09878}
        ::selection{background:#1a1410;color:#f7f3ee}

        @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes heroLine{from{transform:translateY(110%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes dotPulse{0%,100%{box-shadow:0 0 0 0 rgba(176,152,120,.5)}50%{box-shadow:0 0 0 10px rgba(176,152,120,0)}}
        @keyframes spinAnim{to{transform:rotate(360deg)}}

        .h-line{overflow:hidden;display:block;line-height:1.05}
        .h-line-inner{display:block;animation:heroLine 1s cubic-bezier(.16,1,.3,1) both;opacity:0}
        .l0{animation-delay:.08s}.l1{animation-delay:.24s}.l2{animation-delay:.4s}

        .reveal{opacity:0;transform:translateY(28px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1)}
        .reveal.in{opacity:1;transform:translateY(0)}
        .d1{transition-delay:.05s}.d2{transition-delay:.12s}.d3{transition-delay:.19s}.d4{transition-delay:.27s}.d5{transition-delay:.36s}.d6{transition-delay:.46s}

        /* NAV */
        .nav-a{position:relative;font-family:'Jost',sans-serif;font-size:13px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;color:rgba(26,20,16,.6);transition:color .3s;background:none;border:none;cursor:pointer;padding:4px 0}
        .nav-a::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:2px;background:#8a6a44;transition:width .3s}
        .nav-a:hover{color:#8a6a44}.nav-a:hover::after{width:100%}

        /* EYEBROW */
        .eyebrow{font-family:'Jost',sans-serif;font-size:11px;font-weight:500;letter-spacing:.4em;text-transform:uppercase;color:#8a6a44;display:flex;align-items:center;gap:14px}
        .eyebrow::before{content:'';width:28px;height:1px;background:#8a6a44;flex-shrink:0}

        /* BUTTONS */
        .btn-dark{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#1a1410;color:#f7f3ee;font-family:'Jost',sans-serif;font-size:13px;font-weight:500;letter-spacing:.15em;text-transform:uppercase;border:none;padding:14px 28px;cursor:pointer;transition:background .3s,transform .2s;width:100%}
        .btn-dark:hover{background:#2e251e;transform:translateY(-1px)}
        .btn-dark:disabled{background:#b5ada5;cursor:not-allowed;transform:none}
        .btn-outline{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:transparent;color:#1a1410;font-family:'Jost',sans-serif;font-size:13px;font-weight:500;letter-spacing:.15em;text-transform:uppercase;border:2px solid rgba(26,20,16,.25);padding:12px 24px;cursor:pointer;transition:all .3s;width:100%}
        .btn-outline:hover{background:#1a1410;color:#f7f3ee}

        .btn-edit-sm{display:inline-flex;align-items:center;justify-content:center;font-family:'Jost',sans-serif;font-size:12px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;border:1.5px solid rgba(26,20,16,.18);padding:11px;cursor:pointer;background:transparent;color:rgba(26,20,16,.65);transition:all .3s;width:100%}
        .btn-edit-sm:hover{background:#1a1410;color:#f7f3ee;border-color:#1a1410}
        .btn-del-sm{display:inline-flex;align-items:center;justify-content:center;font-family:'Jost',sans-serif;font-size:12px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;border:1.5px solid rgba(185,28,28,.25);padding:11px;cursor:pointer;background:rgba(185,28,28,.04);color:rgba(185,28,28,.7);transition:all .3s;width:100%}
        .btn-del-sm:hover{background:rgba(185,28,28,.1);border-color:rgba(185,28,28,.5);color:#dc2626}

        /* FILTER */
        .filter-btn{font-family:'Jost',sans-serif;font-size:12px;font-weight:500;letter-spacing:.15em;text-transform:uppercase;background:transparent;border:1.5px solid rgba(26,20,16,.15);color:rgba(26,20,16,.5);padding:8px 18px;cursor:pointer;transition:all .3s}
        .filter-btn:hover{border-color:rgba(26,20,16,.35);color:rgba(26,20,16,.8)}
        .filter-btn.active{background:#1a1410;border-color:#1a1410;color:#f7f3ee}

        /* PRODUCT CARDS */
        .prod-card{transition:transform .45s cubic-bezier(.16,1,.3,1),box-shadow .35s;border:1px solid rgba(26,20,16,.1);background:#fff;display:flex;flex-direction:column}
        .prod-card:hover{transform:translateY(-6px);box-shadow:0 18px 40px rgba(26,20,16,.12)}
        .prod-card:hover .prod-img-inner{transform:scale(1.04)}
        .prod-img-inner{transition:transform .55s cubic-bezier(.16,1,.3,1)}

        /* ADMIN */
        .admin-input{width:100%;padding:12px 14px;background:#fff;border:1.5px solid rgba(26,20,16,.18);color:#1a1410;font-family:'Jost',sans-serif;font-size:14px;font-weight:400;outline:none;transition:border-color .3s}
        .admin-input:focus{border-color:#8a6a44}
        .admin-input::placeholder{color:rgba(26,20,16,.3)}
        .admin-label{font-family:'Jost',sans-serif;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:rgba(26,20,16,.5);display:block;margin-bottom:8px}
        .admin-panel{background:#fff;border:1px solid rgba(26,20,16,.12);padding:32px;position:relative;box-shadow:0 4px 20px rgba(26,20,16,.05)}
        .admin-panel-label{position:absolute;top:-1px;left:24px;background:#1a1410;color:#f7f3ee;font-family:'Jost',sans-serif;font-size:9px;font-weight:600;letter-spacing:.3em;padding:4px 12px;text-transform:uppercase}

        /* SEARCH */
        .search-wrap input{font-family:'Jost',sans-serif;font-size:14px;font-weight:400;background:transparent;border:none;border-bottom:2px solid rgba(26,20,16,.2);color:#1a1410;padding:8px 8px 8px 32px;outline:none;width:200px;transition:border-color .3s}
        .search-wrap input:focus{border-bottom-color:#8a6a44}
        .search-wrap input::placeholder{color:rgba(26,20,16,.35)}

        /* MISC */
        .ornament{position:absolute;pointer-events:none}
        .grain{position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:.02;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")}
        .dot-pulse{animation:dotPulse 2s infinite}

        /* MODAL */
        .modal-overlay{position:fixed;inset:0;background:rgba(26,20,16,.55);backdrop-filter:blur(10px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
        .modal-box{background:#faf7f2;border:1px solid rgba(26,20,16,.12);width:100%;position:relative;animation:fadeInUp .35s ease;padding:40px;max-height:92vh;overflow-y:auto;box-shadow:0 32px 80px rgba(26,20,16,.15)}
        .modal-box::-webkit-scrollbar{width:3px}.modal-box::-webkit-scrollbar-thumb{background:#b09878}
        .modal-input{width:100%;padding:14px 16px;background:#fff;border:1.5px solid rgba(26,20,16,.18);color:#1a1410;font-family:'Jost',sans-serif;font-size:15px;font-weight:400;outline:none;transition:border-color .3s}
        .modal-input:focus{border-color:#8a6a44}
        .modal-label{font-family:'Jost',sans-serif;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:rgba(26,20,16,.55);display:block;margin-bottom:8px}

        /* RESPONSIVE */
        @media(max-width:900px){
          .admin-grid{grid-template-columns:1fr!important}
          .prod-grid{grid-template-columns:repeat(2,1fr)!important}
          .footer-grid{grid-template-columns:1fr!important}
          .footer-links{grid-template-columns:1fr 1fr!important}
          .toolbar{flex-direction:column!important;align-items:flex-start!important;gap:16px!important}
          .filter-wrap{flex-wrap:wrap!important}
          .nav-desktop-links{display:none!important}
          .nav-mobile-btn{display:flex!important}
        }
        @media(max-width:600px){
          .hero-sec{padding-bottom:56px!important;min-height:48vh!important}
          .hero-h1{font-size:clamp(42px,11vw,68px)!important}
          .prod-grid{grid-template-columns:1fr!important}
          .section-pad{padding:48px 20px!important}
          .nav-pad{padding:14px 20px!important}
          .admin-form-grid{grid-template-columns:1fr!important}
          .footer-links{grid-template-columns:1fr!important}
        }
        @media(min-width:901px){
          .nav-mobile-btn{display:none!important}
        }
      `}} />

      <div className="grain"/>

      {/* Toast */}
      {toastMsg && (
        <div style={{position:"fixed",bottom:24,right:24,zIndex:300,background:"#1a1410",color:"#f7f3ee",padding:"14px 24px",fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:500,letterSpacing:".1em",animation:"fadeInUp .3s ease",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px rgba(26,20,16,.25)"}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#4ade80",flexShrink:0}}/>
          {toastMsg}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════ */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,background:navScrolled?"rgba(247,243,238,.97)":"transparent",backdropFilter:navScrolled?"blur(16px)":"none",borderBottom:navScrolled?"1px solid rgba(26,20,16,.1)":"1px solid transparent",transition:"all .5s cubic-bezier(.16,1,.3,1)"}}>
        <div className="nav-pad" style={{padding:navScrolled?"14px 48px":"22px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",maxWidth:1200,margin:"0 auto"}}>
          <div className="nav-desktop-links" style={{display:"flex",gap:32}}>
            <Link href="/" className="nav-a" style={{color:"#000000"}}>Beranda</Link>
            <Link href="/koleksi" className="nav-a" style={{color:"#000000"}}>Katalog</Link>
          </div>

          <Link href="/" style={{textDecoration:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <svg width="32" height="16" viewBox="0 0 30 15" fill="none">
              <rect x=".5" y=".5" width="12" height="14" rx="6" stroke="#8a6a44" strokeWidth="1.2"/>
              <rect x="17.5" y=".5" width="12" height="14" rx="6" stroke="#8a6a44" strokeWidth="1.2"/>
              <line x1="12" y1="7.5" x2="18" y2="7.5" stroke="#8a6a44" strokeWidth="1.2"/>
            </svg>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,letterSpacing:".15em",color:"#1a1410",textTransform:"uppercase"}}>Optik Aaliyah</span>
          </Link>

          <div className="nav-desktop-links" style={{display:"flex",gap:28,alignItems:"center"}}>
            {user ? (
              <>
                <span style={{fontFamily:"'Jost',sans-serif",fontSize:13,color:"#000000",fontWeight:500}}>{isAdmin?"Admin":user.email?.split("@")[0]}</span>
                <button onClick={handleLogout} className="nav-a" style={{color:"#000000"}}>Keluar</button>
              </>
            ) : (
              <>
                <button onClick={()=>setShowAuth(true)} className="nav-a">Masuk</button>
                <button onClick={()=>{setIsLoginMode(false);setShowAuth(true)}} style={{background:"#1a1410",color:"#f7f3ee",border:"none",padding:"9px 22px",fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:500,letterSpacing:".15em",textTransform:"uppercase",cursor:"pointer",transition:"background .3s"}}
                  onMouseEnter={e=>(e.currentTarget.style.background="#2e251e")}
                  onMouseLeave={e=>(e.currentTarget.style.background="#1a1410")}
                >Daftar</button>
              </>
            )}
          </div>

          {/* Mobile */}
          <button className="nav-mobile-btn" onClick={()=>setShowAuth(true)} style={{background:"none",border:"none",cursor:"pointer",flexDirection:"column",gap:5,padding:4,display:"none"}}>
            <div style={{width:24,height:2,background:"#1a1410",borderRadius:2}}/>
            <div style={{width:24,height:2,background:"#1a1410",borderRadius:2}}/>
            <div style={{width:16,height:2,background:"#1a1410",borderRadius:2}}/>
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          HERO HEADER
      ══════════════════════════════════════════════ */}
      <section className="hero-sec" style={{position:"relative",minHeight:"50vh",display:"flex",alignItems:"flex-end",overflow:"hidden",paddingBottom:64,paddingTop:120,background:"#f0ebe3"}}>
        <div style={{position:"absolute",inset:"-10%",backgroundImage:"url('https://images.unsplash.com/photo-1509695507497-903c140c43b0?q=80&w=2073')",backgroundSize:"cover",backgroundPosition:"center 30%",transform:`translateY(${heroBgY}px)`,opacity:.08,filter:"sepia(1)",transition:"none"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(240,235,227,.6) 0%,rgba(240,235,227,.98) 100%)"}}/>

        <svg className="ornament" style={{left:"-20px",top:"15%",width:220,opacity:.1,transform:`translateY(${scrollY*.07}px)`}} viewBox="0 0 220 130" fill="none">
          <rect x="2" y="2" width="84" height="68" rx="34" stroke="#8a6a44" strokeWidth="1.1"/>
          <rect x="134" y="2" width="84" height="68" rx="34" stroke="#8a6a44" strokeWidth="1.1"/>
          <line x1="86" y1="36" x2="134" y2="36" stroke="#8a6a44" strokeWidth="1.1"/>
          <line x1="2" y1="36" x2="-24" y2="58" stroke="#8a6a44" strokeWidth="1"/>
          <line x1="218" y1="36" x2="242" y2="58" stroke="#8a6a44" strokeWidth="1"/>
        </svg>

        <div style={{position:"relative",zIndex:10,maxWidth:1200,margin:"0 auto",padding:"0 48px",width:"100%",opacity:heroOpacity,transition:"none"}}>
          <p className="eyebrow" style={{marginBottom:20,animation:"fadeInUp .8s .05s both",color:"#1a1410"}}>
            {isAdmin ? "Panel Manajemen" : "Koleksi Eksklusif"}
          </p>
          <h1 className="hero-h1" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(48px,7vw,84px)",fontWeight:300,lineHeight:.92,letterSpacing:"-.02em",marginBottom:20}}>
            <span className="h-line"><span className="h-line-inner l0" style={{color:"#1a1410"}}>{isAdmin?"Dashboard":"Katalog"}</span></span>
            <span className="h-line"><span className="h-line-inner l1" style={{color:"#8a6a44",fontStyle:"italic"}}>{isAdmin?"Manajemen.":"Frame"}</span></span>
            {!isAdmin && <span className="h-line"><span className="h-line-inner l2" style={{color:"#1a1410"}}>Premium.</span></span>}
          </h1>
          <p style={{fontFamily:"'Jost',sans-serif",fontSize:16,fontWeight:400,color:"rgba(26, 20, 16, 0.94)",maxWidth:520,marginTop:16,lineHeight:1.8,animation:"fadeInUp .9s .55s both"}}>
            {isAdmin
              ? "Kelola seluruh inventaris dan tampilan website Optik Aaliyah secara mudah dan real-time."
              : "Temukan koleksi kacamata premium yang tepat untuk wajah dan kepribadianmu. Tersedia lebih dari 200 pilihan frame."}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TOOLBAR
      ══════════════════════════════════════════════ */}
      <div className="toolbar" style={{borderTop:"1px solid rgba(26,20,16,.1)",borderBottom:"1px solid rgba(26,20,16,.1)",background:"rgba(247,243,238,.98)",backdropFilter:"blur(12px)",padding:"16px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,position:"sticky",top:navScrolled?55:70,zIndex:50,transition:"top .5s"}}>
        <div className="filter-wrap" style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {FILTERS.map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`filter-btn${activeFilter===f?" active":""}`}>{f}</button>
          ))}
        </div>
        <div className="search-wrap" style={{position:"relative",flexShrink:0}}>
          <svg style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:16,height:16,color:"rgba(26, 20, 16, 0.86)"}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" placeholder="Cari koleksi..." value={searchQuery} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ADMIN PANELS
      ══════════════════════════════════════════════ */}
      {isAdmin && (
        <div className="section-pad" style={{maxWidth:1200,margin:"0 auto",padding:"48px 48px 0"}}>
          <div className="admin-grid" style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:24}}>
            {/* Hero image */}
            <div className="admin-panel">
              <div className="admin-panel-label">Foto Beranda</div>
              <p style={{fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:400,color:"rgb(26, 20, 16)",lineHeight:1.7,marginBottom:20}}>
                Upload PNG transparan untuk gambar utama di halaman beranda.
              </p>
              <form onSubmit={handleUpdateHero} style={{display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <label className="admin-label">Pilih File (Maks 800KB)</label>
                  <input type="file" id="hero-upload" accept="image/*" onChange={e=>handleFileToBase64(e,setHeroBase64)} style={{fontFamily:"'Jost',sans-serif",fontSize:12,color:"rgba(26,20,16,.55)",width:"100%"}} required/>
                </div>
                <button type="submit" className="btn-dark">Perbarui Foto</button>
              </form>
            </div>

            {/* Add product */}
            <div className="admin-panel">
              <div className="admin-panel-label">Tambah Produk Baru</div>
              <form onSubmit={handleAddProduct}>
                <div className="admin-form-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  <div>
                    <label className="admin-label"style={{color:"rgba(26, 20, 16, 0.85)"}}>Nama Frame</label>
                    <input className="admin-input" type="text" placeholder="Contoh: Moscot Lemtosh" value={newName} onChange={e=>setNewName(e.target.value)} required
                      onFocus={e=>(e.currentTarget.style.borderColor="#8a6a44")}
                      onBlur={e=>(e.currentTarget.style.borderColor="rgba(26, 20, 16, 0.75)")}/>
                  </div>
                  <div>
                    <label className="admin-label"style={{color:"rgba(26, 20, 16, 0.85)"}}>Harga (Rupiah)</label>
                    <input className="admin-input" type="number" placeholder="Contoh: 450000" value={newPrice} onChange={e=>setNewPrice(e.target.value)} required
                      onFocus={e=>(e.currentTarget.style.borderColor="#8a6a44")}
                      onBlur={e=>(e.currentTarget.style.borderColor="rgba(26,20,16,.18)")}/>
                  </div>
                  <div style={{gridColumn:"span 2"}}>
                    <label className="admin-label"style={{color:"rgba(26, 20, 16, 0.85)"}}>Deskripsi Produk</label>
                    <input className="admin-input" type="text" placeholder="Material, fitur, keunggulan frame..." value={newDesc} onChange={e=>setNewDesc(e.target.value)} required
                      onFocus={e=>(e.currentTarget.style.borderColor="#8a6a44")}
                      onBlur={e=>(e.currentTarget.style.borderColor="rgba(26,20,16,.18)")}/>
                  </div>
                  <div style={{gridColumn:"span 2",display:"grid",gridTemplateColumns:"1fr auto",gap:16,alignItems:"flex-end"}}>
                    <div>
                      <label className="admin-label"style={{color:"rgba(26, 20, 16, 0.85)"}}>Foto Produk (Maks 800KB)</label>
                      <input type="file" id="product-upload" accept="image/*" onChange={e=>handleFileToBase64(e,setImageBase64)} style={{fontFamily:"'Jost',sans-serif",fontSize:12,color:"rgba(26,20,16,.55)",width:"100%"}} required/>
                    </div>
                    <button type="submit" className="btn-dark" style={{width:"auto",padding:"13px 28px",whiteSpace:"nowrap"}}>Simpan</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          PRODUCT GRID
      ══════════════════════════════════════════════ */}
      <div className="section-pad" style={{maxWidth:1200,margin:"0 auto",padding:"48px 48px 100px"}} ref={gridRef}>

        {/* Count bar */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:36,paddingBottom:20,borderBottom:"1px solid rgba(26,20,16,.1)"}}>
          <p style={{fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:500,letterSpacing:".2em",textTransform:"uppercase",color:"rgba(26,20,16,.45)"}}>
            <span style={{color:"#1a1410",fontWeight:600}}>{filtered.length}</span> Frame Ditemukan
          </p>
          {(searchQuery||activeFilter!=="Semua") && (
            <button onClick={()=>{setSearch("");setFilter("Semua");}} style={{fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:500,letterSpacing:".15em",textTransform:"uppercase",color:"rgba(26,20,16,.4)",background:"none",border:"none",cursor:"pointer",transition:"color .3s"}}
              onMouseEnter={e=>(e.currentTarget.style.color="#8a6a44")}
              onMouseLeave={e=>(e.currentTarget.style.color="rgba(26,20,16,.4)")}
            >Hapus Filter ×</button>
          )}
        </div>

        {/* Cards */}
        {filtered.length > 0 ? (
          <div className="prod-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"32px 24px"}}>
            {filtered.map((item,i)=>(
              <div key={item.id} className={`prod-card reveal d${(i%6)+1} ${vis?"in":""}`}>

                {/* Image */}
                <div style={{background:"#e8e0d4",overflow:"hidden",aspectRatio:"4/3",position:"relative",flexShrink:0}}>
                  <img src={item.gambar} alt={item.nama} className="prod-img-inner" style={{width:"100%",height:"100%",objectFit:"cover",display:"block",mixBlendMode:"multiply"}}/>
                </div>

                {/* Info */}
                <div style={{padding:"18px 20px 22px",display:"flex",flexDirection:"column",flexGrow:1}}>
                  <div style={{fontFamily:"'Jost',sans-serif",fontSize:10,fontWeight:600,letterSpacing:".35em",textTransform:"uppercase",color:"#b09878",marginBottom:6}}>Optik Aaliyah</div>
                  <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:500,color:"#1a1410",marginBottom:4,lineHeight:1.1}}>{item.nama}</h3>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic",color:"#8a6a44",marginBottom:10,fontWeight:400}}>
                    Rp {item.harga?.toLocaleString("id-ID")}
                  </p>
                  <p style={{fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:400,color:"rgba(26,20,16,.55)",lineHeight:1.75,marginBottom:18,flexGrow:1,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                    {item.deskripsi}
                  </p>

                  {isAdmin ? (
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,borderTop:"1px solid rgba(26,20,16,.1)",paddingTop:14,marginTop:"auto"}}>
                      <button onClick={()=>openEdit(item)} className="btn-edit-sm">✎ Edit</button>
                      <button onClick={()=>handleDelete(item.id)} className="btn-del-sm">✕ Hapus</button>
                    </div>
                  ) : (
                    <button onClick={()=>buyViaWhatsApp(item.nama)} className="btn-dark" style={{marginTop:"auto"}}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}>
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
          <div style={{textAlign:"center",padding:"80px 24px",border:"1px solid rgba(26,20,16,.1)",background:"#fff"}}>
            <svg style={{width:48,height:48,margin:"0 auto 16px",opacity:.2}} fill="none" stroke="#8a6a44" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:300,color:"rgba(26,20,16,.5)",marginBottom:10}}>Koleksi Tidak Ditemukan</p>
            <p style={{fontFamily:"'Jost',sans-serif",fontSize:14,fontWeight:400,color:"rgba(26,20,16,.4)",marginBottom:24}}>Coba gunakan kata kunci atau filter yang berbeda</p>
            <button onClick={()=>{setSearch("");setFilter("Semua");}} style={{fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:500,letterSpacing:".15em",textTransform:"uppercase",background:"#1a1410",color:"#f7f3ee",border:"none",padding:"12px 28px",cursor:"pointer"}}>
              Tampilkan Semua
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
      <footer style={{background:"#1a1410",padding:"64px 48px 32px"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div className="footer-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:48,marginBottom:44,paddingBottom:40,borderBottom:"1px solid rgba(247,243,238,.1)"}}>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:300,color:"#f7f3ee",marginBottom:4}}>
                Optik <span style={{color:"#b09878",fontStyle:"italic"}}>Aaliyah.</span>
              </div>
              <p style={{fontFamily:"'Jost',sans-serif",fontSize:11,letterSpacing:".25em",textTransform:"uppercase",color:"rgba(247,243,238,.3)",marginBottom:22,fontWeight:500}}>Eyewear Premium · Sidoarjo, ID</p>
              <p style={{fontFamily:"'Jost',sans-serif",fontSize:14,fontWeight:400,color:"rgba(247,243,238,.45)",lineHeight:1.8,maxWidth:300}}>Mendefinisikan ulang gaya kacamata dengan kurasi frame premium berkualitas tinggi.</p>
            </div>
            <div className="footer-links" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
              {[{h:"Navigasi",l:["Beranda","Katalog","AI Try-On"]},{h:"Info",l:["Tentang Kami","Panduan Frame","Perawatan Lensa"]},{h:"Kontak",l:["Puri Indah Df 19","Sidoarjo, Jawa Timur","+62 822-6477-4367"]}].map(g=>(
                <div key={g.h}>
                  <div style={{fontFamily:"'Jost',sans-serif",fontSize:10,fontWeight:600,letterSpacing:".35em",textTransform:"uppercase",color:"rgba(176,152,120,.6)",marginBottom:16}}>{g.h}</div>
                  <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:10}}>
                    {g.l.map(li=>(
                      <li key={li} style={{fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:400,color:"rgba(247,243,238,.45)",cursor:"pointer",transition:"color .25s"}}
                        onMouseEnter={e=>(e.currentTarget.style.color="#b09878")}
                        onMouseLeave={e=>(e.currentTarget.style.color="rgba(247,243,238,.45)")}
                      >{li}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div style={{marginBottom:32,overflow:"hidden",border:"1px solid rgba(247,243,238,.08)"}}>
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3956.102594091213!2d112.6823516760512!3d-7.453901273464231!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7e591ba40e1f9%3A0x1ee871e6ac517c61!2sOptik%20Aaliyah!5e0!3m2!1sid!2sid!4v1776056666993!5m2!1sid!2sid"
              width="100%" height="180" style={{border:0,display:"block",filter:"grayscale(1) brightness(.65)"}}
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
            <p style={{fontFamily:"'Jost',sans-serif",fontSize:11,letterSpacing:".2em",textTransform:"uppercase",color:"rgba(247,243,238,.25)"}}>© 2026 Optik Aaliyah. All rights reserved.</p>
            <div style={{display:"flex",alignItems:"center",gap:8,fontFamily:"'Jost',sans-serif",fontSize:11,letterSpacing:".2em",textTransform:"uppercase",color:"rgba(176,152,120,.45)"}}>
              <div className="dot-pulse" style={{width:6,height:6,borderRadius:"50%",background:"#b09878"}}/>
              Sidoarjo, ID
            </div>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════
          MODAL: AUTH
      ══════════════════════════════════════════════ */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={()=>setShowAuth(false)}>
          <div className="modal-box" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setShowAuth(false)} style={{position:"absolute",top:16,right:16,background:"transparent",border:"none",cursor:"pointer",color:"rgba(26,20,16,.4)"}}>
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <p className="eyebrow" style={{marginBottom:12,fontSize:10}}>{isLoginMode?"Masuk Akun":"Buat Akun Baru"}</p>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:300,color:"#1a1410",marginBottom:32,lineHeight:1.08}}>
              {isLoginMode
                ? <><span>Selamat</span><br/><em style={{fontStyle:"italic",color:"#8a6a44"}}>Datang Kembali.</em></>
                : <><span>Bergabung</span><br/><em style={{fontStyle:"italic",color:"#8a6a44"}}>Bersama Kami.</em></>}
            </h2>
            <form onSubmit={handleAuth} style={{display:"flex",flexDirection:"column",gap:20}}>
              {[{l:"Alamat Email",t:"email",v:email,s:setEmail},{l:"Kata Sandi",t:"password",v:password,s:setPassword}].map(f=>(
                <div key={f.l}>
                  <label className="modal-label">{f.l}</label>
                  <input type={f.t} value={f.v} onChange={e=>f.s(e.target.value)} required minLength={f.t==="password"?6:undefined} className="modal-input"
                    onFocus={e=>(e.currentTarget.style.borderColor="#8a6a44")}
                    onBlur={e=>(e.currentTarget.style.borderColor="rgba(26,20,16,.18)")}/>
                </div>
              ))}
              <button type="submit" className="btn-dark" style={{marginTop:4,padding:"16px",fontSize:14}}>
                {isLoginMode?"Masuk Sekarang":"Daftar Sekarang"}
              </button>
            </form>
            <div style={{marginTop:24,paddingTop:20,borderTop:"1px solid rgba(26,20,16,.1)",textAlign:"center"}}>
              <button onClick={()=>setIsLoginMode(!isLoginMode)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:500,letterSpacing:".1em",color:"rgba(26,20,16,.45)",transition:"color .3s"}}
                onMouseEnter={e=>(e.currentTarget.style.color="#8a6a44")}
                onMouseLeave={e=>(e.currentTarget.style.color="rgba(26,20,16,.45)")}
              >{isLoginMode?"Belum punya akun? Daftar →":"Sudah punya akun? Masuk →"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MODAL: EDIT PRODUK
      ══════════════════════════════════════════════ */}
      {isEditOpen && (
        <div className="modal-overlay" onClick={()=>setIsEditOpen(false)}>
          <div className="modal-box" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setIsEditOpen(false)} style={{position:"absolute",top:16,right:16,background:"transparent",border:"none",cursor:"pointer",color:"rgba(26,20,16,.4)"}}>
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <p className="eyebrow" style={{marginBottom:12,fontSize:10}}>Admin Panel</p>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:300,color:"#1a1410",marginBottom:30,lineHeight:1.08}}>
              Edit<br/><em style={{fontStyle:"italic",color:"#8a6a44"}}>Data Produk.</em>
            </h2>
            <form onSubmit={handleUpdateProduct} style={{display:"flex",flexDirection:"column",gap:18}}>
              {[{l:"Nama Frame",t:"text",v:editName,s:setEditName},{l:"Harga (Rupiah)",t:"number",v:editPrice,s:setEditPrice}].map(f=>(
                <div key={f.l}>
                  <label className="modal-label">{f.l}</label>
                  <input type={f.t} value={f.v} onChange={e=>f.s(e.target.value)} required className="modal-input"
                    onFocus={e=>(e.currentTarget.style.borderColor="#8a6a44")}
                    onBlur={e=>(e.currentTarget.style.borderColor="rgba(26,20,16,.18)")}/>
                </div>
              ))}
              <div>
                <label className="modal-label">Deskripsi Produk</label>
                <textarea value={editDesc} onChange={e=>setEditDesc(e.target.value)} required
                  style={{width:"100%",padding:"13px 15px",background:"#fff",border:"1.5px solid rgba(26,20,16,.18)",color:"#1a1410",fontFamily:"'Jost',sans-serif",fontSize:14,fontWeight:400,outline:"none",transition:"border-color .3s",resize:"none",height:96,lineHeight:1.7}}
                  onFocus={e=>(e.currentTarget.style.borderColor="#8a6a44")}
                  onBlur={e=>(e.currentTarget.style.borderColor="rgba(26,20,16,.18)")}/>
              </div>
              <div>
                <label className="modal-label">Ganti Foto (Opsional, Maks 800KB)</label>
                <input type="file" accept="image/*" onChange={e=>handleFileToBase64(e,setEditImg)}
                  style={{fontFamily:"'Jost',sans-serif",fontSize:12,color:"rgba(26,20,16,.55)",width:"100%"}}/>
              </div>
              <button type="submit" className="btn-dark" style={{marginTop:4,padding:"15px",fontSize:13}}>Simpan Perubahan</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
} 