import { z } from "zod";

export const googleTransferSchema = z.object({
  fullName: z.string().min(2, "To'liq ism kamida 2 belgi bo'lishi kerak"),
  phone: z.string().min(1, "Telefon raqami majburiy"),
  email: z.string().email("Noto'g'ri email format"),
  developerAccountId: z
    .string()
    .min(1, "Developer Account ID majburiy"),
  transactionId: z
    .string()
    .min(1, "Transaction ID majburiy"),
});

export type GoogleTransferData = z.infer<typeof googleTransferSchema>;
