'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus_Jakarta_Sans, Caveat, Cairo } from 'next/font/google';
import {
  ChevronRight, ChevronDown, Menu, X, Download, ArrowRight, Check,
  Facebook, Instagram, Linkedin, Mail, Phone, Send, MapPin,
} from 'lucide-react';
import {
  DropIcon, BoltIcon, SnowIcon, ToolsIcon, RollerIcon, WasherIcon, BroomIcon, LeafIcon,
  ClockIcon, ShieldIcon, CardIcon, UsersIcon, StarIcon, HeadsetIcon, ListIcon, UserIcon,
  CalendarIcon, HouseIcon, DocCheckIcon, PinIcon, ChartIcon, ChatIcon, UserPlusIcon,
  BriefcaseIcon, QuoteIcon,
} from '@/components/home/icons';
import { Reveal, CountUp } from '@/components/home/motion';
import { DICTS, LANGS, type Dict, type Lang } from '@/components/home/i18n';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });
const caveat = Caveat({ subsets: ['latin'], weight: ['700'] });
const cairo = Cairo({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700', '800'] });

const BLUE = '#1d6ff2';
const LANG_STORAGE_KEY = 'fixpro-lang';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.fixpro.mobile';
const APP_STORE_URL = 'https://apps.apple.com/tn/app/fixpro-services/id6785690252';

// Section ids, in the same order as `nav` in the dictionaries
const NAV_IDS = ['accueil', 'services', 'comment-ca-marche', 'pourquoi-fixpro', 'devenir-technicien', 'faq'];

// Visuals only — the copy for each entry lives at the same index in i18n.ts
const SERVICES = [
  { icon: DropIcon, color: '#1d6ff2', bg: '#e8f0fe' },
  { icon: BoltIcon, color: '#f5a800', bg: '#fff5d6' },
  { icon: SnowIcon, color: '#1d6ff2', bg: '#e8f0fe' },
  { icon: ToolsIcon, color: '#8b3dff', bg: '#f1e8ff' },
  { icon: RollerIcon, color: '#f0445a', bg: '#fdebee' },
  { icon: WasherIcon, color: '#1d6ff2', bg: '#e8f0fe' },
  { icon: BroomIcon, color: '#22a35a', bg: '#e4f6ea' },
  { icon: LeafIcon, color: '#22a35a', bg: '#e4f6ea' },
];

const HERO_FEATURES = [
  { icon: BoltIcon, color: '#f5a800', bg: '#fff5d6' },
  { icon: ClockIcon, color: BLUE, bg: '#e8f0fe' },
  { icon: ShieldIcon, color: '#22a35a', bg: '#e4f6ea' },
];

const STEPS = [
  { icon: ListIcon, color: BLUE },
  { icon: UserIcon, color: BLUE },
  { icon: CalendarIcon, color: '#f59e0b' },
  { icon: HouseIcon, color: BLUE },
];

const STATS = [UsersIcon, StarIcon, ShieldIcon, HeadsetIcon];

const NUMBERS = [
  { icon: ShieldIcon, to: 120, prefix: '+' },
  { icon: UsersIcon, to: 10000, prefix: '+' },
  { icon: StarIcon, to: 4.8, decimals: 1, suffix: '/5' },
  { icon: ListIcon, to: 8 },
];

const WHY_POINTS = [
  { icon: ShieldIcon, color: '#22a35a', bg: '#e4f6ea' },
  { icon: DocCheckIcon, color: BLUE, bg: '#e8f0fe' },
  { icon: CardIcon, color: '#8b3dff', bg: '#f1e8ff' },
  { icon: ChatIcon, color: '#f5a800', bg: '#fff5d6' },
];

// Index into SERVICES for each testimonial, plus its star rating
const TESTIMONIAL_META = [
  { service: 0, rating: 5 }, { service: 2, rating: 5 }, { service: 1, rating: 5 }, { service: 3, rating: 4 },
  { service: 6, rating: 5 }, { service: 7, rating: 5 }, { service: 5, rating: 5 }, { service: 4, rating: 4 },
];

const AVATAR_GRADIENTS = [
  'from-[#1d6ff2] to-[#38bdf8]', 'from-[#8b3dff] to-[#c084fc]', 'from-[#22a35a] to-[#4ade80]', 'from-[#f59e0b] to-[#fbbf24]',
];

const WORKER_STEPS = [UserPlusIcon, ShieldIcon, BriefcaseIcon];
const WORKER_BENEFITS = [ChartIcon, ClockIcon, PinIcon];

const initials = (name: string) => name.split(' ').map(p => p[0]).join('');

function Logo({ dark = false, className = 'h-[54px]' }: { dark?: boolean; className?: string }) {
  return (
    <a href="#accueil" className="shrink-0">
      <Image
        src="/images/logo.png"
        alt="FixPro"
        width={320}
        height={110}
        priority={!dark}
        className={`${className} w-auto ${dark ? 'brightness-0 invert' : ''}`}
      />
    </a>
  );
}

function Flag({ lang }: { lang: Lang }) {
  if (lang === 'fr') {
    return (
      <span className="w-5 h-5 rounded-full overflow-hidden flex shrink-0 ring-1 ring-black/5">
        <span className="flex-1 bg-[#1d4ed8]" />
        <span className="flex-1 bg-white" />
        <span className="flex-1 bg-[#ef4444]" />
      </span>
    );
  }
  if (lang === 'en') {
    return (
      <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" className="w-5 h-5 rounded-full shrink-0 ring-1 ring-black/5" aria-hidden>
        <rect width="60" height="30" fill="#012169" />
        <path d="M0 0 60 30M60 0 0 30" stroke="#fff" strokeWidth="6" />
        <path d="M0 0 60 30M60 0 0 30" stroke="#c8102e" strokeWidth="2.5" />
        <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
        <path d="M30 0v30M0 15h60" stroke="#c8102e" strokeWidth="6" />
      </svg>
    );
  }
  // Tunisia
  const star = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 2.3 : 0.95;
    const a = Math.PI / 5 * i + Math.PI;
    return `${(16.3 + r * Math.cos(a)).toFixed(2)},${(10 + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice" className="w-5 h-5 rounded-full shrink-0 ring-1 ring-black/5" aria-hidden>
      <rect width="30" height="20" fill="#e70013" />
      <circle cx="15" cy="10" r="5.6" fill="#fff" />
      <circle cx="14.2" cy="10" r="4.1" fill="#e70013" />
      <circle cx="15.3" cy="10" r="3.3" fill="#fff" />
      <polygon points={star} fill="#e70013" />
    </svg>
  );
}

function LanguageSelect({ lang, onChange, label, className = '' }: { lang: Lang; onChange: (l: Lang) => void; label: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find(l => l.code === lang)!;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[15px] text-[#0b1533] hover:bg-gray-50 transition-colors"
      >
        <Flag lang={lang} /> <span className="max-sm:hidden">{current.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul role="listbox" className="absolute end-0 top-full mt-2 w-44 bg-white rounded-xl shadow-[0_14px_40px_rgba(15,40,90,0.16)] border border-gray-100 p-1.5 z-50">
          {LANGS.map(l => (
            <li key={l.code}>
              <button
                role="option"
                aria-selected={l.code === lang}
                dir={l.dir}
                onClick={() => {
                  onChange(l.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] text-start transition-colors ${
                  l.code === lang ? 'bg-[#e8f0fe] text-[#1d6ff2] font-semibold' : 'hover:bg-gray-50'
                } ${l.code === 'ar' ? cairo.className : ''}`}
              >
                <Flag lang={l.code} /> <span className="flex-1">{l.label}</span>
                {l.code === lang && <Check className="w-4 h-4" strokeWidth={3} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GooglePlayIcon() {
  return (
    <svg viewBox="0 0 24 26" className="w-7 h-7 shrink-0" aria-hidden>
      <path d="M1 1.2 13.6 13 1 24.8c-.4-.2-.6-.7-.6-1.2V2.4c0-.5.2-1 .6-1.2Z" fill="#00d7fe" />
      <path d="M17.6 9.2 13.6 13 1 1.2c.3-.2.8-.2 1.3.1l15.3 7.9Z" fill="#00f076" />
      <path d="M17.6 16.8 2.3 24.7c-.5.3-1 .3-1.3.1L13.6 13l4 3.8Z" fill="#ff3a44" />
      <path d="m22.4 11.7-4.8-2.5-4 3.8 4 3.8 4.8-2.5c1.1-.6 1.1-2 0-2.6Z" fill="#ffd500" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" fill="currentColor" aria-hidden>
      <path d="M16.37 1.43c0 1.14-.5 2.27-1.18 3.08-.74.9-1.99 1.57-2.99 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.2-2.98.81-.94 2.15-1.64 3.25-1.68.03.13.06.28.06.43Zm4.56 15.71c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.94 2.71-3.43 2.71-1.52 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8-1.29-1.82-2.32-4.63-2.32-7.28 0-4.28 2.8-6.55 5.55-6.55 1.45 0 2.67.95 3.6.95.86 0 2.22-1.01 3.9-1.01.61 0 2.89.06 4.37 2.19-.13.09-2.38 1.37-2.38 4.19 0 3.26 2.85 4.42 2.96 4.45Z" />
    </svg>
  );
}

function StoreBadges({ t }: { t: Dict }) {
  return (
    <div className="flex flex-wrap gap-3">
      <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 bg-black hover:bg-gray-900 hover:-translate-y-0.5 text-white rounded-xl ps-3 pe-4 py-1.5 transition-all">
        <GooglePlayIcon />
        <span className="leading-tight">
          <span className="block text-[10px] font-medium tracking-wide">{t.app.playTop}</span>
          <span className="block text-[19px] font-semibold -mt-0.5">Google Play</span>
        </span>
      </a>
      <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 bg-black hover:bg-gray-900 hover:-translate-y-0.5 text-white rounded-xl ps-3 pe-4 py-1.5 transition-all">
        <AppleIcon />
        <span className="leading-tight">
          <span className="block text-[11px] font-medium">{t.app.appleTop}</span>
          <span className="block text-[19px] font-semibold -mt-0.5">App Store</span>
        </span>
      </a>
    </div>
  );
}

/** Forward arrow that points the reading direction (flipped in Arabic). */
function Forward({ className = 'w-4 h-4' }: { className?: string }) {
  return <ArrowRight className={`${className} rtl:-scale-x-100`} />;
}

function SectionHeading({ eyebrow, title, desc, light = false }: { eyebrow: string; title: string; desc?: string; light?: boolean }) {
  return (
    <Reveal className="text-center max-w-2xl mx-auto">
      <span className={`inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.14em] px-3 py-1.5 rounded-full ${light ? 'bg-white/10 text-white' : 'bg-[#e8f0fe] text-[#1d6ff2]'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${light ? 'bg-white' : 'bg-[#1d6ff2]'}`} />
        {eyebrow}
      </span>
      <h2 className={`mt-4 text-[32px] sm:text-[40px] font-extrabold leading-[1.1] tracking-[-0.02em] ${light ? 'text-white' : ''}`}>{title}</h2>
      {desc && <p className={`mt-4 text-[16px] leading-relaxed ${light ? 'text-blue-100' : 'text-[#4b5672]'}`}>{desc}</p>}
    </Reveal>
  );
}

function Stars({ rating, className = 'w-4 h-4' }: { rating: number; className?: string }) {
  return (
    <span className="flex gap-0.5">
      {[0, 1, 2, 3, 4].map(i => (
        <StarIcon key={i} className={`${className} ${i < rating ? 'text-[#f5a800]' : 'text-gray-200'}`} />
      ))}
    </span>
  );
}

function TestimonialCard({
  item, service, rating, index, dir,
}: { item: Dict['testimonials']['items'][number]; service: string; rating: number; index: number; dir: 'ltr' | 'rtl' }) {
  return (
    <figure dir={dir} className="w-[340px] sm:w-[380px] shrink-0 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(15,40,90,0.07)] border border-[#eef2f8] hover:shadow-[0_16px_40px_rgba(15,40,90,0.12)] hover:-translate-y-1 transition-all">
      <div className="flex items-center justify-between">
        <Stars rating={rating} />
        <QuoteIcon className="w-8 h-8 text-[#e8f0fe] rtl:-scale-x-100" />
      </div>
      <blockquote className="mt-3 text-[15px] leading-relaxed text-[#33405a]">“{item.text}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className={`w-11 h-11 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]} text-white font-bold flex items-center justify-center text-[14px]`}>
          {initials(item.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-[15px]">{item.name}</span>
          <span className="block text-[13px] text-[#6b7590]">{item.city}</span>
        </span>
        <span className="text-[12px] font-semibold text-[#1d6ff2] bg-[#e8f0fe] px-2.5 py-1 rounded-full">{service}</span>
      </figcaption>
    </figure>
  );
}

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('fr');
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [active, setActive] = useState('accueil');
  const [scrolled, setScrolled] = useState(false);

  const t = DICTS[lang];
  const { locale, dir } = LANGS.find(l => l.code === lang)!;
  const isAr = lang === 'ar';
  // French by default; only a language the visitor picked before overrides it
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(LANG_STORAGE_KEY);
    } catch {}
    if (saved === 'en' || saved === 'ar') setLang(saved);
  }, []);

  const changeLang = (next: Lang) => {
    setLang(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {}
  };

  // Scroll-spy: highlight the nav link of the section under the header
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      // Nav order differs from page order, so pick the section whose top is closest above the line
      let current = 'accueil';
      let best = -Infinity;
      for (const id of NAV_IDS) {
        const top = document.getElementById(id)?.getBoundingClientRect().top ?? Infinity;
        if (top <= 140 && top > best) {
          best = top;
          current = id;
        }
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = NAV_IDS.map((id, i) => ({ id, label: t.nav[i] }));
  // Phone header sits transparently over the hero until the page scrolls or the menu opens
  const overlay = !scrolled && !menuOpen;
  const testimonials = t.testimonials.items.map((item, i) => ({ item, ...TESTIMONIAL_META[i] }));
  const rows = [testimonials.slice(0, 4), testimonials.slice(4)];

  return (
    <div lang={lang} dir={dir} className={`${isAr ? cairo.className : jakarta.className} min-h-screen bg-white text-[#0b1533] overflow-x-clip`}>
      {/* Header */}
      {/* On phones the bar floats over the hero: transparent with no logo at the top, solid once scrolled or with the menu open */}
      <header
        className={`max-md:fixed max-md:inset-x-0 sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
          scrolled ? 'shadow-[0_6px_24px_rgba(15,23,42,0.08)]' : 'md:shadow-[0_1px_0_rgba(15,23,42,0.06)]'
        } ${overlay ? 'max-md:bg-transparent md:bg-white/95 md:backdrop-blur' : 'bg-white/95 backdrop-blur'}`}
      >
        <div className="max-w-[1440px] mx-auto px-5 lg:px-12 h-[72px] flex items-center justify-between gap-6">
          <div className="max-md:hidden">
            <Logo />
          </div>

          <nav className="hidden xl:flex items-center gap-5 2xl:gap-8 h-full">
            {navLinks.map(link => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`relative h-full flex items-center whitespace-nowrap text-[14px] font-medium transition-colors after:absolute after:left-0 after:right-0 after:bottom-[18px] after:h-[2px] after:rounded-full after:bg-[#1d6ff2] after:transition-transform after:duration-300 ${
                  active === link.id ? 'text-[#1d6ff2] after:scale-x-100' : 'text-[#0b1533] hover:text-[#1d6ff2] after:scale-x-0'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden xl:flex items-center gap-2 2xl:gap-4">
            <LanguageSelect lang={lang} onChange={changeLang} label={t.language} />
            <a
              href="#telecharger"
              className="inline-flex items-center gap-2.5 whitespace-nowrap bg-[#1d6ff2] hover:bg-[#165fd6] hover:-translate-y-0.5 text-white text-[15px] 2xl:text-[17px] font-semibold px-5 2xl:px-7 py-3 2xl:py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all"
            >
              <Download className="w-5 h-5" /> {t.downloadApp}
            </a>
          </div>

          <div className={`xl:hidden ml-auto flex items-center gap-1 rounded-2xl transition-colors ${overlay ? 'max-md:bg-white/75 max-md:backdrop-blur-md max-md:shadow-[0_4px_16px_rgba(15,40,90,0.12)] max-md:ps-1' : ''}`}>
            <LanguageSelect lang={lang} onChange={changeLang} label={t.language} />
            <button onClick={() => setMenuOpen(v => !v)} className="p-2 text-[#0b1533]" aria-label={t.menu}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="xl:hidden border-t border-gray-100 bg-white px-5 py-4 flex flex-col gap-4">
            {navLinks.map(link => (
              <a key={link.id} href={`#${link.id}`} onClick={() => setMenuOpen(false)} className={`text-sm font-medium ${active === link.id ? 'text-[#1d6ff2]' : 'text-[#0b1533]'}`}>
                {link.label}
              </a>
            ))}
            <a href="#telecharger" onClick={() => setMenuOpen(false)} className="inline-flex items-center justify-center gap-2 bg-[#1d6ff2] text-white text-sm font-semibold px-5 py-3 rounded-xl">
              <Download className="w-4 h-4" /> {t.downloadApp}
            </a>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="accueil" className="relative overflow-hidden bg-[#f3f7fc] lg:h-[max(600px,40vw)] lg:max-h-[820px]">
        {/* Desktop: full-bleed banner. object-position 47% pins the phone's left edge to 47% of the viewport so it never slides under the text column. */}
        <img
          src="/images/hero.PNG"
          alt=""
          className="hidden lg:block absolute inset-0 w-full h-full object-cover object-[47%_center]"
        />
        <div className="hidden lg:block absolute inset-y-0 left-0 w-[48%] bg-gradient-to-r from-white/70 via-white/40 to-transparent" />

        {/* Phones, every language: poster artwork that already contains the title, subtitle and feature row.
            `sizes` of 1px at md+ makes desktops fetch only a tiny variant of this hidden image. */}
        <Image
          src="/images/hero-mobile.PNG"
          alt={`FixPro — ${t.hero.title1} ${t.hero.title2}`}
          width={941}
          height={1672}
          priority
          sizes="(min-width: 768px) 1px, 100vw"
          className="md:hidden block w-full h-auto"
        />

        <div className="relative max-w-[1440px] mx-auto px-5 lg:px-12 md:py-10 lg:py-0 lg:pb-8 h-full lg:flex lg:items-center">
          {/* Physical mr-auto keeps the text over the banner's empty left side in Arabic too */}
          <div className={`${isAr ? 'lg:max-w-[min(580px,calc(47vw-100px))]' : 'lg:max-w-[min(620px,calc(47vw-48px))]'} lg:mr-auto`}>
            <h1 className={`sr-only md:not-sr-only animate-hero-in text-[42px] sm:text-[54px] lg:text-[clamp(46px,4.4vw,72px)] font-extrabold ${isAr ? 'leading-[1.25]' : 'leading-[1.02]'} tracking-[-0.03em]`}>
              {t.hero.title1}<br />
              <span className="text-[#1d6ff2]">{t.hero.title2}</span>
            </h1>
            <p className="hidden md:block animate-hero-in [animation-delay:120ms] mt-4 text-[17px] lg:text-[clamp(16px,1.35vw,21px)] leading-snug text-[#33405a]">
              {t.hero.subtitle}
            </p>

            <div className="hidden md:grid animate-hero-in [animation-delay:220ms] mt-7 lg:mt-[clamp(24px,2.4vw,40px)] grid-cols-3 gap-3 lg:gap-4">
              {HERO_FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: f.bg }}>
                    <f.icon className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: f.color }} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold leading-tight">{t.hero.features[i].title}</p>
                    <p className="text-[12px] text-[#4b5672] leading-tight mt-0.5 2xl:whitespace-nowrap">{t.hero.features[i].desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Handwritten tagline over the kitchen side of the banner (2xl only: narrower screens put the technician's cap there) */}
        <div className="hidden 2xl:block absolute right-[2%] top-[6%] -rotate-[8deg] text-white text-center animate-hero-in [animation-delay:500ms]">
          <p className={`${isAr ? `${cairo.className} font-extrabold text-[clamp(26px,2.2vw,40px)] leading-[1.25]` : `${caveat.className} text-[clamp(30px,2.6vw,46px)] leading-[0.95]`} drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]`}>
            {t.hero.tagline1}<br />{t.hero.tagline2}
          </p>
          <svg viewBox="0 0 220 24" className="w-[80%] ml-auto -mt-1" aria-hidden>
            <path d="M4 20 C 70 6, 150 4, 216 8" stroke="#3b9bff" strokeWidth="5" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        {/* Tablet: the phone + technician part of the banner under the text */}
        <div className="hidden md:block lg:hidden relative h-[420px]">
          <img src="/images/hero.PNG" alt="" className="absolute inset-0 w-full h-full object-cover object-[72%_center]" />
        </div>
      </section>

      {/* How it works + download card */}
      <section className="relative z-10 bg-white lg:-mt-8 rounded-t-[28px]">
        <div className="max-w-[1440px] mx-auto px-5 lg:px-12 pt-10 pb-8 grid xl:grid-cols-[1fr_minmax(0,520px)] gap-8 items-center">
          <div id="comment-ca-marche" className="scroll-mt-24">
            <Reveal>
              <h2 className="text-[24px] font-extrabold flex items-center gap-4">
                {t.how.title}
                <span className="w-10 h-[3px] rounded-full bg-[#1d6ff2]" />
              </h2>
            </Reveal>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6">
              {STEPS.map((step, i) => (
                <Reveal key={i} delay={i * 110} className="relative flex flex-col items-center text-center group">
                  <span className="w-[88px] h-[88px] rounded-full bg-[#eef4ff] flex items-center justify-center group-hover:scale-105 group-hover:bg-[#e2ecff] transition-all">
                    <step.icon className="w-10 h-10" style={{ color: step.color }} />
                  </span>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className="hidden md:block absolute top-[34px] -end-[18%] w-5 h-5 text-gray-400 rtl:-scale-x-100" />
                  )}
                  <div className="mt-4 flex items-start gap-2 text-start">
                    <span className="w-7 h-7 rounded-full bg-[#1d6ff2] text-white text-[14px] font-bold flex items-center justify-center shrink-0 -mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-[14px] font-bold leading-tight 2xl:whitespace-nowrap">{t.how.steps[i].title}</h3>
                      <p className="mt-1.5 text-[13px] text-[#4b5672] leading-snug">{t.how.steps[i].desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Background image for this card will be added later — set it via backgroundImage on this div */}
          <Reveal from="right">
            <div
              id="telecharger"
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1d6ff2] to-[#0f4fd1] min-h-[190px] px-7 py-7 flex flex-col justify-center scroll-mt-24"
            >
              <div className="relative z-10 sm:max-w-[78%]">
                <h2 className="text-[28px] font-extrabold text-white leading-tight">{t.app.title}</h2>
                <p className="mt-1.5 text-[18px] font-medium text-white/90">{t.app.subtitle}</p>
                <div className="mt-5">
                  <StoreBadges t={t} />
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Stats */}
        <div className="max-w-[1440px] mx-auto px-5 lg:px-12 pb-16">
          <Reveal>
            <div className="rounded-2xl bg-white shadow-[0_6px_30px_rgba(15,40,90,0.08)] grid sm:grid-cols-2 lg:grid-cols-4">
              {STATS.map((Icon, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 px-6 py-6 ${i > 0 ? 'lg:border-s' : ''} ${i % 2 === 1 ? 'sm:border-s' : ''} border-gray-200 lg:my-4 lg:py-2`}
                >
                  <span className="w-16 h-16 rounded-full bg-[#eef4ff] flex items-center justify-center shrink-0">
                    <Icon className="w-8 h-8 text-[#1d6ff2]" />
                  </span>
                  <div>
                    <p className="text-[18px] font-bold leading-tight">
                      {i === 0 && <CountUp to={10000} prefix="+" locale={locale} />}
                      {i === 1 && <CountUp to={4.8} decimals={1} suffix="/5" locale={locale} />}
                      {i > 1 && t.stats[i].value}
                    </p>
                    <p className="text-[14px] text-[#4b5672] leading-snug mt-0.5">{t.stats[i].label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="relative bg-[#f5f8fd] py-20 lg:py-24 scroll-mt-16 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#1d6ff2]/5" />
        <div className="absolute -bottom-40 -left-24 w-[28rem] h-[28rem] rounded-full bg-[#38bdf8]/5" />
        <div className="relative max-w-[1440px] mx-auto px-5 lg:px-12">
          <SectionHeading eyebrow={t.servicesSection.eyebrow} title={t.servicesSection.title} desc={t.servicesSection.desc} />

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((s, i) => (
              <Reveal key={i} delay={(i % 4) * 90}>
                <a
                  href="#telecharger"
                  className="group relative h-full flex flex-col bg-white rounded-3xl p-6 border border-[#eef2f8] shadow-[0_6px_24px_rgba(15,40,90,0.05)] hover:-translate-y-1.5 hover:shadow-[0_20px_44px_rgba(15,40,90,0.12)] transition-all duration-300 overflow-hidden"
                >
                  <span
                    className="absolute -top-14 -end-14 w-36 h-36 rounded-full opacity-60 group-hover:scale-[1.6] transition-transform duration-500"
                    style={{ backgroundColor: s.bg }}
                  />
                  <span className="relative w-16 h-16 rounded-2xl flex items-center justify-center group-hover:rotate-[-6deg] group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: s.bg }}>
                    <s.icon className="w-9 h-9" style={{ color: s.color }} />
                  </span>
                  <h3 className="relative mt-5 text-[19px] font-extrabold">{t.services[i].title}</h3>
                  <div className="relative mt-3 flex flex-wrap gap-1.5">
                    {t.services[i].tags.map(tag => (
                      <span key={tag} className="text-[12px] font-medium text-[#4b5672] bg-[#f3f6fb] px-2.5 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <span className="relative mt-auto pt-5 inline-flex items-center gap-1.5 text-[14px] font-bold" style={{ color: s.color }}>
                    {t.servicesSection.cta}
                    <span className="group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform"><Forward /></span>
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="relative bg-gradient-to-br from-[#0b2a6b] via-[#0f4fd1] to-[#1d6ff2] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <div className="absolute -top-24 left-1/3 w-[32rem] h-[32rem] rounded-full bg-[#38bdf8]/20 blur-3xl" />
        <div className="relative max-w-[1440px] mx-auto px-5 lg:px-12 py-16 lg:py-20">
          <SectionHeading light eyebrow={t.numbers.eyebrow} title={t.numbers.title} />
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {NUMBERS.map((n, i) => (
              <Reveal key={i} delay={i * 110} from="zoom">
                <div className="h-full rounded-3xl bg-white/[0.08] border border-white/15 backdrop-blur-sm p-5 sm:p-7 hover:bg-white/[0.13] transition-colors">
                  <span className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                    <n.icon className="w-6 h-6 text-white" />
                  </span>
                  <p className="mt-5 text-[38px] sm:text-[52px] font-extrabold text-white leading-none tracking-[-0.03em]">
                    <CountUp to={n.to} decimals={n.decimals} prefix={n.prefix} suffix={n.suffix} locale={locale} />
                  </p>
                  <p className="mt-3 text-[15px] sm:text-[17px] font-bold text-white">{t.numbers.items[i].label}</p>
                  <p className="mt-1 text-[13px] sm:text-[14px] text-blue-100/80">{t.numbers.items[i].note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi FixPro */}
      <section id="pourquoi-fixpro" className="py-20 lg:py-28 scroll-mt-16">
        <div className="max-w-[1440px] mx-auto px-5 lg:px-12 grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.14em] px-3 py-1.5 rounded-full bg-[#e8f0fe] text-[#1d6ff2]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1d6ff2]" /> {t.why.eyebrow}
              </span>
              <h2 className="mt-4 text-[32px] sm:text-[40px] font-extrabold leading-[1.1] tracking-[-0.02em]">
                {t.why.title1}<span className="text-[#1d6ff2]">{t.why.title2}</span>
              </h2>
              <p className="mt-4 text-[16px] text-[#4b5672] leading-relaxed max-w-xl">{t.why.desc}</p>
            </Reveal>

            <div className="mt-10 grid sm:grid-cols-2 gap-5">
              {WHY_POINTS.map((p, i) => (
                <Reveal key={i} delay={i * 100}>
                  <div className="group h-full rounded-2xl p-5 border border-[#eef2f8] hover:border-transparent hover:shadow-[0_14px_36px_rgba(15,40,90,0.1)] transition-all">
                    <span className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: p.bg }}>
                      <p.icon className="w-6 h-6" style={{ color: p.color }} />
                    </span>
                    <h3 className="mt-4 font-extrabold text-[16px]">{t.why.points[i].title}</h3>
                    <p className="mt-1.5 text-[14px] text-[#4b5672] leading-relaxed">{t.why.points[i].desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Illustrative app moments */}
          <Reveal from="right" className="relative">
            <div className="relative mx-auto max-w-[520px] aspect-[1/1.02] rounded-[36px] bg-gradient-to-br from-[#1d6ff2] to-[#0b3fb8] overflow-hidden">
              <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-[#38bdf8]/30 blur-2xl" />

              <div className="absolute top-[9%] start-[8%] end-[14%] bg-white rounded-2xl p-4 shadow-2xl animate-float">
                <div className="flex items-center gap-3">
                  <span className="relative w-11 h-11 rounded-full bg-[#e4f6ea] flex items-center justify-center shrink-0">
                    <span className="absolute inset-0 rounded-full bg-[#22a35a]/30 animate-pulse-ring" />
                    <Check className="relative w-5 h-5 text-[#22a35a]" strokeWidth={3} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-[14px]">{t.why.mock.confirmed}</p>
                    <p className="text-[12px] text-[#6b7590]">{t.why.mock.onTheWay}</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[#eef2f8] overflow-hidden">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r rtl:bg-gradient-to-l from-[#1d6ff2] to-[#38bdf8]" />
                </div>
              </div>

              <div className="absolute top-[38%] start-[18%] end-[5%] bg-white rounded-2xl p-4 shadow-2xl animate-float [animation-delay:-2s]">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1d6ff2] to-[#38bdf8] text-white font-bold flex items-center justify-center shrink-0">{initials(t.why.mock.name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[14px] flex items-center gap-1.5">
                      {t.why.mock.name} <ShieldIcon className="w-4 h-4 text-[#22a35a]" />
                    </p>
                    <p className="text-[12px] text-[#6b7590]">{t.why.mock.job}</p>
                  </div>
                  <span className="text-[12px] font-bold flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-[#f5a800]" /> {t.why.mock.rating}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <span className="text-center text-[12px] font-semibold text-[#1d6ff2] bg-[#e8f0fe] rounded-lg py-2">{t.why.mock.message}</span>
                  <span className="text-center text-[12px] font-semibold text-white bg-[#1d6ff2] rounded-lg py-2">{t.why.mock.book}</span>
                </div>
              </div>

              <div className="absolute bottom-[9%] start-[8%] end-[22%] bg-white rounded-2xl p-4 shadow-2xl animate-float [animation-delay:-4s]">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-[#f1e8ff] flex items-center justify-center shrink-0">
                    <CardIcon className="w-6 h-6 text-[#8b3dff]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[14px]">{t.why.mock.payTitle}</p>
                    <p className="text-[12px] text-[#6b7590]">{t.why.mock.payDesc}</p>
                  </div>
                  <Check className="w-5 h-5 text-[#22a35a]" strokeWidth={3} />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Testimonials */}
      <section id="avis" className="bg-[#f5f8fd] py-20 lg:py-24 overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-5 lg:px-12">
          <SectionHeading eyebrow={t.testimonials.eyebrow} title={t.testimonials.title} />
          <Reveal delay={150} className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-3 bg-white rounded-full ps-2 pe-5 py-2 shadow-[0_6px_20px_rgba(15,40,90,0.06)]">
              <span className="flex -space-x-2 rtl:space-x-reverse">
                {testimonials.slice(0, 4).map(({ item }, i) => (
                  <span key={item.name} className={`w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br ${AVATAR_GRADIENTS[i]} text-white text-[11px] font-bold flex items-center justify-center`}>{initials(item.name)}</span>
                ))}
              </span>
              <Stars rating={5} />
              <span className="text-[14px] font-bold" dir="ltr">{t.testimonials.rating}</span>
              <span className="hidden sm:inline text-[14px] text-[#6b7590]">{t.testimonials.ratingNote}</span>
            </div>
          </Reveal>
        </div>

        {/* The scrolling track stays LTR so the translateX loop works; each card sets its own direction */}
        <div dir="ltr" className="mt-12 space-y-5 [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
          {rows.map((row, r) => (
            <div key={`${lang}-${r}`} className="marquee-row overflow-hidden">
              <div
                className={`flex gap-5 w-max py-2 ${r === 0 ? 'animate-marquee' : 'animate-marquee-reverse'}`}
                style={{ '--marquee-duration': '55s' } as CSSProperties}
              >
                {[...row, ...row].map(({ item, service, rating }, i) => (
                  <TestimonialCard
                    key={`${item.name}-${i}`}
                    item={item}
                    service={t.services[service].title}
                    rating={rating}
                    index={i + r * 2}
                    dir={dir}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Devenir technicien */}
      <section id="devenir-technicien" className="py-20 lg:py-28 scroll-mt-16">
        <div className="max-w-[1440px] mx-auto px-5 lg:px-12 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          <Reveal from="left">
            <div className="relative rounded-[32px] bg-gradient-to-br from-[#0b2a6b] to-[#1d6ff2] p-8 sm:p-12 overflow-hidden text-white">
              <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#38bdf8]/25 blur-2xl" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.14em] px-3 py-1.5 rounded-full bg-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" /> {t.worker.eyebrow}
                </span>
                <h2 className="mt-5 text-[32px] sm:text-[42px] font-extrabold leading-[1.15] tracking-[-0.02em]">{t.worker.title}</h2>
                <p className="mt-4 text-blue-100 text-[16px] leading-relaxed max-w-lg">{t.worker.desc}</p>

                <div className="mt-8 flex items-end gap-4">
                  <p className="text-[64px] sm:text-[76px] font-extrabold leading-none tracking-[-0.04em]">
                    <CountUp to={120} prefix="+" locale={locale} />
                  </p>
                  <p className="pb-2 text-[15px] text-blue-100 leading-snug">{t.worker.count1}<br />{t.worker.count2}</p>
                </div>

                <div className="mt-8 grid sm:grid-cols-2 gap-3 sm:[&>*:last-child]:col-span-2">
                  {WORKER_BENEFITS.map((Icon, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                      <Icon className="w-5 h-5 text-[#7cc4ff] shrink-0" />
                      <span className="text-[14px] font-semibold">{t.worker.benefits[i]}</span>
                    </div>
                  ))}
                </div>

                <a href="#telecharger" className="mt-8 inline-flex items-center gap-2 bg-white text-[#0b2a6b] font-bold px-6 py-3.5 rounded-xl hover:-translate-y-0.5 hover:shadow-xl transition-all">
                  {t.worker.cta} <Forward />
                </a>
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <h3 className="text-[26px] sm:text-[30px] font-extrabold tracking-[-0.02em]">{t.worker.stepsTitle}</h3>
              <p className="mt-2 text-[#4b5672]">{t.worker.stepsSub}</p>
            </Reveal>
            <div className="mt-8 relative">
              <span className="absolute start-[27px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-[#1d6ff2] to-[#e8f0fe]" />
              {WORKER_STEPS.map((Icon, i) => (
                <Reveal key={i} delay={i * 120} className="pb-8 last:pb-0">
                  <div className="relative flex gap-5 group">
                    <span className="relative z-10 w-14 h-14 rounded-2xl bg-white border-2 border-[#e8f0fe] flex items-center justify-center shrink-0 group-hover:border-[#1d6ff2] group-hover:bg-[#1d6ff2] transition-colors">
                      <Icon className="w-7 h-7 text-[#1d6ff2] group-hover:text-white transition-colors" />
                    </span>
                    <div className="pt-1.5">
                      <p className="text-[12px] font-bold text-[#1d6ff2] tracking-wider">{t.worker.stepLabel} {i + 1}</p>
                      <h4 className="mt-0.5 text-[17px] font-extrabold">{t.worker.steps[i].title}</h4>
                      <p className="mt-1 text-[14px] text-[#4b5672] leading-relaxed">{t.worker.steps[i].desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[#f5f8fd] py-20 lg:py-24 scroll-mt-16">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-12 grid lg:grid-cols-[380px_1fr] gap-10 lg:gap-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.14em] px-3 py-1.5 rounded-full bg-[#e8f0fe] text-[#1d6ff2]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1d6ff2]" /> {t.faq.eyebrow}
            </span>
            <h2 className="mt-4 text-[32px] sm:text-[40px] font-extrabold leading-[1.15] tracking-[-0.02em]">{t.faq.title}</h2>
            <p className="mt-4 text-[#4b5672] leading-relaxed">{t.faq.desc}</p>
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-[0_6px_24px_rgba(15,40,90,0.06)]">
              <span className="w-12 h-12 rounded-xl bg-[#e8f0fe] flex items-center justify-center">
                <HeadsetIcon className="w-6 h-6 text-[#1d6ff2]" />
              </span>
              <p className="mt-4 font-extrabold">{t.faq.otherTitle}</p>
              <p className="mt-1 text-[14px] text-[#4b5672]">{t.faq.otherDesc}</p>
              <a href="mailto:contact@fixpro.tn" className="mt-4 inline-flex items-center gap-2 text-[14px] font-bold text-[#1d6ff2] hover:gap-3 transition-all">
                {t.faq.contact} <Forward />
              </a>
            </div>
          </Reveal>

          <div className="space-y-3">
            {t.faq.items.map((item, i) => {
              const open = openFaq === i;
              return (
                <Reveal key={i} delay={i * 70}>
                  <div className={`bg-white rounded-2xl border transition-all ${open ? 'border-[#1d6ff2]/30 shadow-[0_10px_30px_rgba(15,40,90,0.08)]' : 'border-transparent shadow-[0_4px_18px_rgba(15,40,90,0.04)]'}`}>
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full flex items-center justify-between gap-4 px-6 py-5 text-start font-bold text-[16px]"
                      aria-expanded={open}
                    >
                      {item.q}
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${open ? 'bg-[#1d6ff2] text-white rotate-180' : 'bg-[#e8f0fe] text-[#1d6ff2]'}`}>
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                    <div className={`grid transition-[grid-template-rows] duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <p className="px-6 pb-5 -mt-1 text-[15px] text-[#4b5672] leading-relaxed">{item.a}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 lg:py-20">
        <div className="max-w-[1440px] mx-auto px-5 lg:px-12">
          <Reveal from="zoom">
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#1d6ff2] to-[#38bdf8] px-8 py-12 sm:px-14 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-start">
              <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative">
                <h2 className="text-[30px] sm:text-[38px] font-extrabold text-white leading-tight tracking-[-0.02em]">{t.cta.title}</h2>
                <p className="mt-2 text-[17px] text-white/90">{t.cta.desc}</p>
              </div>
              <div className="relative">
                <StoreBadges t={t} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#0b1533] text-gray-300">
        <div className="max-w-[1440px] mx-auto px-5 lg:px-12 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Logo dark className="h-10" />
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">{t.footer.about}</p>
            <div className="mt-5 flex items-center gap-3">
              {[Facebook, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#1d6ff2] flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm">{t.footer.links}</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {navLinks.map(link => (
                <li key={link.id}><a href={`#${link.id}`} className="text-gray-400 hover:text-white transition-colors">{link.label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm">{t.footer.users}</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><a href="#telecharger" className="text-gray-400 hover:text-white transition-colors">{t.downloadApp}</a></li>
              <li><a href="#avis" className="text-gray-400 hover:text-white transition-colors">{t.footer.reviews}</a></li>
              <li><a href="#devenir-technicien" className="text-gray-400 hover:text-white transition-colors">{t.footer.becomeTech}</a></li>
              <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors">{t.footer.admin}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm">{t.footer.contact}</h4>
            <ul className="mt-4 space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" /> <span dir="ltr">+216 50 214 803</span></li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0" /> fxproo.support@gmail.com</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" /> {t.footer.address}</li>
            </ul>
            <form className="mt-5 flex items-center gap-2" onSubmit={e => e.preventDefault()}>
              <input type="email" placeholder={t.footer.emailPlaceholder} className="min-w-0 flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              <button type="submit" className="bg-[#1d6ff2] hover:bg-[#165fd6] rounded-lg p-2 transition-colors shrink-0">
                <Send className="w-4 h-4 text-white rtl:-scale-x-100" />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 py-5 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} FixPro. {t.footer.rights}
        </div>
      </footer>
    </div>
  );
}
