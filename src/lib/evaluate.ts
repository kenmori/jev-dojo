import type { Usage } from "@typesafe-ai/sdk";
import {
  boardQuestions,
  boardStep,
  DEPARTMENTS,
  type Department,
  type Label,
  type Lang,
  postsFor,
} from "./board.js";
import { createDojo, type Dojo } from "./client.js";
import { sumUsage } from "./cost.js";
import {
  accuracy,
  type Bin,
  brierBinary,
  brierMulti,
  confusionMatrix,
  expectedCalibrationError,
  mean,
  reliabilityBins,
  type ThresholdRow,
  thresholdSweep,
} from "./metrics.js";
import { mapWithLimits } from "./production.js";

/** 1件の投稿に対する Jev の答え（評価に使う部分だけ） */
export interface Prediction {
  id: string;
  complaint: number;
  department: Department;
  departmentConfidence: number;
  departmentProbabilities: Record<string, number>;
  urgency: number;
  urgencyConfidence: number;
  usage: Usage;
}

export function boardDojo(lang: Lang, options: Parameters<typeof createDojo>[1] = {}): Dojo {
  return createDojo(boardStep(lang), options);
}

/** 1件を判定する。三段・四段・九段でも使う */
export async function predictOne(dojo: Dojo, id: string, text: string): Promise<Prediction> {
  const r = await dojo.client.systemOne({ state: text, questions: boardQuestions });
  const { isComplaint, department, urgency } = r.answers;
  return {
    id,
    complaint: isComplaint.noul,
    department: department.choice,
    departmentConfidence: department.confidence,
    departmentProbabilities: { ...department.probabilities },
    urgency: urgency.score,
    urgencyConfidence: urgency.confidence,
    usage: r.usage,
  };
}

/** 全件を判定する。live のときは同時実行数を抑える */
export async function predictAll(dojo: Dojo, lang: Lang, concurrency = 4): Promise<Prediction[]> {
  const posts = postsFor(lang);
  return mapWithLimits(posts, (p) => predictOne(dojo, p.id, p.text), {
    concurrency: dojo.mode === "replay" ? posts.length : concurrency,
  });
}

export const toUrgencyLevel = (expected: number): 0 | 1 | 2 =>
  expected < 0.5 ? 0 : expected < 1.5 ? 1 : 2;

export interface Summary {
  n: number;
  complaint: {
    accuracy: number;
    brier: number;
    bins: Bin[];
    ece: number;
    sweep: ThresholdRow[];
  };
  department: {
    accuracy: number;
    brier: number;
    meanConfidence: number;
    meanConfidenceCorrect: number;
    meanConfidenceWrong: number;
    confusion: Record<Department, Record<Department, number>>;
  };
  urgency: {
    accuracy: number;
    meanAbsError: number;
  };
  usage: Usage;
}

/** 予測とラベルを突き合わせて指標を出す */
export function summarize(predictions: Prediction[], labels: Label[]): Summary {
  const byId = new Map(labels.map((l) => [l.id, l]));
  const pairs = predictions.flatMap((p) => {
    const l = byId.get(p.id);
    return l ? [{ p, l }] : [];
  });
  const complaintP = pairs.map(({ p }) => p.complaint);
  const complaintY = pairs.map(({ l }) => l.isComplaint);
  const bins = reliabilityBins(complaintP, complaintY, 5);
  const deptPred = pairs.map(({ p }) => p.department);
  const deptGold = pairs.map(({ l }) => l.department);
  const correct = pairs.filter(({ p, l }) => p.department === l.department);
  const wrong = pairs.filter(({ p, l }) => p.department !== l.department);
  return {
    n: pairs.length,
    complaint: {
      accuracy: accuracy(
        complaintP.map((p) => p >= 0.5),
        complaintY,
      ),
      brier: brierBinary(complaintP, complaintY),
      bins,
      ece: expectedCalibrationError(bins),
      sweep: thresholdSweep(complaintP, complaintY),
    },
    department: {
      accuracy: accuracy(deptPred, deptGold),
      brier: brierMulti(
        pairs.map(({ p }) => p.departmentProbabilities),
        deptGold,
      ),
      meanConfidence: mean(pairs.map(({ p }) => p.departmentConfidence)),
      meanConfidenceCorrect: mean(correct.map(({ p }) => p.departmentConfidence)),
      meanConfidenceWrong: mean(wrong.map(({ p }) => p.departmentConfidence)),
      confusion: confusionMatrix(deptPred, deptGold, DEPARTMENTS),
    },
    urgency: {
      accuracy: accuracy(
        pairs.map(({ p }) => toUrgencyLevel(p.urgency)),
        pairs.map(({ l }) => l.urgency),
      ),
      meanAbsError: mean(pairs.map(({ p, l }) => Math.abs(p.urgency - l.urgency))),
    },
    usage: sumUsage(...pairs.map(({ p }) => p.usage)),
  };
}

export const pct = (x: number) => (Number.isFinite(x) ? `${(x * 100).toFixed(1)}%` : "—");
export const num = (x: number, digits = 3) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
