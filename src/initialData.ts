/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Animal, CropField, FeedInventory, FeedAssignment, Partner, PartnerTransaction } from './types';

export const initialAnimals: Animal[] = [
  {
    id: 'an-1',
    caravana: 'AR-3012',
    breed: 'Aberdeen Angus',
    gender: 'Macho',
    category: 'Novillo',
    birthDate: '2024-09-12',
    initialWeight: 180,
    currentWeight: 310,
    weightHistory: [
      { date: '2024-11-15', weight: 180 },
      { date: '2025-01-20', weight: 220 },
      { date: '2025-03-10', weight: 265 },
      { date: '2025-05-15', weight: 310 },
    ],
    status: 'Activo',
    notes: 'Excelente ganancia diaria. Muy dócil.',
    partnerId: 'part-1',
  },
  {
    id: 'an-2',
    caravana: 'AR-3015',
    breed: 'Aberdeen Angus',
    gender: 'Macho',
    category: 'Novillo',
    birthDate: '2024-09-20',
    initialWeight: 175,
    currentWeight: 295,
    weightHistory: [
      { date: '2024-11-15', weight: 175 },
      { date: '2025-01-20', weight: 210 },
      { date: '2025-03-10', weight: 250 },
      { date: '2025-05-15', weight: 295 },
    ],
    status: 'Activo',
    notes: 'Grupo bache 1.',
    partnerId: 'part-1',
  },
  {
    id: 'an-3',
    caravana: 'AR-3024',
    breed: 'Hereford',
    gender: 'Hembra',
    category: 'Vaquillona',
    birthDate: '2024-10-05',
    initialWeight: 160,
    currentWeight: 270,
    weightHistory: [
      { date: '2024-12-01', weight: 160 },
      { date: '2025-02-15', weight: 195 },
      { date: '2025-04-10', weight: 235 },
      { date: '2025-05-30', weight: 270 },
    ],
    status: 'Activo',
    notes: 'Destinada a futura madre.',
    partnerId: 'part-2',
  },
  {
    id: 'an-4',
    caravana: 'AR-3051',
    breed: 'Brangus',
    gender: 'Macho',
    category: 'Ternero',
    birthDate: '2025-01-10',
    initialWeight: 90,
    currentWeight: 165,
    weightHistory: [
      { date: '2025-03-01', weight: 90 },
      { date: '2025-04-15', weight: 125 },
      { date: '2025-05-25', weight: 165 },
    ],
    status: 'Activo',
    notes: 'Destetado recientemente.',
    partnerId: 'part-2',
  },
  {
    id: 'an-5',
    caravana: 'AR-2980',
    breed: 'Hereford',
    gender: 'Hembra',
    category: 'Vaca',
    birthDate: '2022-05-15',
    initialWeight: 420,
    currentWeight: 495,
    weightHistory: [
      { date: '2024-10-01', weight: 420 },
      { date: '2025-01-15', weight: 445 },
      { date: '2025-03-20', weight: 470 },
      { date: '2025-05-28', weight: 495 },
    ],
    status: 'Activo',
    notes: 'Preñada, parición estimada para Agosto.',
    partnerId: 'part-1',
  }
];

export const initialFeeds: FeedInventory[] = [
  {
    id: 'fd-1',
    name: 'Silo de Maíz planta entera',
    stockKg: 45000,
    costPerKgUSD: 0.08, // Producido propio, costo por kg
    source: 'Producido',
    notes: 'Cosechado del Lote Norte.',
  },
  {
    id: 'fd-2',
    name: 'Fardo de Raygrass',
    stockKg: 8500,
    costPerKgUSD: 0.12,
    source: 'Producido',
    notes: 'Excelente calidad de fibra.',
  },
  {
    id: 'fd-3',
    name: 'Concentrado Iniciador Bovinos',
    stockKg: 2400,
    costPerKgUSD: 0.35, // Comprado
    source: 'Comprado',
    notes: 'Alimento premium bolsas de 40kg.',
  },
];

export const initialAssignments: FeedAssignment[] = [
  { id: 'as-1', animalId: 'an-1', date: '2025-05-25', feedId: 'fd-1', amountKg: 8 },
  { id: 'as-2', animalId: 'an-1', date: '2025-05-25', feedId: 'fd-3', amountKg: 1.5 },
  { id: 'as-3', animalId: 'an-2', date: '2025-05-25', feedId: 'fd-1', amountKg: 8 },
  { id: 'as-4', animalId: 'an-2', date: '2025-05-25', feedId: 'fd-3', amountKg: 1.5 },
  { id: 'as-5', animalId: 'an-3', date: '2025-05-25', feedId: 'fd-2', amountKg: 4 },
  { id: 'as-6', animalId: 'an-4', date: '2025-05-25', feedId: 'fd-3', amountKg: 2 },
];

export const initialFields: CropField[] = [
  {
    id: 'fld-1',
    name: 'Estancia La Querencia - Lote 4',
    areaHectares: 45,
    cropType: 'Maíz para Silo',
    rentalCostUSD: 13500, // Equivale a 300 USD/ha
    rentalContractTerm: 'Campaña de Verano (6 meses)',
    status: 'Completado' as any, // We will support status 'Sembrado', 'En Desarrollo', 'Cosechado', 'Planificado'
    estimatedYieldTon: 540, // 12 Ton/ha
    actualYieldTon: 562,
    harvestDate: '2025-04-10',
    expenses: [
      { id: 'e-1', category: 'Alquiler', description: 'Canon de alquiler total (45 Hectáreas)', amountUSD: 13500, date: '2024-10-01' },
      { id: 'e-2', category: 'Semilla', description: 'Híbrido de Maíz Silero KWS (45 bolsas)', amountUSD: 7200, date: '2024-10-15' },
      { id: 'e-3', category: 'Fertilizante', description: 'Fosfato Monoamónico (MAP) + Urea', amountUSD: 5400, date: '2024-10-20' },
      { id: 'e-4', category: 'Agroquímico', description: 'Herbicida presiembra y post-emergencia', amountUSD: 1800, date: '2024-11-05' },
      { id: 'e-5', category: 'Maquinaria', description: 'Servicio contratado de Siembra Neumática', amountUSD: 2700, date: '2024-10-25' },
      { id: 'e-6', category: 'Maquinaria', description: 'Contratista de Cosecha y Picado de Maíz para Silo', amountUSD: 6750, date: '2025-04-10' },
      { id: 'e-7', category: 'Combustible', description: 'Gasoil para tractores pisado silo', amountUSD: 950, date: '2025-04-11' },
    ]
  },
  {
    id: 'fld-2',
    name: 'Campo Don Pedro - Lote Cañada',
    areaHectares: 30,
    cropType: 'Alfalfa para Fardos',
    rentalCostUSD: 7500, // 250 USD/ha
    rentalContractTerm: 'Contrato Anual Agrario',
    status: 'En Desarrollo',
    estimatedYieldTon: 180, // 6 Ton/ha anuales, cortes sucesivos
    expenses: [
      { id: 'e-201', category: 'Alquiler', description: 'Pago de alquiler primer semestre (30 Hectáreas)', amountUSD: 3750, date: '2024-09-01' },
      { id: 'e-202', category: 'Semilla', description: 'Semilla Alfalfa Fiscalizada Grupo 9 (300 kg)', amountUSD: 2400, date: '2024-09-10' },
      { id: 'e-203', category: 'Fertilizante', description: 'Superfosfato Triple de Calcio', amountUSD: 1950, date: '2024-09-12' },
      { id: 'e-204', category: 'Maquinaria', description: 'Labranza y preparación de cama de siembra', amountUSD: 1500, date: '2024-09-05' },
      { id: 'e-205', category: 'Maquinaria', description: 'Servicio contratado de siembra de pasturas', amountUSD: 1200, date: '2024-09-15' },
      { id: 'e-206', category: 'Alquiler', description: 'Pago de alquiler segundo semestre (30 Hectáreas)', amountUSD: 3750, date: '2025-03-01' },
    ]
  }
];

export const initialPartners: Partner[] = [
  {
    id: 'part-1',
    name: 'Socio Juan Carlos',
    phone: '+54 9 11 5555-1234',
    email: 'juancarlos@campo.com',
    notes: 'Socio inversor mayoritario. Concentrado prioritariamente en la hacienda vacuna.',
    quotaShare: 60,
    createdAt: '2024-10-01T12:00:00Z'
  },
  {
    id: 'part-2',
    name: 'Socio Martín Gómez',
    phone: '+54 9 341 555-7890',
    email: 'martin@campo.com',
    notes: 'Socio operativo y técnico de campo. Gestiona las siembras y controles.',
    quotaShare: 40,
    createdAt: '2024-10-01T12:00:00Z'
  }
];

export const initialPartnerTransactions: PartnerTransaction[] = [
  {
    id: 'tx-1',
    partnerId: 'part-1',
    amountUSD: 25000,
    date: '2024-10-01',
    type: 'Aporte',
    concept: 'Aporte inicial para arrendamiento e incorporación de hacienda',
    category: 'General'
  },
  {
    id: 'tx-2',
    partnerId: 'part-2',
    amountUSD: 15000,
    date: '2024-10-10',
    type: 'Aporte',
    concept: 'Fondo cooperativo para laboreo y compra de semilla de alfalfa',
    category: 'Agrícola'
  },
  {
    id: 'tx-3',
    partnerId: 'part-1',
    amountUSD: 8500,
    date: '2025-02-14',
    type: 'Aporte',
    concept: 'Inyección de capital para compra de alimento balanceado iniciador',
    category: 'Hacienda'
  },
  {
    id: 'tx-4',
    partnerId: 'part-2',
    amountUSD: 1800,
    date: '2025-03-05',
    type: 'Gasto Asociado',
    concept: 'Compra extraordinaria de herbicidas de post-emergencia',
    category: 'Agrícola'
  },
  {
    id: 'tx-5',
    partnerId: 'part-1',
    amountUSD: 3500,
    date: '2025-05-10',
    type: 'Retiro',
    concept: 'Retiro parcial de anticipo de utilidades',
    category: 'General'
  }
];
