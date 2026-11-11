import { wiki } from "@/app/content";
import { SplitLayout } from "@/app/components/SplitLayout";
import { ProductIndex } from "@/app/components/ProductIndex";
import { CompareDock } from "@/app/components/Compare";
import { products, productHref } from "@/lib/wiki";
import { productDetail } from "@/lib/productSpecs";
import { lensTags } from "@/lib/lensTags";

const items = products().map((p) => ({
  slug: p.slug,
  href: productHref(p.slug),
  kind: p.kind as "camera" | "lens" | "accessory",
  group: p.group,
  name: p.name,
  code: p.code,
  image: p.image,
  detail: p.kind === "accessory" ? "" : productDetail(p),
  tags: p.kind === "lens" ? lensTags(p) : [],
}));

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplitLayout
        header={
          <>
            <h1 className="text-display font-light">{wiki.product.title}</h1>
          </>
        }
        index={<ProductIndex items={items} />}
       
      >
        {children}
      </SplitLayout>
      <CompareDock />
    </>
  );
}
