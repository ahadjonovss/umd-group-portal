import { AccountForm } from "@/components/forms/AccountForm";
import { FormPageLayout } from "@/components/FormPageLayout";
import { getPricing } from "@/lib/firestore/settings";
import { getUsdRate } from "@/lib/cbu";
import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.submitPage.account.meta };
}
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const t = await getT();
  const [pricing, rate] = await Promise.all([getPricing(), getUsdRate()]);
  return (
    <FormPageLayout
      title={t.submitPage.account.title}
      subtitle={t.submitPage.account.subtitle}
    >
      <AccountForm pricing={pricing} rate={rate} />
    </FormPageLayout>
  );
}
