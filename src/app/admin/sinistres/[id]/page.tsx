"use client";

import { useParams } from 'next/navigation';
import { ClaimDetailView } from '@/components/claim-detail-view';
import { PortalHeader } from '@/components/portal-header';

export default function AdminClaimDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PortalHeader
        title="Back-office"
        navItems={[
          { label: 'Sinistres', href: '/admin', active: true },
          { label: 'Clients', href: '/admin/clients', active: false },
          { label: 'Gestors', href: '/admin/managers', active: false },
          { label: 'Perits', href: '/admin/experts', active: false },
          { label: 'Usuaris', href: '/admin/users', active: false },
        ]}
        userName="Roger Jordana"
        userInitials="RJ"
        userSubtitle="Administrador"
      />
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <ClaimDetailView claimId={id} role="admin" backHref="/admin" />
      </main>
    </div>
  );
}
