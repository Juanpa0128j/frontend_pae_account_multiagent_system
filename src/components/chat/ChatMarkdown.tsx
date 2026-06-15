'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface ChatMarkdownProps {
    content: string;
}

// Isolated so react-markdown + remark-gfm + rehype-sanitize are code-split
// out of the chat route's first-load bundle (loaded only when a message
// with content actually renders). Sanitization (rehype-sanitize) is required
// and MUST stay — it strips unsafe HTML from model output.
export default function ChatMarkdown({ content }: ChatMarkdownProps) {
    return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {content}
        </ReactMarkdown>
    );
}
