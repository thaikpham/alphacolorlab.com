import Image from "next/image";
import { Fragment } from "react";
import { sections, type Step, type ModelId, cameraModels, alphaConsole } from "../content";

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="flex-shrink-0"
    >
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.5" fill="currentColor" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function byModel<T>(base: T, by?: Partial<Record<ModelId, T>>): { models?: string; value: T }[] {
  if (!by) return [{ value: base }];
  const rest = cameraModels.filter((m) => by[m.id] === undefined).map((m) => m.id).join(" ");
  return [
    ...(rest ? [{ models: rest, value: base }] : []),
    ...cameraModels.filter((m) => by[m.id] !== undefined).map((m) => ({ models: m.id, value: by[m.id]! })),
  ];
}

const legacyModels = cameraModels.filter((m) => m.menu === "legacy").map((m) => m.id).join(" ");

function StepRow({ step, index }: { step: Step; index: number }) {
  return (
    <>
      <li
        className="p-4 sm:p-5 flex gap-3 sm:gap-4"
        data-reveal
        data-model-only={step.only?.join(" ")}
        style={{ "--i": index } as React.CSSProperties}
      >
        <div className="size-8 rounded-badge bg-accent text-on-accent text-subhead font-semibold grid place-items-center flex-shrink-0 tabular-nums">
          {step.n}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="text-body font-semibold pt-0.5 text-pretty">{step.title}{step.optional && <span className="text-secondary font-normal"> (tùy chọn)</span>}</div>
            {byModel(step.value, step.valueBy).map(({ models, value }) => (
              <div key={models ?? "all"} data-model-only={models} className="rounded-full bg-accent/10 text-accent-text font-semibold text-footnote px-2.5 py-1 whitespace-nowrap flex-shrink-0 tabular-nums">
                {value}
              </div>
            ))}
          </div>
          {byModel(step.en, step.enBy).map(({ models, value }) => (
            <div key={models ?? "all"} data-model-only={models} className="text-secondary text-footnote mt-1">{value}</div>
          ))}
          {byModel(step.path, step.pathBy).map(({ models, value: path }) => path.length > 0 && (
            <div key={models ?? "all"} data-model-only={models} className="text-secondary text-footnote font-medium flex flex-wrap items-center gap-x-1 gap-y-0.5 mt-2">
              <span>MENU</span>
              {path.map((segment, idx) => (
                <span key={idx} className="inline-flex items-center gap-1">
                  <span className="text-tertiary">
                    <ChevronIcon />
                  </span>
                  <span>{segment}</span>
                </span>
              ))}
            </div>
          ))}
          {step.note && (
            <div data-model-only={step.noteFor?.join(" ")} className={`mt-3 rounded-control px-3 py-2.5 text-footnote text-label flex gap-2 ${step.noteTone === "warning" ? "bg-warning-fill" : "bg-fill"}`}>
              <span className={`flex-shrink-0 mt-0.5 ${step.noteTone === "warning" ? "text-warning" : "text-secondary"}`}>
                <InfoIcon />
              </span>
              <p className="text-pretty">{step.note}</p>
            </div>
          )}
          {step.memory === "notStored" && (
            <div data-model-only={legacyModels} className="mt-3 rounded-control px-3 py-2.5 text-footnote text-secondary flex gap-2 bg-fill">
              <span className="flex-shrink-0 mt-0.5">
                <InfoIcon />
              </span>
              <p className="text-pretty">Không lưu trong bộ M1–M4: cài tay một lần.</p>
            </div>
          )}
          {cameraModels.map(({ id }) => step.noteBy?.[id] && (
            <div key={id} data-model-only={id} className="mt-2 rounded-control px-3 py-2.5 text-footnote text-label flex gap-2 bg-fill">
              <span className="flex-shrink-0 mt-0.5 text-secondary">
                <InfoIcon />
              </span>
              <p className="text-pretty">{step.noteBy[id]}</p>
            </div>
          ))}
        </div>
      </li>
      {step.only && cameraModels.map(({ id }) => {
        if (step.only!.includes(id)) return null;
        const skipNote = step.skipNote?.[id];
        return (
          <li
            key={`skip-${step.n}-${id}`}
            className="p-4 sm:p-5 flex gap-3 sm:gap-4"
            data-model-only={id}
          >
            <div className="size-8 rounded-badge bg-fill text-secondary text-subhead font-semibold grid place-items-center flex-shrink-0 tabular-nums">
              {step.n}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="text-body font-semibold pt-0.5 text-pretty">{step.title}</div>
                <div className="rounded-badge bg-fill px-2 py-0.5 text-footnote text-secondary font-medium">
                  {alphaConsole.skipped}
                </div>
              </div>
              {skipNote && (
                <p className="text-secondary text-footnote mt-3">{skipNote}</p>
              )}
            </div>
          </li>
        );
      })}
    </>
  );
}

export function GuideChapter({ chapterId }: { chapterId: string }) {
  const section = sections.find((s) => s.id === chapterId);
  if (!section) return null;

  return (
    <section id={chapterId} aria-labelledby={`heading-${chapterId}`} className="scroll-mt-24">
      <div className="mb-6" data-reveal>
        <h1 id={`heading-${chapterId}`} className="text-title font-normal">
          {section.title}
        </h1>
        <p className="text-body text-secondary mt-2">{section.lead}</p>
      </div>
      <div className="grid gap-5 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Phones: steps first, illustration after, so text stays the LCP and the menu path is on screen at once */}
        <div className="order-last flex flex-col gap-5 md:order-none">
          {section.images.map((img, idx) => (
            <figure key={idx} data-reveal style={{ "--i": idx } as React.CSSProperties}>
              <Image
                src={img.src}
                alt={img.alt}
                width={img.w}
                height={img.h}
                sizes="(min-width:768px) 40vw, 100vw"
                className="w-full h-auto rounded-card"
              />
              <figcaption className="text-footnote text-secondary mt-3">
                {img.caption}
              </figcaption>
            </figure>
          ))}
        </div>
        <div>
          <ul className="rounded-card bg-card shadow-card divide-y divide-separator">
            {section.steps.map((step, i) => (
              <StepRow key={step.n} step={step} index={i} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Bảng tóm tắt mọi bước: giá trị theo model, bước máy này không có thì ghi Bỏ qua. */
export function GuideSummary() {
  return (
    <section aria-labelledby="summary-heading">
      <h1 id="summary-heading" className="text-title font-normal mb-6" data-reveal>
        {alphaConsole.summaryTitle}
      </h1>
      <ul className="rounded-card bg-card shadow-card divide-y divide-separator">
        {sections.flatMap((s) => s.steps).map((step, i) => (
          <Fragment key={step.n}>
            <li className="py-3 px-4 sm:px-5 flex gap-4 items-center" data-reveal data-model-only={step.only?.join(" ")} style={{ "--i": i } as React.CSSProperties}>
              <div className="size-8 rounded-badge bg-accent text-on-accent text-subhead font-semibold grid place-items-center flex-shrink-0 tabular-nums">{step.n}</div>
              <div className="flex-1 min-w-0 text-subhead font-semibold">
                {step.title}{step.optional && <span className="text-secondary font-normal"> (tùy chọn)</span>}
              </div>
              {byModel(step.value, step.valueBy).map(({ models, value }) => (
                <div key={models ?? "all"} data-model-only={models} className="rounded-full bg-accent/10 text-accent-text font-semibold text-footnote px-2.5 py-1 whitespace-nowrap flex-shrink-0 tabular-nums">
                  {value}
                </div>
              ))}
            </li>
            {step.only && cameraModels.filter(({ id }) => !step.only!.includes(id)).map(({ id }) => (
              <li key={`skip-${id}`} className="py-3 px-4 sm:px-5 flex gap-4 items-center" data-model-only={id}>
                <div className="size-8 rounded-badge bg-fill text-secondary text-subhead font-semibold grid place-items-center flex-shrink-0 tabular-nums">{step.n}</div>
                <div className="flex-1 min-w-0 text-subhead text-secondary">{step.title}</div>
                <div className="rounded-badge bg-fill px-2 py-0.5 text-footnote text-secondary font-medium">{alphaConsole.skipped}</div>
              </li>
            ))}
          </Fragment>
        ))}
      </ul>
    </section>
  );
}
