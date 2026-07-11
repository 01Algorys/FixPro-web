import StubPage from '@/components/ui/StubPage';

export default function ZonesPage() {
  return (
    <StubPage
      title="Zones d'intervention"
      subtitle="Gestion des zones géographiques couvertes par les techniciens"
      breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: "Zones d'intervention" }]}
      todo="TODO: les zones sont stockées dans Worker.serviceArea (Json). Ajouter un endpoint GET /admin/zones/stats et une carte interactive (Leaflet ou Google Maps)."
    />
  );
}
