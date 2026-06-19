export interface User {
  id: string
  name: string
  role: 'manager' | 'technicien'
  avatar: string
  zone: string
}

export interface Client {
  id: string
  name: string
  address: string
  phone: string
}

export interface Technician {
  id: string
  name: string
  zone: string
  userId: string
}

export type InterventionStatus = 'a_faire' | 'en_cours' | 'fait'
export type Priority = 'basse' | 'moyenne' | 'haute'

export interface Intervention {
  id: string
  title: string
  status: InterventionStatus
  priority: Priority
  technicianId: string
  clientId: string
  location: string
  photosBefore: string[]
  photosAfter: string[]
  report: string
  signature: string
  scheduledAt: string
}
