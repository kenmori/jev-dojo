/**
 * 第2問（初段・十段）利用者の投稿を state に入れよ。
 *
 * 条件:
 * - 投稿の本文は state.post.text に入れる（名前付きのフィールド）
 * - 投稿者名は state.post.author に入れる
 * - 掲示板の説明 state.board.name に "地域のお祭り掲示板" を入れる
 * - 投稿の本文を、質問（instructions）側に混ぜない（この関数は state だけを返す）
 *
 * ----
 * Q2 (1st Dan / 10th Dan) Put a user's post into the state.
 *
 * Requirements:
 * - the post body goes into state.post.text (a named field)
 * - the author goes into state.post.author
 * - put "地域のお祭り掲示板" into state.board.name (the test checks this exact string)
 * - do not mix the post body into the question (instructions); this function returns the state only
 */
export interface BoardState {
  board: { name: string };
  post: { text: string; author: string };
}

export function buildState(_text: string, _author: string): BoardState {
  throw new Error("未実装 / not implemented: 第2問 / Q2");
}
