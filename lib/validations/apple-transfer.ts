import { z } from "zod";
import type { Dict } from "@/lib/i18n";

export const makeAppleTransferSchema = (t: Dict) =>
  z.object({
    appStoreConnectTeamId: z.string().min(1, t.validation.teamIdRequired),
    appleDevAccountEmail: z.string().email(t.validation.appleEmailInvalid),
  });

export type AppleTransferData = z.infer<ReturnType<typeof makeAppleTransferSchema>>;
