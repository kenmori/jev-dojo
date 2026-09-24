export interface BoardState {
  board: { name: string };
  post: { text: string; author: string };
}

export function buildState(text: string, author: string): BoardState {
  return { board: { name: "地域のお祭り掲示板" }, post: { text, author } };
}
