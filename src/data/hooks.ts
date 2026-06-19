import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { InterventionStatus, Priority } from '../types'

export function useUsers() {
  return useLiveQuery(() => db.users.toArray()) ?? []
}

export function useClients() {
  return useLiveQuery(() => db.clients.toArray()) ?? []
}

export function useTechnicians() {
  return useLiveQuery(() => db.technicians.toArray()) ?? []
}

export function useInterventions() {
  return useLiveQuery(() => db.interventions.toArray()) ?? []
}

export function useIntervention(id: string) {
  return useLiveQuery(() => db.interventions.get(id), [id])
}

export function useClient(id: string | undefined) {
  return useLiveQuery(() => (id ? db.clients.get(id) : undefined), [id])
}

export function useTechnician(id: string | undefined) {
  return useLiveQuery(() => (id ? db.technicians.get(id) : undefined), [id])
}

export async function updateInterventionStatus(id: string, status: InterventionStatus) {
  await db.interventions.update(id, { status })
}

export async function updateIntervention(id: string, data: Partial<{
  status: InterventionStatus
  priority: Priority
  technicianId: string
  report: string
  signature: string
  photosBefore: string[]
  photosAfter: string[]
}>) {
  await db.interventions.update(id, data)
}
