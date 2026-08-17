interface URLPatternOptions { baseURL?: string; }
type URLPatternInput = string | URLPattern;
declare class URLPattern {
  constructor(input?: URLPatternInput | Record<string, string>, baseURL?: string | URLPatternOptions);
}
