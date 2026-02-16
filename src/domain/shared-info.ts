export interface SharedInfo {
  id: string;
  info_key: string;
  title: string;
  content: string;
  notes: string | null;
  floor: number | null;
  display_order: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedInfoInput {
  info_key: string;
  title: string;
  content: string;
  notes?: string;
  floor?: number;
  display_order?: number;
}
