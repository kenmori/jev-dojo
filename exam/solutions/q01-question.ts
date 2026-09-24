import { type ChoiceQuestion, choice } from "@typesafe-ai/sdk";

export function departmentQuestion(): ChoiceQuestion {
  return choice("この投稿は、どの担当が対応するべきですか？", {
    honbu: "運営本部。全体の予定、ボランティア、ごみ、トイレ、お礼や意見など",
    yatai: "屋台・出店。出店の有無、料金、食べ物",
    kotsu: "交通・駐車場。車、自転車、道路、バス",
    otoshimono: "落とし物。なくした物、拾った物、逃げたペット",
    kyugo: "救護・安全。けが、体調不良、迷子、危険な状況",
    sonota: "どれにも当てはまらない。お祭りと関係のない宣伝など",
  });
}
