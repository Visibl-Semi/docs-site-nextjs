export type IntentType = 'natural' | 'markdown' | 'graph' | 'combined';

export interface IntentResult {
  type: IntentType;
  graphType?: 'mermaid' | 'netlistsvg';
}

export const detectIntent = (message: string): IntentResult => {
  const lowerMessage = message.toLowerCase();
  
  // Graph-specific keywords
  const mermaidKeywords = ['flowchart', 'sequence diagram', 'gantt', 'mermaid'];
  const netlistKeywords = ['circuit', 'netlist', 'digital logic', 'gate diagram'];
  
  // Markdown keywords
  const markdownKeywords = ['table', 'list', 'format', 'markdown'];

  const hasMermaid = mermaidKeywords.some(word => lowerMessage.includes(word));
  const hasNetlist = netlistKeywords.some(word => lowerMessage.includes(word));
  const hasMarkdown = markdownKeywords.some(word => lowerMessage.includes(word));

  if ((hasMermaid || hasNetlist) && hasMarkdown) {
    return {
      type: 'combined',
      graphType: hasMermaid ? 'mermaid' : 'netlistsvg'
    };
  }
  
  if (hasMermaid || hasNetlist) {
    return {
      type: 'graph',
      graphType: hasMermaid ? 'mermaid' : 'netlistsvg'
    };
  }
  
  if (hasMarkdown) {
    return { type: 'markdown' };
  }

  return { type: 'natural' };
};