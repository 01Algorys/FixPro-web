'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

// FixPro works by country: a client only sees and books technicians of their
// own country. An account's country comes from its phone number at sign-up.

const ALL_COUNTRIES = 'AC AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TA TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW'.split(' ');

const names = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['fr'], { type: 'region' }) : null;

export const countryName = (code: string) => {
  try {
    return names?.of(code) ?? code;
  } catch {
    return code;
  }
};

// 'TN' -> 🇹🇳
export const countryFlag = (code: string) =>
  /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...Array.from(code).map(letter => 0x1f1e6 + letter.charCodeAt(0) - 65)) : '';

/** Filter listing the countries that have accounts, with how many. */
export function CountryFilter({ value, onChange }: { value: string; onChange: (country: string) => void }) {
  const [countries, setCountries] = useState<{ country: string; clients: number; technicians: number }[]>([]);

  useEffect(() => {
    adminApi.getCountries().then(res => setCountries(res.data)).catch(() => {});
  }, []);

  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
      <option value="ALL">Tous les pays</option>
      {countries.map(c => (
        <option key={c.country} value={c.country}>
          {countryFlag(c.country)} {countryName(c.country)} ({c.clients + c.technicians})
        </option>
      ))}
    </select>
  );
}

/** An account's country; click to move the account to another one. */
export function CountryBadge({ userId, country, canEdit, onChanged }: { userId: number; country?: string; canEdit: boolean; onChanged: (country: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [choice, setChoice] = useState(country ?? 'TN');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!country) return null;

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await adminApi.updateUserCountry(userId, choice);
      onChanged(res.data.country);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec du changement de pays');
    }
    setBusy(false);
  };

  if (!editing) {
    return canEdit ? (
      <button onClick={() => { setChoice(country); setEditing(true); }} title={`${countryName(country)} — changer de pays`}
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600">
        {countryFlag(country)} {country}
      </button>
    ) : (
      <span title={countryName(country)} className="inline-flex items-center gap-1 text-xs text-gray-500">{countryFlag(country)} {country}</span>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(false)}>
      <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-900">Changer de pays</h3>
        <p className="text-sm text-gray-500 mt-1">
          Un client ne voit que les techniciens de son pays, et un technicien n&apos;est visible que des clients du sien.
        </p>
        <select value={choice} onChange={e => setChoice(e.target.value)}
          className="mt-4 w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          {[...ALL_COUNTRIES].sort((a, b) => countryName(a).localeCompare(countryName(b), 'fr')).map(code => (
            <option key={code} value={code}>{countryFlag(code)} {countryName(code)}</option>
          ))}
        </select>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setEditing(false)} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Annuler</button>
          <button onClick={save} disabled={busy || choice === country}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
