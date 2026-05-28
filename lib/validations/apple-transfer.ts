import { z } from "zod";

export const appleTransferSchema = z.object({
  fullName: z.string().min(2, "To'liq ism kamida 2 belgi bo'lishi kerak"),
  phone: z.string().min(1, "Telefon raqami majburiy"),
  email: z.string().email("Noto'g'ri email format"),
  appStoreConnectTeamId: z
    .string()
    .min(1, "App Store Connect Team ID majburiy"),
  appleDevAccountEmail: z
    .string()
    .email("Noto'g'ri Apple Developer Account email"),
});

export type AppleTransferData = z.infer<typeof appleTransferSchema>;
