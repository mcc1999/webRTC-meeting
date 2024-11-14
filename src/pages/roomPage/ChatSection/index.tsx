import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { Topic } from "../../../utils/socket";
import { addChatMessage } from "../../../store/roomSlice";
import MessageSender from "./MessageSender";
import MessageList from "./MessageList";

const ChatSection: React.FC = () => {
  const socket = useAppSelector((state) => state.wss.socket);
  const dispatch = useAppDispatch();
  const chatMessageList = useAppSelector((state) => state.room.chatMessageList);

  useEffect(() => {
    if (!socket) return;
    socket.on(Topic.RECEIVE_CHAT_MESSAGE, (data) => {
      dispatch(addChatMessage(data));
    });

    return () => {
      socket.off(Topic.RECEIVE_CHAT_MESSAGE);
    };
  }, [socket]);

  return (
    <div className="w-1/5 h-screen">
      <div>
        <div className="text-white text-sm pl-[24px] py-[8px] bg-gradient-to-b from-blue-700 to-cyan-600">
          聊天室
        </div>
        <MessageList
          chatMessageList={chatMessageList}
          height="calc(100vh - 36px - 64px)"
        />
      </div>
      <MessageSender type="chat" />
    </div>
  );
};

export default ChatSection;
