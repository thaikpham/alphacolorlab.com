import { hero } from "@/app/content";
import { SplitLayout } from "@/app/components/SplitLayout";
import { ConsoleIndex } from "@/app/components/ConsoleIndex";

/** Alpha Console: left = your camera + task list (ConsoleIndex), right = one task, each its own URL. */
export default function ConsoleSplitLayout({ children }: { children: React.ReactNode }) {
  const header = <h1 className="text-display font-light text-balance">{hero.title}</h1>;
  return (
    <SplitLayout header={header} index={<ConsoleIndex />} lists={["console"]}>
      {children}
    </SplitLayout>
  );
}
