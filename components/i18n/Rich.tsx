import { Fragment, type ReactNode } from "react";

// Lug'atdagi matnlarda **...** qismlarini <strong> qilib chiqaradi.
// Shu tufayli tarjima fayllarida JSX saqlashga hojat qolmaydi.
export function Rich({ text }: { text: string }): ReactNode {
  const parts = text.split("**");
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>
      )}
    </>
  );
}
