import { db } from './db'
import type { User, Client, Technician, Intervention } from '../types'
import { avatarNadia, avatarKarim, avatarYacine, photos } from '../assets/images'

const users: User[] = [
  { id: 'u1', name: 'Nadia', role: 'manager', avatar: avatarNadia, zone: 'Oran' },
  { id: 'u2', name: 'Karim Belkacem', role: 'technicien', avatar: avatarKarim, zone: 'Oran Centre' },
  { id: 'u3', name: 'Yacine', role: 'technicien', avatar: avatarYacine, zone: 'Oran Est' },
]

const clients: Client[] = [
  { id: 'c1', name: 'Famille Benali', address: '12 Rue Larbi Ben M\'hidi, Oran', phone: '0551234567' },
  { id: 'c2', name: 'Epicerie Mostefa', address: '45 Bd Maata, Oran', phone: '0559876543' },
  { id: 'c3', name: 'Résidence El Bahia', address: '8 Rue des Frères Moulay, Oran', phone: '0543216789' },
  { id: 'c4', name: 'Café Internet Galaxy', address: '23 Av. de l\'ANP, Oran', phone: '0567891234' },
]

const technicians: Technician[] = [
  { id: 't1', name: 'Karim Belkacem', zone: 'Oran Centre', userId: 'u2' },
  { id: 't2', name: 'Yacine', zone: 'Oran Est', userId: 'u3' },
]

const today = new Date()
const day = (offset: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() + offset)
  d.setHours(9 + Math.floor(Math.random() * 6), 0, 0, 0)
  return d.toISOString()
}

const interventions: Intervention[] = [
  {
    id: 'i1',
    title: 'Installation fibre FTTH – Appt Benali',
    status: 'fait',
    priority: 'haute',
    technicianId: 't1',
    clientId: 'c1',
    location: '12 Rue Larbi Ben M\'hidi, Oran',
    photosBefore: [photos.fibreAvant],
    photosAfter: [photos.fibreApres],
    report: 'Installation ONT et tirage fibre terminés. Test débit OK (100 Mbps). Client satisfait.',
    signature: '',
    scheduledAt: day(-1),
  },
  {
    id: 'i2',
    title: 'Dépannage ADSL – Armoire technique Bd Maata',
    status: 'en_cours',
    priority: 'haute',
    technicianId: 't1',
    clientId: 'c2',
    location: '45 Bd Maata, Oran',
    photosBefore: [photos.armoireAvant],
    photosAfter: [photos.armoireApres],
    report: '',
    signature: '',
    scheduledAt: day(0),
  },
  {
    id: 'i3',
    title: 'Installation fibre – Commerce Mostefa Télécoms',
    status: 'a_faire',
    priority: 'moyenne',
    technicianId: 't1',
    clientId: 'c2',
    location: '45 Bd Maata, Oran',
    photosBefore: [photos.commerceAvant],
    photosAfter: [],
    report: '',
    signature: '',
    scheduledAt: day(1),
  },
  {
    id: 'i4',
    title: 'Dépannage ADSL – Domicile Résidence El Bahia',
    status: 'a_faire',
    priority: 'basse',
    technicianId: 't1',
    clientId: 'c3',
    location: '8 Rue des Frères Moulay, Oran',
    photosBefore: [photos.modemAvant],
    photosAfter: [],
    report: '',
    signature: '',
    scheduledAt: day(2),
  },
  {
    id: 'i5',
    title: 'Vérification ligne ADSL – Café Galaxy',
    status: 'a_faire',
    priority: 'moyenne',
    technicianId: 't2',
    clientId: 'c4',
    location: '23 Av. de l\'ANP, Oran',
    photosBefore: [],
    photosAfter: [],
    report: '',
    signature: '',
    scheduledAt: day(0),
  },
  {
    id: 'i6',
    title: 'Migration cuivre → fibre – Résidence El Bahia',
    status: 'en_cours',
    priority: 'haute',
    technicianId: 't2',
    clientId: 'c3',
    location: '8 Rue des Frères Moulay, Oran',
    photosBefore: [photos.fibreAvant],
    photosAfter: [],
    report: '',
    signature: '',
    scheduledAt: day(-1),
  },
]

export async function seedDatabase() {
  const count = await db.users.count()
  if (count > 0) return
  await db.users.bulkAdd(users)
  await db.clients.bulkAdd(clients)
  await db.technicians.bulkAdd(technicians)
  await db.interventions.bulkAdd(interventions)
}

export async function resetDatabase() {
  await db.delete()
  await db.open()
  await db.users.bulkAdd(users)
  await db.clients.bulkAdd(clients)
  await db.technicians.bulkAdd(technicians)
  await db.interventions.bulkAdd(interventions)
}
