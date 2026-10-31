import StubPage from '@/components/ui/StubPage';

export default function RapportsPage() {
  return (
    <StubPage
      title="Rapports & Analyses"
      subtitle="Statistiques détaillées de la plateforme"
      breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Rapports & Analyses' }]}
      todo="TODO: nécessite des endpoints d'agrégation (séries temporelles, revenus par période, export) côté backend."
    />
  );
}
