import { DunsForm } from "@/components/forms/DunsForm";
import { FormPageLayout } from "@/components/FormPageLayout";
import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.submitPage.duns.meta };
}

export default async function DunsPage() {
  const t = await getT();
  return (
    <FormPageLayout
      title={t.submitPage.duns.title}
      subtitle={t.submitPage.duns.subtitle}
    >
      <DunsForm />
    </FormPageLayout>
  );
}
