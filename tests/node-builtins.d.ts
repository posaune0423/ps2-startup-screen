declare module "node:assert/strict" {
  interface AssertStrict {
    doesNotMatch(string: string, regexp: RegExp, message?: string): void;
    equal(actual: unknown, expected: unknown, message?: string): void;
    match(string: string, regexp: RegExp, message?: string): void;
    ok(value: unknown, message?: string): void;
  }

  const assert: AssertStrict;
  export default assert;
}

declare module "node:fs" {
  interface FileStats {
    size: number;
  }

  export function readFileSync(path: string | URL, encoding: string): string;
  export function statSync(path: string | URL): FileStats;
}
