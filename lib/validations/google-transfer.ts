import { z } from "zod";
import type { Dict } from "@/lib/i18n";

export const makeGoogleTransferSchema = (t: Dict) =>
  z.object({
    developerAccountId: z.string().min(1, t.validation.devAccountIdRequired),
    transactionId: z.string().min(1, t.validation.transactionIdRequired),
  });

export type GoogleTransferData = z.infer<ReturnType<typeof makeGoogleTransferSchema>>;
