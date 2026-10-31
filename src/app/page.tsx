'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus_Jakarta_Sans, Caveat } from 'next/font/google';
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

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });
const caveat = Caveat({ subsets: ['latin'], weight: ['700'] });

const BLUE = '#1d6ff2';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.fixpro.mobile';
const APP_STORE_URL = 'https://apps.apple.com/tn/app/fixpro-services/id6785690252';

const NAV_LINKS = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'services', label: 'Services' },
  { id: 'comment-ca-marche', label: 'Comment ça marche' },
  { id: 'pourquoi-fixpro', label: 'Pourquoi FixPro' },
  { id: 'devenir-technicien', label: 'Devenir technicien' },
  { id: 'faq', label: 'FAQ' },
];

const SERVICES = [
  { title: 'Plomberie', icon: DropIcon, color: '#1d6ff2', bg: '#e8f0fe', tags: ['Fuites', 'Robinetterie', 'Chauffe-eau', 'Débouchage'] },
  { title: 'Électricité', icon: BoltIcon, color: '#f5a800', bg: '#fff5d6', tags: ['Pannes', 'Tableau électrique', 'Prises', 'Éclairage'] },
  { title: 'Climatisation', icon: SnowIcon, color: '#1d6ff2', bg: '#e8f0fe', tags: ['Installation', 'Entretien', 'Recharge gaz'] },
  { title: 'Bricolage', icon: ToolsIcon, color: '#8b3dff', bg: '#f1e8ff', tags: ['Montage de meubles', 'Fixations', 'Petites réparations'] },
  { title: 'Peinture', icon: RollerIcon, color: '#f0445a', bg: '#fdebee', tags: ['Murs', 'Plafonds', 'Façades', 'Finitions'] },
  { title: 'Électroménager', icon: WasherIcon, color: '#1d6ff2', bg: '#e8f0fe', tags: ['Lave-linge', 'Réfrigérateur', 'Four', 'Lave-vaisselle'] },
  { title: 'Nettoyage', icon: BroomIcon, color: '#22a35a', bg: '#e4f6ea', tags: ['Ménage', 'Après travaux', 'Vitres'] },
  { title: 'Jardinage', icon: LeafIcon, color: '#22a35a', bg: '#e4f6ea', tags: ['Tonte', 'Taille de haies', 'Espaces verts'] },
];

const HERO_FEATURES = [
  { title: 'Simple', desc: 'Réservez en quelques clics', icon: BoltIcon, color: '#f5a800', bg: '#fff5d6' },
  { title: 'Rapide', desc: 'Intervention proche de vous', icon: ClockIcon, color: BLUE, bg: '#e8f0fe' },
  { title: 'Fiable', desc: 'Techniciens vérifiés', icon: ShieldIcon, color: '#22a35a', bg: '#e4f6ea' },
];

const HERO_CARDS = [
  { title: 'Intervention rapide', desc: 'près de chez vous', icon: ClockIcon, color: BLUE },
  { title: 'Techniciens', desc: 'qualifiés et vérifiés', icon: ShieldIcon, color: '#22a35a' },
  { title: 'Paiement sécurisé', desc: 'dans l’application', icon: CardIcon, color: BLUE },
];

const STEPS = [
  { icon: ListIcon, title: 'Choisissez un service', desc: 'Sélectionnez le service dont vous avez besoin', color: BLUE },
  { icon: UserIcon, title: 'Trouvez un technicien', desc: 'Consultez les profils, avis et disponibilités', color: BLUE },
  { icon: CalendarIcon, title: 'Réservez facilement', desc: 'Choisissez la date et validez votre demande', color: '#f59e0b' },
  { icon: HouseIcon, title: 'Intervention à domicile', desc: 'Le technicien se déplace chez vous', color: BLUE },
];

const STATS = [
  { icon: UsersIcon, value: <CountUp to={10000} prefix="+" />, label: 'utilisateurs nous font confiance' },
  { icon: StarIcon, value: <CountUp to={4.8} decimals={1} suffix="/5" />, label: 'Note moyenne des techniciens' },
  { icon: ShieldIcon, value: 'Techniciens vérifiés', label: 'Des professionnels évalués' },
  { icon: HeadsetIcon, value: 'Support à votre écoute', label: 'Une équipe disponible pour vous aider' },
];

const NUMBERS = [
  { icon: ShieldIcon, to: 120, prefix: '+', label: 'Techniciens vérifiés', note: 'Identité et certifications contrôlées' },
  { icon: UsersIcon, to: 10000, prefix: '+', label: 'Utilisateurs', note: 'Nous font déjà confiance' },
  { icon: StarIcon, to: 4.8, decimals: 1, suffix: '/5', label: 'Note moyenne', note: 'Attribuée par nos clients' },
  { icon: ListIcon, to: 8, label: 'Catégories de services', note: 'Pour tous vos besoins à domicile' },
];

const WHY_POINTS = [
  { icon: ShieldIcon, color: '#22a35a', bg: '#e4f6ea', title: 'Techniciens vérifiés', desc: 'Identité et certifications contrôlées par notre équipe avant chaque validation.' },
  { icon: DocCheckIcon, color: BLUE, bg: '#e8f0fe', title: 'Prix clairs, sans surprise', desc: 'Le devis est validé avec vous avant que le technicien n’intervienne.' },
  { icon: CardIcon, color: '#8b3dff', bg: '#f1e8ff', title: 'Paiement sécurisé', desc: 'Vous ne payez qu’une fois le service réalisé et validé, directement dans l’app.' },
  { icon: ChatIcon, color: '#f5a800', bg: '#fff5d6', title: 'Suivi et messagerie', desc: 'Suivez votre demande et échangez avec le technicien à chaque étape.' },
];

// Placeholder reviews — replace with real customer testimonials before launch.
const TESTIMONIALS = [
  { name: 'Sarra M.', city: 'Tunis', service: 'Plomberie', rating: 5, text: 'Fuite sous l’évier un dimanche matin : un plombier était chez moi en moins d’une heure. Travail propre et prix annoncé à l’avance.' },
  { name: 'Mehdi K.', city: 'Sousse', service: 'Climatisation', rating: 5, text: 'Entretien de deux climatiseurs avant l’été. Technicien ponctuel, très professionnel, et le paiement dans l’app est super pratique.' },
  { name: 'Ines B.', city: 'Ariana', service: 'Électricité', rating: 5, text: 'J’ai pu comparer les profils et les avis avant de choisir. L’électricien a tout remis aux normes en une après-midi.' },
  { name: 'Youssef T.', city: 'Sfax', service: 'Bricolage', rating: 4, text: 'Montage de meubles et pose d’étagères. Réservation en deux minutes, intervention le lendemain. Je recommande !' },
  { name: 'Amel H.', city: 'La Marsa', service: 'Nettoyage', rating: 5, text: 'Nettoyage impeccable après travaux. On sent que les techniciens sont vérifiés et sérieux.' },
  { name: 'Karim S.', city: 'Nabeul', service: 'Jardinage', rating: 5, text: 'Taille de haies et entretien du jardin. Très bon rapport qualité-prix et un suivi clair dans l’application.' },
  { name: 'Leila R.', city: 'Bizerte', service: 'Électroménager', rating: 5, text: 'Ma machine à laver est repartie en une visite. Le technicien a expliqué la panne et le devis était clair.' },
  { name: 'Walid A.', city: 'Monastir', service: 'Peinture', rating: 4, text: 'Peinture de tout le salon, finitions parfaites. Les notifications à chaque étape m’ont vraiment rassuré.' },
];

const AVATAR_GRADIENTS = [
  'from-[#1d6ff2] to-[#38bdf8]', 'from-[#8b3dff] to-[#c084fc]', 'from-[#22a35a] to-[#4ade80]', 'from-[#f59e0b] to-[#fbbf24]',
];

const WORKER_STEPS = [
  { icon: UserPlusIcon, title: 'Créez votre profil', desc: 'Inscrivez-vous gratuitement sur l’application et renseignez vos compétences.' },
  { icon: ShieldIcon, title: 'Validation du profil', desc: 'Notre équipe examine et valide votre candidature sous 48h.' },
  { icon: BriefcaseIcon, title: 'Recevez des demandes', desc: 'Commencez à recevoir des demandes de service près de chez vous.' },
];

const WORKER_BENEFITS = [
  { icon: ChartIcon, text: 'Revenus complémentaires' },
  { icon: ClockIcon, text: 'Horaires flexibles' },
  { icon: PinIcon, text: 'Zone de travail personnalisable' },
];

const FAQ = [
  { q: 'Comment réserver un technicien ?', a: 'Téléchargez l’application, choisissez un service, sélectionnez un technicien proche de chez vous puis validez la date de l’intervention.' },
  { q: 'Les techniciens sont-ils vérifiés ?', a: 'Oui. Chaque technicien fournit une pièce d’identité et ses certifications, que notre équipe vérifie avant validation du profil.' },
  { q: 'Quand dois-je payer ?', a: 'Le prix est validé avec vous avant l’intervention, et le paiement sécurisé n’est effectué qu’une fois le service réalisé.' },
  { q: 'Puis-je choisir mon technicien ?', a: 'Oui. Vous consultez les profils, les avis clients et les disponibilités avant de réserver le technicien qui vous convient.' },
  { q: 'Comment devenir technicien FixPro ?', a: 'Créez votre profil dans l’application, soumettez vos documents et commencez à recevoir des demandes après validation sous 48h.' },
];

function Logo({ dark = false, className = "h-[54px]" }: { dark?: boolean; className?: string }) {
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

function FrenchFlag() {
  return (
    <span className="w-5 h-5 rounded-full overflow-hidden flex shrink-0 ring-1 ring-black/5">
      <span className="flex-1 bg-[#1d4ed8]" />
      <span className="flex-1 bg-white" />
      <span className="flex-1 bg-[#ef4444]" />
    </span>
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

function StoreBadges() {
  return (
    <div className="flex flex-wrap gap-3">
      <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 bg-black hover:bg-gray-900 hover:-translate-y-0.5 text-white rounded-xl pl-3 pr-4 py-1.5 transition-all">
        <GooglePlayIcon />
        <span className="leading-tight">
          <span className="block text-[10px] font-medium tracking-wide">DISPONIBLE SUR</span>
          <span className="block text-[19px] font-semibold -mt-0.5">Google Play</span>
        </span>
      </a>
      <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 bg-black hover:bg-gray-900 hover:-translate-y-0.5 text-white rounded-xl pl-3 pr-4 py-1.5 transition-all">
        <AppleIcon />
        <span className="leading-tight">
          <span className="block text-[11px] font-medium">Télécharger sur</span>
          <span className="block text-[19px] font-semibold -mt-0.5">App Store</span>
        </span>
      </a>
    </div>
  );
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

function TestimonialCard({ t, index }: { t: (typeof TESTIMONIALS)[number]; index: number }) {
  return (
    <figure className="w-[340px] sm:w-[380px] shrink-0 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(15,40,90,0.07)] border border-[#eef2f8] hover:shadow-[0_16px_40px_rgba(15,40,90,0.12)] hover:-translate-y-1 transition-all">
      <div className="flex items-center justify-between">
        <Stars rating={t.rating} />
        <QuoteIcon className="w-8 h-8 text-[#e8f0fe]" />
      </div>
      <blockquote className="mt-3 text-[15px] leading-relaxed text-[#33405a]">“{t.text}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className={`w-11 h-11 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]} text-white font-bold flex items-center justify-center text-[14px]`}>
          {t.name.split(' ').map(p => p[0]).join('')}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-[15px]">{t.name}</span>
          <span className="block text-[13px] text-[#6b7590]">{t.city}</span>
        </span>
        <span className="text-[12px] font-semibold text-[#1d6ff2] bg-[#e8f0fe] px-2.5 py-1 rounded-full">{t.service}</span>
      </figcaption>
    </figure>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [active, setActive] = useState('accueil');
  const [scrolled, setScrolled] = useState(false);

  // Scroll-spy: highlight the nav link of the section under the header
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      // Nav order differs from page order, so pick the section whose top is closest above the line
      let current = 'accueil';
      let best = -Infinity;
      for (const { id } of NAV_LINKS) {
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

  const rowA = TESTIMONIALS.slice(0, 4);
  const rowB = TESTIMONIALS.slice(4);

  return (
    <div className={`${jakarta.className} min-h-screen bg-white text-[#0b1533] overflow-x-clip`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur transition-shadow ${scrolled ? 'shadow-[0_6px_24px_rgba(15,23,42,0.08)]' : 'shadow-[0_1px_0_rgba(15,23,42,0.06)]'}`}>
        <div className="max-w-[1440px] mx-auto px-5 lg:px-12 h-[72px] flex items-center justify-between gap-6">
          <Logo />

          <nav className="hidden xl:flex items-center gap-8 h-full">
            {NAV_LINKS.map(link => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`relative h-full flex items-center text-[14px] font-medium transition-colors after:absolute after:left-0 after:right-0 after:bottom-[18px] after:h-[2px] after:rounded-full after:bg-[#1d6ff2] after:transition-transform after:duration-300 ${
                  active === link.id ? 'text-[#1d6ff2] after:scale-x-100' : 'text-[#0b1533] hover:text-[#1d6ff2] after:scale-x-0'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden xl:flex items-center gap-4">
            <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[15px] text-[#0b1533] hover:bg-gray-50 transition-colors">
              <FrenchFlag /> Français <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            <a
              href="#telecharger"
              className="inline-flex items-center gap-2.5 bg-[#1d6ff2] hover:bg-[#165fd6] hover:-translate-y-0.5 text-white text-[17px] font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all"
            >
              <Download className="w-5 h-5" /> Télécharger l&apos;app
            </a>
          </div>

          <button onClick={() => setMenuOpen(v => !v)} className="xl:hidden p-2 text-[#0b1533]" aria-label="Menu">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="xl:hidden border-t border-gray-100 bg-white px-5 py-4 flex flex-col gap-4">
            {NAV_LINKS.map(link => (
              <a key={link.id} href={`#${link.id}`} onClick={() => setMenuOpen(false)} className={`text-sm font-medium ${active === link.id ? 'text-[#1d6ff2]' : 'text-[#0b1533]'}`}>
                {link.label}
              </a>
            ))}
            <a href="#telecharger" onClick={() => setMenuOpen(false)} className="inline-flex items-center justify-center gap-2 bg-[#1d6ff2] text-white text-sm font-semibold px-5 py-3 rounded-xl">
              <Download className="w-4 h-4" /> Télécharger l&apos;app
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

        <div className="relative max-w-[1440px] mx-auto px-5 lg:px-12 pt-10 lg:pt-[clamp(32px,3.5vw,56px)] pb-10 lg:pb-16 h-full">
          <div className="lg:max-w-[min(620px,calc(47vw-48px))]">
            <h1 className="animate-hero-in text-[42px] sm:text-[54px] lg:text-[clamp(46px,4.4vw,72px)] font-extrabold leading-[1.02] tracking-[-0.03em]">
              Tous vos services<br />
              <span className="text-[#1d6ff2]">à portée de main</span>
            </h1>
            <p className="animate-hero-in [animation-delay:120ms] mt-4 text-[17px] lg:text-[clamp(16px,1.35vw,21px)] leading-snug text-[#33405a]">
              FixPro vous met en relation avec des techniciens qualifiés près de chez vous, pour tous vos besoins à domicile.
            </p>

            <div className="animate-hero-in [animation-delay:220ms] mt-6 lg:mt-[clamp(16px,1.6vw,28px)] grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              {HERO_FEATURES.map(f => (
                <div key={f.title} className="flex items-center gap-2.5">
                  <span className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: f.bg }}>
                    <f.icon className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: f.color }} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold leading-tight">{f.title}</p>
                    <p className="text-[12px] text-[#4b5672] leading-tight mt-0.5 2xl:whitespace-nowrap">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 lg:mt-[clamp(16px,1.6vw,28px)] grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {SERVICES.map((s, i) => (
                <a
                  key={s.title}
                  href="#services"
                  style={{ animationDelay: `${300 + i * 50}ms` }}
                  className="animate-hero-in group bg-white rounded-2xl shadow-[0_4px_18px_rgba(15,40,90,0.07)] border border-white hover:border-[#1d6ff2]/25 hover:-translate-y-1 hover:shadow-[0_10px_26px_rgba(15,40,90,0.12)] transition-[transform,box-shadow,border-color] flex flex-col items-center justify-center gap-2 py-3 lg:py-[clamp(6px,0.6vw,12px)] lg:gap-1.5"
                >
                  <span className="w-14 h-14 lg:w-[clamp(40px,3.3vw,56px)] lg:h-[clamp(40px,3.3vw,56px)] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: s.bg }}>
                    <s.icon className="w-7 h-7 lg:w-[56%] lg:h-[56%]" style={{ color: s.color }} />
                  </span>
                  <span className="text-[13px] sm:text-[14px] lg:text-[clamp(12px,1vw,15px)] font-bold">{s.title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Handwritten tagline + floating feature cards over the kitchen side of the banner */}
        <div className="hidden xl:block absolute right-[2%] top-[6%] -rotate-[8deg] text-white text-center animate-hero-in [animation-delay:500ms]">
          <p className={`${caveat.className} text-[clamp(30px,2.6vw,46px)] leading-[0.95] drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]`}>
            Votre solution<br />pour la maison
          </p>
          <svg viewBox="0 0 220 24" className="w-[80%] ml-auto -mt-1" aria-hidden>
            <path d="M4 20 C 70 6, 150 4, 216 8" stroke="#3b9bff" strokeWidth="5" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        <div className="hidden xl:flex absolute right-[3.8%] top-[30%] flex-col gap-4 w-[clamp(220px,15vw,270px)]">
          {HERO_CARDS.map((c, i) => (
            <div
              key={c.title}
              style={{ animationDelay: `${600 + i * 120}ms` }}
              className="animate-hero-in bg-white rounded-xl shadow-[0_10px_30px_rgba(10,30,70,0.18)] px-4 py-3.5 flex items-center gap-3 hover:-translate-x-1 transition-transform"
            >
              <c.icon className="w-8 h-8 shrink-0" style={{ color: c.color }} />
              <div className="min-w-0">
                <p className="text-[14px] font-bold leading-tight">{c.title}</p>
                <p className="text-[14px] text-[#33405a] leading-tight">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile / tablet: show the phone + technician part of the banner under the text */}
        <div className="lg:hidden relative h-[300px] sm:h-[420px]">
          <img src="/images/hero.PNG" alt="" className="absolute inset-0 w-full h-full object-cover object-[72%_center]" />
        </div>
      </section>

      {/* How it works + download card */}
      <section className="relative z-10 bg-white lg:-mt-8 rounded-t-[28px]">
        <div className="max-w-[1440px] mx-auto px-5 lg:px-12 pt-10 pb-8 grid xl:grid-cols-[1fr_minmax(0,520px)] gap-8 items-center">
          <div id="comment-ca-marche" className="scroll-mt-24">
            <Reveal>
              <h2 className="text-[24px] font-extrabold flex items-center gap-4">
                Comment ça marche ?
                <span className="w-10 h-[3px] rounded-full bg-[#1d6ff2]" />
              </h2>
            </Reveal>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6">
              {STEPS.map((step, i) => (
                <Reveal key={step.title} delay={i * 110} className="relative flex flex-col items-center text-center group">
                  <span className="w-[88px] h-[88px] rounded-full bg-[#eef4ff] flex items-center justify-center group-hover:scale-105 group-hover:bg-[#e2ecff] transition-all">
                    <step.icon className="w-10 h-10" style={{ color: step.color }} />
                  </span>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className="hidden md:block absolute top-[34px] -right-[18%] w-5 h-5 text-gray-400" />
                  )}
                  <div className="mt-4 flex items-start gap-2 text-left">
                    <span className="w-7 h-7 rounded-full bg-[#1d6ff2] text-white text-[14px] font-bold flex items-center justify-center shrink-0 -mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-[14px] font-bold leading-tight 2xl:whitespace-nowrap">{step.title}</h3>
                      <p className="mt-1.5 text-[13px] text-[#4b5672] leading-snug">{step.desc}</p>
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
                <h2 className="text-[28px] font-extrabold text-white leading-tight">Téléchargez FixPro</h2>
                <p className="mt-1.5 text-[18px] font-medium text-white/90">Disponible sur iOS et Android</p>
                <div className="mt-5">
                  <StoreBadges />
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Stats */}
        <div className="max-w-[1440px] mx-auto px-5 lg:px-12 pb-16">
          <Reveal>
            <div className="rounded-2xl bg-white shadow-[0_6px_30px_rgba(15,40,90,0.08)] grid sm:grid-cols-2 lg:grid-cols-4">
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex items-center gap-4 px-6 py-6 ${i > 0 ? 'lg:border-l' : ''} ${i % 2 === 1 ? 'sm:border-l' : ''} border-gray-200 lg:my-4 lg:py-2`}
                >
                  <span className="w-16 h-16 rounded-full bg-[#eef4ff] flex items-center justify-center shrink-0">
                    <s.icon className="w-8 h-8 text-[#1d6ff2]" />
                  </span>
                  <div>
                    <p className="text-[18px] font-bold leading-tight">{s.value}</p>
                    <p className="text-[14px] text-[#4b5672] leading-snug mt-0.5">{s.label}</p>
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
          <SectionHeading
            eyebrow="NOS SERVICES"
            title="Un technicien qualifié pour chaque besoin"
            desc="De la petite réparation à l’entretien régulier, trouvez le bon professionnel près de chez vous et réservez en quelques clics."
          />

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((s, i) => (
              <Reveal key={s.title} delay={(i % 4) * 90}>
                <a
                  href="#telecharger"
                  className="group relative h-full flex flex-col bg-white rounded-3xl p-6 border border-[#eef2f8] shadow-[0_6px_24px_rgba(15,40,90,0.05)] hover:-translate-y-1.5 hover:shadow-[0_20px_44px_rgba(15,40,90,0.12)] transition-all duration-300 overflow-hidden"
                >
                  <span
                    className="absolute -top-14 -right-14 w-36 h-36 rounded-full opacity-60 group-hover:scale-[1.6] transition-transform duration-500"
                    style={{ backgroundColor: s.bg }}
                  />
                  <span className="relative w-16 h-16 rounded-2xl flex items-center justify-center group-hover:rotate-[-6deg] group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: s.bg }}>
                    <s.icon className="w-9 h-9" style={{ color: s.color }} />
                  </span>
                  <h3 className="relative mt-5 text-[19px] font-extrabold">{s.title}</h3>
                  <div className="relative mt-3 flex flex-wrap gap-1.5">
                    {s.tags.map(tag => (
                      <span key={tag} className="text-[12px] font-medium text-[#4b5672] bg-[#f3f6fb] px-2.5 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <span className="relative mt-auto pt-5 inline-flex items-center gap-1.5 text-[14px] font-bold" style={{ color: s.color }}>
                    Réserver <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
          <SectionHeading light eyebrow="FIXPRO EN CHIFFRES" title="Une communauté qui grandit chaque jour" />
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {NUMBERS.map((n, i) => (
              <Reveal key={n.label} delay={i * 110} from="zoom">
                <div className="h-full rounded-3xl bg-white/[0.08] border border-white/15 backdrop-blur-sm p-5 sm:p-7 hover:bg-white/[0.13] transition-colors">
                  <span className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                    <n.icon className="w-6 h-6 text-white" />
                  </span>
                  <p className="mt-5 text-[38px] sm:text-[52px] font-extrabold text-white leading-none tracking-[-0.03em]">
                    <CountUp to={n.to} decimals={n.decimals} prefix={n.prefix} suffix={n.suffix} />
                  </p>
                  <p className="mt-3 text-[15px] sm:text-[17px] font-bold text-white">{n.label}</p>
                  <p className="mt-1 text-[13px] sm:text-[14px] text-blue-100/80">{n.note}</p>
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
                <span className="w-1.5 h-1.5 rounded-full bg-[#1d6ff2]" /> POURQUOI FIXPRO
              </span>
              <h2 className="mt-4 text-[32px] sm:text-[40px] font-extrabold leading-[1.1] tracking-[-0.02em]">
                La tranquillité d’esprit, <span className="text-[#1d6ff2]">à chaque intervention</span>
              </h2>
              <p className="mt-4 text-[16px] text-[#4b5672] leading-relaxed max-w-xl">
                Nous avons conçu FixPro pour que faire appel à un technicien soit aussi simple et sûr que commander un taxi.
              </p>
            </Reveal>

            <div className="mt-10 grid sm:grid-cols-2 gap-5">
              {WHY_POINTS.map((p, i) => (
                <Reveal key={p.title} delay={i * 100}>
                  <div className="group h-full rounded-2xl p-5 border border-[#eef2f8] hover:border-transparent hover:shadow-[0_14px_36px_rgba(15,40,90,0.1)] transition-all">
                    <span className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: p.bg }}>
                      <p.icon className="w-6 h-6" style={{ color: p.color }} />
                    </span>
                    <h3 className="mt-4 font-extrabold text-[16px]">{p.title}</h3>
                    <p className="mt-1.5 text-[14px] text-[#4b5672] leading-relaxed">{p.desc}</p>
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

              <div className="absolute top-[9%] left-[8%] right-[14%] bg-white rounded-2xl p-4 shadow-2xl animate-float">
                <div className="flex items-center gap-3">
                  <span className="relative w-11 h-11 rounded-full bg-[#e4f6ea] flex items-center justify-center shrink-0">
                    <span className="absolute inset-0 rounded-full bg-[#22a35a]/30 animate-pulse-ring" />
                    <Check className="relative w-5 h-5 text-[#22a35a]" strokeWidth={3} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-[14px]">Demande confirmée</p>
                    <p className="text-[12px] text-[#6b7590]">Votre technicien est en route</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[#eef2f8] overflow-hidden">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#1d6ff2] to-[#38bdf8]" />
                </div>
              </div>

              <div className="absolute top-[38%] left-[18%] right-[5%] bg-white rounded-2xl p-4 shadow-2xl animate-float [animation-delay:-2s]">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1d6ff2] to-[#38bdf8] text-white font-bold flex items-center justify-center shrink-0">KB</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[14px] flex items-center gap-1.5">
                      Karim B. <ShieldIcon className="w-4 h-4 text-[#22a35a]" />
                    </p>
                    <p className="text-[12px] text-[#6b7590]">Plombier · 1,2 km</p>
                  </div>
                  <span className="text-[12px] font-bold flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-[#f5a800]" /> 4,9
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <span className="text-center text-[12px] font-semibold text-[#1d6ff2] bg-[#e8f0fe] rounded-lg py-2">Message</span>
                  <span className="text-center text-[12px] font-semibold text-white bg-[#1d6ff2] rounded-lg py-2">Réserver</span>
                </div>
              </div>

              <div className="absolute bottom-[9%] left-[8%] right-[22%] bg-white rounded-2xl p-4 shadow-2xl animate-float [animation-delay:-4s]">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-[#f1e8ff] flex items-center justify-center shrink-0">
                    <CardIcon className="w-6 h-6 text-[#8b3dff]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[14px]">Paiement sécurisé</p>
                    <p className="text-[12px] text-[#6b7590]">Débité après l’intervention</p>
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
          <SectionHeading eyebrow="AVIS CLIENTS" title="Ils ont fait confiance à FixPro" />
          <Reveal delay={150} className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-3 bg-white rounded-full pl-2 pr-5 py-2 shadow-[0_6px_20px_rgba(15,40,90,0.06)]">
              <span className="flex -space-x-2">
                {['SM', 'MK', 'IB', 'YT'].map((n, i) => (
                  <span key={n} className={`w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br ${AVATAR_GRADIENTS[i]} text-white text-[11px] font-bold flex items-center justify-center`}>{n}</span>
                ))}
              </span>
              <Stars rating={5} />
              <span className="text-[14px] font-bold">4,8/5</span>
              <span className="hidden sm:inline text-[14px] text-[#6b7590]">note moyenne de nos techniciens</span>
            </div>
          </Reveal>
        </div>

        <div className="mt-12 space-y-5 [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
          {[rowA, rowB].map((row, r) => (
            <div key={r} className="marquee-row overflow-hidden">
              <div
                className={`flex gap-5 w-max py-2 ${r === 0 ? 'animate-marquee' : 'animate-marquee-reverse'}`}
                style={{ '--marquee-duration': '55s' } as CSSProperties}
              >
                {[...row, ...row].map((t, i) => (
                  <TestimonialCard key={`${t.name}-${i}`} t={t} index={i + r * 2} />
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
                  <span className="w-1.5 h-1.5 rounded-full bg-white" /> REJOIGNEZ-NOUS
                </span>
                <h2 className="mt-5 text-[32px] sm:text-[42px] font-extrabold leading-[1.08] tracking-[-0.02em]">
                  Développez votre activité avec FixPro
                </h2>
                <p className="mt-4 text-blue-100 text-[16px] leading-relaxed max-w-lg">
                  Vous êtes plombier, électricien, technicien climatisation ou bricoleur ? Recevez des demandes de clients près de chez vous.
                </p>

                <div className="mt-8 flex items-end gap-4">
                  <p className="text-[64px] sm:text-[76px] font-extrabold leading-none tracking-[-0.04em]">
                    <CountUp to={120} prefix="+" />
                  </p>
                  <p className="pb-2 text-[15px] text-blue-100 leading-snug">techniciens nous font<br />déjà confiance</p>
                </div>

                <div className="mt-8 grid sm:grid-cols-2 gap-3 sm:[&>*:last-child]:col-span-2">
                  {WORKER_BENEFITS.map(b => (
                    <div key={b.text} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                      <b.icon className="w-5 h-5 text-[#7cc4ff] shrink-0" />
                      <span className="text-[14px] font-semibold">{b.text}</span>
                    </div>
                  ))}
                </div>

                <a href="#telecharger" className="mt-8 inline-flex items-center gap-2 bg-white text-[#0b2a6b] font-bold px-6 py-3.5 rounded-xl hover:-translate-y-0.5 hover:shadow-xl transition-all">
                  Devenir technicien <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <h3 className="text-[26px] sm:text-[30px] font-extrabold tracking-[-0.02em]">Rejoindre FixPro en 3 étapes</h3>
              <p className="mt-2 text-[#4b5672]">Inscription gratuite, validation rapide.</p>
            </Reveal>
            <div className="mt-8 relative">
              <span className="absolute left-[27px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-[#1d6ff2] to-[#e8f0fe]" />
              {WORKER_STEPS.map((step, i) => (
                <Reveal key={step.title} delay={i * 120} className="pb-8 last:pb-0">
                  <div className="relative flex gap-5 group">
                    <span className="relative z-10 w-14 h-14 rounded-2xl bg-white border-2 border-[#e8f0fe] flex items-center justify-center shrink-0 group-hover:border-[#1d6ff2] group-hover:bg-[#1d6ff2] transition-colors">
                      <step.icon className="w-7 h-7 text-[#1d6ff2] group-hover:text-white transition-colors" />
                    </span>
                    <div className="pt-1.5">
                      <p className="text-[12px] font-bold text-[#1d6ff2] tracking-wider">ÉTAPE {i + 1}</p>
                      <h4 className="mt-0.5 text-[17px] font-extrabold">{step.title}</h4>
                      <p className="mt-1 text-[14px] text-[#4b5672] leading-relaxed">{step.desc}</p>
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
              <span className="w-1.5 h-1.5 rounded-full bg-[#1d6ff2]" /> FAQ
            </span>
            <h2 className="mt-4 text-[32px] sm:text-[40px] font-extrabold leading-[1.1] tracking-[-0.02em]">Questions fréquentes</h2>
            <p className="mt-4 text-[#4b5672] leading-relaxed">Tout ce qu’il faut savoir avant votre première réservation.</p>
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-[0_6px_24px_rgba(15,40,90,0.06)]">
              <span className="w-12 h-12 rounded-xl bg-[#e8f0fe] flex items-center justify-center">
                <HeadsetIcon className="w-6 h-6 text-[#1d6ff2]" />
              </span>
              <p className="mt-4 font-extrabold">Une autre question ?</p>
              <p className="mt-1 text-[14px] text-[#4b5672]">Notre équipe support est à votre écoute.</p>
              <a href="mailto:contact@fixpro.tn" className="mt-4 inline-flex items-center gap-2 text-[14px] font-bold text-[#1d6ff2] hover:gap-3 transition-all">
                Contacter le support <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </Reveal>

          <div className="space-y-3">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <Reveal key={item.q} delay={i * 70}>
                  <div className={`bg-white rounded-2xl border transition-all ${open ? 'border-[#1d6ff2]/30 shadow-[0_10px_30px_rgba(15,40,90,0.08)]' : 'border-transparent shadow-[0_4px_18px_rgba(15,40,90,0.04)]'}`}>
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-bold text-[16px]"
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
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#1d6ff2] to-[#38bdf8] px-8 py-12 sm:px-14 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
              <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative">
                <h2 className="text-[30px] sm:text-[38px] font-extrabold text-white leading-tight tracking-[-0.02em]">Un souci à la maison ?</h2>
                <p className="mt-2 text-[17px] text-white/90">Un technicien vérifié près de chez vous, en quelques clics.</p>
              </div>
              <div className="relative">
                <StoreBadges />
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
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              FixPro est votre plateforme de confiance pour tous vos services à domicile.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[Facebook, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#1d6ff2] flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm">Liens utiles</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {NAV_LINKS.map(link => (
                <li key={link.id}><a href={`#${link.id}`} className="text-gray-400 hover:text-white transition-colors">{link.label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm">Pour les utilisateurs</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><a href="#telecharger" className="text-gray-400 hover:text-white transition-colors">Télécharger l&apos;app</a></li>
              <li><a href="#avis" className="text-gray-400 hover:text-white transition-colors">Avis clients</a></li>
              <li><a href="#devenir-technicien" className="text-gray-400 hover:text-white transition-colors">Devenir technicien</a></li>
              <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors">Espace admin</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" /> +216 12 345 678</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0" /> contact@fixpro.tn</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" /> 10 Rue des Entrepreneurs, Tunis, Tunisie</li>
            </ul>
            <form className="mt-5 flex items-center gap-2" onSubmit={e => e.preventDefault()}>
              <input type="email" placeholder="Votre email" className="min-w-0 flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              <button type="submit" className="bg-[#1d6ff2] hover:bg-[#165fd6] rounded-lg p-2 transition-colors shrink-0">
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 py-5 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} FixPro. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
