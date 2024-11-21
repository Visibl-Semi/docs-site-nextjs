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

  switch (functionCall.name) {
    case 'generateMarkdown':
      return {
        type: 'markdown',
        content: `§§markdown§§${args.content}§§/markdown§§`
      };

    case 'generateGraph':
      // Handle graph generation
      const svg = await renderNetlistSvg(args.code);
      const graphTypeFlag = args.type === 'mermaid' ? 'mermaid' : 'netlistsvg';
      return {
        type: 'graph',
        graphType: graphTypeFlag,
        content: `§§${graphTypeFlag}§§${svg}§§/${graphTypeFlag}§§`
      };

    default:
      return { type: 'natural', content: args.content };
  }
};