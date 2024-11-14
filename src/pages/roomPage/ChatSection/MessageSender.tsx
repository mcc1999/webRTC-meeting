import React, { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../../hooks/hooks";
import { Topic } from "../../../utils/socket";
import { BsFillSendFill } from "react-icons/bs";

const MessageSender: React.FC = () => {
  const [message, setMessage] = useState("");
  const messageRef = useRef("");
  const identify = useAppSelector((state) => state.room.self.identify);
  const socket = useAppSelector((state) => state.wss.socket);

  useEffect(() => {
    if (!socket) return;
    function enterClickHandler(e: KeyboardEvent) {
      if (e.key === "Enter") {
        sendMessage();
      }
    }
    window.addEventListener("keypress", enterClickHandler);

    return () => {
      socket && window.removeEventListener("keypress", enterClickHandler);
    };
  }, [socket]);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  const sendMessage = function sendMessage() {
    if (!messageRef.current.trim()) return;
    socket?.emit(Topic.SEND_CHAT_MESSAGE, {
      identify,
      message: messageRef.current,
    });
    setMessage("");
  };
  return (
    <div className="h-[48px] m-[8px] px-[8px] flex justify-center items-center border-2 rounded-full border-cyan-500">
      <div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="请输入消息..."
          className="outline-none w-[calc(100%-16px-8px)] text-sm"
        />
      </div>
      <div onClick={sendMessage}>
        <BsFillSendFill className="text-cyan-500 cursor-pointer" />
      </div>
    </div>
  );
};

export default MessageSender;
