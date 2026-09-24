import postsEn from "../../data/posts.en.json" with { type: "json" };
import postsJa from "../../data/posts.ja.json" with { type: "json" };
import { LANG, type Lang } from "./i18n.js";

/** 共通題材「地域のお祭り掲示板」の投稿。日本語と英語は同じ id・同じ内容 */
export interface Post {
  id: string;
  author: string;
  text: string;
}

export const postsByLang: Record<Lang, Post[]> = { ja: postsJa, en: postsEn };

/** 今の言語（JEV_LANG）の投稿 */
export const posts: Post[] = postsByLang[LANG];

export function getPost(id: string, lang: Lang = LANG): Post {
  const post = postsByLang[lang].find((p) => p.id === id);
  if (!post) throw new Error(`post ${id} not found in data/posts.${lang}.json`);
  return post;
}
