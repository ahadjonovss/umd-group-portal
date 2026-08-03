import "server-only";
import { randomBytes } from "crypto";
import { adminDb, adminAuth, FieldValue, Timestamp, type DocumentSnapshot } from "@/lib/firebase/admin";

export interface AdminUser {
  uid: string;
  email: string | null;
  fullName: string;
  phone: string;
  telegram: string;
  telegramChatId: string | null; // bot xabar yuborishi uchun (ulangach)
  telegramNotify: boolean; // xabarnomalar yoqilganmi
  role: string | null;
  passwordPlain: string | null; // admin ko'rishi uchun (faqat panel orqali o'rnatilganlar)
  walletUzs: number; // hamyon balansi (so'm) — ortiqcha to'lovlardan
  createdAt: string | null;
  appCount?: number;
}

function mapUser(d: DocumentSnapshot): AdminUser {
  const x = d.data() ?? {};
  return {
    uid: d.id,
    email: x.email ?? null,
    fullName: x.fullName ?? "",
    phone: x.phone ?? "",
    telegram: x.telegram ?? "",
    telegramChatId: x.telegramChatId ?? null,
    telegramNotify: x.telegramNotify !== false, // default yoqilgan
    role: x.role ?? null,
    passwordPlain: x.passwordPlain ?? null,
    walletUzs: typeof x.walletUzs === "number" ? x.walletUzs : 0,
    createdAt: x.createdAt instanceof Timestamp ? x.createdAt.toDate().toISOString() : null,
  };
}

// ── Telegram ulash ─────────────────────────────
const TG_LINKS = "telegramLinks";
const LINK_TTL_MS = 30 * 60 * 1000; // 30 daqiqa

export interface UserTelegram {
  chatId: string | null;
  notify: boolean;
  username: string;
  fullName: string;
  email: string | null;
}

// Foydalanuvchining Telegram holati (xabar yuborish uchun).
export async function getUserTelegram(uid: string): Promise<UserTelegram> {
  const d = await adminDb.collection("users").doc(uid).get();
  const x = d.data() ?? {};
  return {
    chatId: x.telegramChatId ?? null,
    notify: x.telegramNotify !== false,
    username: x.telegramUsername ?? x.telegram ?? "",
    fullName: x.fullName ?? "",
    email: x.email ?? null,
  };
}

// Bir martalik ulash tokeni yaratadi (deep-link uchun).
export async function createTelegramLinkToken(uid: string): Promise<string> {
  const token = randomBytes(9).toString("base64url"); // ~12 belgi
  await adminDb.collection(TG_LINKS).doc(token).set({ uid, createdAt: FieldValue.serverTimestamp() });
  return token;
}

// Tokenni tekshirib uid qaytaradi va o'chiradi (muddati o'tgan bo'lsa null).
export async function consumeTelegramLinkToken(token: string): Promise<string | null> {
  const ref = adminDb.collection(TG_LINKS).doc(token);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const x = snap.data()!;
  await ref.delete().catch(() => {});
  const created = x.createdAt instanceof Timestamp ? x.createdAt.toMillis() : 0;
  if (created && Date.now() - created > LINK_TTL_MS) return null;
  return (x.uid as string) ?? null;
}

// Chat ID bo'yicha foydalanuvchi uid'sini topadi (webhook uchun).
export async function getUserByChatId(chatId: string | number): Promise<string | null> {
  const snap = await adminDb.collection("users").where("telegramChatId", "==", String(chatId)).limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

// Chat ID ni foydalanuvchiga bog'laydi.
export async function linkTelegramChat(uid: string, chatId: string | number, username?: string): Promise<void> {
  await adminDb.collection("users").doc(uid).set(
    {
      telegramChatId: String(chatId),
      telegramNotify: true,
      telegramLinkedAt: FieldValue.serverTimestamp(),
      ...(username ? { telegramUsername: username } : {}),
    },
    { merge: true }
  );
}

// Ulashni uzadi.
export async function unlinkTelegramChat(uid: string): Promise<void> {
  await adminDb.collection("users").doc(uid).set(
    { telegramChatId: FieldValue.delete(), telegramLinkedAt: FieldValue.delete() },
    { merge: true }
  );
}

// Xabarnomalarni yoqish/o'chirish.
export async function setTelegramNotify(uid: string, on: boolean): Promise<void> {
  await adminDb.collection("users").doc(uid).set({ telegramNotify: on }, { merge: true });
}

// Hamyon balansini o'qish (so'm).
export async function getUserWalletUzs(uid: string): Promise<number> {
  const d = await adminDb.collection("users").doc(uid).get();
  const v = d.get("walletUzs");
  return typeof v === "number" ? v : 0;
}

// Hamyon balansini delta ga o'zgartiradi (musbat — qo'shish, manfiy — ayirish).
export async function adjustWallet(uid: string, deltaUzs: number): Promise<void> {
  if (!uid || !deltaUzs) return;
  await adminDb.collection("users").doc(uid).set({ walletUzs: FieldValue.increment(Math.round(deltaUzs)) }, { merge: true });
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const snap = await adminDb.collection("users").get();
  const users = snap.docs.map(mapUser);
  users.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return users;
}

export async function getUser(uid: string): Promise<AdminUser | null> {
  const d = await adminDb.collection("users").doc(uid).get();
  if (!d.exists) return null;
  return mapUser(d);
}

export async function setUserPassword(uid: string, password: string): Promise<void> {
  await adminAuth.updateUser(uid, { password });
  // Admin ko'rishi uchun ochiq nusxa (Firebase hash'ni qaytarmaydi)
  await adminDb.collection("users").doc(uid).set({ passwordPlain: password }, { merge: true });
}

// Login emailini yangilaydi: Auth + users hujjati + ilovalardagi ownerEmail/contact.email.
export async function setUserEmail(uid: string, email: string): Promise<void> {
  await adminAuth.updateUser(uid, { email });
  await adminDb.collection("users").doc(uid).set({ email }, { merge: true });

  const appsSnap = await adminDb.collection("apps").where("ownerUid", "==", uid).get();
  if (!appsSnap.empty) {
    const batch = adminDb.batch();
    appsSnap.forEach((d) => batch.update(d.ref, { ownerEmail: email, "contact.email": email }));
    await batch.commit();
  }
}

// Admin: foydalanuvchini + uning ilovalari, to'lovlari, sharhlarini + Auth akkauntini o'chiradi.
export async function deleteUser(uid: string): Promise<void> {
  const [apps, pays, revs] = await Promise.all([
    adminDb.collection("apps").where("ownerUid", "==", uid).get(),
    adminDb.collection("payments").where("ownerUid", "==", uid).get(),
    adminDb.collection("reviews").where("ownerUid", "==", uid).get(),
  ]);
  const batch = adminDb.batch();
  apps.forEach((d) => batch.delete(d.ref));
  pays.forEach((d) => batch.delete(d.ref));
  revs.forEach((d) => batch.delete(d.ref));
  batch.delete(adminDb.collection("users").doc(uid));
  await batch.commit();
  try {
    await adminAuth.deleteUser(uid);
  } catch {
    // Auth'da bo'lmasa ham davom etamiz
  }
}

export async function setUserRole(uid: string, makeAdmin: boolean): Promise<void> {
  await adminDb
    .collection("users")
    .doc(uid)
    .update({ role: makeAdmin ? "admin" : FieldValue.delete() });
}

// Admin: profil ma'lumotlarini (ism, telefon, telegram) yangilaydi.
export async function setUserProfile(
  uid: string,
  data: { fullName: string; phone: string; telegram: string }
): Promise<void> {
  const fullName = data.fullName.trim();
  const phone = data.phone.trim();
  const telegram = data.telegram.trim().replace(/^@/, "");
  await adminDb.collection("users").doc(uid).set({ fullName, phone, telegram }, { merge: true });
  try {
    await adminAuth.updateUser(uid, { displayName: fullName });
  } catch {
    // Auth displayName yangilanmasa ham jiddiy emas
  }
}
