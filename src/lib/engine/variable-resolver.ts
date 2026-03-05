/**
 * Resolves {{variable}} patterns in strings using environment + global variables.
 */
export function resolveVariables(
  input: string,
  variables: Record<string, string>
): string {
  return input.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match;
  });
}

/**
 * Extract all {{variable}} references from a string.
 */
export function extractVariables(input: string): string[] {
  const matches = input.matchAll(/\{\{(\w+)\}\}/g);
  return [...new Set([...matches].map((m) => m[1]))];
}

/**
 * Check if a string contains unresolved variables.
 */
export function hasUnresolvedVariables(
  input: string,
  variables: Record<string, string>
): boolean {
  const refs = extractVariables(input);
  return refs.some((ref) => !(ref in variables));
}
