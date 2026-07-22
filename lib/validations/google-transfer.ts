import { z } from "zod";

export const googleTransferSchema = z.object({
  developerAccountId: z
    .string()
    .min(1, "Developer Account ID majburiy"),
  transactionId: z
    .string()
    .min(1, "Transaction ID majburiy"),
});

export type GoogleTransferData = z.infer<typeof googleTransferSchema>;
