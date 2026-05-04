import { supabase } from './supabase'
import type { Claim, ChatMessage, Manager, Client, Expert, ClaimStatus, ClaimType, ClaimDocument } from './types'

function rowToClaim(row: any): Claim {
  return {
    id: row.id,
    number: row.number,
    type: row.type as ClaimType,
    status: row.status as ClaimStatus,
    description: row.description ?? '',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    estimatedCost: row.estimated_cost ?? undefined,
    location: row.location_lat != null
      ? { lat: row.location_lat, lng: row.location_lng }
      : undefined,
    photos: row.photos ?? [],
    messages: (row.chat_messages ?? []).map(rowToMessage),
    assignedExpertId: row.assigned_expert_id ?? undefined,
    notes: row.notes ?? undefined,
    report: row.report ?? undefined,
    documents: row.documents ?? [],
    incidentAt: row.incident_at ? new Date(row.incident_at) : undefined,
  }
}

export async function uploadClaimPhoto(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `claims/photos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('green-cover-bucket')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('green-cover-bucket')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function uploadClaimDocument(file: File): Promise<ClaimDocument> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `claims/documents/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from('green-cover-bucket')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('green-cover-bucket')
    .getPublicUrl(filePath);

  return { name: file.name, url: data.publicUrl };
}

function rowToMessage(row: any): ChatMessage {
  return {
    id: row.id,
    sender: row.sender,
    text: row.text,
    timestamp: new Date(row.created_at),
  }
}

function rowToManager(row: any): Manager {
  return {
    id: row.id,
    name: row.name,
    photoUrl: row.photo_url ?? '',
    phone: row.phone ?? '',
    available: row.available ?? true,
  }
}

function rowToClient(row: any): Client {
  return {
    id: row.id,
    name: row.name,
    location: row.location ?? '',
    managerName: row.manager_name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    policyNumber: row.policy_number ?? '',
    activeClaimsCount: Number(row.active_claims_count ?? 0),
    status: row.status as 'Actiu' | 'Inactiu' | 'Pendent',
  }
}

function rowToExpert(row: any): Expert {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty ?? '',
    zone: row.zone ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    rating: Number(row.rating ?? 0),
    activeClaims: Number(row.active_claims ?? 0),
  }
}

export async function getClaims(): Promise<Claim[]> {
  const { data, error } = await supabase
    .from('claims')
    .select('*, chat_messages(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(rowToClaim)
}

export async function getManager(): Promise<Manager | null> {
  const { data, error } = await supabase
    .from('managers')
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return rowToManager(data)
}

export async function getManagers(): Promise<Manager[]> {
  const { data, error } = await supabase
    .from('managers')
    .select('*')
    .order('name')
  if (error) throw error
  return (data ?? []).map(rowToManager)
}

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients_with_stats')
    .select('*')
    .order('name')
  if (error) throw error
  return (data ?? []).map(rowToClient)
}

export async function getExperts(): Promise<Expert[]> {
  const { data, error } = await supabase
    .from('experts')
    .select('*')
    .order('name')
  if (error) throw error
  return (data ?? []).map(rowToExpert)
}

export async function getClaimById(id: string): Promise<Claim | null> {
  const { data, error } = await supabase
    .from('claims')
    .select('*, chat_messages(*)')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return rowToClaim(data)
}

export async function sendMessage(
  claimId: string,
  sender: 'user' | 'manager',
  text: string
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ claim_id: claimId, sender, text })
    .select()
    .single()
  if (error) throw error
  return rowToMessage(data)
}

export async function updateClaimStatus(
  claimId: string,
  status: ClaimStatus,
  notes?: string
): Promise<void> {
  const payload: Record<string, unknown> = { status }
  if (notes !== undefined) payload.notes = notes
  const { error } = await supabase
    .from('claims')
    .update(payload)
    .eq('id', claimId)
  if (error) throw error
}

export async function assignExpert(claimId: string, expertId: string): Promise<void> {
  const { error } = await supabase
    .from('claims')
    .update({ assigned_expert_id: expertId, status: 'Perit designat' })
    .eq('id', claimId)
  if (error) throw error
}

export async function getClaimsByExpert(expertId: string): Promise<Claim[]> {
  const { data, error } = await supabase
    .from('claims')
    .select('*, chat_messages(*)')
    .eq('assigned_expert_id', expertId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(rowToClaim)
}

export async function submitExpertReport(
  claimId: string,
  report: string,
  newPhotoFiles: File[],
  newDocFiles: File[]
): Promise<void> {
  const { data: current } = await supabase
    .from('claims')
    .select('photos, documents')
    .eq('id', claimId)
    .maybeSingle()

  const existingPhotos: string[] = current?.photos ?? []
  const existingDocs: ClaimDocument[] = current?.documents ?? []

  const [uploadedPhotos, uploadedDocs] = await Promise.all([
    Promise.all(newPhotoFiles.map(uploadClaimPhoto)),
    Promise.all(newDocFiles.map(uploadClaimDocument)),
  ])

  // Canvi d'estat garantit: operació independent de les columnes noves
  const { error: statusError } = await supabase
    .from('claims')
    .update({ status: 'Informe rebut' })
    .eq('id', claimId)
  if (statusError) throw statusError

  const { error: detailError } = await supabase
    .from('claims')
    .update({
      report,
      photos: [...existingPhotos, ...uploadedPhotos],
      documents: [...existingDocs, ...uploadedDocs],
    })
    .eq('id', claimId)
  if (detailError) throw detailError
}

export async function getExpertById(id: string): Promise<Expert | null> {
  const { data, error } = await supabase
    .from('experts')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return rowToExpert(data)
}

export async function createManager(input: {
  name: string
  phone: string
  photoUrl?: string
  available?: boolean
}): Promise<Manager> {
  const { data, error } = await supabase
    .from('managers')
    .insert({
      name: input.name,
      phone: input.phone,
      photo_url: input.photoUrl ?? '',
      available: input.available ?? true,
    })
    .select('*')
    .single()

  if (error) throw error
  return rowToManager(data)
}

export async function createExpert(input: {
  name: string
  specialty: string
  zone: string
  phone: string
  email: string
  rating?: number
}): Promise<Expert> {
  const { data, error } = await supabase
    .from('experts')
    .insert({
      name: input.name,
      specialty: input.specialty,
      zone: input.zone,
      phone: input.phone,
      email: input.email,
      rating: input.rating ?? 0,
      active_claims: 0,
    })
    .select('*')
    .single()

  if (error) throw error
  return rowToExpert(data)
}

export async function createClaim(input: {
  const { data, error } = await supabase
    .from('claims')
    .insert({
      type: input.type,
      description: input.description,
      photos: input.photos,
      incident_at: input.incidentAt?.toISOString() ?? null,
      client_id: input.clientId ?? null,
      location_lat: input.locationLat ?? null,
      location_lng: input.locationLng ?? null,
    })
    .select('*, chat_messages(*)')
    .single()
  if (error) throw error
  return rowToClaim(data)
}
