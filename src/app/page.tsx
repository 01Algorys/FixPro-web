'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MapPin, Search, ShieldCheck, Zap, Lock, Bell, Star, ChevronRight, Menu, X,
  Wrench, Snowflake, KeyRound, Paintbrush, LayoutGrid, Users, Briefcase,
  ClipboardCheck, Handshake, Wallet, UserPlus, FileCheck, TrendingUp, Clock,
  CreditCard, Facebook, Instagram, Linkedin, Mail, Phone, Send, Smartphone,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '#accueil', label: 'Accueil' },
  { href: '#apropos', label: 'À propos' },
  { href: '#services', label: 'Services' },
  { href: '#comment-ca-marche', label: 'Comment ça marche' },
  { href: '#tarifs', label: 'Tarifs' },
  { href: '#contact', label: 'Contact' },
];

const CATEGORIES = [
  { title: 'Plomberie', desc: 'Installation, réparation et dépannage plomberie', icon: Wrench, color: '#1a56db' },
  { title: 'Électricité', desc: 'Installation, mise aux normes et dépannage électrique', icon: Zap, color: '#eab308' },
  { title: 'Climatisation', desc: 'Installation et entretien climatisation', icon: Snowflake, color: '#3b82f6' },
  { title: 'Serrurerie', desc: 'Ouverture de porte, changement de serrures et plus', icon: KeyRound, color: '#8b5cf6' },
  { title: 'Peinture', desc: 'Peinture intérieure et extérieure', icon: Paintbrush, color: '#ec4899' },
  { title: 'Et plus encore', desc: 'Nettoyage, déménagement et bien d\'autres', icon: LayoutGrid, color: '#64748b' },
];

const STATS = [
  { icon: Users, value: '+5,000', label: 'Utilisateurs satisfaits' },
  { icon: Briefcase, value: '+1,500', label: 'Professionnels actifs' },
  { icon: ClipboardCheck, value: '+15,000', label: 'Services réalisés' },
  { icon: Star, value: '4.8/5', label: 'Note moyenne' },
];

const STEPS = [
  { icon: Smartphone, title: 'Choisissez votre service', desc: 'Sélectionnez le service dont vous avez besoin en quelques clics.' },
  { icon: Handshake, title: 'Trouvez un professionnel', desc: 'Nous vous proposons les meilleurs professionnels proches de chez vous.' },
  { icon: Wallet, title: 'Réservez et payez', desc: 'Réservez facilement et payez en toute sécurité sur l\'application.' },
];

const WORKER_STEPS = [
  { icon: UserPlus, title: 'Créez votre profil', desc: 'Inscrivez-vous gratuitement sur l\'application et renseignez vos compétences.' },
  { icon: FileCheck, title: 'Soumettez vos documents', desc: 'Pièce d\'identité et certifications pour vérifier votre expertise.' },
  { icon: ShieldCheck, title: 'Validation du profil', desc: 'Notre équipe examine et valide votre candidature sous 48h.' },
  { icon: Briefcase, title: 'Recevez des demandes', desc: 'Commencez à recevoir des demandes de service près de chez vous.' },
];

const WORKER_BENEFITS = [
  { icon: TrendingUp, text: 'Revenus complémentaires' },
  { icon: Clock, text: 'Horaires flexibles' },
  { icon: MapPin, text: 'Zone de travail personnalisable' },
  { icon: CreditCard, text: 'Paiements sécurisés et rapides' },
];

const PRICING_POINTS = [
  { title: 'Consultation gratuite', desc: 'Décrivez votre besoin et recevez des propositions sans engagement.' },
  { title: 'Devis avant intervention', desc: 'Le prix est validé avec vous avant que le professionnel n\'intervienne.' },
  { title: 'Paiement sécurisé après service', desc: 'Vous ne payez qu\'une fois le service réalisé et validé.' },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#accueil" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">FixPro</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <a href="#telecharger" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
              Télécharger l&apos;app
            </a>
          </div>

          <button onClick={() => setMenuOpen(v => !v)} className="md:hidden p-2 text-gray-600">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-4">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="text-sm text-gray-600 hover:text-blue-600">
                {link.label}
              </a>
            ))}
            <a href="#telecharger" onClick={() => setMenuOpen(false)} className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg">
              Télécharger l&apos;app
            </a>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="accueil" className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-gray-900">
              Vos services à domicile,<br />
              <span className="text-blue-600">en un seul clic</span>
            </h1>
            <p className="mt-5 text-gray-500 text-lg max-w-md">
              FixPro vous met en relation avec des professionnels qualifiés pour tous vos besoins du quotidien.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#services" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
                <Search className="w-4 h-4" /> Trouver un service
              </a>
              <a href="#devenir-professionnel" className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-semibold px-6 py-3 rounded-lg border border-gray-200 transition-colors">
                Devenir professionnel
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Professionnels vérifiés
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Zap className="w-4 h-4 text-blue-600" /> Service rapide
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Lock className="w-4 h-4 text-blue-600" /> Paiement sécurisé
              </div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-70 -z-10" />

            <div className="relative w-[280px] h-[560px] bg-gray-900 rounded-[2.5rem] p-2.5 shadow-2xl">
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-gray-900 rounded-b-xl z-20" />
              <div className="w-full h-full bg-gray-50 rounded-[2rem] overflow-hidden flex flex-col">
                <div className="bg-blue-600 px-5 pt-8 pb-6 rounded-b-2xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Bonjour 👋</p>
                      <p className="text-xs text-blue-100 mt-0.5 leading-snug">Comment pouvons-nous<br />vous aider aujourd&apos;hui ?</p>
                    </div>
                    <div className="relative">
                      <Bell className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] flex items-center justify-center">1</span>
                    </div>
                  </div>
                  <div className="mt-4 bg-white/15 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-white/80" />
                    <span className="text-xs text-white/80">Rechercher un service...</span>
                  </div>
                </div>

                <div className="px-5 mt-4">
                  <p className="text-[11px] font-semibold text-gray-500">Catégories</p>
                  <div className="mt-2 grid grid-cols-4 gap-2.5">
                    {CATEGORIES.map(cat => (
                      <div key={cat.title} className="flex flex-col items-center gap-1">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}1a` }}>
                          <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                        </div>
                        <span className="text-[8px] text-gray-500 text-center leading-tight">{cat.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-5 mt-5 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-gray-500">Professionnels proches</p>
                    <span className="text-[10px] text-blue-600 font-medium">Voir tout</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {[
                      { name: 'Sami Belhaj', job: 'Plombier', rating: '4.8', reviews: '128', dist: '1.2 km' },
                      { name: 'Karim Ben Ali', job: 'Électricien', rating: '4.7', reviews: '95', dist: '1.8 km' },
                    ].map(w => (
                      <div key={w.name} className="bg-white rounded-xl px-3 py-2.5 flex items-center gap-2.5 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold shrink-0">
                          {w.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-gray-800 truncate">{w.name}</p>
                          <p className="text-[9px] text-gray-400">{w.job}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[9px] text-yellow-500 flex items-center gap-0.5 justify-end">★ {w.rating} ({w.reviews})</p>
                          <p className="text-[8px] text-gray-400">{w.dist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex absolute -bottom-4 -right-2 lg:right-6 items-center gap-2 bg-white rounded-2xl shadow-xl px-4 py-3 border border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">+1,500 pros</p>
                <p className="text-[10px] text-gray-400">prêts à intervenir</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About / Services */}
      <section id="apropos" className="max-w-7xl mx-auto px-6 pb-4">
        <p className="text-sm text-gray-400 text-center max-w-2xl mx-auto">
          FixPro est la plateforme qui simplifie l&apos;accès aux services à domicile en Tunisie : des professionnels vérifiés, des interventions rapides et un paiement sécurisé, le tout depuis une seule application.
        </p>
      </section>

      <section id="services" className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-xl mx-auto">
          <p className="text-xs font-semibold text-blue-600 tracking-wider">NOS SERVICES</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">Des professionnels pour chaque besoin</h2>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map(cat => (
            <div key={cat.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}1a` }}>
                <cat.icon className="w-6 h-6" style={{ color: cat.color }} />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{cat.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{cat.desc}</p>
              <a href="#comment-ca-marche" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:gap-1.5 transition-all">
                En savoir plus <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(stat => (
            <div key={stat.label} className="flex items-center gap-3 justify-center md:justify-start">
              <stat.icon className="w-8 h-8 text-white/80 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-blue-100">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing / transparency */}
      <section id="tarifs" className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-xl mx-auto">
          <p className="text-xs font-semibold text-blue-600 tracking-wider">TARIFS</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">Des prix clairs, sans surprise</h2>
        </div>

        <div className="mt-10 grid sm:grid-cols-3 gap-5">
          {PRICING_POINTS.map(p => (
            <div key={p.title} className="rounded-2xl border border-gray-100 p-6 text-center">
              <h3 className="font-semibold text-gray-900">{p.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto">
            <p className="text-xs font-semibold text-blue-600 tracking-wider">COMMENT ÇA MARCHE</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">En 3 étapes simples</h2>
          </div>

          <div className="mt-12 grid sm:grid-cols-3 gap-8 relative">
            {STEPS.map((step, i) => (
              <div key={step.title} className="text-center relative">
                <div className="mx-auto w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center relative">
                  <step.icon className="w-8 h-8 text-blue-600" />
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-1.5 text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Devenir professionnel */}
      <section id="devenir-professionnel" className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-xl mx-auto">
          <p className="text-xs font-semibold text-blue-600 tracking-wider">REJOIGNEZ-NOUS</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">Devenez professionnel FixPro</h2>
          <p className="mt-3 text-gray-500 text-sm">
            Vous êtes plombier, électricien, technicien climatisation ou serrurier ? Rejoignez notre réseau et développez votre activité.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WORKER_STEPS.map((step, i) => (
            <div key={step.title} className="rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-gray-300">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 text-sm">{step.title}</h3>
              <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-blue-50 rounded-2xl p-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WORKER_BENEFITS.map(b => (
            <div key={b.text} className="flex items-center gap-3">
              <b.icon className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="text-sm font-medium text-gray-700">{b.text}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a href="#telecharger" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            Devenir professionnel <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Download CTA */}
      <section id="telecharger" className="max-w-7xl mx-auto px-6 pb-16">
        <div className="bg-blue-600 rounded-3xl px-8 py-10 md:px-12 md:py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-white">Prêt à simplifier votre quotidien ?</h2>
            <p className="mt-2 text-blue-100 text-sm max-w-md">
              Téléchargez l&apos;application FixPro dès maintenant et profitez de services rapides et fiables.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 bg-black text-white rounded-xl px-4 py-2.5 cursor-pointer hover:bg-gray-900 transition-colors">
                <Smartphone className="w-6 h-6" />
                <div className="leading-tight">
                  <p className="text-[9px] text-gray-300">Télécharger dans</p>
                  <p className="text-sm font-semibold">l&apos;App Store</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-black text-white rounded-xl px-4 py-2.5 cursor-pointer hover:bg-gray-900 transition-colors">
                <Smartphone className="w-6 h-6" />
                <div className="leading-tight">
                  <p className="text-[9px] text-gray-300">Disponible sur</p>
                  <p className="text-sm font-semibold">Google Play</p>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-center gap-1.5 bg-white rounded-xl p-3">
              <div className="w-16 h-16 rounded-md" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #111 0 3px, transparent 3px 6px), repeating-linear-gradient(-45deg, #111 0 3px, transparent 3px 6px)',
                backgroundBlendMode: 'multiply',
              }} />
              <span className="text-[9px] text-gray-500">Scannez-moi</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#0b1533] text-gray-300">
        <div className="max-w-7xl mx-auto px-6 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">FixPro</span>
            </div>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              FixPro est votre plateforme de confiance pour tous vos services à domicile.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[Facebook, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm">Liens utiles</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {NAV_LINKS.map(link => (
                <li key={link.href}><a href={link.href} className="text-gray-400 hover:text-white transition-colors">{link.label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm">Pour les utilisateurs</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><a href="#telecharger" className="text-gray-400 hover:text-white transition-colors">Télécharger l&apos;app</a></li>
              <li><a href="#devenir-professionnel" className="text-gray-400 hover:text-white transition-colors">Devenir professionnel</a></li>
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
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-lg p-2 transition-colors shrink-0">
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
