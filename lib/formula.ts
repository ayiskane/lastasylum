/**
 * Evaluates game formula expressions like:
 *   Math.ceil(0.125*Math.pow(n1,0.8925))
 *   Math.floor(n5+(n1*3500+n3*35000+n2*26000)*n4)
 *
 * Variables: n1, n2, ... nN are passed as params
 */
export function evaluateFormula(
  expression: string,
  params: Record<string, number>
): number {
  // Replace nN with actual values
  let expr = expression
  for (const [key, val] of Object.entries(params)) {
    expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(val))
  }

  // Math.X → Math.X (already valid JS)
  try {
    const fn = new Function('Math', `return ${expr}`)
    const result = fn(Math)
    return typeof result === 'number' ? result : NaN
  } catch {
    return NaN
  }
}

/**
 * Extracts variable names (n1, n2, etc.) from a formula expression
 */
export function extractVariables(expression: string): string[] {
  const matches = expression.match(/\bn\d+\b/g)
  if (!matches) return []
  return [...new Set(matches)].sort()
}
