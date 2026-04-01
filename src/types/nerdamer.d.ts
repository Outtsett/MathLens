declare module 'nerdamer' {
  interface NerdamerResult {
    toString(): string;
    text(format?: string): string;
    toTeX(): string;
    evaluate(): NerdamerResult;
    symbol: unknown;
  }

  function nerdamer(
    expression: string,
    subs?: Record<string, string>,
    option?: string[],
  ): NerdamerResult;

  namespace nerdamer {
    function diff(
      expression: string,
      variable: string,
      n?: number,
    ): NerdamerResult;
    function integrate(
      expression: string,
      variable: string,
    ): NerdamerResult;
    function solve(
      expression: string,
      variable: string,
    ): NerdamerResult;
    function simplify(expression: string): NerdamerResult;
    function expand(expression: string): NerdamerResult;
    function factor(expression: string): NerdamerResult;
  }

  export = nerdamer;
}
