import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import posts from "../../../data/posts.ja.json";
import { type JudgeResult, judgePost } from "../server/judge";

export const Route = createFileRoute("/")({ component: Home });

const DEPARTMENT_NAMES: Record<string, string> = {
  honbu: "運営本部",
  yatai: "屋台・出店",
  kotsu: "交通・駐車場",
  otoshimono: "落とし物",
  kyugo: "救護・安全",
  sonota: "その他",
};

const LANE_NAMES = {
  auto: "自動で担当へ",
  confirm: "担当者が確認",
  human: "本部が読む",
} as const;

function Home() {
  const [text, setText] = useState(posts[1]?.text ?? "");
  const [result, setResult] = useState<JudgeResult>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(value: string) {
    setBusy(true);
    setError(undefined);
    try {
      setResult(await judgePost({ data: { text: value } }));
    } catch (e) {
      setResult(undefined);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <header>
        <h1>お祭り掲示板の仕分け</h1>
        <p>投稿を Jev に判定させ、担当と対応レーンを決めます（jev-dojo 応用A）。</p>
      </header>

      <div className="layout">
        <section className="samples" aria-label="見本の投稿">
          <h2>見本の投稿</h2>
          <ul>
            {posts.slice(0, 20).map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setText(p.text);
                    void submit(p.text);
                  }}
                >
                  <span className="id">{p.id}</span> {p.text}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="judge">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit(text);
            }}
          >
            <label htmlFor="post">投稿</label>
            <textarea id="post" value={text} rows={4} onChange={(e) => setText(e.target.value)} />
            <button type="submit" disabled={busy}>
              {busy ? "判定中…" : "判定する"}
            </button>
          </form>

          {error && <p className="error">{error}</p>}

          {result && (
            <div className="result">
              <p className={`mode mode-${result.mode}`}>
                {result.mode === "live"
                  ? `実API（${result.model}）`
                  : result.synthetic
                    ? "デモ: 記録済みの見本データ（合成）。実APIの結果ではありません"
                    : "デモ: 記録済みの実APIレスポンス"}
              </p>
              {result.prediction.urgency >= 1.5 && (
                <p className="urgent">
                  緊急度が高い投稿です。レーンにかかわらず、すぐ人が対応してください
                </p>
              )}
              <dl>
                <dt>担当</dt>
                <dd>
                  {DEPARTMENT_NAMES[result.prediction.department] ?? result.prediction.department}
                  <small>（confidence {result.prediction.departmentConfidence.toFixed(2)}）</small>
                </dd>
                <dt>対応レーン</dt>
                <dd>
                  <span className={`lane lane-${result.routing.lane}`}>
                    {LANE_NAMES[result.routing.lane]}
                  </span>
                  <small>{result.routing.reason}</small>
                  {result.routing.alsoNotifyKyugo && <small>／ 念のため救護にも知らせる</small>}
                </dd>
                <dt>苦情の確率</dt>
                <dd>{result.prediction.complaint.toFixed(2)}</dd>
                <dt>緊急度（0〜2）</dt>
                <dd>{result.prediction.urgency.toFixed(2)}</dd>
              </dl>
              <h3>担当ごとの確率</h3>
              <ul className="bars">
                {Object.entries(result.prediction.departmentProbabilities).map(([k, v]) => (
                  <li key={k}>
                    <span>{DEPARTMENT_NAMES[k] ?? k}</span>
                    <meter min={0} max={1} value={v} />
                    <span>{v.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
