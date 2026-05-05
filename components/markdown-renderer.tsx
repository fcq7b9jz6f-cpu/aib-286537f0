'use client';

import { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const formattedContent = useMemo(() => {
    // A very simple markdown to HTML converter
    let html = content
      .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')       // Bold
      .replace(/\*([^\*]+)\*/g, '<em>$1</em>')             // Italic
      .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>') // Code block
      .replace(/`([^`]+)`/g, '<code>$1</code>')             // Inline code
      .replace(/\n/g, '<br />');                             // Newlines

    return { __html: html };
  }, [content]);

  return <div dangerouslySetInnerHTML={formattedContent} />;
}