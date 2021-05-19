declare module 'match-all' {
  declare function matchAll(
    s: string,
    r: RegExp,
  ): {
    input: string;
    regex: RegExp;
    next(): string | undefined;
    nextRaw(): string | undefined;
    toArray(): string[];
    reset(i: number = 0): number;
  };

  export default matchAll;
}
