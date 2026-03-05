'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface JsonViewerProps {
  data: string;
  maxHeight?: string;
}

export function JsonViewer({ data, maxHeight = '400px' }: JsonViewerProps) {
  let formatted = data;
  try {
    formatted = JSON.stringify(JSON.parse(data), null, 2);
  } catch {
    // Not valid JSON, display raw
  }

  return (
    <div className="overflow-auto rounded-md" style={{ maxHeight }}>
      <SyntaxHighlighter
        language="json"
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '0.375rem',
          fontSize: '0.8125rem',
          lineHeight: '1.5',
        }}
        wrapLongLines
      >
        {formatted}
      </SyntaxHighlighter>
    </div>
  );
}
