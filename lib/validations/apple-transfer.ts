import { z } from "zod";

export const appleTransferSchema = z.object({
  appStoreConnectTeamId: z
    .string()
    .min(1, "App Store Connect Team ID majburiy"),
  appleDevAccountEmail: z
    .string()
    .email("Noto'g'ri Apple Developer Account email"),
});

export type AppleTransferData = z.infer<typeof appleTransferSchema>;
