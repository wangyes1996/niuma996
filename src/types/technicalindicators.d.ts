declare module 'technicalindicators' {
  export interface MACDInput {
    values: number[];
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
    SimpleMA?: boolean;
  }

  export interface MACDOutput {
    MACD: number;
    signal: number;
    histogram: number;
  }

  export class SMA {
    static calculate(input: { period: number; values: number[] }): number[];
  }

  export class EMA {
    static calculate(input: { period: number; values: number[] }): number[];
  }

  export class RSI {
    static calculate(input: { period: number; values: number[] }): number[];
  }

  export class MACD {
    static calculate(input: MACDInput): MACDOutput[];
  }
}