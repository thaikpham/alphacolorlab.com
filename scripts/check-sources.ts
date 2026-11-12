// Kiểm tra link nguồn: meta.sources[].url (data/articles.json) và source (data/products.json).
//   npm run check:sources      cần mạng; in link chết, thoát 1 nếu có link chết
// Chỉ báo cáo, không thay link. Link chết = HTTP 404/410 hoặc tên miền không phân giải.
// Lỗi tạm (5xx, timeout, 401/403/429 do bị chặn) ghi là "unverified", không làm lỗi.
import { readFileSync } from 'node:fs'
import path from 'node:path'

const TIMEOUT_MS = 15_000
const CONCURRENCY = 8

export type Source = { url: string; where: string[] }
export type Verdict = 'ok' | 'dead' | 'unverified'
export type Result = { url: string; verdict: Verdict; status?: number; error?: string }
export type Fetcher = (url: string, method: 'HEAD' | 'GET') => Promise<{ status: number }>

/** Gom mọi link nguồn, mỗi link một lần, kèm nơi dùng. Ảnh sản phẩm không phải nguồn nên bỏ qua. */
export function collectSources(articles: any[], products: any[]): Source[] {
  const byUrl = new Map<string, string[]>()
  const add = (url: string, where: string) => byUrl.set(url, [...(byUrl.get(url) ?? []), where])
  for (const a of articles) {
    const sources: Array<{ url: string }> = a.meta?.sources ?? []
    sources.forEach((s, i) => add(s.url, `articles/${a.id} sources[${i}]`))
  }
  for (const p of products) if (p.source) add(p.source, `products/${p.code}`)
  return [...byUrl].map(([url, where]) => ({ url, where }))
}

export function classify(status: number): Verdict {
  if (status >= 200 && status < 400) return 'ok'
  if (status === 404 || status === 410) return 'dead'
  return 'unverified'
}

function errorCode(err: unknown): string {
  const e = err as { cause?: { code?: string }; name?: string } | undefined
  return e?.cause?.code ?? e?.name ?? 'error'
}

export function classifyError(err: unknown): Verdict {
  return errorCode(err) === 'ENOTFOUND' ? 'dead' : 'unverified'
}

async function attempt(url: string, method: 'HEAD' | 'GET', request: Fetcher): Promise<Result> {
  try {
    const res = await request(url, method)
    return { url, verdict: classify(res.status), status: res.status }
  } catch (err) {
    return { url, verdict: classifyError(err), error: errorCode(err) }
  }
}

/** HEAD trước; nếu không ok thì GET, và kết quả GET là kết quả cuối. */
export async function checkUrl(url: string, request: Fetcher = defaultRequest): Promise<Result> {
  const head = await attempt(url, 'HEAD', request)
  if (head.verdict === 'ok') return head
  return attempt(url, 'GET', request)
}

/** Kiểm tra mọi link, tối đa `concurrency` yêu cầu cùng lúc; kết quả giữ thứ tự đầu vào. */
export async function checkAll(sources: Source[], concurrency = CONCURRENCY, request?: Fetcher): Promise<Result[]> {
  const results = new Array<Result>(sources.length)
  let next = 0
  const worker = async () => {
    while (next < sources.length) {
      const i = next++
      results[i] = await checkUrl(sources[i].url, request)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, sources.length) }, worker))
  return results
}

const defaultRequest: Fetcher = async (url, method) => {
  const res = await fetch(url, {
    method,
    redirect: 'follow',
    headers: { 'User-Agent': 'source-link-check/1.0' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  await res.body?.cancel()
  return { status: res.status }
}

if (process.argv[1]?.endsWith('check-sources.ts')) {
  const root = path.resolve(import.meta.dirname, '..')
  const articles = JSON.parse(readFileSync(path.join(root, 'data/articles.json'), 'utf8'))
  const products = JSON.parse(readFileSync(path.join(root, 'data/products.json'), 'utf8'))
  const sources = collectSources(articles, products)
  console.log(`Checking ${sources.length} unique source URLs...`)

  const results = await checkAll(sources)
  const where = new Map(sources.map((s) => [s.url, s.where]))
  const dead = results.filter((r) => r.verdict === 'dead')
  const unverified = results.filter((r) => r.verdict === 'unverified')
  for (const r of dead) console.log(`DEAD ${r.status ?? r.error} ${r.url}\n  used by: ${where.get(r.url)!.join(', ')}`)
  for (const r of unverified) console.log(`UNVERIFIED ${r.status ?? r.error} ${r.url}`)
  console.log(`ok ${results.length - dead.length - unverified.length}, dead ${dead.length}, unverified ${unverified.length}`)
  process.exitCode = dead.length ? 1 : 0
}
