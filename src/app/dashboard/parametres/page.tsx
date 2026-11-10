'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Settings, ExternalLink, ShieldCheck, ShieldHalf, UserPlus, KeyRound, Power, Trash2, Pencil, MoreHorizontal,
  X, AlertCircle, CheckCircle2, Eye, EyeOff, Wand2, UserCog, Lock, RefreshCw,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useAccess } from '@/components/layout/shell';
import { adminApi } from '@/lib/api';
import { LEVEL_LABEL } from '@/lib/access';
import { Card, Skeleton, Avatar, fmtDay } from '@/components/dashboard/kit';
import type { AccessLevel, AdminAccount, AdminPermissions, AdminSection, AdminSectionDef } from '@/types';

const inputCls = 'w-full rounded-xl border border-[#e3e8f1] bg-white px-3 py-2 text-[13.5px] focus:outline-none focus:ring-4 focus:ring-[#1d6ff2]/10 focus:border-[#1d6ff2]/50';
const labelCls = 'block text-[12px] font-semibold text-[#33405a] mb-1';
const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#1d6ff2] hover:bg-[#2f80ff] px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors disabled:opacity-50';
const btnGhost = 'inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-[#33405a] hover:bg-[#f3f6fb] transition-colors disabled:opacity-50';

/** A strong random password: upper, lower, digit and symbol, no look-alike characters */
function generatePassword() {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#$%&*?'];
  const pick = (s: string) => s[crypto.getRandomValues(new Uint32Array(1))[0] % s.length];
  const chars = [...sets.map(pick), ...Array.from({ length: 8 }, () => pick(sets.join('')))];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/** Same rule as the API: null when the password is strong enough */
function passwordProblem(p: string) {
  if (p.length < 8) return 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
  if (!/[A-Z]/.test(p) || !/[a-z]/.test(p)) return 'Le nouveau mot de passe doit contenir une majuscule et une minuscule.';
  if (!/\d/.test(p)) return 'Le nouveau mot de passe doit contenir au moins un chiffre.';
  if (!/[^A-Za-z0-9]/.test(p)) return 'Le nouveau mot de passe doit contenir au moins un caractère spécial.';
  return null;
}

function Alert({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) {
  return tone === 'error' ? (
    <div className="flex items-start gap-2 rounded-xl border border-[#fde2e2] bg-[#fff6f6] px-3 py-2 text-[13px] text-[#b91c1c]">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{children}</span>
    </div>
  ) : (
    <div className="flex items-start gap-2 rounded-xl border border-[#cdeedd] bg-[#f0fbf5] px-3 py-2 text-[13px] text-[#15803d]">
      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> <span>{children}</span>
    </div>
  );
}

function AccessBadge({ full }: { full: boolean }) {
  return full ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f0fe] px-2.5 py-1 text-[11.5px] font-semibold text-[#1d4ed8]">
      <ShieldCheck className="w-3.5 h-3.5" /> Accès complet
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4d6] px-2.5 py-1 text-[11.5px] font-semibold text-[#a16207]">
      <ShieldHalf className="w-3.5 h-3.5" /> Accès limité
    </span>
  );
}

function PermissionChips({ permissions, sections }: { permissions: AdminPermissions | null; sections: AdminSectionDef[] }) {
  const granted = sections.filter(s => permissions?.[s.key]);
  if (!granted.length) return <span className="text-[12px] text-[#8a94ad]">Aucune section</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {granted.map(s => (
        <span key={s.key} className="rounded-lg bg-[#f1f4f9] px-2 py-0.5 text-[11.5px] text-[#33405a]">
          {s.label}{' '}
          <span className={`whitespace-nowrap font-semibold ${permissions?.[s.key] === 'edit' ? 'text-[#1d6ff2]' : 'text-[#8a94ad]'}`}>
            · {LEVEL_LABEL[permissions?.[s.key] as AccessLevel]}
          </span>
        </span>
      ))}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, footer, wide }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0b1533]/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`bg-white rounded-2xl shadow-2xl border border-[#edf1f7] w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[92vh] flex flex-col`}>
        <div className="px-5 py-4 border-b border-[#edf1f7] flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-extrabold">{title}</h2>
            {subtitle && <p className="text-[12.5px] text-[#6b7590] mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="p-1.5 -mr-1.5 text-[#5b6680] hover:bg-[#f3f6fb] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">{children}</div>
        <div className="px-5 py-3 border-t border-[#edf1f7] flex items-center justify-end gap-2">{footer}</div>
      </div>
    </div>
  );
}

function PasswordField({ value, onChange, label = 'Mot de passe', hint, generate }: {
  value: string; onChange: (v: string) => void; label?: string; hint?: string; generate?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            required
            type={show ? 'text' : 'password'}
            value={value}
            onChange={e => onChange(e.target.value)}
            autoComplete="new-password"
            className={`${inputCls} pr-10 font-mono`}
          />
          <button type="button" onClick={() => setShow(v => !v)} aria-label={show ? 'Masquer' : 'Afficher'} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#8a94ad] hover:text-[#33405a]">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {generate && (
          <button type="button" onClick={() => { onChange(generatePassword()); setShow(true); }} className="inline-flex items-center gap-1.5 rounded-xl border border-[#e3e8f1] px-3 text-[12.5px] font-semibold text-[#1d6ff2] hover:bg-[#f2f7ff]">
            <Wand2 className="w-4 h-4" /> Générer
          </button>
        )}
      </div>
      <p className="text-[11.5px] text-[#8a94ad] mt-1">{hint ?? '8 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial.'}</p>
    </div>
  );
}

// ─── Access editor ──────────────────────────────────────────────────────────

type AccessState = { full: boolean; permissions: AdminPermissions };

function AccessEditor({ sections, value, onChange }: { sections: AdminSectionDef[]; value: AccessState; onChange: (v: AccessState) => void }) {
  const set = (key: AdminSection, level: AccessLevel | null) => {
    const permissions = { ...value.permissions };
    if (level) permissions[key] = level;
    else delete permissions[key];
    onChange({ ...value, permissions });
  };
  const choice = (full: boolean, Icon: React.ElementType, title: string, text: string) => (
    <button
      type="button"
      onClick={() => onChange({ ...value, full })}
      aria-pressed={value.full === full}
      className={`flex-1 rounded-xl border p-3 text-left transition-colors ${value.full === full ? 'border-[#1d6ff2] bg-[#f2f7ff] ring-2 ring-[#1d6ff2]/15' : 'border-[#e3e8f1] hover:border-[#c9d3e3]'}`}
    >
      <span className="flex items-center gap-2 text-[13.5px] font-bold"><Icon className="w-4 h-4 text-[#1d6ff2]" /> {title}</span>
      <span className="mt-1 block text-[12px] text-[#6b7590]">{text}</span>
    </button>
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        {choice(true, ShieldCheck, 'Accès complet', 'Toutes les sections, et la gestion des administrateurs.')}
        {choice(false, ShieldHalf, 'Accès limité', 'Seulement les sections choisies ci-dessous.')}
      </div>
      {!value.full && (
        <div className="rounded-xl border border-[#edf1f7]">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#edf1f7] bg-[#fafbfd] rounded-t-xl">
            <span className="text-[12px] font-semibold text-[#5b6680]">Section</span>
            <span className="text-[12px] font-semibold text-[#5b6680]">Accès</span>
          </div>
          {sections.map(s => {
            const current = value.permissions[s.key] ?? null;
            const options: { level: AccessLevel | null; label: string }[] = [
              { level: null, label: 'Aucun' },
              ...s.levels.map(l => ({ level: l, label: LEVEL_LABEL[l] })),
            ];
            return (
              <div key={s.key} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b last:border-b-0 border-[#edf1f7]">
                <span className={`text-[13px] ${current ? 'font-semibold text-[#0b1533]' : 'text-[#5b6680]'}`}>{s.label}</span>
                <div className="inline-flex rounded-lg bg-[#eef2f8] p-0.5" role="radiogroup" aria-label={s.label}>
                  {options.map(o => (
                    <button
                      key={o.label}
                      type="button"
                      role="radio"
                      aria-checked={current === o.level}
                      onClick={() => set(s.key, o.level)}
                      className={`rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors ${
                        current === o.level ? 'bg-white text-[#1d6ff2] shadow-[0_1px_3px_rgba(15,40,90,0.12)]' : 'text-[#5b6680] hover:text-[#0b1533]'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <p className="px-3 py-2 text-[11.5px] text-[#8a94ad] border-t border-[#edf1f7]">
            « Lecture » permet de consulter ; « Modification » permet aussi d&apos;agir (suspendre, créer, enregistrer un paiement…). Notifications et Paramètres restent ouverts à tous.
          </p>
        </div>
      )}
    </div>
  );
}

const accessInput = (a: AccessState) =>
  a.full ? { access: 'FULL' as const } : { access: 'LIMITED' as const, permissions: a.permissions };

// ─── Dialogs ────────────────────────────────────────────────────────────────

function CreateAdminDialog({ sections, onDone, onClose }: { sections: AdminSectionDef[]; onDone: (msg: string) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(generatePassword);
  const [access, setAccess] = useState<AccessState>({ full: false, permissions: {} });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await adminApi.createAdmin({ name, email, password, ...(phone ? { phone } : {}), ...accessInput(access) });
      onDone(`Compte créé pour ${name}. Communiquez-lui son e-mail et son mot de passe ; il pourra le changer dans Paramètres.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <Modal
        wide
        title="Ajouter un administrateur"
        subtitle="Le compte se connecte au tableau de bord avec cet e-mail et ce mot de passe."
        onClose={onClose}
        footer={<>
          <button type="button" onClick={onClose} disabled={saving} className={btnGhost}>Annuler</button>
          <button type="submit" disabled={saving || (!access.full && !Object.keys(access.permissions).length)} className={btnPrimary}>
            {saving && <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
            Créer le compte
          </button>
        </>}
      >
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nom complet</label>
            <input required minLength={2} value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>E-mail</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Téléphone <span className="font-normal text-[#8a94ad]">(facultatif)</span></label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+216 …" className={inputCls} />
          </div>
          <PasswordField value={password} onChange={setPassword} generate hint="Copiez-le avant de créer le compte : il ne sera plus affiché." />
        </div>
        <AccessEditor sections={sections} value={access} onChange={setAccess} />
      </Modal>
    </form>
  );
}

function EditAccessDialog({ admin, sections, onDone, onClose }: { admin: AdminAccount; sections: AdminSectionDef[]; onDone: (msg: string) => void; onClose: () => void }) {
  const [name, setName] = useState(admin.name);
  const [access, setAccess] = useState<AccessState>({ full: admin.full, permissions: admin.permissions ?? {} });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await adminApi.updateAdmin(admin.id, { name, ...accessInput(access) });
      onDone(`Accès de ${name} mis à jour. Le changement s'applique immédiatement.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <Modal
        wide
        title={`Accès de ${admin.name}`}
        subtitle={admin.email}
        onClose={onClose}
        footer={<>
          <button type="button" onClick={onClose} disabled={saving} className={btnGhost}>Annuler</button>
          <button type="submit" disabled={saving || (!access.full && !Object.keys(access.permissions).length)} className={btnPrimary}>Enregistrer</button>
        </>}
      >
        {error && <Alert tone="error">{error}</Alert>}
        <div>
          <label className={labelCls}>Nom complet</label>
          <input required minLength={2} value={name} onChange={e => setName(e.target.value)} className={inputCls} />
        </div>
        <AccessEditor sections={sections} value={access} onChange={setAccess} />
      </Modal>
    </form>
  );
}

function ResetPasswordDialog({ admin, onDone, onClose }: { admin: AdminAccount; onDone: (msg: string) => void; onClose: () => void }) {
  const [password, setPassword] = useState(generatePassword);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminApi.resetAdminPassword(admin.id, password);
      onDone(`Nouveau mot de passe enregistré pour ${admin.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setSaving(false);
    }
  };
  return (
    <form onSubmit={submit}>
      <Modal
        title="Nouveau mot de passe"
        subtitle={`Pour ${admin.name} (${admin.email})`}
        onClose={onClose}
        footer={<>
          <button type="button" onClick={onClose} disabled={saving} className={btnGhost}>Annuler</button>
          <button type="submit" disabled={saving} className={btnPrimary}>Enregistrer</button>
        </>}
      >
        {error && <Alert tone="error">{error}</Alert>}
        <PasswordField value={password} onChange={setPassword} generate hint="Copiez-le et communiquez-le à la personne : il ne sera plus affiché." />
      </Modal>
    </form>
  );
}

function ConfirmDialog({ title, text, action, danger, onConfirm, onClose }: {
  title: string; text: string; action: string; danger?: boolean; onConfirm: () => Promise<void>; onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={<>
        <button type="button" onClick={onClose} disabled={busy} className={btnGhost}>Annuler</button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError('');
            try {
              await onConfirm();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Erreur');
              setBusy(false);
            }
          }}
          className={danger ? 'inline-flex items-center gap-2 rounded-xl bg-[#dc2626] hover:bg-[#ef4444] px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50' : btnPrimary}
        >
          {action}
        </button>
      </>}
    >
      {error && <Alert tone="error">{error}</Alert>}
      <p className="text-[13.5px] text-[#33405a]">{text}</p>
    </Modal>
  );
}

// ─── Admin list ─────────────────────────────────────────────────────────────

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit' | 'password' | 'toggle' | 'delete'; admin: AdminAccount };

function RowMenu({ admin, onPick }: { admin: AdminAccount; onPick: (d: Dialog) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const item = (Icon: React.ElementType, label: string, d: Dialog, cls = 'text-[#33405a]') => (
    <button onClick={() => { setOpen(false); onPick(d); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] hover:bg-[#f3f6fb] ${cls}`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)} aria-label={`Actions pour ${admin.name}`} aria-expanded={open} className="p-2 rounded-xl text-[#5b6680] hover:bg-[#f3f6fb]">
        <MoreHorizontal className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl border border-[#edf1f7] bg-white p-1.5 shadow-[0_14px_40px_rgba(15,40,90,0.16)]">
          {item(Pencil, "Modifier l'accès", { kind: 'edit', admin })}
          {item(KeyRound, 'Nouveau mot de passe', { kind: 'password', admin })}
          {item(Power, admin.active ? 'Désactiver le compte' : 'Réactiver le compte', { kind: 'toggle', admin }, admin.active ? 'text-[#a16207]' : 'text-[#15803d]')}
          {item(Trash2, 'Supprimer', { kind: 'delete', admin }, 'text-[#dc2626]')}
        </div>
      )}
    </div>
  );
}

function AdminAccounts({ sections, myId }: { sections: AdminSectionDef[]; myId: number | undefined }) {
  const [admins, setAdmins] = useState<AdminAccount[] | null>(null);
  const [failed, setFailed] = useState('');
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    setFailed('');
    adminApi.getAdmins().then(res => setAdmins(res.data)).catch(e => setFailed(e.message));
  }, []);
  useEffect(load, [load]);

  const done = (msg: string) => {
    setDialog(null);
    setNotice(msg);
    load();
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-[#e8f0fe] flex items-center justify-center shrink-0"><UserCog className="w-5 h-5 text-[#1d6ff2]" /></span>
          <div>
            <h2 className="text-[16px] font-extrabold">Administrateurs</h2>
            <p className="text-[12.5px] text-[#6b7590]">Qui peut ouvrir le tableau de bord, et quelles sections.</p>
          </div>
        </div>
        <button onClick={() => setDialog({ kind: 'create' })} className={btnPrimary}>
          <UserPlus className="w-4 h-4" /> Ajouter un administrateur
        </button>
      </div>

      {notice && <div className="px-5 pb-3"><Alert tone="success">{notice}</Alert></div>}
      {failed && (
        <div className="px-5 pb-4 flex items-center gap-3">
          <Alert tone="error">{failed}</Alert>
          <button onClick={load} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#b91c1c] hover:underline"><RefreshCw className="w-4 h-4" /> Réessayer</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-y border-[#edf1f7] bg-[#fafbfd] text-[11.5px] font-semibold uppercase tracking-wide text-[#8a94ad]">
              <th className="px-5 py-2.5">Administrateur</th>
              <th className="px-3 py-2.5">Accès</th>
              <th className="px-3 py-2.5">Statut</th>
              <th className="px-3 py-2.5">Créé le</th>
              <th className="px-5 py-2.5 w-12" />
            </tr>
          </thead>
          <tbody>
            {!admins && !failed && Array.from({ length: 3 }, (_, i) => (
              <tr key={i} className="border-b border-[#edf1f7]"><td colSpan={5} className="px-5 py-3.5"><Skeleton className="h-9 w-full" /></td></tr>
            ))}
            {admins?.map(a => (
              <tr key={a.id} className={`border-b border-[#edf1f7] align-top ${a.active ? '' : 'bg-[#fafbfd]'}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={a.name} src={a.avatar} size={36} />
                    <div className="min-w-0">
                      <p className={`flex flex-wrap items-center gap-x-1.5 text-[13.5px] font-bold ${a.active ? '' : 'text-[#8a94ad]'}`}>
                        {a.name} {a.id === myId && <span className="whitespace-nowrap rounded-full bg-[#f1f4f9] px-2 py-0.5 text-[11px] font-semibold text-[#5b6680]">Vous</span>}
                      </p>
                      <p className="text-[12px] text-[#6b7590] truncate">{a.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5 max-w-[340px]">
                  <AccessBadge full={a.full} />
                  {!a.full && <div className="mt-1.5"><PermissionChips permissions={a.permissions} sections={sections} /></div>}
                </td>
                <td className="px-3 py-3.5">
                  {a.active ? (
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#15803d]"><span className="w-2 h-2 rounded-full bg-[#16a34a]" /> Actif</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#8a94ad]"><span className="w-2 h-2 rounded-full bg-[#94a3b8]" /> Désactivé</span>
                  )}
                </td>
                <td className="px-3 py-3.5 text-[12.5px] text-[#5b6680]">
                  {fmtDay(a.createdAt)}
                  {a.createdBy?.name && <p className="text-[11.5px] text-[#8a94ad]">par {a.createdBy.name}</p>}
                </td>
                <td className="px-5 py-3 text-right">
                  {a.id !== myId && <RowMenu admin={a} onPick={setDialog} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-5 py-3 text-[12px] text-[#8a94ad]">
        Vous ne pouvez pas modifier votre propre accès : il reste donc toujours au moins un administrateur avec un accès complet.
      </p>

      {dialog?.kind === 'create' && <CreateAdminDialog sections={sections} onDone={done} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'edit' && <EditAccessDialog admin={dialog.admin} sections={sections} onDone={done} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'password' && <ResetPasswordDialog admin={dialog.admin} onDone={done} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'toggle' && (
        <ConfirmDialog
          title={dialog.admin.active ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?'}
          text={dialog.admin.active
            ? `${dialog.admin.name} sera déconnecté immédiatement et ne pourra plus se connecter. Vous pourrez réactiver le compte plus tard.`
            : `${dialog.admin.name} pourra de nouveau se connecter, avec les mêmes accès qu'avant.`}
          action={dialog.admin.active ? 'Désactiver' : 'Réactiver'}
          danger={dialog.admin.active}
          onConfirm={async () => {
            await adminApi.setAdminActive(dialog.admin.id, !dialog.admin.active);
            done(dialog.admin.active ? `${dialog.admin.name} est désactivé.` : `${dialog.admin.name} est réactivé.`);
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title="Supprimer ce compte ?"
          text={`Le compte de ${dialog.admin.name} sera supprimé définitivement. Pour seulement couper son accès, préférez « Désactiver ».`}
          action="Supprimer définitivement"
          danger
          onConfirm={async () => {
            await adminApi.deleteAdmin(dialog.admin.id);
            done(`Le compte de ${dialog.admin.name} est supprimé.`);
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </Card>
  );
}

// ─── My account ─────────────────────────────────────────────────────────────

function MyAccount() {
  const { me, full } = useAccess();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    if (next !== confirm) {
      setResult({ tone: 'error', text: 'Les deux nouveaux mots de passe ne correspondent pas.' });
      return;
    }
    const weak = passwordProblem(next);
    if (weak) {
      setResult({ tone: 'error', text: weak });
      return;
    }
    setSaving(true);
    try {
      await adminApi.changeOwnPassword(current, next);
      setResult({ tone: 'success', text: 'Mot de passe modifié.' });
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      // The app's endpoint answers in English
      const message = err instanceof Error ? err.message : '';
      setResult({
        tone: 'error',
        text: /current password/i.test(message) ? 'Le mot de passe actuel est incorrect.'
          : /validation failed/i.test(message) ? 'Le nouveau mot de passe ne respecte pas les règles (8 caractères, majuscule, minuscule, chiffre et caractère spécial comme ! ou ?).'
          : message || 'Erreur',
      });
    }
    setSaving(false);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Avatar name={me?.name ?? 'A'} src={me?.avatar} size={44} />
        <div className="min-w-0">
          <h2 className="text-[16px] font-extrabold truncate">{me?.name ?? 'Mon compte'}</h2>
          <p className="text-[12.5px] text-[#6b7590] truncate">{me?.email}</p>
        </div>
      </div>
      <div className="mt-4">
        <AccessBadge full={full} />
        {!full && me && (
          <div className="mt-2">
            <PermissionChips permissions={me.permissions} sections={me.sections} />
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mt-5 pt-4 border-t border-[#edf1f7] space-y-3">
        <h3 className="flex items-center gap-2 text-[14px] font-bold"><Lock className="w-4 h-4 text-[#5b6680]" /> Changer mon mot de passe</h3>
        {result && <Alert tone={result.tone}>{result.text}</Alert>}
        <div>
          <label className={labelCls}>Mot de passe actuel</label>
          <input required type="password" value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" className={inputCls} />
        </div>
        <PasswordField label="Nouveau mot de passe" value={next} onChange={setNext} />
        <div>
          <label className={labelCls}>Confirmer le nouveau mot de passe</label>
          <input required type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" className={inputCls} />
        </div>
        <button type="submit" disabled={saving} className={btnPrimary}>Enregistrer</button>
      </form>
    </Card>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ParametresPage() {
  const { me, full } = useAccess();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

  return (
    <>
      <TopBar />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex w-11 h-11 rounded-xl bg-[#e8f0fe] items-center justify-center shrink-0">
            <Settings className="w-6 h-6 text-[#1d6ff2]" strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">Paramètres</h1>
            <p className="mt-0.5 text-[13px] text-[#6b7590]">Votre compte{full ? ', les comptes administrateur' : ''} et la configuration du tableau de bord.</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] items-start">
          <div className="space-y-4 min-w-0">
            {full ? (
              me ? <AdminAccounts sections={me.sections} myId={me.id} /> : null
            ) : (
              <Card className="p-5 flex items-start gap-3">
                <ShieldHalf className="w-5 h-5 text-[#a16207] mt-0.5 shrink-0" />
                <p className="text-[13.5px] text-[#33405a]">
                  Votre compte a un accès limité. Seuls les administrateurs avec un accès complet peuvent ajouter des administrateurs ou changer leurs accès.
                </p>
              </Card>
            )}

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Settings className="w-5 h-5 text-[#1d6ff2]" />
                <h2 className="text-[15px] font-bold">Application</h2>
              </div>
              <div className="text-[13px]">
                <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-[#edf1f7]">
                  <span className="text-[#6b7590]">URL de l&apos;API</span>
                  <span className="font-mono text-[12px] text-[#33405a] bg-[#f6f8fc] px-2 py-1 rounded-lg break-all">{apiUrl}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#edf1f7]">
                  <span className="text-[#6b7590]">Version du tableau de bord</span>
                  <span className="text-[#33405a]">1.0.0</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[#6b7590]">Santé du backend</span>
                  <a href={apiUrl.replace(/\/api\/?$/, '/health')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#1d6ff2] hover:underline text-[12.5px] font-semibold">
                    Vérifier <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </Card>
          </div>

          <MyAccount />
        </div>
      </main>
    </>
  );
}
