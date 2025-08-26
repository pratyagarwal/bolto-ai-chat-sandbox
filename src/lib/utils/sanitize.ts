export function sanitizeOutput(text: string): string {
  return text
    // Remove markdown bold formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove markdown italic formatting  
    .replace(/\*(.*?)\*/g, '$1')
    // Remove markdown bullet points
    .replace(/^• /gm, '')
    // Remove double quotes around text
    .replace(/"([^"]+)"/g, '$1')
    // Remove single quotes around text
    .replace(/'([^']+)'/g, '$1')
    // Clean up extra whitespace
    .replace(/\n\s*\n/g, '\n')
    .trim();
}