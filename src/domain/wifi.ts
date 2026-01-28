export interface WifiInfo {
  id: string;
  floor: number | null;
  area_name: string;
  ssid: string;
  password: string;
  display_order: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WifiInfoInput {
  floor?: number;
  area_name: string;
  ssid: string;
  password: string;
  display_order?: number;
}
