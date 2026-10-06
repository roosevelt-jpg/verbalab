'use client';

import { useState } from 'react';

type CodePanelProps = {
  code: string;
  label?: string;
  className?: string;
};

export function CodePanel({ code, label = 'JSON', className }: CodePanelProps) {
  const [copied, setCopied] = useState(false);

  async function onCopy {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout( => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={`vl-code-panel${className ? ` ${className}` : ''}`}>
      <div className="vl-code-panel-header">
        <span className="vl-code-panel-label">{label}</span>
        <button type="button" className="vl-code-copy" onClick={ => void onCopy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{code}</pre>
    </div>
  );
}
