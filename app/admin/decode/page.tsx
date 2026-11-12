import { notFound } from "next/navigation";
import Link from "next/link";
import { decodeConsole } from "@/app/content";
import { AdminDecode } from "./AdminDecode";

export const metadata = {
  title: decodeConsole.admin.title,
  robots: { index: false, follow: false },
};

export default function AdminDecodePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="max-w-page mx-auto px-4 sm:px-6 py-10">
      <p className="mb-6 text-subhead">
        <Link href="/admin" className="text-accent-text underline">{decodeConsole.admin.toPresets}</Link>
      </p>
      <div className="mb-8">
        <h1 className="text-title font-normal mb-2">{decodeConsole.admin.title}</h1>
        <p className="text-body text-secondary">{decodeConsole.admin.lead}</p>
      </div>
      <AdminDecode />
    </div>
  );
}
