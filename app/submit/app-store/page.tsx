import { AppStoreForm } from "@/components/forms/AppStoreForm";
import { FormPageLayout } from "@/components/FormPageLayout";
import { getPricing } from "@/lib/firestore/settings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "App Store Joylashtirish — UMD GROUP" };
export const dynamic = "force-dynamic";

export default async function AppStorePage() {
  const pricing = await getPricing();
  return (
    <FormPageLayout
      title="App Store — Ilova Joylashtirish"
      subtitle="iOS ilovangizni Apple App Store-ga chiqarish"
    >
      <AppStoreForm pricing={pricing} />
    </FormPageLayout>
  );
}
