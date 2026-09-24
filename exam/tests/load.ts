/**
 * EXAM_SOLUTIONS=1 のときは解答例を、そうでなければ自分の答え（exam/tasks）を読み込む。
 */
export function load<T>(name: string): Promise<T> {
  const dir = process.env.EXAM_SOLUTIONS === "1" ? "solutions" : "tasks";
  return import(`../${dir}/${name}.ts`) as Promise<T>;
}
