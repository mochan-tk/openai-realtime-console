import { useEffect, useState } from "react";

export default function ConversationDisplay({ events, isSessionActive }) {
  const [conversationItems, setConversationItems] = useState([]);

  useEffect(() => {
    if (!events || events.length === 0) return;

    // 会話に関連するイベントのみを抽出
    const relevantEvents = events.filter(event => 
      event.type === "conversation.item.create" ||
      event.type === "response.audio_transcript.delta" ||
      event.type === "response.audio_transcript.done" ||
      event.type === "response.text.delta" ||
      event.type === "response.text.done"
    );

    const items = [];
    let currentResponse = null;

    // イベントを時系列順に並べ替え（最新が先頭なので逆順にする）
    const sortedEvents = [...relevantEvents].reverse();

    sortedEvents.forEach(event => {
      if (event.type === "conversation.item.create") {
        if (event.item && event.item.content && event.item.content[0]) {
          const content = event.item.content[0];
          if (content.type === "input_text") {
            items.push({
              id: event.item.id || event.event_id,
              role: "user",
              content: content.text,
              timestamp: event.timestamp
            });
          }
        }
      } else if (event.type === "response.audio_transcript.delta") {
        if (!currentResponse) {
          currentResponse = {
            id: event.response_id,
            role: "assistant",
            content: "",
            timestamp: event.timestamp
          };
        }
        currentResponse.content += event.delta || "";
      } else if (event.type === "response.audio_transcript.done") {
        if (currentResponse) {
          items.push(currentResponse);
          currentResponse = null;
        }
      } else if (event.type === "response.text.delta") {
        if (!currentResponse) {
          currentResponse = {
            id: event.response_id,
            role: "assistant",
            content: "",
            timestamp: event.timestamp
          };
        }
        currentResponse.content += event.delta || "";
      } else if (event.type === "response.text.done") {
        if (currentResponse) {
          items.push(currentResponse);
          currentResponse = null;
        }
      }
    });

    // 最新の会話を上に表示するため、再度逆順にする
    setConversationItems(items.reverse());
  }, [events]);

  if (!isSessionActive) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">セッションを開始すると会話が表示されます</p>
      </div>
    );
  }

  if (conversationItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">会話を始めてください...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-3">
      {conversationItems.map((item) => (
        <div
          key={item.id}
          className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] p-3 rounded-lg ${
              item.role === "user"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-900"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{item.content}</p>
            <p className="text-xs opacity-70 mt-1">
              {item.timestamp}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
