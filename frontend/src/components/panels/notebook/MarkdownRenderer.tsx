import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLanguage = '';

  const renderInline = (text: string): React.ReactNode => {
    // Replace inline code, bold, italic, links
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Inline code: `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-neutral-800 text-sky-600 dark:text-sky-300 font-mono text-[11px]"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Bold: **bold** or __bold__
      const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
      if (boldMatch) {
        parts.push(
          <strong key={key++} className="font-bold text-gray-900 dark:text-neutral-100">
            {boldMatch[2]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic: *italic* or _italic_
      const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
      if (italicMatch) {
        parts.push(
          <em key={key++} className="italic text-gray-800 dark:text-neutral-200">
            {italicMatch[2]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Strikethrough: ~~del~~
      const strikeMatch = remaining.match(/^~~(.*?)~~/);
      if (strikeMatch) {
        parts.push(
          <del key={key++} className="line-through text-gray-500 dark:text-neutral-500">
            {strikeMatch[1]}
          </del>
        );
        remaining = remaining.slice(strikeMatch[0].length);
        continue;
      }

      // Link: [title](url)
      const linkMatch = remaining.match(/^\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="text-sky-600 dark:text-sky-400 underline hover:text-sky-500"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Plain character
      const nextSpecial = remaining.search(/[`*_~\[]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return parts;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced Code Block
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`codeblock-${i}`} className="my-2 rounded bg-neutral-900 border border-neutral-800 p-2.5 overflow-x-auto">
            {codeLanguage && (
              <div className="text-[10px] text-neutral-500 uppercase font-mono mb-1">{codeLanguage}</div>
            )}
            <pre className="font-mono text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
              {codeBuffer.join('\n')}
            </pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
        codeLanguage = '';
      } else {
        inCodeBlock = true;
        codeLanguage = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Empty Line
    if (!line.trim()) {
      elements.push(<div key={`spacer-${i}`} className="h-1.5" />);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-base font-bold text-gray-900 dark:text-neutral-100 my-1 pb-1 border-b border-gray-200 dark:border-neutral-800">
          {renderInline(line.slice(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-sm font-semibold text-gray-900 dark:text-neutral-100 my-1">
          {renderInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-xs font-semibold text-gray-800 dark:text-neutral-200 my-0.5">
          {renderInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${i}`} className="text-[11.5px] font-medium text-gray-800 dark:text-neutral-300 my-0.5">
          {renderInline(line.slice(5))}
        </h4>
      );
      continue;
    }

    // Horizontal Rule
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={`hr-${i}`} className="my-2 border-gray-300 dark:border-neutral-800" />);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${i}`} className="border-l-2 border-sky-500 pl-2.5 my-1 text-gray-600 dark:text-neutral-400 italic text-xs">
          {renderInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Bullet list
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <li key={`li-${i}`} className="ml-4 list-disc text-xs text-gray-800 dark:text-neutral-300 leading-snug">
          {renderInline(line.trim().slice(2))}
        </li>
      );
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${i}`} className="text-xs text-gray-800 dark:text-neutral-300 leading-relaxed">
        {renderInline(line)}
      </p>
    );
  }

  return <div className="flex flex-col gap-0.5 select-text leading-normal">{elements}</div>;
};
