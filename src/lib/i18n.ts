import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 表示と質問の言語。JEV_LANG=en で英語、未設定なら日本語。
 * .env に JEV_LANG=en と書いておけば、毎回指定しなくてよい。
 *
 *   JEV_LANG=en npm run k07
 */
export type Lang = "ja" | "en";

export function currentLang(env: NodeJS.ProcessEnv = process.env): Lang {
  const v = env.JEV_LANG?.trim().toLowerCase();
  if (!v || v === "ja") return "ja";
  if (v === "en") return "en";
  throw new Error(`JEV_LANG must be "ja" or "en" (got: ${v})`);
}

/** 言語は import の時点で決まるので、ここで .env を先に読む。テスト中は手元の .env に左右されないよう読まない */
function loadDotEnvForLang(): void {
  if (process.env.VITEST) return;
  // 応用A のアプリ（Cloudflare Workers）からも読まれる。そこにはファイルも .env もないので何もしない
  if (typeof process.loadEnvFile !== "function" || !import.meta.url?.startsWith("file:")) return;
  try {
    const file = join(dirname(fileURLToPath(import.meta.url)), "..", "..", ".env");
    if (existsSync(file)) process.loadEnvFile(file);
  } catch {
    // .env が読めなくても、言語は環境変数（なければ日本語）で決める
  }
}

loadDotEnvForLang();

/** プロセスの起動時に決まる言語 */
export const LANG: Lang = currentLang();

/** 日本語と英語の文字列から、今の言語のほうを返す */
export const t = <T = string>(ja: T, en: T): T => (LANG === "ja" ? ja : en);
