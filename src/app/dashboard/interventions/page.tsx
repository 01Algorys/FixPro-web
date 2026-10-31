import StubPage from '@/components/ui/StubPage';

export default function InterventionsPage() {
  return (
    <StubPage
      title="Interventions"
      subtitle="Suivi des interventions en cours et terminées"
      breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Interventions' }]}
      todo="TODO: aujourd'hui une intervention = une réservation IN_PROGRESS ou COMPLETED. Nécessite un filtre par statut et par date sur GET /admin/reservations."
    />
  );
}
