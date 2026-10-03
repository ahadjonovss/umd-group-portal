"use client";

import type { Pricing } from "@/lib/firestore/settings";
import { useT } from "@/components/i18n/LanguageProvider";
import { Rich } from "@/components/i18n/Rich";

export type TermsService = "publish" | "transfer" | "update" | "renewal" | "account" | "push_certificate" | "duns";

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
  const t = useT();
  const rest = 100 - p.publishAdvance;

  if (service === "publish") {
    const s = t.terms.publish;
    return (
      <>
        <Section num="1" title={s.s1Title}>
          <p><Rich text={s.s1Body} /></p>
        </Section>
        <Section num="2" title={s.s2Title}>
          <p><Rich text={s.s2Intro(p.publishAdvance, rest)} /></p>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-2xl font-bold text-blue-600 mb-0.5">{p.publishAdvance}%</p>
              <p className="text-xs text-blue-700"><Rich text={s.s2Advance} /></p>
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-2xl font-bold text-slate-700 mb-0.5">{rest}%</p>
              <p className="text-xs text-slate-600"><Rich text={s.s2Rest} /></p>
            </div>
          </div>
        </Section>
        <Section num="3" title={s.s3Title}>
          <Bullet color="red"><Rich text={s.s3a(rest)} /></Bullet>
          <Bullet color="red"><Rich text={s.s3b} /></Bullet>
          <Bullet color="red"><Rich text={s.s3c} /></Bullet>
        </Section>
        <Section num="4" title={s.s4Title}>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl font-bold text-emerald-600 whitespace-nowrap">{s.s4Badge}</span>
            <p className="text-xs text-emerald-700">{s.s4Note}</p>
          </div>
          <p className="mt-2"><Rich text={s.s4Body} /></p>
        </Section>
        <Section num="5" title={s.s5Title}>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="font-medium text-slate-800 mb-1">{s.s5ClientTitle}</p>
            <p><Rich text={s.s5ClientBody(p.publishCancelFee)} /></p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="font-medium text-slate-800 mb-1">{s.s5UsTitle}</p>
            <p><Rich text={s.s5UsBody} /></p>
          </div>
        </Section>
        <Section num="6" title={s.s6Title}>
          <Bullet>{s.s6a}</Bullet>
          <Bullet>{s.s6b}</Bullet>
        </Section>
      </>
    );
  }

  if (service === "transfer") {
    const s = t.terms.transfer;
    return (
      <>
        <Section num="1" title={s.s1Title}>
          <p><Rich text={s.s1Body} /></p>
        </Section>
        <Section num="2" title={s.s2Title}>
          <p><Rich text={s.s2Body(p.transferAdvance)} /></p>
        </Section>
        <Section num="3" title={s.s3Title}>
          <Bullet>{s.s3a}</Bullet>
          <Bullet>{s.s3b}</Bullet>
        </Section>
        <Section num="4" title={s.s4Title}>
          <Bullet color="red"><Rich text={s.s4a} /></Bullet>
        </Section>
        <Section num="5" title={s.s5Title}>
          <p>{s.s5Body}</p>
        </Section>
      </>
    );
  }

  if (service === "update") {
    const s = t.terms.update;
    return (
      <>
        <Section num="1" title={s.s1Title}>
          <p><Rich text={s.s1Body} /></p>
        </Section>
        <Section num="2" title={s.s2Title}>
          <Bullet><Rich text={s.s2a} /></Bullet>
        </Section>
        <Section num="3" title={s.s3Title}>
          <p><Rich text={s.s3Body(p.updateAndroid, p.updateIos, p.updateAdvance)} /></p>
        </Section>
        <Section num="4" title={s.s4Title}>
          <Bullet><Rich text={s.s4a} /></Bullet>
          <Bullet><Rich text={s.s4b} /></Bullet>
        </Section>
      </>
    );
  }

  if (service === "renewal") {
    const s = t.terms.renewal;
    return (
      <>
        <Section num="1" title={s.s1Title}>
          <p><Rich text={s.s1Body} /></p>
        </Section>
        <Section num="2" title={s.s2Title}>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <p className="text-sm text-emerald-800"><Rich text={s.s2Body} /></p>
          </div>
        </Section>
        <Section num="3" title={s.s3Title}>
          <Bullet><Rich text={s.s3a} /></Bullet>
          <Bullet><Rich text={s.s3b} /></Bullet>
        </Section>
        <Section num="4" title={s.s4Title}>
          <Bullet color="red"><Rich text={s.s4a} /></Bullet>
        </Section>
      </>
    );
  }

  if (service === "push_certificate") {
    const s = t.terms.pushCertificate;
    return (
      <>
        <Section num="1" title={s.s1Title}>
          <p><Rich text={s.s1Body} /></p>
        </Section>
        <Section num="2" title={s.s2Title}>
          <Bullet><Rich text={s.s2a} /></Bullet>
          <Bullet><Rich text={s.s2b} /></Bullet>
        </Section>
        <Section num="3" title={s.s3Title}>
          <p><Rich text={s.s3Body(p.pushCertificate)} /></p>
        </Section>
        <Section num="4" title={s.s4Title}>
          <Bullet>{s.s4a}</Bullet>
          <Bullet><Rich text={s.s4b} /></Bullet>
        </Section>
        <Section num="5" title={s.s5Title}>
          <Bullet><Rich text={s.s5a} /></Bullet>
        </Section>
      </>
    );
  }

  if (service === "duns") {
    const s = t.terms.duns;
    return (
      <>
        <Section num="1" title={s.s1Title}>
          <p><Rich text={s.s1Body} /></p>
        </Section>
        <Section num="2" title={s.s2Title}>
          <p><Rich text={s.s2Body(p.duns)} /></p>
        </Section>
        <Section num="3" title={s.s3Title}>
          <Bullet>{s.s3a}</Bullet>
          <Bullet color="red"><Rich text={s.s3b} /></Bullet>
        </Section>
        <Section num="4" title={s.s4Title}>
          <Bullet><Rich text={s.s4a} /></Bullet>
        </Section>
      </>
    );
  }

  // account
  const s = t.terms.account;
  return (
    <>
      <Section num="1" title={s.s1Title}>
        <p><Rich text={s.s1Body} /></p>
      </Section>
      <Section num="2" title={s.s2Title}>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] text-slate-500">{s.googlePersonal}</p>
            <p className="text-lg font-bold text-slate-900">${p.accountGooglePersonal}</p>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] text-slate-500">{s.googleCorporate}</p>
            <p className="text-lg font-bold text-slate-900">${p.accountGoogleCorporate}</p>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] text-slate-500">{s.applePersonal}</p>
            <p className="text-lg font-bold text-slate-900">${p.accountApplePersonal}</p>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] text-slate-500">{s.appleCorporate}</p>
            <p className="text-lg font-bold text-slate-900">${p.accountAppleCorporate}</p>
          </div>
        </div>
        <p className="mt-2">
          <Rich
            text={
              s.s2Payment(p.accountAdvance) +
              (p.accountAdvance < 100 ? s.s2PaymentRest(100 - p.accountAdvance) : "") +
              "."
            }
          />
        </p>
      </Section>
      <Section num="3" title={s.s3Title}>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800">
          <p><Rich text={s.s3Body} /></p>
        </div>
      </Section>
      <Section num="4" title={s.s4Title}>
        <Bullet>{s.s4a}</Bullet>
        <Bullet><Rich text={s.s4b} /></Bullet>
      </Section>
      <Section num="5" title={s.s5Title}>
        <Bullet>{s.s5a}</Bullet>
        <Bullet color="red"><Rich text={s.s5b} /></Bullet>
      </Section>
      <Section num="6" title={s.s6Title}>
        <Bullet><Rich text={s.s6a} /></Bullet>
      </Section>
      <Section num="7" title={s.s7Title}>
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <p className="font-medium text-slate-800 mb-1">{s.s7ClientTitle}</p>
          <p><Rich text={s.s7ClientBody(p.accountCancelFee)} /></p>
        </div>
      </Section>
    </>
  );
}
