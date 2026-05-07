"use client";

import { useParams } from 'next/navigation';
import { ClaimDetailView } from '@/components/claim-detail-view';

export default function AdminClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ClaimDetailView claimId={id} role="admin" backHref="/admin" />;
}
