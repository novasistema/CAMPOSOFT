/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WeightRecord {
  date: string;
  weight: number; // in kg
}

export type AnimalGender = 'Macho' | 'Hembra';
export type AnimalStatus = 'Activo' | 'Vendido' | 'Baja';
export type AnimalCategory = 'Ternero' | 'Ternera' | 'Novillo' | 'Vaquillona' | 'Vaca' | 'Toro';

export interface Animal {
  id: string; // Internal unique ID
  caravana: string; // The physical ear tag ID (e.g., "TX-3401")
  breed: string; // E.g., "Angus", "Hereford", "Brangus"
  gender: AnimalGender;
  category: AnimalCategory;
  birthDate: string;
  initialWeight: number; // Weight at entry, kg
  currentWeight: number; // Current weight, kg
  weightHistory: WeightRecord[];
  status: AnimalStatus;
  notes?: string;
  userId?: string;
  partnerId?: string; // Link to specific Partner ID
  createdAt?: string;
  updatedAt?: string;
}

export interface FeedAssignment {
  id: string;
  animalId: string; // Applies to this animal
  date: string;
  feedId: string; // Link to FeedInventory
  amountKg: number; // Daily amount given
  userId?: string;
  createdAt?: string;
}

export interface FeedInventory {
  id: string;
  name: string; // E.g., "Silo de Maíz", "Alfalfa", "Sorgo", "Concentrado Proteico"
  stockKg: number;
  costPerKgUSD: number; // Cost in USD
  source: 'Producido' | 'Comprado';
  notes?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CropExpenseCategory = 
  | 'Alquiler' 
  | 'Semilla' 
  | 'Fertilizante' 
  | 'Agroquímico' 
  | 'Maquinaria' 
  | 'Combustible' 
  | 'Mano de Obra' 
  | 'Otros';

export interface CropExpense {
  id: string;
  category: CropExpenseCategory;
  description: string;
  amountUSD: number;
  date: string;
  partnerId?: string; // Link to specific partner contributing/paying this expense
  isCuentaCorriente?: boolean; // True if acquired on credit / open account (Cuenta Corriente)
  isPaid?: boolean; // True if paid, false if pending
}

export type CropStatus = 'Planificado' | 'Sembrado' | 'En Desarrollo' | 'Cosechado';

export interface CropField {
  id: string;
  name: string; // E.g., "Fracción Norte - Don Juan"
  areaHectares: number; // Hectares
  cropType: string; // E.g., "Maíz Silero", "Sorgo Forrajero", "Alfalfa"
  rentalCostUSD: number; // Total rental cost for this plot/season
  rentalContractTerm?: string; // E.g., "Anual", "6 meses"
  expenses: CropExpense[];
  status: CropStatus;
  estimatedYieldTon: number; // Estimated yield in Tons
  actualYieldTon?: number; // Actual harvested Tons
  harvestDate?: string;
  userId?: string;
  partnerId?: string; // Optional field-level owner/manager partner
  createdAt?: string;
  updatedAt?: string;
}

export interface Partner {
  id: string;
  name: string;
  quotaShare?: number; // E.g., 50 (%) share, optional
  phone?: string;
  email?: string;
  notes?: string;
  userId?: string;
  createdAt?: string;
}

export type PartnerTransactionType = 'Aporte' | 'Retiro' | 'Gasto Asociado';

export interface PartnerTransaction {
  id: string;
  partnerId: string; // Link to Partner
  amountUSD: number;
  date: string;
  type: PartnerTransactionType; // Inversión / Retiro / Gasto
  concept: string; // Context, e.g., "Aporte para vaquillonas", "Compra de pesticidas"
  category: 'Hacienda' | 'Agrícola' | 'General';
  userId?: string;
  createdAt?: string;
}
