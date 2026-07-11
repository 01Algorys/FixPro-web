import { redirect } from 'next/navigation';

// "Demandes" is an alias for reservations in FixPro's domain
export default function DemandesPage() {
  redirect('/dashboard/reservations');
}
