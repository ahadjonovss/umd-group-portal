import { PlayMarketForm } from "@/components/forms/PlayMarketForm";
import { FormPageLayout } from "@/components/FormPageLayout";
import { getPricing } from "@/lib/firestore/settings";
import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.submitPage.playMarket.meta };
}
export const dynamic = "force-dynamic";

export default async function PlayMarketPage() {
  const t = await getT();
  const pricing = await getPricing();
  return (
    <FormPageLayout
      title={t.submitPage.playMarket.title}
      subtitle={t.submitPage.playMarket.subtitle}
    >
      <PlayMarketForm pricing={pricing} />
    </FormPageLayout>
  );
}
