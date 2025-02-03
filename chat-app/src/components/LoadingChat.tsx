export default function LoadingChat() {
  return (
    <div className="flex space-x-3 mt-2">
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-ping"></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-ping animate-delay-200"></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-ping animate-delay-400"></div>
    </div>
  )
}
