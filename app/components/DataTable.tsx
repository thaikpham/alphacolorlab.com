import { RichText } from "./RichText";

/** Bảng dữ liệu trong thẻ trắng, cuộn ngang trên điện thoại. Ô và chú thích nhận inline markdown và wikilink. */
export function DataTable({ head, rows, caption }: { head: readonly string[]; rows: readonly (readonly string[])[]; caption?: string }) {
  return (
    <figure>
      {/* tabIndex: vùng cuộn ngang phải dùng được bằng bàn phím */}
      <div tabIndex={0} className="overflow-x-auto rounded-card bg-card shadow-card">
        <table className="w-full text-left text-subhead">
          <thead>
            <tr className="border-b border-separator">
              {head.map((h, i) =>
                h ? (
                  <th key={i} scope="col" className="px-4 py-2.5 text-footnote font-semibold text-secondary whitespace-nowrap">{h}</th>
                ) : (
                  <td key={i} />
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2.5 align-top">
                    <RichText text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && (
        <figcaption className="mt-2 px-1 text-footnote text-secondary">
          <RichText text={caption} />
        </figcaption>
      )}
    </figure>
  );
}
