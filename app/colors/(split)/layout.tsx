import { colorBank } from "@/app/content";
import { SplitLayout } from "@/app/components/SplitLayout";
import { ColorsIndex } from "@/app/components/ColorsIndex";
import { CartTray } from "@/app/components/CartTray";
import presets from "@/lib/zve10/presets";

export default function ColorsSplitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const header = (
    <h1 className="text-display font-light">{colorBank.list.title}</h1>
  );

  return (
    <>
      <SplitLayout
        header={header}
        index={<ColorsIndex presets={presets} />}
       
      >
        {children}
      </SplitLayout>
      <CartTray />
    </>
  );
}
