import { Metadata } from "next";
import { notFound } from "next/navigation";
import presets from "@/lib/zve10/presets";
import { colorBank, nav } from "@/app/content";
import { RecipeDetailContent } from "@/app/components/RecipeDetailContent";
import { Community } from "@/app/components/Community";
import { BackLink } from "@/app/components/BackLink";
import { SITE_URL } from "@/lib/site";
import { JsonLdScript } from "@/app/components/JsonLdScript";
import { breadcrumbLd } from "@/lib/jsonld";

export function generateStaticParams() {
  return presets.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const preset = presets.find((p) => p.id === slug);
  return {
    title: preset ? `${preset.name} · Color Bank` : "Color Bank",
    description: preset?.description_vi || "Color Bank công thức màu Sony ZV-E10 và A6400",
    alternates: {
      canonical: `${SITE_URL}/colors/${slug}`,
    },
  };
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const preset = presets.find((p) => p.id === slug);

  if (!preset) notFound();

  return (
    <div className="min-h-dvh bg-bg text-label">
      <div className="max-w-page mx-auto px-4 sm:px-6 md:px-8 pt-16 pb-16 sm:pt-24 sm:pb-24 md:pt-6">
        <div className="md:hidden">
          <BackLink href="/colors">{colorBank.recipe.backLink}</BackLink>
        </div>
        <h1 className="text-display font-light mt-4 mb-8 md:mt-0">{preset.name}</h1>

        <RecipeDetailContent preset={preset} />
        <JsonLdScript schema={breadcrumbLd([nav.apps[1].label, "/colors"], [preset.name, `/colors/${preset.id}`])} />
        <Community page={`recipe/${preset.id}`} title={preset.name} />
      </div>
    </div>
  );
}
