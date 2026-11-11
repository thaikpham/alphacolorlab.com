// `<` escaped so text inside the data can never close the script tag.
export function JsonLdScript({ schema }: { schema: object | null }) {
  if (!schema) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />;
}
