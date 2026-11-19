"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { useModel } from "@/lib/model";
import { ArticleToc } from "@/app/components/ArticleToc";

export type VariantTab = {
  id: string;
  label: string;
  /** Mã máy (`cameraModels` trong app/content.ts) mà bản này là mặc định. */
  models: readonly string[];
  toc: { id: string; text: string }[];
  body: ReactNode;
};

/**
 * Công tắc bản của bài (`?menu=legacy|new-gen`), kèm mục lục và thân bài của bản đang chọn.
 * Server và lần hydrate đều dựng bản đầu (máy mặc định của `useModel` là zve10); sau khi mount mới đọc `?menu=`,
 * không có thì theo máy đã chọn. Mọi bản đều có trong HTML, bản không chọn để `hidden`.
 */
export function ArticleVariants({ tocLabel, switchLabel, variants, children }: {
  tocLabel: string;
  switchLabel: string;
  variants: VariantTab[];
  /** Phần sau thân bài (liên kết, nguồn, bình luận): nằm trong cột đọc, dùng chung cho mọi bản. */
  children: ReactNode;
}) {
  const model = useModel();
  const byModel = variants.find((v) => v.models.includes(model))?.id ?? variants[0].id;
  const [active, setActive] = useState(variants[0].id);

  useLayoutEffect(() => {
    const menu = new URLSearchParams(window.location.search).get("menu");
    setActive(variants.find((v) => v.id === menu)?.id ?? byModel);
  }, [variants, byModel]);

  // replaceState không cuộn trang; giữ nguyên state của Next và phần #hash
  const choose = (id: string) => {
    setActive(id);
    const url = new URL(window.location.href);
    url.searchParams.set("menu", id);
    window.history.replaceState(window.history.state, "", url);
  };

  const current = variants.find((v) => v.id === active) ?? variants[0];
  return (
    <>
      <ArticleToc label={tocLabel} items={current.toc} />
      <div className="min-w-0 max-w-article">
        <div role="group" aria-label={switchLabel} className="mb-6 flex gap-1 rounded-full bg-fill p-1">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={v.id === current.id}
              onClick={() => choose(v.id)}
              className={`flex-1 min-h-11 rounded-full px-3 py-2 text-subhead transition ${
                v.id === current.id ? "bg-card shadow-thumb font-semibold text-label" : "font-medium text-label hover:bg-fill-strong"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="mb-16">
          {variants.map((v) => (
            <div key={v.id} hidden={v.id !== current.id}>
              {v.body}
            </div>
          ))}
        </div>
        {children}
      </div>
    </>
  );
}
