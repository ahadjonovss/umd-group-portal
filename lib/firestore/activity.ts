import "server-only";
import { adminDb, FieldValue, Timestamp, type DocumentSnapshot } from "@/lib/firebase/admin";

export type ActorType = "admin" | "user" | "system";

// O'zgarishni kim amalga oshirgani.
export interface Actor {
  type: ActorType;
  name: string;
  uid: string | null;
}

export const SYSTEM_ACTOR: Actor = { type: "system", name: "Tizim", uid: null };

export interface ActivityView {
  id: string;
  appId: string;
  action: string;
  message: string;
  actorType: ActorType;
  actorName: string;
  actorUid: string | null;
  createdAt: string | null;
}

const COL = "activities";

// Ilova bo'yicha bitta amaliyot yozuvini qo'shadi. Xatolik asosiy oqimni buzmaydi.
export async function logActivity(
  appId: string,
  action: string,
  message: string,
  actor: Actor
): Promise<void> {
  if (!appId) return;
  try {
    await adminDb.collection(COL).add({
      appId,
      action,
      message,
      actorType: actor.type,
      actorName: actor.name || (actor.type === "system" ? "Tizim" : ""),
      actorUid: actor.uid ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error("[logActivity] xato:", e);
  }
}

function map(d: DocumentSnapshot): ActivityView {
  const x = d.data() ?? {};
  const c = x.createdAt;
  return {
    id: d.id,
    appId: x.appId ?? "",
    action: x.action ?? "",
    message: x.message ?? "",
    actorType: (x.actorType as ActorType) ?? "system",
    actorName: x.actorName ?? "",
    actorUid: x.actorUid ?? null,
    createdAt: c instanceof Timestamp ? c.toDate().toISOString() : null,
  };
}

// Ilova bo'yicha amaliyotlar tarixi (yangi -> eski).
export async function getAppActivity(appId: string): Promise<ActivityView[]> {
  const snap = await adminDb.collection(COL).where("appId", "==", appId).get();
  return snap.docs.map(map).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}
