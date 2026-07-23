export interface RandomSource {
  next(): number;
  nextInt(minimum: number, maximum: number): number;
}
