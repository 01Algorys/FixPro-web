import type { Metadata } from 'next';
import Link from 'next/link';
import { jakarta } from '../fonts';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — FixPro',
  description: "Comment FixPro collecte, utilise et protège vos données personnelles.",
};

const UPDATED = '6 novembre 2026';
const CONTACT_EMAIL = 'fixproo.support@gmail.com';

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. Qui sommes-nous ?',
    body: (
      <p>
        FixPro est une application mobile et un site web qui mettent en relation des particuliers avec des
        techniciens (plombiers, électriciens, frigoristes…) en Tunisie. FixPro est édité depuis le 10 Rue des
        Entrepreneurs, Tunis, Tunisie. Pour toute question sur vos données, écrivez-nous à{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
  {
    title: '2. Données que nous collectons',
    body: (
      <ul>
        <li><strong>Compte :</strong> nom, adresse e-mail, numéro de téléphone, photo de profil et mot de passe (stocké chiffré, jamais en clair).</li>
        <li><strong>Connexion avec Google :</strong> si vous choisissez « Continuer avec Google », nous recevons de Google votre nom, votre adresse e-mail, votre photo de profil et un identifiant de compte Google. Nous ne recevons jamais votre mot de passe Google.</li>
        <li><strong>Connexion avec Apple :</strong> si vous choisissez « Continuer avec Apple », nous recevons d&apos;Apple un identifiant de compte et, si vous les partagez, votre nom et votre adresse e-mail (qui peut être une adresse masquée). Nous ne recevons jamais votre mot de passe Apple.</li>
        <li><strong>Profil technicien :</strong> services proposés, expérience, tarif horaire, description et position de travail.</li>
        <li><strong>Documents de vérification (techniciens, facultatifs) :</strong> photo recto et verso de la carte d&apos;identité, selfie avec la carte et preuve d&apos;activité (patente, diplôme, attestation ou facture). Ils sont stockés de façon privée et ne sont consultés que par notre équipe, uniquement pour attribuer le badge vérifié. Ils ne sont jamais montrés aux clients.</li>
        <li><strong>Réalisations (techniciens) :</strong> les photos de travaux que vous ajoutez à votre profil sont visibles publiquement.</li>
        <li><strong>Réservations :</strong> service demandé, date, heure, adresse d&apos;intervention, description du problème et photos éventuelles.</li>
        <li><strong>Localisation :</strong> avec votre autorisation, la position de votre appareil pour proposer des techniciens proches ou pré-remplir l&apos;adresse. Vous pouvez la refuser dans les réglages de votre téléphone.</li>
        <li><strong>Messages et avis :</strong> les messages et photos échangés avec un technicien ou un client au sujet d&apos;une réservation, ainsi que les notes et avis laissés.</li>
        <li><strong>Données techniques :</strong> jeton de notification pour vous envoyer des alertes, et journaux techniques nécessaires au bon fonctionnement du service.</li>
      </ul>
    ),
  },
  {
    title: '3. Pourquoi nous les utilisons',
    body: (
      <ul>
        <li>Créer et sécuriser votre compte, et vous connecter (y compris avec Google ou Apple).</li>
        <li>Vous permettre de réserver un technicien, de suivre vos interventions et d&apos;échanger avec lui.</li>
        <li>Afficher les techniciens disponibles près de chez vous.</li>
        <li>Vérifier l&apos;identité des techniciens qui envoient leurs documents et leur attribuer le badge vérifié, qui les fait passer en priorité dans les recherches.</li>
        <li>Vous envoyer des notifications liées à vos réservations et messages.</li>
        <li>Assurer la sécurité du service, prévenir la fraude et répondre à vos demandes de support.</li>
      </ul>
    ),
  },
  {
    title: '4. Données reçues de Google',
    body: (
      <>
        <p>
          Lorsque vous vous connectez avec Google, FixPro utilise uniquement votre nom, votre adresse e-mail, votre
          photo de profil et votre identifiant Google pour créer votre compte ou vous y connecter. Ces informations ne
          sont pas utilisées à des fins publicitaires, ne sont pas vendues et ne sont pas transmises à des tiers, sauf
          dans les cas décrits à la section 5.
        </p>
        <p>
          L&apos;utilisation et le transfert par FixPro des informations reçues des API Google respectent les{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
            règles relatives aux données utilisateur des services d&apos;API Google
          </a>
          , y compris les exigences d&apos;utilisation limitée (Limited Use).
        </p>
      </>
    ),
  },
  {
    title: '5. Avec qui nous les partageons',
    body: (
      <ul>
        <li><strong>Entre client et technicien :</strong> une fois une réservation acceptée, le client et le technicien voient le nom, le numéro de téléphone et l&apos;adresse d&apos;intervention nécessaires pour réaliser le service.</li>
        <li><strong>Prestataires techniques :</strong> hébergement de nos serveurs et de notre base de données, stockage des photos, envoi des notifications et connexion Google ou Apple. Ils traitent les données uniquement pour notre compte.</li>
        <li><strong>Obligations légales :</strong> si la loi ou une autorité compétente l&apos;exige.</li>
      </ul>
    ),
  },
  {
    title: '6. Durée de conservation',
    body: (
      <p>
        Vos données sont conservées tant que votre compte est actif. Lorsque vous supprimez votre compte, vos données
        personnelles, dont vos documents de vérification et vos photos de réalisations, sont supprimées ou anonymisées, sauf celles que nous devons garder pour respecter une obligation
        légale ou régler un litige.
      </p>
    ),
  },
  {
    title: '7. Sécurité',
    body: (
      <p>
        Les échanges entre l&apos;application et nos serveurs sont chiffrés (HTTPS), les mots de passe sont stockés
        sous forme chiffrée, et l&apos;accès aux données est limité aux personnes qui en ont besoin. Les documents de
        vérification et les photos de conversation sont stockés de façon privée, avec des liens d&apos;accès temporaires.
        Les informations cachées des photos, comme la position GPS, sont supprimées à l&apos;envoi.
      </p>
    ),
  },
  {
    title: '8. Vos droits',
    body: (
      <>
        <p>
          Conformément à la loi organique tunisienne n° 2004-63 sur la protection des données personnelles, vous
          pouvez accéder à vos données, les corriger, demander leur suppression ou vous opposer à leur traitement.
        </p>
        <ul>
          <li>Vous pouvez modifier vos informations depuis votre profil dans l&apos;application.</li>
          <li>Vous pouvez supprimer votre compte à tout moment depuis l&apos;application (Profil → Supprimer le compte).</li>
          <li>Pour toute autre demande, écrivez à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</li>
        </ul>
        <p>
          Si vous vous êtes connecté avec Google, vous pouvez aussi retirer l&apos;accès de FixPro depuis{' '}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">votre compte Google</a>.
        </p>
      </>
    ),
  },
  {
    title: '9. Mineurs',
    body: <p>FixPro s&apos;adresse aux personnes de 18 ans et plus. Nous ne collectons pas sciemment de données concernant des mineurs.</p>,
  },
  {
    title: '10. Modifications',
    body: (
      <p>
        Nous pouvons mettre à jour cette politique. La date de dernière mise à jour figure en haut de cette page ; en
        cas de changement important, nous vous en informerons dans l&apos;application.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className={`${jakarta.className} min-h-screen bg-[#f4f7fc] text-[#0b1533]`}>
      <header className="bg-[#0b1533] text-white">
        <div className="max-w-3xl mx-auto px-5 py-10 sm:py-14">
          <Link href="/" className="text-sm text-blue-200 hover:text-white">← FixPro</Link>
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">Politique de confidentialité</h1>
          <p className="mt-3 text-sm text-gray-300">Dernière mise à jour : {UPDATED}</p>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-5 py-10 space-y-6">
        <p className="text-[15px] leading-7 text-gray-700">
          Cette politique explique quelles données personnelles FixPro collecte lorsque vous utilisez l&apos;application
          mobile FixPro et le site fixpro-app.com, pourquoi nous les utilisons et quels sont vos droits.
        </p>
        {sections.map((s) => (
          <section key={s.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold">{s.title}</h2>
            <div className="mt-3 text-[15px] leading-7 text-gray-700 space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_a]:text-[#1d6ff2] [&_a]:underline [&_strong]:text-[#0b1533]">
              {s.body}
            </div>
          </section>
        ))}
      </article>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} FixPro · <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-gray-700">{CONTACT_EMAIL}</a>
      </footer>
    </main>
  );
}
