import type { Usage } from "@typesafe-ai/sdk";
import { facts } from "./facts.js";
import { t } from "./i18n.js";

export interface Pricing {
  inputPerMtok: number;
  outputPerMtok: number;
}

/** トークン数から費用（USD）を計算する。単価は 100万トークンあたり */
export function costUSD(usage: Usage, pricing: Pricing = facts.pricing): number {
  return (
    (usage.input_tokens / 1_000_000) * pricing.inputPerMtok +
    (usage.output_tokens / 1_000_000) * pricing.outputPerMtok
  );
}

/** 小さな金額でも 0 に丸めずに、有効数字2桁で表示する。例: $0.0000042 */
export function formatUSD(amount: number): string {
  if (amount === 0) return "$0";
  const decimals = Math.max(2, -Math.floor(Math.log10(Math.abs(amount))) + 1);
  return `$${amount.toFixed(decimals)}`;
}

export function sumUsage(...usages: Usage[]): Usage {
  return usages.reduce<Usage>(
    (acc, u) => ({
      input_tokens: acc.input_tokens + u.input_tokens,
      output_tokens: acc.output_tokens + u.output_tokens,
    }),
    { input_tokens: 0, output_tokens: 0 },
  );
}

export function describeCost(usage: Usage, pricing: Pricing = facts.pricing): string {
  return `${t("入力", "input")} ${usage.input_tokens} tok / ${t("出力", "output")} ${usage.output_tokens} tok → ${formatUSD(costUSD(usage, pricing))}`;
}
