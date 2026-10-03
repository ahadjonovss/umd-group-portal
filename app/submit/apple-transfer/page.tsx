import { AppleTransferForm } from "@/components/forms/AppleTransferForm";
import { FormPageLayout } from "@/components/FormPageLayout";
import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.submitPage.appleTransfer.meta };
}

export default async function AppleTransferPage() {
  const t = await getT();
  return (
    <FormPageLayout
      title={t.submitPage.appleTransfer.title}
      subtitle={t.submitPage.appleTransfer.subtitle}
    >
      <AppleTransferForm />
    </FormPageLayout>
  );
}
