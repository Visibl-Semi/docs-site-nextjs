// Safely import mermaid
let mermaid: any;

if (typeof window !== 'undefined') {
  // Only import mermaid on the client side
  import('mermaid').then((m) => {
    mermaid = m.default;
    mermaid.initialize({ startOnLoad: false });
  });
}

import { renderNetlistSvg } from './netlist-renderer';
import { detectIntent } from './intent-detection';

export const processFunctionCall = async (functionCall: any) => {
  const args = functionCall.arguments;
  const intent = detectIntent(args.content || args.code);

  switch (intent.type) {
    case 'markdown':
      // Call generateMarkdown function
      return {
        type: 'markdown',
        content: args.content
      };

    case 'graph':
      if (intent.graphType === 'mermaid') {
        // Render Mermaid graph
        try {
          const svg = await mermaid.render('graph-' + Math.random(), args.code);
          return {
            type: 'graph',
            graphType: 'mermaid',
            content: svg
          };
        } catch (e) {
          console.error('Mermaid rendering error:', e);
          return {
            type: 'markdown',
            content: '```mermaid\n' + args.code + '\n```'
          };
        }
      } else if (intent.graphType === 'netlistsvg') {
        // Render Netlistsvg graph
        try {
          const svg = await renderNetlistSvg(args.code);
          return {
            type: 'graph',
            graphType: 'netlistsvg',
            content: svg
          };
        } catch (e) {
          console.error('Netlist rendering error:', e);
          return {
            type: 'markdown',
            content: '```netlistsvg\n' + args.code + '\n```'
          };
        }
      }
      break;

    case 'natural':
      // No function call needed
      return { type: 'natural', content: args.content };

    default:
      throw new Error(`Unknown function: ${functionCall.name}`);
  }
};