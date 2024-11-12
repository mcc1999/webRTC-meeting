import React, { useEffect, useRef, useState } from "react";
import { BsFillSendFill } from "react-icons/bs";
import { useAppSelector } from "../../hooks/hooks";
import { Topic } from "../../utils/socket";

const ChatSection: React.FC = () => {
  const [message, setMessage] = useState("");
  const messageRef = useRef("");
  const identify = useAppSelector((state) => state.room.self.identify);
  const socket = useAppSelector((state) => state.wss.socket);

  useEffect(() => {
    function enterClickHandler(e: KeyboardEvent) {
      if (e.key === "Enter") {
        sendMessage();
      }
    }
    window.addEventListener("keypress", enterClickHandler);
    socket?.on(Topic.CHAT_MESSAGE, (data) => {
      console.log(data);
    });

    return () => {
      socket?.off("chat message");
      window.removeEventListener("keypress", enterClickHandler);
    };
  }, []);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  function sendMessage() {
    socket?.emit(Topic.CHAT_MESSAGE, {
      identify,
      message: messageRef.current,
    });
    setMessage("");
  }
  return (
    <div className="w-1/5 h-screen">
      <div>
        <div className="text-gray-400 text-sm pl-[24px] my-[8px]">聊天室</div>
        <div className="h-[calc(100vh-36px-64px)] overflow-y-scroll"></div>
      </div>
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
    </div>
  );
};

export default ChatSection;
