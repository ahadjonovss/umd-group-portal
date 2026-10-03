import { z } from "zod";
import type { Dict } from "@/lib/i18n";

export const makeDunsSchema = (t: Dict) =>
  z.object({
    companyName: z.string().min(1, t.validation.companyNameRequired),
    legalAddress: z.string().min(1, t.validation.legalAddressRequired),
    companyPhone: z.string().min(1, t.validation.companyPhoneRequired),
    website: z.string().optional(),
    cpName: z.string().min(1, t.validation.contactNameRequired),
    cpPhone: z.string().optional(),
  });

export type DunsData = z.infer<ReturnType<typeof makeDunsSchema>>;
