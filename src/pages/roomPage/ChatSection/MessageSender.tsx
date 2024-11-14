import React, { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../../hooks/hooks";
import { Topic } from "../../../utils/socket";
import { BsFillSendFill } from "react-icons/bs";

interface MessageSenderProps {
  type: "privateChat" | "chat";
  privateChatTargetMemberId?: string;
  disabled?: boolean;
}

const MessageSender: React.FC<MessageSenderProps> = ({
  type = "chat",
  privateChatTargetMemberId,
  disabled,
}) => {
  const [message, setMessage] = useState("");
  const messageRef = useRef("");
  const identify = useAppSelector((state) => state.room.self.identify);
  const memberId = useAppSelector((state) => state.room.self.memberId);
  const socket = useAppSelector((state) => state.wss.socket);
  const rtcEndpoints = useAppSelector((state) => state.room.rtcEndpoints);
  const privateChatMemberId = useAppSelector(
    (state) => state.room.privateChatMemberId
  );

  useEffect(() => {
    if (!socket || !privateChatMemberId) return;
    function enterClickHandler(e: KeyboardEvent) {
      console.log("debug enter press");

      if (e.key === "Enter") {
        sendMessage();
      }
    }
    window.addEventListener("keypress", enterClickHandler);

    return () => {
      socket && window.removeEventListener("keypress", enterClickHandler);
    };
  }, [socket, privateChatMemberId]);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  const sendMessage = function sendMessage() {
    if (
      !messageRef.current.trim() ||
      (type === "privateChat" && !privateChatTargetMemberId)
    ) {
      return;
    }
    if (type === "privateChat") {
      rtcEndpoints[privateChatTargetMemberId!].sendDataChannelMessage({
        identify,
        message: messageRef.current,
        memberId,
        timestamp: Date.now(),
      });
    } else {
      socket?.emit(Topic.SEND_CHAT_MESSAGE, {
        identify,
        memberId,
        message: messageRef.current,
      });
    }
    setMessage("");
  };

  const inputDisabledStyle = disabled ? " cursor-not-allowed" : "";
  return (
    <div className="h-[48px] m-[8px] px-[8px] flex justify-center items-center border-2 rounded-full border-cyan-500">
      <div>
        <input
          disabled={disabled}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="请输入消息..."
          className={
            "outline-none w-[calc(100%-16px-8px)] text-sm" + inputDisabledStyle
          }
        />
      </div>
      <div onClick={sendMessage}>
        <BsFillSendFill className="text-cyan-500 cursor-pointer" />
      </div>
    </div>
  );
};

export default MessageSender;
