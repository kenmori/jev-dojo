import postsJson from "../../data/posts.ja.json" with { type: "json" };

/** 共通題材「地域のお祭り掲示板」の投稿 */
export interface Post {
  id: string;
  author: string;
  text: string;
}

export const posts: Post[] = postsJson;

export function getPost(id: string): Post {
  const post = posts.find((p) => p.id === id);
  if (!post) throw new Error(`投稿 ${id} が data/posts.ja.json にありません`);
  return post;
}
