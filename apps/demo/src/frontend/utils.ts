export function tokensToStr(qty: bigint, decimals: number, trimTail: boolean = true): string {
  if (qty === BigInt(0)) {
    return "0";
  }

  const decimalDiv = BigInt(Math.pow(10, decimals));

  const head = qty / decimalDiv;
  const tail = qty % decimalDiv;

  const headFormatted = head.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");

  if (tail === BigInt(0)) {
    return headFormatted;
  }

  const tailFormatted = tail.toString().padStart(decimals, "0");
  const tailTrimmed = trimTail ? tailFormatted.slice(0, Math.min(decimals, 4)) : tailFormatted;

  return `${headFormatted}.${tailTrimmed}`;
}
