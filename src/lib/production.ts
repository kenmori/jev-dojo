import type { Usage } from "@typesafe-ai/sdk";
import { costUSD, formatUSD, type Pricing } from "./cost.js";
import { facts } from "./facts.js";
import { t } from "./i18n.js";

/**
 * 本番運用の部品（九段）。
 * リトライとバックオフは SDK が持っているので、ここでは「SDK が持っていないもの」だけを足す。
 */

/** 同時に走るリクエストの数を制限する */
export function createLimiter(concurrency: number) {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(
      t("concurrency は 1 以上の整数です", "concurrency must be an integer of 1 or more"),
    );
  }
  let active = 0;
  const queue: (() => void)[] = [];
  const next = () => {
    if (active >= concurrency) return;
    const start = queue.shift();
    if (start) {
      active += 1;
      start();
    }
  };
  return function run<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push(() => {
        task()
          .then(resolve, reject)
          .finally(() => {
            active -= 1;
            next();
          });
      });
      next();
    });
  };
}

export interface Clock {
  now(): number;
  sleep(ms: number): Promise<void>;
}

export const realClock: Clock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
};

/**
 * 1分あたりのリクエスト数を超えないように待つ。
 * 429 を受けてから下がるより、送る側で守るほうがきれい。SDK のリトライは「それでも当たったとき」の保険。
 */
export function createRateGate(perMinute: number, clock: Clock = realClock) {
  const starts: number[] = [];
  const windowMs = 60_000;
  let chain = Promise.resolve();
  return function acquire(): Promise<void> {
    chain = chain.then(async () => {
      for (;;) {
        const now = clock.now();
        while (starts.length > 0 && now - (starts[0] as number) >= windowMs) starts.shift();
        if (starts.length < perMinute) {
          starts.push(now);
          return;
        }
        await clock.sleep(windowMs - (now - (starts[0] as number)));
      }
    });
    return chain;
  };
}

export class BudgetExceededError extends Error {
  constructor(
    readonly spentUSD: number,
    readonly limitUSD: number,
  ) {
    super(
      t(
        `予算を超えました: ${formatUSD(spentUSD)} / 上限 ${formatUSD(limitUSD)}`,
        `Budget exceeded: ${formatUSD(spentUSD)} / limit ${formatUSD(limitUSD)}`,
      ),
    );
  }
}

/** 使った金額を数え、上限を超えたら止める */
export class BudgetGuard {
  #spent = 0;

  constructor(
    readonly limitUSD: number,
    readonly pricing: Pricing = facts.pricing,
  ) {}

  get spentUSD(): number {
    return this.#spent;
  }

  /** 送る前に呼ぶ。すでに上限に達していたら止める */
  check(): void {
    if (this.#spent >= this.limitUSD) throw new BudgetExceededError(this.#spent, this.limitUSD);
  }

  /** 応答を受けたら呼ぶ */
  record(usage: Usage): void {
    this.#spent += costUSD(usage, this.pricing);
  }
}

/** 1リクエスト1行の JSON ログ。本文（state）は個人情報を含みうるので既定では書かない */
export interface RequestLog {
  at: string;
  step: string;
  itemId: string;
  model: string;
  requestId: string | undefined;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  latencyMs: number;
  error?: string;
}

export function logLine(entry: RequestLog): string {
  return JSON.stringify(entry);
}

export interface MapOptions {
  concurrency: number;
  perMinute?: number;
  clock?: Clock;
}

/** 配列を、同時実行数と1分あたりの上限を守りながら処理する。結果は入力と同じ順番 */
export async function mapWithLimits<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  options: MapOptions,
): Promise<R[]> {
  const run = createLimiter(options.concurrency);
  const gate = options.perMinute ? createRateGate(options.perMinute, options.clock) : undefined;
  return Promise.all(
    items.map((item, i) =>
      run(async () => {
        await gate?.();
        return fn(item, i);
      }),
    ),
  );
}
