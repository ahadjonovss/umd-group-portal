import { z } from "zod";

export const playMarketStep1Schema = z.object({
  fullName: z.string().min(2, "To'liq ism kamida 2 belgi bo'lishi kerak"),
  phone: z.string().regex(/^\+998\d{9}$/, "Format: +998XXXXXXXXX"),
  email: z.string().email("Noto'g'ri email format"),
});

export const playMarketStep2Schema = z.object({
  appName: z
    .string()
    .min(1, "Ilova nomi majburiy")
    .max(30, "Ilova nomi max 30 belgi"),
  packageName: z
    .string()
    .min(1, "Package name majburiy")
    .regex(
      /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/,
      "Format: com.company.appname"
    ),
  shortDescription: z
    .string()
    .min(1, "Qisqa tavsif majburiy")
    .max(80, "Qisqa tavsif max 80 belgi"),
  fullDescription: z
    .string()
    .min(1, "To'liq tavsif majburiy")
    .max(4000, "To'liq tavsif max 4000 belgi"),
  privacyPolicyUrl: z
    .string()
    .url("To'g'ri URL kiriting")
    .refine((url) => url.startsWith("https://"), "URL HTTPS bo'lishi shart"),
});

export const playMarketStep3Schema = z.object({});

export const playMarketStep5Schema = z.object({
  testLogin: z.string().optional(),
  testPassword: z.string().optional(),
  note: z.string().optional(),
});

export type PlayMarketStep1 = z.infer<typeof playMarketStep1Schema>;
export type PlayMarketStep2 = z.infer<typeof playMarketStep2Schema>;
export type PlayMarketStep5 = z.infer<typeof playMarketStep5Schema>;
