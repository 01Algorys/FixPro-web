import StubPage from '@/components/ui/StubPage';

export default function AbonnementsPage() {
  return (
    <StubPage
      title="Abonnements"
      subtitle="Plans et abonnements des techniciens"
      breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Abonnements' }]}
      todo="TODO: nécessite un modèle Subscription dans Prisma et les endpoints GET /admin/subscriptions."
    />
  );
}
