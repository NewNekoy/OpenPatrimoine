import { propertiesService } from '@/services/properties.service'
import { tenantsService } from '@/services/tenants.service'
import { rentsService } from '@/services/rents.service'
import { accountingService } from '@/services/accounting.service'

function monthKey(offset: number): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offset)
  return d.toISOString().slice(0, 7)
}
function day(yearMonth: string, d = 1): string {
  return `${yearMonth}-${String(d).padStart(2, '0')}`
}

export async function seedTemplateData(): Promise<void> {
  // ── Properties ─────────────────────────────────────────────────────────────
  const p1 = await propertiesService.create({
    name: 'Appartement Lyon 3e', address: '14 rue Garibaldi', city: 'Lyon',
    type: 'apartment', surface: 52, rooms: 3,
    purchasePrice: 185000, purchaseDate: '2019-06-15',
    notes: 'Rénové en 2020, double vitrage, parquet chêne.',
    photos: []
  })
  const p2 = await propertiesService.create({
    name: 'Maison Bordeaux Caudéran', address: '7 allée des Acacias', city: 'Bordeaux',
    type: 'house', surface: 110, rooms: 5,
    purchasePrice: 320000, purchaseDate: '2021-03-01',
    photos: []
  })
  const p3 = await propertiesService.create({
    name: 'Studio Paris 11e', address: '32 boulevard Voltaire', city: 'Paris',
    type: 'apartment', surface: 24, rooms: 1,
    purchasePrice: 210000, purchaseDate: '2018-11-20',
    notes: 'Meublé. Idéal étudiant.',
    photos: []
  })
  const p4 = await propertiesService.create({
    name: 'Parking Marseille Centre', address: '5 rue de la République', city: 'Marseille',
    type: 'parking', surface: 12,
    purchasePrice: 18000, purchaseDate: '2022-07-10',
    photos: []
  })

  // ── Tenants ─────────────────────────────────────────────────────────────────
  const t1 = await tenantsService.create({
    firstName: 'Marie', lastName: 'Leblanc',
    email: 'marie.leblanc@gmail.com', phone: '06 12 34 56 78',
    propertyId: p1.id, leaseStart: '2022-09-01',
    monthlyRent: 780, charges: 60, deposit: 840,
    notes: 'Locataire sérieuse, toujours à jour.', photos: [], documents: []
  })
  const t2 = await tenantsService.create({
    firstName: 'Thomas', lastName: 'Mercier',
    email: 'tmercier@outlook.fr', phone: '07 65 43 21 09',
    propertyId: p2.id, leaseStart: '2021-07-01', leaseEnd: day(monthKey(1), 30),
    monthlyRent: 1150, charges: 120, deposit: 1150,
    notes: 'Bail se termine le mois prochain.', photos: [], documents: []
  })
  const t3 = await tenantsService.create({
    firstName: 'Léa', lastName: 'Fontaine',
    email: 'lea.fontaine@hotmail.com', phone: '06 98 76 54 32',
    propertyId: p3.id, leaseStart: '2023-01-15',
    monthlyRent: 890, charges: 0, deposit: 890,
    photos: [], documents: []
  })
  const t4 = await tenantsService.create({
    firstName: 'David', lastName: 'Renard',
    email: 'david.renard@gmail.com',
    propertyId: p1.id, leaseStart: '2020-03-01', leaseEnd: '2023-08-31',
    monthlyRent: 750, charges: 55, deposit: 750,
    notes: 'Ancien locataire — bail terminé.', photos: [], documents: []
  })
  const t5 = await tenantsService.create({
    firstName: 'Sophie', lastName: 'Durand',
    email: 'sophie.durand@gmail.com', phone: '06 11 22 33 44',
    propertyId: p4.id, leaseStart: '2022-12-01',
    monthlyRent: 80, charges: 0, deposit: 80,
    photos: [], documents: []
  })

  // ── Rents ───────────────────────────────────────────────────────────────────
  const currentMonth = monthKey(0)
  const m1 = monthKey(-1)
  const m2 = monthKey(-2)
  const m3 = monthKey(-3)
  const m4 = monthKey(-4)
  const m5 = monthKey(-5)

  // Marie Leblanc (p1) — payés régulièrement sauf ce mois en attente
  for (const m of [m5, m4, m3, m2, m1]) {
    await rentsService.create({
      tenantId: t1.id, propertyId: p1.id, amount: 840,
      dueDate: day(m), paidDate: day(m, 5), status: 'paid'
    })
  }
  await rentsService.create({
    tenantId: t1.id, propertyId: p1.id, amount: 840,
    dueDate: day(currentMonth), status: 'pending'
  })

  // Thomas Mercier (p2) — un retard + en attente ce mois
  for (const m of [m4, m3, m2]) {
    await rentsService.create({
      tenantId: t2.id, propertyId: p2.id, amount: 1270,
      dueDate: day(m), paidDate: day(m, 8), status: 'paid'
    })
  }
  await rentsService.create({
    tenantId: t2.id, propertyId: p2.id, amount: 1270,
    dueDate: day(m1), status: 'late'
  })
  await rentsService.create({
    tenantId: t2.id, propertyId: p2.id, amount: 1270,
    dueDate: day(currentMonth), status: 'pending'
  })

  // Léa Fontaine (p3) — tous payés
  for (const m of [m5, m4, m3, m2, m1]) {
    await rentsService.create({
      tenantId: t3.id, propertyId: p3.id, amount: 890,
      dueDate: day(m), paidDate: day(m, 3), status: 'paid'
    })
  }
  await rentsService.create({
    tenantId: t3.id, propertyId: p3.id, amount: 890,
    dueDate: day(currentMonth), paidDate: day(currentMonth, 2), status: 'paid'
  })

  // David Renard (ancien, p1) — loyer impayé ancien
  await rentsService.create({
    tenantId: t4.id, propertyId: p1.id, amount: 805,
    dueDate: '2023-08-01', status: 'late'
  })

  // Sophie Durand (parking p4)
  for (const m of [m3, m2, m1]) {
    await rentsService.create({
      tenantId: t5.id, propertyId: p4.id, amount: 80,
      dueDate: day(m), paidDate: day(m, 10), status: 'paid'
    })
  }
  await rentsService.create({
    tenantId: t5.id, propertyId: p4.id, amount: 80,
    dueDate: day(currentMonth), status: 'pending'
  })

  // ── Accounting ──────────────────────────────────────────────────────────────
  const year = new Date().getFullYear()
  const entries: Parameters<typeof accountingService.create>[0][] = [
    // Recettes — loyers
    { type: 'income', category: 'Loyer', amount: 840, date: `${year}-01-05`, propertyId: p1.id, description: 'Loyer — Marie Leblanc (janvier)' },
    { type: 'income', category: 'Loyer', amount: 840, date: `${year}-02-05`, propertyId: p1.id, description: 'Loyer — Marie Leblanc (février)' },
    { type: 'income', category: 'Loyer', amount: 840, date: `${year}-03-05`, propertyId: p1.id, description: 'Loyer — Marie Leblanc (mars)' },
    { type: 'income', category: 'Loyer', amount: 1270, date: `${year}-01-08`, propertyId: p2.id, description: 'Loyer — Thomas Mercier (janvier)' },
    { type: 'income', category: 'Loyer', amount: 1270, date: `${year}-02-08`, propertyId: p2.id, description: 'Loyer — Thomas Mercier (février)' },
    { type: 'income', category: 'Loyer', amount: 890, date: `${year}-01-03`, propertyId: p3.id, description: 'Loyer — Léa Fontaine (janvier)' },
    { type: 'income', category: 'Loyer', amount: 890, date: `${year}-02-03`, propertyId: p3.id, description: 'Loyer — Léa Fontaine (février)' },
    { type: 'income', category: 'Loyer', amount: 890, date: `${year}-03-03`, propertyId: p3.id, description: 'Loyer — Léa Fontaine (mars)' },
    { type: 'income', category: 'Loyer', amount: 80, date: `${year}-01-10`, propertyId: p4.id, description: 'Loyer — Sophie Durand (janvier)' },
    { type: 'income', category: 'Loyer', amount: 80, date: `${year}-02-10`, propertyId: p4.id, description: 'Loyer — Sophie Durand (février)' },

    // Charges — p1
    { type: 'expense', category: 'Travaux', amount: 1400, date: `${year}-02-14`, propertyId: p1.id, description: 'Remplacement chauffe-eau' },
    { type: 'expense', category: 'Assurance', amount: 320, date: `${year}-01-01`, propertyId: p1.id, description: 'Prime assurance PNO annuelle' },
    { type: 'expense', category: 'Taxe foncière', amount: 780, date: `${year}-01-20`, propertyId: p1.id, description: 'Taxe foncière 2024' },

    // Charges — p2
    { type: 'expense', category: 'Travaux', amount: 3200, date: `${year}-03-05`, propertyId: p2.id, description: 'Réfection toiture partielle' },
    { type: 'expense', category: 'Assurance', amount: 510, date: `${year}-01-01`, propertyId: p2.id, description: 'Prime assurance PNO annuelle' },
    { type: 'expense', category: 'Taxe foncière', amount: 1240, date: `${year}-01-20`, propertyId: p2.id, description: 'Taxe foncière 2024' },
    { type: 'expense', category: 'Frais de gestion', amount: 190, date: `${year}-02-01`, propertyId: p2.id, description: 'Honoraires agence — février' },

    // Charges — p3
    { type: 'expense', category: 'Assurance', amount: 180, date: `${year}-01-01`, propertyId: p3.id, description: 'Prime assurance PNO annuelle' },
    { type: 'expense', category: 'Copropriété', amount: 210, date: `${year}-01-15`, propertyId: p3.id, description: 'Charges copropriété Q1' },
    { type: 'expense', category: 'Taxe foncière', amount: 420, date: `${year}-01-20`, propertyId: p3.id, description: 'Taxe foncière 2024' },

    // Général
    { type: 'expense', category: 'Comptabilité', amount: 600, date: `${year}-01-10`, description: 'Honoraires expert-comptable 2024' },
  ]

  for (const entry of entries) {
    await accountingService.create(entry)
  }
}
