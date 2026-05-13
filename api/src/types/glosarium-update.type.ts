export interface GlosariumUpdateData {
  word: string;
  meaning: string;
}

export interface GlosariumUpdatePayload {
  updateDate?: string;
  pin: string;
  glosarium: GlosariumUpdateData[]
}