import { DunsForm } from "@/components/forms/DunsForm";
import { FormPageLayout } from "@/components/FormPageLayout";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "DUNS Raqami Ochish — UMD GROUP" };

export default function DunsPage() {
  return (
    <FormPageLayout
      title="DUNS Raqami Ochish"
      subtitle="Biznesingiz uchun DUNS raqamini rasmiylashtirish"
    >
      <DunsForm />
    </FormPageLayout>
  );
}
