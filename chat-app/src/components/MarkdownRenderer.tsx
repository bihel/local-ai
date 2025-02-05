import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";

export default function MarkdownRenderer({ children }: { children: string }) {
  return <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{children}</ReactMarkdown>;
}
