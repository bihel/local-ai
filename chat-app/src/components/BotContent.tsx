import React from "react"
import MarkdownRenderer from "./MarkdownRenderer"
import Think from "./Think"

export default function BotContent({ content }: { content: string }) {
  const elements: React.ReactNode[] = []
  let lastIndex = 0
  const regex = /<think>([\s\S]*?)<\/think>/g
  let match
  let key = 0

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      elements.push(
        <MarkdownRenderer key={key++}>
          {content.substring(lastIndex, match.index)}
        </MarkdownRenderer>,
      )
    }
    elements.push(<Think text={match[1]} key={key++} />)
    lastIndex = regex.lastIndex
  }
  if (lastIndex < content.length) {
    elements.push(
      <MarkdownRenderer key={key++}>
        {content.substring(lastIndex)}
      </MarkdownRenderer>,
    )
  }
  return elements
}
