import StubPage from '@/components/ui/StubPage';

export default function PaiementsPage() {
  return (
    <StubPage
      title="Paiements"
      subtitle="Historique des transactions et remboursements"
      breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Paiements' }]}
      todo="TODO: nécessite un système de paiement (Stripe, Flouci…) et les endpoints GET /admin/payments, GET /admin/payments/stats."
    />
  );
}
