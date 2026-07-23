import type { Pricing } from "@/lib/firestore/settings";

export type TermsService = "publish" | "transfer" | "update" | "renewal" | "account" | "push_certificate";

export function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
      <div className="flex items-start gap-3 mb-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
          {num}
        </span>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="ml-10 text-sm text-slate-600 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function Bullet({ color = "blue", children }: { color?: "blue" | "red" | "emerald"; children: React.ReactNode }) {
  const c = color === "red" ? "text-red-500" : color === "emerald" ? "text-emerald-500" : "text-blue-500";
  return (
    <div className="flex items-start gap-2">
      <span className={`${c} mt-0.5 flex-shrink-0`}>•</span>
      <p>{children}</p>
    </div>
  );
}

export function TermsContent({ service, pricing: p }: { service: TermsService; pricing: Pricing }) {
  const rest = 100 - p.publishAdvance;

  if (service === "publish") {
    return (
      <>
        <Section num="1" title="Xizmat narxi va muddati">
          <p>
            Mobil ilovani App Store va Google Play Market platformalariga joylashtirish bo&apos;yicha xizmat narxi va
            muddati ilova funksionalligiga ko&apos;ra <strong>individual</strong> belgilanadi.
          </p>
        </Section>
        <Section num="2" title="To'lov tartibi">
          <p>To&apos;lov <strong>{p.publishAdvance}/{rest} formatida</strong> amalga oshiriladi:</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-2xl font-bold text-blue-600 mb-0.5">{p.publishAdvance}%</p>
              <p className="text-xs text-blue-700">Xizmat boshlanishidan oldin — <strong>oldindan to&apos;lov</strong></p>
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-2xl font-bold text-slate-700 mb-0.5">{rest}%</p>
              <p className="text-xs text-slate-600">Ilova joylashtirilgach <strong>1 soat ichida</strong></p>
            </div>
          </div>
        </Section>
        <Section num="3" title="Jarima va kechikishlar">
          <Bullet color="red">{rest}% qolgan to&apos;lov 1 soatdan kechiksa — qolgan summaga <strong>30% jarima</strong>.</Bullet>
          <Bullet color="red">To&apos;lov 24 soatdan oshsa — ilova <strong>ogohlantirishsiz</strong> platformadan olib tashlanadi.</Bullet>
          <Bullet color="red">Qo&apos;shimcha 24 soat beriladi. Shunda ham to&apos;lanmasa — ilova <strong>butunlay o&apos;chiriladi</strong>, mablag&apos; qaytarilmaydi.</Bullet>
        </Section>
        <Section num="4" title="Kafolat muddati">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl font-bold text-emerald-600">9 oy</span>
            <p className="text-xs text-emerald-700">Ilova platformada joylashtirilgan kundan boshlab kafolatlanadi.</p>
          </div>
          <p className="mt-2">9 oy tugagach, mijoz shartnomani <strong>chegirmali narxda yangilashi</strong> lozim. Aks holda ilova olib tashlanishi mumkin.</p>
        </Section>
        <Section num="5" title="Voz kechish va mablag' qaytarilishi">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="font-medium text-slate-800 mb-1">Mijoz voz kechsa:</p>
            <p>Umumiy xizmat narxining <strong>{p.publishCancelFee}%</strong>i bajarilgan ish va soliq xarajatlari uchun ushlab qolinadi, to&apos;langandan qolgani qaytariladi.</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="font-medium text-slate-800 mb-1">UMD GROUP voz kechsa:</p>
            <p>Komissiyasiz, to&apos;langan summa <strong>3 ish kuni ichida</strong> to&apos;liq qaytariladi.</p>
          </div>
        </Section>
        <Section num="6" title="Yakuniy qoidalar">
          <Bullet>UMD GROUP ilovaning texnik va dizayn talablariga muvofiqligini ta&apos;minlaydi.</Bullet>
          <Bullet>Qoidalarga zid yoki noqonuniy kontentli ilovalarga xizmat ko&apos;rsatishdan bosh tortish huquqi saqlanadi.</Bullet>
        </Section>
      </>
    );
  }

  if (service === "transfer") {
    return (
      <>
        <Section num="1" title="Xizmat mohiyati">
          <p>Chiqarilgan ilovani <strong>developer akkauntlar o&apos;rtasida o&apos;tkazish</strong> (Google Play yoki App Store).</p>
        </Section>
        <Section num="2" title="Narx va to'lov">
          <p>Narx ilova platformasiga qarab belgilanadi va so&apos;rov yaratilganda ko&apos;rsatiladi. To&apos;lov <strong>{p.transferAdvance}% oldindan</strong>.</p>
        </Section>
        <Section num="3" title="Jarayon va muddat">
          <Bullet>Transfer platforma qoidasiga ko&apos;ra bir necha ish kuni davom etadi.</Bullet>
          <Bullet>Jarayon to&apos;lov tasdiqlangach boshlanadi.</Bullet>
        </Section>
        <Section num="4" title="Muhim">
          <Bullet color="red">Transferdan so&apos;ng ilova <strong>UMD GROUP obunasida bo&apos;lmaydi</strong> — egalik mijozga o&apos;tadi.</Bullet>
        </Section>
        <Section num="5" title="Voz kechish">
          <p>Jarayon boshlanmasidan bekor qilinsa — mablag&apos; qaytariladi. Transfer boshlangach qaytarilmaydi.</p>
        </Section>
      </>
    );
  }

  if (service === "update") {
    return (
      <>
        <Section num="1" title="Xizmat mohiyati">
          <p>Chiqarilgan ilovaning <strong>yangi versiyasini</strong> store&apos;ga chiqarish.</p>
        </Section>
        <Section num="2" title="Shartlar">
          <Bullet>Ilova store&apos;da <strong>chiqarilgan</strong> va asosiy to&apos;lovi <strong>yakunlangan</strong> bo&apos;lishi kerak.</Bullet>
        </Section>
        <Section num="3" title="Narx va to'lov">
          <p>Android — <strong>${p.updateAndroid}</strong>, iOS — <strong>${p.updateIos}</strong>. To&apos;lov <strong>{p.updateAdvance}% oldindan</strong>.</p>
        </Section>
        <Section num="4" title="Jarayon">
          <Bullet><strong>Android:</strong> yangi <strong>.aab</strong> faylni Telegram orqali topshirasiz.</Bullet>
          <Bullet><strong>iOS:</strong> yangi kodni <strong>GitHub</strong>ga push qilasiz.</Bullet>
        </Section>
      </>
    );
  }

  if (service === "renewal") {
    return (
      <>
        <Section num="1" title="Xizmat mohiyati">
          <p>Ilovaning <strong>9 oylik muddatini</strong> yana <strong>+9 oyga</strong> uzaytirish.</p>
        </Section>
        <Section num="2" title="Narx">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <p className="text-sm text-emerald-800">Uzaytirish narxi — ilova <strong>chiqarilgan paytdagi narxning 50%</strong>i.</p>
          </div>
        </Section>
        <Section num="3" title="To'lov va muddat">
          <Bullet>To&apos;lov <strong>100% oldindan</strong>.</Bullet>
          <Bullet>To&apos;lovdan so&apos;ng muddat <strong>+9 oyga</strong> uzaytiriladi.</Bullet>
        </Section>
        <Section num="4" title="Muhim">
          <Bullet color="red">Muddat o&apos;z vaqtida uzaytirilmasa — ilova store&apos;dan <strong>olib tashlanishi</strong> mumkin.</Bullet>
        </Section>
      </>
    );
  }

  if (service === "push_certificate") {
    return (
      <>
        <Section num="1" title="Xizmat mohiyati">
          <p>Apple ilovalari uchun <strong>push notification (APNs) sertifikati</strong>ni tayyorlab berish.</p>
        </Section>
        <Section num="2" title="Shartlar">
          <Bullet>Faqat <strong>Apple (App Store)</strong> ilovalari uchun.</Bullet>
          <Bullet>Ilova store&apos;da <strong>chiqarilgan</strong> va asosiy to&apos;lovi <strong>yakunlangan</strong> bo&apos;lishi kerak.</Bullet>
        </Section>
        <Section num="3" title="Narx va to'lov">
          <p>Narx — <strong>${p.pushCertificate}</strong>. To&apos;lov <strong>100% oldindan</strong>.</p>
        </Section>
        <Section num="4" title="Jarayon">
          <Bullet>So&apos;rov yaratasiz va to&apos;lovni amalga oshirasiz.</Bullet>
          <Bullet>To&apos;lov tasdiqlangач sertifikat <strong>Telegram orqali</strong> yuboriladi.</Bullet>
        </Section>
        <Section num="5" title="Muhim">
          <Bullet>Bu <strong>bir martalik</strong> xizmat. APNs sertifikati Apple tomonidan vaqti-vaqti bilan yangilanishi mumkin — kerak bo&apos;lganда qayta so&apos;rov yaratasiz.</Bullet>
        </Section>
      </>
    );
  }

  // account
  return (
    <>
      <Section num="1" title="Xizmat mohiyati">
        <p>Sizning nomingizga <strong>Google Play Console</strong> yoki <strong>App Store Connect</strong> developer akkauntini rasmiy ravishda ochish va sozlash.</p>
      </Section>
      <Section num="2" title="Narx — faqat xizmat haqi">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] text-slate-500">Google — shaxsiy</p>
            <p className="text-lg font-bold text-slate-900">${p.accountGooglePersonal}</p>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] text-slate-500">Google — korporativ</p>
            <p className="text-lg font-bold text-slate-900">${p.accountGoogleCorporate}</p>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] text-slate-500">Apple — shaxsiy</p>
            <p className="text-lg font-bold text-slate-900">${p.accountApplePersonal}</p>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] text-slate-500">Apple — korporativ</p>
            <p className="text-lg font-bold text-slate-900">${p.accountAppleCorporate}</p>
          </div>
        </div>
        <p className="mt-2">To&apos;lov <strong>{p.accountAdvance}% oldindan</strong>{p.accountAdvance < 100 ? `, ${100 - p.accountAdvance}% akkaunt topshirilgach` : ""}.</p>
      </Section>
      <Section num="3" title="Platforma to'lovi alohida">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800">
          <p>Narx <strong>faqat bizning xizmat haqimiz</strong>. Platformaning rasmiy to&apos;lovi narxga <strong>kirmaydi</strong>: Google — <strong>$25</strong>, Apple — <strong>$99/yil</strong>. To&apos;g&apos;ridan-to&apos;g&apos;ri Google/Apple&apos;ga to&apos;lanadi.</p>
        </div>
      </Section>
      <Section num="4" title="Kerakli ma'lumotlar">
        <Bullet>Akkaunt logini (Gmail / Apple ID) va paroli.</Bullet>
        <Bullet><strong>Korporativ:</strong> yuridik kompaniya ma&apos;lumotlari; Apple uchun <strong>D-U-N-S raqami</strong>.</Bullet>
      </Section>
      <Section num="5" title="Jarayon va muddat">
        <Bullet>Ma&apos;lumotlar to&apos;g&apos;ri bo&apos;lsa — bir necha ish kunida.</Bullet>
        <Bullet color="red">Korporativ (ayniqsa Apple D-U-N-S) tasdiqlash <strong>1–2 haftagacha</strong> cho&apos;zilishi mumkin.</Bullet>
      </Section>
      <Section num="6" title="Mas'uliyat">
        <Bullet>Akkaunt <strong>mijoz nomiga</strong> ochiladi; login ma&apos;lumotlari mijozga topshiriladi.</Bullet>
      </Section>
      <Section num="7" title="Voz kechish">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <p className="font-medium text-slate-800 mb-1">Mijoz voz kechsa:</p>
          <p>Jarayon boshlangan bo&apos;lsa, umumiy xizmat narxining <strong>{p.accountCancelFee}%</strong>i ushlab qolinadi. Platforma to&apos;lovi qilingach yoki akkaunt ochilgach — qaytarilmaydi.</p>
        </div>
      </Section>
    </>
  );
}
