import { AppStoreForm } from "@/components/forms/AppStoreForm";
import { FormPageLayout } from "@/components/FormPageLayout";
import { getPricing } from "@/lib/firestore/settings";
import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.submitPage.appStore.meta };
}
export const dynamic = "force-dynamic";

export default async function AppStorePage() {
  const t = await getT();
  const pricing = await getPricing();
  return (
    <FormPageLayout
      title={t.submitPage.appStore.title}
      subtitle={t.submitPage.appStore.subtitle}
    >
      <AppStoreForm pricing={pricing} />
    </FormPageLayout>
  );
}
