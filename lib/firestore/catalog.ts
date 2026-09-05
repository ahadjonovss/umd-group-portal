import "server-only";
import { adminDb, FieldValue, Timestamp, type DocumentSnapshot } from "@/lib/firebase/admin";
import {
  normalizeSnapshot,
  normalizeFields,
  DEFAULT_SNAPSHOT,
  type CatalogService,
  type ServiceDefSnapshot,
  type ServiceField,
} from "@/lib/service-def";

const CATALOG = "serviceCatalog";

function tsToIso(v: unknown): string | null {
  return v instanceof Timestamp ? v.toDate().toISOString() : null;
}

function mapCatalog(d: DocumentSnapshot): CatalogService {
  const x = d.data() ?? {};
  const snap = normalizeSnapshot(x);
  return {
    ...snap,
    id: d.id,
    key: snap.key || d.id,
    description: typeof x.description === "string" ? x.description : "",
    scope: x.scope === "public" ? "public" : "assigned",
    active: x.active !== false,
    fields: normalizeFields(x.fields),
    terms: typeof x.terms === "string" ? x.terms : "",
    createdAt: tsToIso(x.createdAt),
    updatedAt: tsToIso(x.updatedAt),
  };
}

// Barcha xizmatlar (admin katalogi) — yangi -> eski.
export async function getCatalog(): Promise<CatalogService[]> {
  const snap = await adminDb.collection(CATALOG).get();
  const items = snap.docs.map(mapCatalog);
  items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return items;
}

// Faol xizmatlar (biriktirish uchun).
export async function getActiveCatalog(): Promise<CatalogService[]> {
  return (await getCatalog()).filter((c) => c.active);
}

// Ochiq (self-service) xizmatlar — bosh sahifa / kabinet uchun.
export async function getPublicCatalog(): Promise<CatalogService[]> {
  return (await getCatalog()).filter((c) => c.active && c.scope === "public");
}

export async function getCatalogService(id: string): Promise<CatalogService | null> {
  const d = await adminDb.collection(CATALOG).doc(id).get();
  return d.exists ? mapCatalog(d) : null;
}

// key (slug) bo'yicha — ochiq xizmat sahifalari uchun.
export async function getCatalogByKey(key: string): Promise<CatalogService | null> {
  const snap = await adminDb.collection(CATALOG).where("key", "==", key).limit(1).get();
  return snap.empty ? null : mapCatalog(snap.docs[0]);
}

export type CatalogInput = Omit<CatalogService, "id" | "createdAt" | "updatedAt">;

function toDoc(input: CatalogInput) {
  const snap: ServiceDefSnapshot = normalizeSnapshot(input);
  const fields: ServiceField[] = normalizeFields(input.fields);
  return {
    ...snap,
    description: (input.description ?? "").slice(0, 2000),
    scope: input.scope === "public" ? "public" : "assigned",
    active: input.active !== false,
    fields,
    terms: (input.terms ?? "").slice(0, 5000),
  };
}

export async function createCatalogService(input: CatalogInput): Promise<string> {
  const ref = adminDb.collection(CATALOG).doc();
  await ref.set({
    ...toDoc(input),
    key: input.key || ref.id,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateCatalogService(id: string, input: CatalogInput): Promise<void> {
  await adminDb
    .collection(CATALOG)
    .doc(id)
    .set({ ...toDoc(input), key: input.key || id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function setCatalogActive(id: string, active: boolean): Promise<void> {
  await adminDb.collection(CATALOG).doc(id).update({ active, updatedAt: FieldValue.serverTimestamp() });
}

// Xizmatni o'chiradi. Biriktirilgan arizalar TEGILMAYDI — ularda snapshot bor.
export async function deleteCatalogService(id: string): Promise<void> {
  await adminDb.collection(CATALOG).doc(id).delete();
}

// Shu katalog xizmatidan nechta ariza biriktirilgan.
export async function countCatalogUsage(id: string): Promise<number> {
  const snap = await adminDb.collection("apps").where("catalogId", "==", id).get();
  return snap.size;
}

// Yangi xizmat uchun bo'sh shablon (admin formasi uchun).
export function emptyCatalogInput(): CatalogInput {
  return {
    ...DEFAULT_SNAPSHOT,
    name: "",
    shortName: "",
    key: "",
    description: "",
    scope: "assigned",
    active: true,
    fields: [],
    terms: "",
  };
}
