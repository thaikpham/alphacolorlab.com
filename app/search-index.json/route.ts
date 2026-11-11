import { buildIndex } from '@/lib/searchIndex'

// Prerendered at build: nothing here reads request data (Cache Components).
export async function GET() {
  return Response.json(buildIndex())
}
