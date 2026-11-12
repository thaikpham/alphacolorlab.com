import { allGraph } from '@/lib/appGraphs'

// Cạnh của đồ thị tổng hợp và đường dẫn của từng nút, cho cá nhân hóa theo túi đồ (lib/usePersonal).
// Prerendered at build: nothing here reads request data (Cache Components).
export async function GET() {
  const g = allGraph()
  return Response.json({ edges: g.edges, href: Object.fromEntries(g.nodes.flatMap((n) => (n.href ? [[n.id, n.href]] : []))) })
}
