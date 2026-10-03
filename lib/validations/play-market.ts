import { z } from "zod";
import type { Dict } from "@/lib/i18n";

export const makePlayMarketStep1Schema = (t: Dict) =>
  z.object({
    fullName: z.string().min(2, t.validation.fullNameMin),
    phone: z.string().regex(/^\+998\d{9}$/, t.validation.phoneFormat),
    email: z.string().email(t.validation.emailInvalid),
  });

export const makePlayMarketStep2Schema = (t: Dict) =>
  z.object({
    appName: z
      .string()
      .min(1, t.validation.appNameRequired)
      .max(30, t.validation.appNameMax),
    packageName: z
      .string()
      .min(1, t.validation.packageNameRequired)
      .regex(
        /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/,
        t.validation.packageNameFormat
      ),
    shortDescription: z
      .string()
      .min(1, t.validation.shortDescRequired)
      .max(80, t.validation.shortDescMax),
    fullDescription: z
      .string()
      .min(1, t.validation.fullDescRequired)
      .max(4000, t.validation.fullDescMax),
    privacyPolicyUrl: z
      .string()
      .url(t.validation.urlInvalid)
      .refine((url) => url.startsWith("https://"), t.validation.urlHttps),
  });

export const playMarketStep5Schema = z.object({
  testLogin: z.string().optional(),
  testPassword: z.string().optional(),
  note: z.string().optional(),
});

export type PlayMarketStep1 = z.infer<ReturnType<typeof makePlayMarketStep1Schema>>;
export type PlayMarketStep2 = z.infer<ReturnType<typeof makePlayMarketStep2Schema>>;
export type PlayMarketStep5 = z.infer<typeof playMarketStep5Schema>;
