import { AppStoreForm } from "@/components/forms/AppStoreForm";
import { FormPageLayout } from "@/components/FormPageLayout";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "App Store Joylashtirish — UMD GROUP" };

export default function AppStorePage() {
  return (
    <FormPageLayout
      title="App Store — Ilova Joylashtirish"
      subtitle="iOS ilovangizni Apple App Store-ga chiqarish"
    >
      <AppStoreForm />
    </FormPageLayout>
  );
}
