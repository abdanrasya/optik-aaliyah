"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, limit, onSnapshot, doc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

const ADMIN_EMAIL = "admin@optikaaliyah.com";

// Daftar kacamata untuk AI Try-On dengan gambar ilustrasi SVG
const GLASSES_OPTIONS = [
  {
    id: 0, nama: "Aviator Classic",
    bentuk: "Cocok: Wajah Bulat & Oval",
    svg: (
      <svg viewBox="0 0 120 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
        <path d="M8 25 C8 14 16 8 28 8 C40 8 48 14 48 25 C48 36 40 42 28 42 C16 42 8 36 8 25Z" stroke="#8a6a44" strokeWidth="2.5" fill="rgba(138,106,68,.08)"/>
        <path d="M72 25 C72 14 80 8 92 8 C104 8 112 14 112 25 C112 36 104 42 92 42 C80 42 72 36 72 25Z" stroke="#8a6a44" strokeWidth="2.5" fill="rgba(138,106,68,.08)"/>
        <path d="M48 20 L72 20" stroke="#8a6a44" strokeWidth="2"/>
        <path d="M8 22 L2 18" stroke="#8a6a44" strokeWidth="2" strokeLinecap="round"/>
        <path d="M112 22 L118 18" stroke="#8a6a44" strokeWidth="2" strokeLinecap="round"/>
        <path d="M28 28 L35 35" stroke="#8a6a44" strokeWidth="1" opacity=".3"/>
        <path d="M92 28 L99 35" stroke="#8a6a44" strokeWidth="1" opacity=".3"/>
      </svg>
    ),
  },
  {
    id: 1, nama: "Round Vintage",
    bentuk: "Cocok: Wajah Persegi & Oval",
    svg: (
      <svg viewBox="0 0 120 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
        <circle cx="30" cy="25" r="18" stroke="#8a6a44" strokeWidth="2.5" fill="rgba(138,106,68,.08)"/>
        <circle cx="90" cy="25" r="18" stroke="#8a6a44" strokeWidth="2.5" fill="rgba(138,106,68,.08)"/>
        <path d="M48 25 L72 25" stroke="#8a6a44" strokeWidth="2"/>
        <path d="M12 20 L4 16" stroke="#8a6a44" strokeWidth="2" strokeLinecap="round"/>
        <path d="M108 20 L116 16" stroke="#8a6a44" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 2, nama: "Square Bold",
    bentuk: "Cocok: Wajah Oval & Hati",
    svg: (
      <svg viewBox="0 0 120 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
        <rect x="8" y="10" width="42" height="30" rx="4" stroke="#8a6a44" strokeWidth="2.5" fill="rgba(138,106,68,.08)"/>
        <rect x="70" y="10" width="42" height="30" rx="4" stroke="#8a6a44" strokeWidth="2.5" fill="rgba(138,106,68,.08)"/>
        <path d="M50 25 L70 25" stroke="#8a6a44" strokeWidth="2"/>
        <path d="M8 22 L2 18" stroke="#8a6a44" strokeWidth="2" strokeLinecap="round"/>
        <path d="M112 22 L118 18" stroke="#8a6a44" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 3, nama: "Cat-Eye Elegan",
    bentuk: "Cocok: Wajah Bulat & Hati",
    svg: (
      <svg viewBox="0 0 120 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
        <path d="M8 30 C8 30 10 12 28 10 C44 8 50 20 50 28 C50 36 44 40 32 40 C18 40 8 34 8 30Z" stroke="#8a6a44" strokeWidth="2.5" fill="rgba(138,106,68,.08)"/>
        <path d="M70 30 C70 30 72 12 90 10 C106 8 112 20 112 28 C112 36 106 40 94 40 C80 40 70 34 70 30Z" stroke="#8a6a44" strokeWidth="2.5" fill="rgba(138,106,68,.08)"/>
        <path d="M50 24 L70 24" stroke="#8a6a44" strokeWidth="2"/>
        <path d="M8 28 L2 24" stroke="#8a6a44" strokeWidth="2" strokeLinecap="round"/>
        <path d="M112 24 L118 20" stroke="#8a6a44" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 4, nama: "Wayfarer Klasik",
    bentuk: "Cocok: Semua Bentuk Wajah",
    svg: (
      <svg viewBox="0 0 120 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
        <path d="M8 14 L50 14 L50 34 C50 38 46 42 40 42 L18 42 C12 42 8 38 8 34 Z" stroke="#8a6a44" strokeWidth="2.5" fill="rgba(138,106,68,.08)"/>
        <path d="M70 14 L112 14 L112 34 C112 38 108 42 102 42 L80 42 C74 42 70 38 70 34 Z" stroke="#8a6a44" strokeWidth="2.5" fill="rgba(138,106,68,.08)"/>
        <path d="M50 22 L70 22" stroke="#8a6a44" strokeWidth="2"/>
        <path d="M8 20 L2 16" stroke="#8a6a44" strokeWidth="2" strokeLinecap="round"/>
        <path d="M112 20 L118 16" stroke="#8a6a44" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 5, nama: "Oval Tipis",
    bentuk: "Cocok: Wajah Persegi & Bulat",
    svg: (
      <svg viewBox="0 0 120 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
        <ellipse cx="29" cy="25" rx="21" ry="14" stroke="#8a6a44" strokeWidth="2.5" fill="rgba(138,106,68,.08)"/>
        <ellipse cx="91" cy="25" rx="21" ry="14" stroke="#8a6a44" strokeWidth="2.5" fill="rgba(138,106,68,.08)"/>
        <path d="M50 25 L70 25" stroke="#8a6a44" strokeWidth="2"/>
        <path d="M8 22 L2 18" stroke="#8a6a44" strokeWidth="2" strokeLinecap="round"/>
        <path d="M112 22 L118 18" stroke="#8a6a44" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function LandingPage() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [user, setUser]                         = useState<User | null>(null);
  const [isAdmin, setIsAdmin]                   = useState(false);
  const [showAuthModal, setShowAuthModal]       = useState(false);
  const [isLoginMode, setIsLoginMode]           = useState(true);
  const [email, setEmail]                       = useState("");
  const [password, setPassword]                 = useState("");
  const [heroImage, setHeroImage]               = useState("https://i.ibb.co/30Z3D2c/sunglasses-png-transparent-picture-11535787682sz9qngolow.png");
  const [toastMsg, setToastMsg]                 = useState("");
  const [scrollY, setScrollY]                   = useState(0);
  const [heroVisible, setHeroVisible]           = useState(false);
  const [vis, setVis]                           = useState<Set<string>>(new Set());
  const curRef  = useRef(0);
  const rafRef  = useRef<number>(0);
  const sec2Ref = useRef<HTMLDivElement>(null);
  const sec3Ref = useRef<HTMLDivElement>(null);
  const sec4Ref = useRef<HTMLDivElement>(null);
  const sec5Ref = useRef<HTMLDivElement>(null);

  // Try-On
  const [isTryOnOpen, setIsTryOnOpen]       = useState(false);
  const [isProcessing, setIsProcessing]     = useState(false);
  const [tryOnResult, setTryOnResult]       = useState<string | null>(null);
  const [detectedShapes, setDetectedShapes] = useState<string[]>([]);
  const [glassesIndex, setGlassesIndex]     = useState(0);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream]                 = useState<MediaStream | null>(null);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = () => { curRef.current = lerp(curRef.current, window.scrollY, 0.08); setScrollY(curRef.current); rafRef.current = requestAnimationFrame(tick); };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => { setTimeout(() => setHeroVisible(true), 100); }, []);

  useEffect(() => {
    const refs = [{ ref: sec2Ref, id:"s2" },{ ref: sec3Ref, id:"s3" },{ ref: sec4Ref, id:"s4" },{ ref: sec5Ref, id:"s5" }];
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setVis((p) => new Set([...p, e.target.getAttribute("data-id")||""])); }),
      { threshold: 0.1 }
    );
    refs.forEach(({ ref }) => ref.current && obs.observe(ref.current));
    return () => obs.disconnect();
  }, []);

  useEffect(() => { return onAuthStateChanged(auth, (cu) => { setUser(cu); setIsAdmin(cu?.email === ADMIN_EMAIL); }); }, []);
  useEffect(() => { const q = query(collection(db,"kacamata"),limit(3)); return onSnapshot(q,(s) => setFeaturedProducts(s.docs.map((d) => ({ id:d.id,...d.data() })))); }, []);
  useEffect(() => { return onSnapshot(doc(db,"pengaturan","beranda"),(s) => { if (s.exists()&&s.data().url_foto_utama) setHeroImage(s.data().url_foto_utama); }); }, []);

  const openCamera = async () => {
    setIsTryOnOpen(true); setTryOnResult(null); setDetectedShapes([]);
    try { const ms = await navigator.mediaDevices.getUserMedia({ video:true }); setStream(ms); if (videoRef.current) videoRef.current.srcObject = ms; }
    catch { showToast("GAGAL MENGAKSES KAMERA"); }
  };
  const closeCamera = () => { stream?.getTracks().forEach((t) => t.stop()); setStream(null); setIsTryOnOpen(false); };
  const captureAndProcess = async () => {
    if (!videoRef.current||!canvasRef.current) return;
    setIsProcessing(true);
    const v = videoRef.current; const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v,0,0,c.width,c.height);
    c.toBlob(async (blob) => {
      if (!blob) { setIsProcessing(false); return; }
      const fd = new FormData(); fd.append("file",blob,"capture.jpg");
      try {
        const res = await fetch(`http://192.168.171.1:8000/predict?glasses_index=${glassesIndex}`,{ method:"POST",body:fd });
        if (!res.ok) throw new Error((await res.json()).detail||"Gagal");
        const data = await res.json();
        setTryOnResult(`data:image/png;base64,${data.image}`);
        setDetectedShapes(data.faces.map((f:any) => f.shape));
      } catch (e:any) { showToast(e.message.toUpperCase()); }
      finally { setIsProcessing(false); }
    },"image/jpeg");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLoginMode) { await signInWithEmailAndPassword(auth,email,password); showToast("BERHASIL MASUK"); }
      else { await createUserWithEmailAndPassword(auth,email,password); showToast("AKUN DIBUAT"); }
      setShowAuthModal(false); setEmail(""); setPassword("");
    } catch (err:any) { showToast("GAGAL: "+err.message); }
  };
  const handleLogout = async () => { await signOut(auth); showToast("BERHASIL KELUAR"); };

  const heroOpacity = Math.max(0, 1 - scrollY/580);
  const heroBgY     = scrollY * 0.35;
  const heroImgY    = scrollY * -0.14;
  const heroTextY   = scrollY * 0.09;
  const navScrolled = scrollY > 50;

  const FALLBACK = [
    { id:"1", nama:"Zenith Classic",  harga:750000, deskripsi:"Frame titanium premium dengan lensa polarisasi UV400. Ringan dan tahan lama.", gambar:"" },
    { id:"2", nama:"Luna Oval",       harga:580000, deskripsi:"Desain round vintage dengan material asetat Italia. Elegan dan timeless.", gambar:"" },
    { id:"3", nama:"Atlas Bold",      harga:620000, deskripsi:"Frame square tegas dengan material asetat premium. Cocok untuk tampilan modern.", gambar:"" },
  ];
  const products = featuredProducts.length > 0 ? featuredProducts : FALLBACK;
  const selectedGlasses = GLASSES_OPTIONS[glassesIndex] || GLASSES_OPTIONS[0];

  return (
    <main style={{ background:"#f7f3ee", color:"#1a1410", fontFamily:"'Cormorant Garamond','Georgia',serif", minHeight:"100vh", overflowX:"hidden" }}>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:#f7f3ee}
        ::-webkit-scrollbar-thumb{background:#b09878}
        ::selection{background:#1a1410;color:#f7f3ee}

        @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes heroLine{from{transform:translateY(110%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes floatUD{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes scanAnim{0%{top:0;opacity:0}8%{opacity:1}92%{opacity:1}100%{top:100%;opacity:0}}
        @keyframes dotPulse{0%,100%{box-shadow:0 0 0 0 rgba(176,152,120,.5)}50%{box-shadow:0 0 0 10px rgba(176,152,120,0)}}
        @keyframes spinAnim{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}

        .h-line{overflow:hidden;display:block;line-height:1.05}
        .h-line-inner{display:block;animation:heroLine 1.1s cubic-bezier(.16,1,.3,1) both;opacity:0}
        .l0{animation-delay:.06s}.l1{animation-delay:.22s}.l2{animation-delay:.38s}

        .reveal{opacity:0;transform:translateY(32px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1)}
        .reveal.in{opacity:1;transform:translateY(0)}
        .d1{transition-delay:.07s}.d2{transition-delay:.18s}.d3{transition-delay:.29s}.d4{transition-delay:.42s}.d5{transition-delay:.56s}

        /* === NAV === */
        .nav-a{position:relative;font-family:'Jost',sans-serif;font-size:13px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;color:rgba(26,20,16,.6);transition:color .3s;background:none;border:none;cursor:pointer;padding:4px 0}
        .nav-a::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:2px;background:#8a6a44;transition:width .3s}
        .nav-a:hover{color:#8a6a44}.nav-a:hover::after{width:100%}

        /* === EYEBROW === */
        .eyebrow{font-family:'Jost',sans-serif;font-size:11px;font-weight:500;letter-spacing:.4em;text-transform:uppercase;color:#8a6a44;display:flex;align-items:center;gap:14px}
        .eyebrow::before{content:'';width:28px;height:1px;background:#8a6a44;flex-shrink:0}

        /* === BUTTONS === */
        .btn-dark{display:inline-flex;align-items:center;justify-content:center;gap:10px;background:#1a1410;color:#f7f3ee;font-family:'Jost',sans-serif;font-size:13px;font-weight:500;letter-spacing:.15em;text-transform:uppercase;border:none;padding:16px 36px;cursor:pointer;transition:background .3s,transform .2s;text-decoration:none}
        .btn-dark:hover{background:#2e251e;transform:translateY(-2px)}
        .btn-outline{display:inline-flex;align-items:center;justify-content:center;gap:10px;background:transparent;color:#1a1410;font-family:'Jost',sans-serif;font-size:13px;font-weight:500;letter-spacing:.15em;text-transform:uppercase;border:2px solid rgba(26,20,16,.3);padding:14px 30px;cursor:pointer;text-decoration:none;transition:all .3s}
        .btn-outline:hover{background:#1a1410;color:#f7f3ee;border-color:#1a1410}

        /* === PRODUCT CARDS === */
        .prod-card{transition:transform .5s cubic-bezier(.16,1,.3,1),box-shadow .4s;cursor:pointer;background:#fff;border:1px solid rgba(26,20,16,.08)}
        .prod-card:hover{transform:translateY(-8px)!important;box-shadow:0 20px 48px rgba(26,20,16,.12)}
        .prod-card:hover .prod-img-inner{transform:scale(1.04)}
        .prod-img-inner{transition:transform .6s cubic-bezier(.16,1,.3,1)}

        /* === FACE CARDS === */
        .face-card{border:1px solid rgba(26,20,16,.12);padding:20px;transition:border-color .3s,background .3s;cursor:default}
        .face-card:hover{border-color:rgba(138,106,68,.45);background:rgba(176,152,120,.07)}

        /* === GLASSES SELECTOR === */
        .glasses-btn{border:2px solid rgba(26,20,16,.12);padding:12px;cursor:pointer;background:transparent;transition:all .3s;display:flex;flex-direction:column;gap:8px;align-items:center}
        .glasses-btn:hover{border-color:#b09878;background:rgba(176,152,120,.06)}
        .glasses-btn.active{border-color:#8a6a44;background:rgba(138,106,68,.08)}

        /* === MISC === */
        .sep{height:1px;background:linear-gradient(to right,transparent,rgba(26,20,16,.15),transparent)}
        .ornament{position:absolute;pointer-events:none}
        .bg-ghost{position:absolute;pointer-events:none;user-select:none;font-family:'Cormorant Garamond',serif;font-weight:700;line-height:1;color:transparent;-webkit-text-stroke:1px rgba(26,20,16,.04);white-space:nowrap}
        .grain{position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:.022;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")}
        .gold-shimmer{background:linear-gradient(90deg,#8a6a44 0%,#c8a96e 40%,#8a6a44 60%,#5c4020 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite}
        .scan-line{position:absolute;left:0;right:0;height:1px;background:linear-gradient(to right,transparent,#8a6a44,transparent);animation:scanAnim 3s linear infinite}
        .dot-pulse{animation:dotPulse 2s infinite}

        /* === MODAL === */
        .modal-overlay{position:fixed;inset:0;background:rgba(26,20,16,.55);backdrop-filter:blur(12px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
        .modal-box{background:#faf7f2;border:1px solid rgba(26,20,16,.1);width:100%;position:relative;animation:fadeInUp .35s ease;padding:40px;max-height:92vh;overflow-y:auto}
        .modal-input{width:100%;padding:14px 16px;background:#fff;border:1.5px solid rgba(26,20,16,.18);color:#1a1410;font-family:'Jost',sans-serif;font-size:15px;font-weight:400;outline:none;transition:border-color .3s;border-radius:0}
        .modal-input:focus{border-color:#8a6a44}
        .modal-label{font-family:'Jost',sans-serif;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:rgba(26,20,16,.55);display:block;margin-bottom:8px}

        /* === RESPONSIVE === */
        @media(max-width:900px){
          .hero-grid{grid-template-columns:1fr!important;text-align:center}
          .hero-img-col{display:none!important}
          .hero-stats{justify-content:center!important}
          .hero-btns{justify-content:center!important}
          .eyebrow{justify-content:center!important}
          .sec-grid-2{grid-template-columns:1fr!important}
          .manifesto-grid{grid-template-columns:1fr!important}
          .prod-tilted-grid{grid-template-columns:1fr!important}
          .prod-tilted-grid > div{transform:rotate(0deg)!important}
          .footer-grid{grid-template-columns:1fr!important}
          .footer-links-grid{grid-template-columns:1fr 1fr!important}
          .nav-desktop{display:none!important}
          .nav-mobile-btn{display:flex!important}
          .tryon-modal{flex-direction:column!important;max-width:480px!important}
          .tryon-cam{width:100%!important;aspect-ratio:4/3}
          .tryon-controls{width:100%!important;padding:24px!important}
          .glasses-grid{grid-template-columns:repeat(3,1fr)!important}
        }
        @media(max-width:600px){
          .sec-pad{padding:80px 20px!important}
          .sec-pad-sm{padding:60px 20px!important}
          .nav-pad{padding:16px 20px!important}
          .hero-h1{font-size:clamp(44px,11vw,72px)!important}
          .manifesto-h2{font-size:clamp(40px,10vw,60px)!important}
          .prod-tilted-grid{grid-template-columns:1fr 1fr!important}
          .glasses-grid{grid-template-columns:repeat(2,1fr)!important}
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
        <div className="nav-pad" style={{padding:navScrolled?"15px 48px":"24px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",maxWidth:1200,margin:"0 auto"}}>

          {/* Desktop left */}
          <div className="nav-desktop" style={{display:"flex",gap:32,alignItems:"center"}}>
            <Link href="/" className="nav-a" style={{color:"#000000"}}>Beranda</Link>
            <Link href="/koleksi" className="nav-a" style={{color:"#000000"}}>Katalog</Link>
          </div>

          {/* Center logo */}
          <Link href="/" style={{textDecoration:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <svg width="32" height="16" viewBox="0 0 30 15" fill="none">
              <rect x=".5" y=".5" width="12" height="14" rx="6" stroke="#8a6a44" strokeWidth="1.2"/>
              <rect x="17.5" y=".5" width="12" height="14" rx="6" stroke="#8a6a44" strokeWidth="1.2"/>
              <line x1="12" y1="7.5" x2="18" y2="7.5" stroke="#8a6a44" strokeWidth="1.2"/>
            </svg>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,letterSpacing:".15em",color:"#1a1410",textTransform:"uppercase"}}>Optik Aaliyah</span>
          </Link>

          {/* Desktop right */}
          <div className="nav-desktop" style={{display:"flex",gap:32,alignItems:"center"}}>
            {user ? (
              <>
                <span style={{fontFamily:"'Jost',sans-serif",fontSize:13,color:"#000000",fontWeight:500}}>{isAdmin?"Admin":user.email?.split("@")[0]}</span>
                <button onClick={handleLogout} className="nav-a"style={{color:"#000000"}}>Keluar</button>
              </>
            ) : (
              <>
                <button onClick={()=>setShowAuthModal(true)} className="nav-a">Masuk</button>
                <button onClick={()=>{setIsLoginMode(false);setShowAuthModal(true);}} className="btn-dark" style={{padding:"10px 24px",fontSize:12}}>Daftar</button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="nav-mobile-btn" onClick={()=>setShowAuthModal(true)} style={{background:"none",border:"none",cursor:"pointer",flexDirection:"column",gap:5,padding:4}}>
            <div style={{width:24,height:2,background:"#1a1410",borderRadius:2}}/>
            <div style={{width:24,height:2,background:"#1a1410",borderRadius:2}}/>
            <div style={{width:16,height:2,background:"#1a1410",borderRadius:2}}/>
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section style={{position:"relative",minHeight:"100vh",display:"flex",alignItems:"center",overflow:"hidden",background:"#f7f3ee"}}>
        <div style={{position:"absolute",inset:"-10%",backgroundImage:"url('https://images.unsplash.com/photo-1509695507497-903c140c43b0?q=80&w=2073')",backgroundSize:"cover",backgroundPosition:"center",transform:`translateY(${heroBgY}px)`,opacity:.07,filter:"sepia(1)",transition:"none"}}/>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 75% 85% at 55% 45%, rgba(220,200,170,.25) 0%, transparent 70%)"}}/>

        {/* Ornaments */}
        <svg className="ornament" style={{left:"-30px",top:"12%",width:280,opacity:.12,transform:`translateY(${scrollY*.07}px)`}} viewBox="0 0 280 380" fill="none">
          <path d="M260 190 C180 70 60 50 10 190 C60 330 180 310 260 190Z" stroke="#8a6a44" strokeWidth="1" fill="none"/>
          <path d="M260 190 L10 190" stroke="#8a6a44" strokeWidth=".5" strokeDasharray="4 7"/>
          <ellipse cx="135" cy="190" rx="38" ry="76" stroke="#8a6a44" strokeWidth=".5" fill="none" opacity=".5"/>
        </svg>
        <svg className="ornament" style={{right:"-15px",bottom:"6%",width:240,opacity:.1,transform:`translateY(${scrollY*-.05}px)`}} viewBox="0 0 240 150" fill="none">
          <rect x="2" y="2" width="96" height="76" rx="38" stroke="#8a6a44" strokeWidth="1.3"/>
          <rect x="142" y="2" width="96" height="76" rx="38" stroke="#8a6a44" strokeWidth="1.3"/>
          <line x1="98" y1="40" x2="142" y2="40" stroke="#8a6a44" strokeWidth="1.3"/>
          <line x1="2" y1="40" x2="-26" y2="66" stroke="#8a6a44" strokeWidth="1.3"/>
          <line x1="238" y1="40" x2="264" y2="66" stroke="#8a6a44" strokeWidth="1.3"/>
        </svg>

        <div className="sec-pad" style={{position:"relative",zIndex:10,maxWidth:1200,margin:"0 auto",padding:"0 48px",width:"100%",opacity:heroOpacity,transform:`translateY(${heroTextY}px)`,transition:"none"}}>
          <div className="hero-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:60,alignItems:"center"}}>
            <div>
              
              <h1 className="hero-h1" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(52px,6.5vw,88px)",fontWeight:300,lineHeight:.95,letterSpacing:"-.02em",marginBottom:32}}>
                {heroVisible && (
                  <>
                    <span className="h-line"><span className="h-line-inner l0" style={{color:"#1a1410"}}>Visi yang</span></span>
                    <span className="h-line"><span className="h-line-inner l1" style={{color:"#8a6a44",fontStyle:"italic"}}>Mendefinisikan</span></span>
                    <span className="h-line"><span className="h-line-inner l2" style={{color:"#1a1410"}}>Gaya Anda.</span></span>
                  </>
                )}
              </h1>
              {heroVisible && (
                <>
                  <p style={{fontFamily:"'Jost',sans-serif",fontSize:16,fontWeight:400,lineHeight:1.8,color:"rgb(26, 20, 16)",maxWidth:440,marginBottom:40,animation:"fadeInUp .9s .52s both"}}>
                    Eyewear premium lahir dari semangat Sidoarjo—memadukan material superior dengan estetika yang tak lekang oleh waktu.
                  </p>
                  <div className="hero-btns" style={{display:"flex",gap:14,flexWrap:"wrap",animation:"fadeInUp .9s .66s both"}}>
                    <Link href="/koleksi"><button className="btn-dark">Lihat Koleksi</button></Link>
                    <button onClick={openCamera} className="btn-outline">
                      <span style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",display:"inline-block",flexShrink:0}}/>
                      Coba AI Try-On
                    </button>
                  </div>
                  <div className="hero-stats" style={{marginTop:52,paddingTop:32,borderTop:"1px solid rgba(26,20,16,.12)",display:"flex",gap:48,animation:"fadeInUp .9s .82s both"}}>
                    {[["200+","Frame Koleksi"],["5K+","Pelanggan Puas"],["8","Tahun Berdiri"]].map(([n,l])=>(
                      <div key={l}>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:42,fontWeight:300,color:"#8a6a44",lineHeight:1}}>{n}</div>
                        <div style={{fontFamily:"'Jost',sans-serif",fontSize:11,letterSpacing:".2em",textTransform:"uppercase",color:"rgba(26, 20, 16, 0.8)",marginTop:4,fontWeight:500}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="hero-img-col" style={{display:"flex",justifyContent:"center",alignItems:"center",transform:`translateY(${heroImgY}px)`,transition:"none"}}>
              <div style={{position:"relative",animation:heroVisible?"floatUD 5s ease-in-out infinite":"none",animationDelay:"1.2s"}}>
                <div style={{position:"absolute",inset:-80,background:"radial-gradient(circle,rgba(176,152,120,.2) 0%,transparent 65%)",borderRadius:"50%"}}/>
                <img src={heroImage} alt="Kacamata Optik Aaliyah" style={{width:"100%",maxWidth:460,objectFit:"contain",mixBlendMode:"multiply",position:"relative",zIndex:1}}/>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{position:"absolute",bottom:32,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:8,opacity:heroOpacity*.5}}>
          <div style={{width:1,height:52,background:"linear-gradient(to bottom,transparent,#b09878)",animation:"scanAnim 2.2s ease-in-out infinite"}}/>
          <span style={{fontFamily:"'Jost',sans-serif",fontSize:10,letterSpacing:".4em",textTransform:"uppercase",color:"#b09878",fontWeight:500}}>Scroll</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          MANIFESTO STRIP
      ══════════════════════════════════════════════ */}
      <section ref={sec2Ref} data-id="s2" className="sec-pad" style={{position:"relative",padding:"140px 48px",background:"#f0ebe3",overflow:"hidden",textAlign:"center",borderTop:"1px solid rgba(26,20,16,.09)",borderBottom:"1px solid rgba(26,20,16,.09)"}}>
        <div className="bg-ghost" style={{fontSize:"clamp(80px,14vw,180px)",top:"50%",left:"50%",transform:`translate(-50%,-50%) translateY(${(scrollY-900)*.07}px)`,position:"absolute",zIndex:0}}>AALIYAH</div>

        <svg className="ornament" style={{left:"3%",top:"50%",width:200,opacity:.1,transform:`translateY(calc(-50% + ${(scrollY-900)*.1}px))`}} viewBox="0 0 210 130" fill="none">
          <rect x="2" y="2" width="84" height="68" rx="34" stroke="#8a6a44" strokeWidth="1.1"/>
          <rect x="124" y="2" width="84" height="68" rx="34" stroke="#8a6a44" strokeWidth="1.1"/>
          <line x1="86" y1="36" x2="124" y2="36" stroke="#8a6a44" strokeWidth="1.1"/>
          <line x1="2" y1="36" x2="-24" y2="58" stroke="#8a6a44" strokeWidth="1"/>
          <line x1="208" y1="36" x2="232" y2="58" stroke="#8a6a44" strokeWidth="1"/>
        </svg>

        <div style={{position:"relative",zIndex:2,maxWidth:780,margin:"0 auto"}}>
          <h2 className={`reveal ${vis.has("s2")?"in":""}`} style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(32px,5vw,64px)",fontWeight:300,lineHeight:1.15,color:"#1a1410",marginBottom:36}}>
            Eyewear terbaik untuk<br/>
            <em style={{fontStyle:"italic",color:"#8a6a44"}}>setiap cerita hidupmu.</em>
          </h2>
          <p className={`reveal d2 ${vis.has("s2")?"in":""}`} style={{fontFamily:"'Jost',sans-serif",fontSize:16,fontWeight:400,color:"rgba(26, 20, 16, 0.84)",lineHeight:1.8,maxWidth:520,margin:"0 auto 40px"}}>
            Temukan frame yang sempurna untuk wajah dan kepribadianmu. Lebih dari 200 pilihan koleksi premium siap menanti.
          </p>
          <div className={`reveal d3 ${vis.has("s2")?"in":""}`} style={{display:"flex",alignItems:"center",gap:20,justifyContent:"center",marginBottom:36}}>
            <div style={{flex:1,maxWidth:120,height:1,background:"linear-gradient(to right,transparent,rgba(26,20,16,.2))"}}/>
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><rect x=".5" y=".5" width="7" height="12" rx="3.5" stroke="#b09878" strokeWidth=".9"/><rect x="10.5" y=".5" width="7" height="12" rx="3.5" stroke="#b09878" strokeWidth=".9"/><line x1="7" y1="6.5" x2="11" y2="6.5" stroke="#b09878" strokeWidth=".9"/></svg>
            <div style={{flex:1,maxWidth:120,height:1,background:"linear-gradient(to left,transparent,rgba(26,20,16,.2))"}}/>
          </div>
          <div className={`reveal d4 ${vis.has("s2")?"in":""}`}>
            <Link href="/koleksi"><button className="btn-dark">Lihat Semua Koleksi →</button></Link>
          </div>  
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PRODUK UNGGULAN
      ══════════════════════════════════════════════ */}
      <section ref={sec3Ref} data-id="s3" className="sec-pad" style={{padding:"100px 48px",background:"#f7f3ee",position:"relative"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"url('https://images.unsplash.com/photo-1509695507497-903c140c43b0?q=80&w=2073')",backgroundSize:"cover",backgroundPosition:"center top",opacity:.03,filter:"sepia(1)"}}/>
        <div style={{maxWidth:1200,margin:"0 auto",position:"relative",zIndex:2}}>
          <div className={`reveal ${vis.has("s3")?"in":""}`} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:64,paddingBottom:28,borderBottom:"1px solid rgba(26,20,16,.12)"}}>
            <div>
              <p className="eyebrow" style={{marginBottom:14}}>Koleksi Terkini</p>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(34px,4.5vw,56px)",fontWeight:300,lineHeight:.95,letterSpacing:"-.01em",color:"#1a1410"}}>
                Frame <em style={{fontStyle:"italic",color:"#8a6a44"}}>Pilihan</em><br/>
                <span className="gold-shimmer">Bulan Ini.</span>
              </h2>
            </div>
            <Link href="/koleksi" style={{fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:500,letterSpacing:".15em",textTransform:"uppercase",textDecoration:"none",color:"#8a6a44",borderBottom:"2px solid rgba(138,106,68,.3)",paddingBottom:4,transition:"color .3s",whiteSpace:"nowrap"}}
              onMouseEnter={e=>(e.currentTarget.style.color="#5c4020")}
              onMouseLeave={e=>(e.currentTarget.style.color="#8a6a44")}
            >Lihat Semua →</Link>
          </div>

          <div className="prod-tilted-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:28,alignItems:"flex-end"}}>
            {products.map((item,i)=>{
              const tilts=[-4,0,4], hs=[320,390,320];
              return (
                <div key={item.id} className={`prod-card reveal d${i+1} ${vis.has("s3")?"in":""}`} style={{transform:`rotate(${tilts[i]||0}deg)`}}>
                  <div style={{background:"#e8e0d4",display:"flex",alignItems:"center",justifyContent:"center",height:hs[i]||360,overflow:"hidden"}}>
                    {item.gambar
                      ? <img src={item.gambar} alt={item.nama} className="prod-img-inner" style={{width:"100%",height:"100%",objectFit:"cover",mixBlendMode:"multiply"}}/>
                      : <div style={{fontSize:72,opacity:.35}}>🕶️</div>
                    }
                  </div>
                  <div style={{padding:"18px 22px 22px",borderTop:"none"}}>
                    <div style={{fontFamily:"'Jost',sans-serif",fontSize:10,fontWeight:500,letterSpacing:".35em",textTransform:"uppercase",color:"#b09878",marginBottom:6}}>Optik Aaliyah</div>
                    <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:500,color:"#1a1410",marginBottom:4}}>{item.nama}</h3>
                    <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,color:"#8a6a44",fontStyle:"italic",marginBottom:8}}>Rp {item.harga?.toLocaleString("id-ID")}</p>
                    <p style={{fontFamily:"'Jost',sans-serif",fontSize:13,color:"rgba(26,20,16,.55)",lineHeight:1.7,fontWeight:400,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{item.deskripsi}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="sep" style={{margin:"0 48px"}}/>

      {/* ══════════════════════════════════════════════
          AI TRY-ON SECTION
      ══════════════════════════════════════════════ */}
      <section ref={sec4Ref} data-id="s4" className="sec-pad" style={{padding:"100px 48px",background:"#f7f3ee",position:"relative"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div className="sec-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:72,alignItems:"center"}}>
            <div>
              <p className={`eyebrow reveal ${vis.has("s4")?"in":""}`} style={{marginBottom:20}}>Inovasi Teknologi</p>
              <h2 className={`reveal d1 ${vis.has("s4")?"in":""}`} style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(34px,4.5vw,56px)",fontWeight:300,lineHeight:1,letterSpacing:"-.01em",color:"#1a1410",marginBottom:24}}>
                Temukan<br/><em style={{fontStyle:"italic",color:"#8a6a44"}}>Frame Sempurna</em><br/>
                <span style={{color:"transparent",WebkitTextStroke:"1px rgba(26, 20, 16, 0.62)"}}>Untukmu.</span>
              </h2>
              <p className={`reveal d2 ${vis.has("s4")?"in":""}`} style={{fontFamily:"'Jost',sans-serif",fontSize:16,fontWeight:400,color:"rgb(26, 20, 16)",lineHeight:1.8,marginBottom:40,maxWidth:440}}>
                Engine TensorFlow kami mendeteksi bentuk wajahmu dan memberikan overlay kacamata secara langsung—layaknya punya stylist pribadi.
              </p>
              <div className={`reveal d3 ${vis.has("s4")?"in":""}`} style={{border:"1px solid rgba(26,20,16,.12)",display:"grid",gridTemplateColumns:"1fr 1fr",marginBottom:40}}>
                {[["Wajah Bulat","Pilih Frame Square — efek tirus"],["Wajah Persegi","Pilih Frame Round — lembutkan garis"],["Wajah Oval","Bebas pilih semua siluet frame"],["Wajah Hati","Pilih Aviator — melebar di bawah"]].map(([s,r],i)=>(
                  <div key={s} className="face-card" style={{borderRight:i%2===0?"1px solid rgba(26,20,16,.12)":"none",borderBottom:i<2?"1px solid rgba(26,20,16,.12)":"none"}}>
                    <div style={{fontFamily:"'Jost',sans-serif",fontSize:11,fontWeight:600,letterSpacing:".2em",textTransform:"uppercase",color:"#8a6a44",marginBottom:6}}>{s}</div>
                    <div style={{fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:400,color:"rgb(26, 20, 16)",lineHeight:1.6}}>{r}</div>
                  </div>
                ))}
              </div>
              <div className={`reveal d4 ${vis.has("s4")?"in":""}`}>
                <button onClick={openCamera} className="btn-dark" style={{display:"inline-flex",alignItems:"center",gap:12}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",flexShrink:0}}/>
                  Aktifkan Kamera AI
                </button>
              </div>
            </div>

            {/* Scanner panel */}
            <div className={`reveal d2 ${vis.has("s4")?"in":""}`} style={{border:"1px solid rgba(26,20,16,.12)",background:"#faf7f2",padding:40,position:"relative",boxShadow:"0 8px 40px rgba(26,20,16,.07)"}}>
              <div style={{position:"absolute",top:-1,left:32,background:"#1a1410",color:"#f7f3ee",fontFamily:"'Jost',sans-serif",fontSize:9,fontWeight:600,letterSpacing:".25em",padding:"5px 14px",textTransform:"uppercase"}}>TensorFlow AI</div>
              <div style={{width:"100%",height:200,position:"relative",overflow:"hidden",border:"1px solid rgba(26,20,16,.1)",marginBottom:28,display:"flex",alignItems:"center",justifyContent:"center",background:"#f0ebe3"}}>
                <svg width="96" height="116" viewBox="0 0 96 116" style={{opacity:.22}}>
                  <ellipse cx="48" cy="56" rx="36" ry="48" fill="none" stroke="#8a6a44" strokeWidth="1"/>
                  <line x1="32" y1="44" x2="42" y2="44" stroke="#8a6a44" strokeWidth="1"/>
                  <line x1="54" y1="44" x2="64" y2="44" stroke="#8a6a44" strokeWidth="1"/>
                  <path d="M36 72 Q48 82 60 72" fill="none" stroke="#8a6a44" strokeWidth="1"/>
                  <line x1="48" y1="56" x2="48" y2="65" stroke="#8a6a44" strokeWidth=".6"/>
                  <ellipse cx="37" cy="44" rx="5" ry="3" fill="none" stroke="#8a6a44" strokeWidth=".5"/>
                  <ellipse cx="59" cy="44" rx="5" ry="3" fill="none" stroke="#8a6a44" strokeWidth=".5"/>
                </svg>
                <div className="scan-line"/>
                {[{top:8,left:8,bw:"2px 0 0 2px"},{top:8,right:8,bw:"2px 2px 0 0"},{bottom:8,left:8,bw:"0 0 2px 2px"},{bottom:8,right:8,bw:"0 2px 2px 0"}].map((c,i)=>(
                  <div key={i} style={{position:"absolute",width:16,height:16,...c,borderColor:"#8a6a44",borderStyle:"solid",borderWidth:c.bw as any}}/>
                ))}
              </div>
              {["Deteksi 5 bentuk wajah secara real-time","Overlay AR pada 68 titik wajah","Rekomendasi frame akurasi 94%","Didukung TensorFlow + MediaPipe"].map((f,i)=>(
                <div key={f} style={{display:"flex",alignItems:"center",gap:14,padding:"11px 0",borderBottom:i<3?"1px solid rgba(26,20,16,.08)":"none"}}>
                  <div className="dot-pulse" style={{width:7,height:7,borderRadius:"50%",background:"#b09878",flexShrink:0,animationDelay:`${i*.35}s`}}/>
                  <span style={{fontFamily:"'Jost',sans-serif",fontSize:14,fontWeight:400,color:"rgb(26, 20, 16)"}}>{f}</span>
                </div>
              ))}
              <button onClick={openCamera} className="btn-dark" style={{width:"100%",marginTop:24}}>Buka Kamera Sekarang</button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          MANIFESTO
      ══════════════════════════════════════════════ */}
      <section ref={sec5Ref} data-id="s5" className="sec-pad" style={{padding:"120px 48px",background:"#f0ebe3",position:"relative",overflow:"hidden",borderTop:"1px solid rgba(26,20,16,.09)"}}>
        <div className="bg-ghost" style={{fontSize:"clamp(60px,11vw,150px)",top:"50%",left:"50%",transform:"translate(-50%,-50%)",position:"absolute",zIndex:0}}>SIDOARJO</div>
        <div style={{maxWidth:1200,margin:"0 auto",position:"relative",zIndex:2}}>
          <div className="manifesto-grid" style={{display:"grid",gridTemplateColumns:"5fr 7fr",gap:72,alignItems:"start"}}>
            <div className={`reveal ${vis.has("s5")?"in":""}`}>
              <p className="eyebrow" style={{marginBottom:20}}>Tentang Kami</p>
              <h2 className="manifesto-h2" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(44px,6vw,72px)",fontWeight:300,lineHeight:.92,letterSpacing:"-.02em"}}>
                Optik<br/>Aaliyah<br/>
                <span style={{color:"transparent",WebkitTextStroke:"1px rgba(26, 20, 16, 0.6)",fontStyle:"italic"}}>Manifesto.</span>
              </h2>
            </div>
            <div style={{background:"#fff",border:"1px solid rgba(26,20,16,.1)",padding:"40px 48px",boxShadow:"0 8px 40px rgba(26,20,16,.06)"}}>
              <p className={`reveal d1 ${vis.has("s5")?"in":""}`} style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:300,lineHeight:1.75,color:"rgb(26, 20, 16)",marginBottom:40}}>
                Lahir di Sidoarjo dengan semangat mengubah cara dunia melihat Anda. Kami percaya kacamata bukan sekadar alat bantu—melainkan pernyataan gaya yang paling mendalam.
              </p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:28,paddingTop:32,borderTop:"1px solid rgba(26,20,16,.1)"}}>
                {[{h:"Visi Kami",p:"Menjadi standar baru kurasi eyewear yang menggabungkan kualitas material superior dengan desain tak lekang waktu."},{h:"Filosofi",p:"Setiap frame dipilih dengan presisi tinggi—keseimbangan sempurna antara kenyamanan dan estetika yang memukau."}].map((m,i)=>(
                  <div key={m.h} className={`reveal d${i+2} ${vis.has("s5")?"in":""}`}>
                    <div style={{fontFamily:"'Jost',sans-serif",fontSize:11,fontWeight:600,letterSpacing:".25em",textTransform:"uppercase",color:"#8a6a44",marginBottom:12}}>{m.h}</div>
                    <p style={{fontFamily:"'Jost',sans-serif",fontSize:14,fontWeight:400,color:"rgba(26, 20, 16, 0.85)",lineHeight:1.8}}>{m.p}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

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
              <p style={{fontFamily:"'Jost',sans-serif",fontSize:11,letterSpacing:".25em",textTransform:"uppercase",color:"rgba(247,243,238,.3)",marginBottom:24,fontWeight:500}}>Eyewear Premium · Sidoarjo, ID</p>
              <p style={{fontFamily:"'Jost',sans-serif",fontSize:14,fontWeight:400,color:"rgba(247,243,238,.45)",lineHeight:1.8,maxWidth:300}}>Mendefinisikan ulang gaya kacamata dengan kurasi frame premium berkualitas tinggi.</p>
            </div>
            <div className="footer-links-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
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
            <p style={{fontFamily:"'Jost',sans-serif",fontSize:11,letterSpacing:".2em",textTransform:"uppercase",color:"rgba(247,243,238,.25)",fontWeight:400}}>© 2026 Optik Aaliyah. All rights reserved.</p>
            <div style={{display:"flex",alignItems:"center",gap:8,fontFamily:"'Jost',sans-serif",fontSize:11,letterSpacing:".2em",textTransform:"uppercase",color:"rgba(176,152,120,.45)"}}>
              <div className="dot-pulse" style={{width:6,height:6,borderRadius:"50%",background:"#b09878"}}/>
              Sidoarjo, ID
            </div>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════
          MODAL: AI TRY-ON
      ══════════════════════════════════════════════ */}
      {isTryOnOpen && (
        <div className="modal-overlay" onClick={closeCamera}>
          <div className="tryon-modal" onClick={e=>e.stopPropagation()} style={{background:"#faf7f2",border:"1px solid rgba(26,20,16,.12)",width:"100%",maxWidth:900,display:"flex",animation:"fadeInUp .4s ease",boxShadow:"0 32px 80px rgba(26,20,16,.18)",maxHeight:"92vh",overflowY:"auto"}}>
            {/* Camera side */}
            <div className="tryon-cam" style={{width:"55%",background:"#e8e0d4",position:"relative",aspectRatio:"4/3",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
              <button onClick={closeCamera} style={{position:"absolute",top:12,right:12,zIndex:10,background:"rgba(26,20,16,.5)",border:"none",cursor:"pointer",color:"#f7f3ee",padding:"6px 9px",borderRadius:4}}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              {isProcessing && (
                <div style={{position:"absolute",inset:0,zIndex:20,background:"rgba(247,243,238,.9)",backdropFilter:"blur(6px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
                  <svg style={{width:36,height:36,color:"#8a6a44",animation:"spinAnim 1s linear infinite"}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                    <path style={{opacity:.8}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <p style={{fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:500,letterSpacing:".2em",textTransform:"uppercase",color:"#8a6a44"}}>Memindai Wajah...</p>
                </div>
              )}
              {tryOnResult
                ? <img src={tryOnResult} alt="Hasil" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
                : <video ref={videoRef} autoPlay playsInline style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)"}}/>
              }
              <canvas ref={canvasRef} style={{display:"none"}}/>
            </div>

            {/* Controls side */}
            <div className="tryon-controls" style={{width:"45%",padding:32,display:"flex",flexDirection:"column",overflowY:"auto"}}>
              <p className="eyebrow" style={{marginBottom:10,fontSize:9}}>AI Face Scanner</p>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:300,color:"#1a1410",marginBottom:12,lineHeight:1.1}}>
                Coba Frame<br/><em style={{fontStyle:"italic",color:"#8a6a44"}}>Virtualmu.</em>
              </h2>
              <p style={{fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:400,color:"rgba(26,20,16,.55)",lineHeight:1.7,marginBottom:20}}>
                Posisikan wajahmu di tengah layar lalu pilih model kacamata di bawah ini.
              </p>

              {/* Detected shape result */}
              {tryOnResult && detectedShapes.length > 0 && (
                <div style={{marginBottom:20,border:"1px solid rgba(138,106,68,.3)",background:"rgba(176,152,120,.1)",padding:16}}>
                  <p style={{fontFamily:"'Jost',sans-serif",fontSize:10,fontWeight:600,letterSpacing:".3em",textTransform:"uppercase",color:"#8a6a44",marginBottom:4}}>Hasil Deteksi</p>
                  <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:400,color:"#1a1410",fontStyle:"italic"}}>{detectedShapes.join(", ")} Face</h3>
                </div>
              )}

              {/* Glasses selector with SVG illustrations */}
              <div style={{marginBottom:20}}>
                <p style={{fontFamily:"'Jost',sans-serif",fontSize:11,fontWeight:600,letterSpacing:".2em",textTransform:"uppercase",color:"rgba(26,20,16,.55)",marginBottom:12}}>Pilih Model Kacamata</p>
                <div className="glasses-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  {GLASSES_OPTIONS.map((g)=>(
                    <button key={g.id} onClick={()=>setGlassesIndex(g.id)} className={`glasses-btn${glassesIndex===g.id?" active":""}`}>
                      {/* SVG illustration */}
                      <div style={{width:"100%",height:44,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {g.svg}
                      </div>
                      <span style={{fontFamily:"'Jost',sans-serif",fontSize:10,fontWeight:500,letterSpacing:".05em",color:glassesIndex===g.id?"#8a6a44":"rgba(26,20,16,.55)",textAlign:"center",lineHeight:1.3}}>{g.nama}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected glasses info */}
              <div style={{background:"rgba(26,20,16,.04)",border:"1px solid rgba(26,20,16,.1)",padding:"12px 16px",marginBottom:20}}>
                <p style={{fontFamily:"'Jost',sans-serif",fontSize:11,fontWeight:600,color:"#8a6a44",marginBottom:2}}>{selectedGlasses.nama}</p>
                <p style={{fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:400,color:"rgba(26,20,16,.5)"}}>{selectedGlasses.bentuk}</p>
              </div>

              {/* Action button */}
              <div style={{marginTop:"auto"}}>
                {tryOnResult
                  ? <button onClick={()=>setTryOnResult(null)} className="btn-outline" style={{width:"100%"}}>↺ Ulangi Pindai</button>
                  : <button onClick={captureAndProcess} disabled={isProcessing} className="btn-dark" style={{width:"100%",opacity:isProcessing?.5:1}}>
                      Ambil Foto & Analisis
                    </button>
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MODAL: AUTH
      ══════════════════════════════════════════════ */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={()=>setShowAuthModal(false)}>
          <div className="modal-box" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setShowAuthModal(false)} style={{position:"absolute",top:16,right:16,background:"transparent",border:"none",cursor:"pointer",color:"rgba(26,20,16,.4)"}}>
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
              <button type="submit" className="btn-dark" style={{width:"100%",padding:"16px",fontSize:14,marginTop:4}}>
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
    </main>
  );
}