// PrashanBaanLogo.jsx — IT UTSAV 4.0 Edition
// Uses actual image assets for both logos

import prashanbaanImg from '../assets/prashanbaan-logo.png';
import uttaranchalImg from '../assets/uttaranchal-logo.png';

/* ─────────────────────────────────────────────────────────
   HERO LOGO — used on LobbyPage (large, centred)
───────────────────────────────────────────────────────── */
export function PrashanBaanHeroLogo({ compact = false }) {
  return (
    <div className="flex flex-col items-center select-none gap-4">
      {/* University logo top */}
      <img
        src={uttaranchalImg}
        alt="Uttaranchal University"
        className={`object-contain ${compact ? 'h-10' : 'h-14'}`}
        style={{ filter: 'drop-shadow(0 0 8px rgba(0,245,255,0.3))' }}
      />

      {/* PrashanBaan logo centre */}
      <img
        src={prashanbaanImg}
        alt="PrashanBaan IT UTSAV 4.0"
        className={`object-contain ${compact ? 'h-24' : 'h-40'}`}
        style={{ filter: 'drop-shadow(0 0 20px rgba(255,0,110,0.5)) drop-shadow(0 0 40px rgba(0,245,255,0.3))' }}
      />

      {/* Divider */}
      <div
        className="w-64 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.5), rgba(255,0,110,0.5), transparent)' }}
      />

      <p className="font-body text-[10px] tracking-[0.55em] text-white/25 uppercase">
        The Arrow of Knowledge
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MINI LOGO — used in game headers (compact horizontal)
───────────────────────────────────────────────────────── */
export function PrashanBaanMiniLogo() {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* University */}
      <img
        src={uttaranchalImg}
        alt="Uttaranchal University"
        className="h-9 object-contain opacity-80"
        style={{ filter: 'drop-shadow(0 0 4px rgba(0,245,255,0.2))' }}
      />
      {/* PrashanBaan */}
      <img
        src={prashanbaanImg}
        alt="PrashanBaan IT UTSAV 4.0"
        className="h-11 object-contain"
        style={{ filter: 'drop-shadow(0 0 8px rgba(255,0,110,0.4))' }}
      />
    </div>
  );
}
