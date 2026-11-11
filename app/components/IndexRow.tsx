"use client";

import { usePathname } from "next/navigation";
import { LinkRow } from "./LinkRow";

/** LinkRow for a split-view index: highlighted while its page is open. */
export function IndexRow(props: { href: string; title: string; detail?: string }) {
  return <LinkRow {...props} isActive={usePathname() === props.href} />;
}
