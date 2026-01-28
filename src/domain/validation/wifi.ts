import { z } from "zod";
import { sanitizeForStorage } from "@/lib/security/validation";

export const wifiInfoSchema = z.object({
  area_name: z
    .string()
    .min(1)
    .max(50)
    .transform((val) => sanitizeForStorage(val)),
  ssid: z
    .string()
    .min(1)
    .max(100)
    .transform((val) => sanitizeForStorage(val)),
  password: z.string().min(1).max(200),
  display_order: z.number().int().min(0).max(100).default(0),
});

export type WifiInfoValidated = z.infer<typeof wifiInfoSchema>;
