import { decodeConsole } from "@/app/content";
import { AdminGate } from "./AdminGate";

export const metadata = {
  title: decodeConsole.admin.title,
  robots: { index: false, follow: false },
};

export default function AdminDecodePage() {
  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-title font-normal mb-8">{decodeConsole.admin.title}</h1>
      <AdminGate />
    </div>
  );
}
