import type { CardFile, Finding, GameModel, Submission, SubmitResult } from "./types.ts";

export function buildSubmission(
  missionId: string,
  model: GameModel,
  firmware: string | null,
  region: "pal" | "ntsc" | null,
  nickname: string | null,
  lang: "vi" | "en",
  mission: any,
  files: CardFile[],
  verification: any,
  score: any,
  durationMs: number,
  retries: number,
  appVersion: string,
  findings?: Finding[]
): Submission {
  const filesBase64 = files.map(f => ({
    folder: f.folder,
    name: f.name,
    base64: btoa(String.fromCharCode(...f.bytes))
  }));

  return {
    missionId,
    model,
    firmware,
    region,
    nickname,
    lang,
    mission,
    files: filesBase64,
    verification,
    score,
    durationMs,
    retries,
    appVersion,
    ...(findings ? { findings } : {})
  };
}

export async function submit(s: Submission): Promise<SubmitResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    return { ok: false, error: "not-configured" };
  }

  try {
    const response = await fetch(`${baseUrl}/rest/v1/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        "Authorization": `Bearer ${anonKey}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        model: s.model,
        firmware: s.firmware || null,
        region: s.region || null,
        nickname: s.nickname || null,
        lang: s.lang,
        score: s.score.total,
        duration_ms: s.durationMs,
        retries: s.retries,
        app_version: s.appVersion,
        payload: s
      })
    });

    if (!response.ok) {
      await response.text(); // drain response
      return { ok: false, error: `http_${response.status}` };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: "network_error" };
  }
}

export function downloadableLog(s: Submission): string {
  return JSON.stringify(s, null, 2);
}
