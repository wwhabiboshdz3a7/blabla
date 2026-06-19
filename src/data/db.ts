import Dexie, { type Table } from 'dexie'
import type { User, Client, Technician, Intervention } from '../types'

class FanniDB extends Dexie {
  users!: Table<User>
  clients!: Table<Client>
  technicians!: Table<Technician>
  interventions!: Table<Intervention>

  constructor() {
    super('fanni-pro')
    this.version(1).stores({
      users: 'id, role',
      clients: 'id',
      technicians: 'id, userId',
      interventions: 'id, status, technicianId, clientId, scheduledAt',
    })
  }
}

export const db = new FanniDB()
