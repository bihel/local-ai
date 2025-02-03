import { useState } from "react"
import MarkdownRenderer from "./MarkdownRenderer"

export default function Think({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const trimmedText = text.trim()
  return (
    <div className="my-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="underline text-sm text-gray-400 focus:outline-none"
      >
        {expanded ? "Hide thought" : "Show thought"}
      </button>
      {expanded && (
        <div className="mt-1 text-sm text-gray-300 border-l border-gray-600 pl-2">
          <MarkdownRenderer>
            {trimmedText || "No thought needed"}
          </MarkdownRenderer>
        </div>
      )}
    </div>
  )
}
