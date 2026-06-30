export type HardwareCategory = 'Laptop' | 'Komputer Stacjonarny' | 'Serwer' | 'Monitor' | 'Inny';

export type HardwareStatus = 'W użyciu' | 'W magazynie' | 'Wymieniony' | 'Wycofany';

export interface InventoryItem {
  id: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  processor: string;
  ram: string;
  storage: string;
  graphics: string;
  operatingSystem: string;
  category: HardwareCategory;
  confidence: number; // confidence of OCR extraction (0-100)
  notes: string;
  status: HardwareStatus;
  addedAt: string;
  lastModifiedAt: string;
  photoUrl?: string; // base64 representation of the photo
  room?: string; // Room location e.g. "Sala 102"
  
  // Replacement relationships
  replacesItemId?: string;   // ID of the old computer that THIS computer is replacing
  replacedByItemId?: string; // ID of the new computer that IS REPLACING this computer
  replacementDate?: string;  // Date of replacement
  purchaseDate?: string;     // Purchase date e.g. "YYYY-MM-DD"
}

export interface ReplacementLog {
  id: string;
  oldItemId: string;
  newItemId: string;
  date: string;
  replacedByPerson?: string;
  notes?: string;
}
