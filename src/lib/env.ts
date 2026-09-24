import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./fixtures.js";

/** .env があれば読み込む。既に環境変数にある値は上書きしない */
export function loadDotEnv(file = join(ROOT, ".env")): void {
  if (!existsSync(file)) return;
  process.loadEnvFile(file);
}
