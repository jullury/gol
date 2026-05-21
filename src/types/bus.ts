export interface Bus {
  id: string;
  numero: string;
  name: string;
  numberOfPlace: number;
  photo1: string | null;
  photo2: string | null;
  photo3: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export type BusFormData = Omit<Bus, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
