import { z } from "zod";

export const dunsSchema = z.object({
  companyName: z.string().min(1, "Kompaniya nomi majburiy"),
  legalAddress: z.string().min(1, "Yuridik manzil majburiy"),
  companyPhone: z.string().min(1, "Kompaniya telefoni majburiy"),
  website: z.string().optional(),
  cpName: z.string().min(1, "Kontakt shaxs F.I.O. majburiy"),
  cpPhone: z.string().optional(),
});

export type DunsData = z.infer<typeof dunsSchema>;
