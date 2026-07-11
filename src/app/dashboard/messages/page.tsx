import StubPage from '@/components/ui/StubPage';

export default function MessagesPage() {
  return (
    <StubPage
      title="Messages"
      subtitle="Conversations entre clients et techniciens"
      breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Messages' }]}
      todo="TODO: nécessite l'endpoint GET /admin/messages (list conversations) et une vue de conversation. Le modèle Message existe déjà dans Prisma."
    />
  );
}
