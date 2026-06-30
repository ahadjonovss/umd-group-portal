"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { createAppSubmission } from "@/lib/firestore/apps";
import type { ServiceType } from "@/types";

const TRANSFER: ServiceType[] = ["google-transfer", "apple-transfer"];

// Kabinetga tezkor draft ariza qo'shadi (test/qoralama uchun).
export async function actCreateDraft(serviceType: ServiceType) {
  // Faqat dev (lokal) — production'da ishlamaydi.
  if (process.env.NODE_ENV !== "development") return;
  const user = await requireUser();

  const userDoc = await adminDb.collection("users").doc(user.uid).get();
  const fullName = (userDoc.get("fullName") as string) || user.name || "Mijoz";
  const phone = (userDoc.get("phone") as string) || "";

  const isTransfer = TRANSFER.includes(serviceType);

  await createAppSubmission({
    ownerUid: user.uid,
    ownerEmail: user.email,
    serviceType,
    appName: isTransfer ? null : "Draft ilova",
    contact: { fullName, phone, email: user.email ?? "" },
    submission: {},
  });

  revalidatePath("/panel");
}
