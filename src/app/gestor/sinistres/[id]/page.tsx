"use client";

import { useParams } from 'next/navigation';
import { ClaimDetailView } from '@/components/claim-detail-view';

export default function GestorClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ClaimDetailView claimId={id} role="gestor" backHref="/gestor/sinistres" />;
}
