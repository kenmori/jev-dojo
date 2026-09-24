export function maskPersonalInfo(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "［メール］")
    .replace(/0\d{1,4}-?\d{1,4}-?\d{3,4}/g, "［電話番号］");
}
