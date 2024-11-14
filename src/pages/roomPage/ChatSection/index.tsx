import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { Topic } from "../../../utils/socket";
import { addChatMessage } from "../../../store/roomSlice";
import MessageSender from "./MessageSender";
import MessageList from "./MessageList";

const ChatSection: React.FC = () => {
  const socket = useAppSelector((state) => state.wss.socket);
  const dispatch = useAppDispatch();

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
        <div className="text-gray-400 text-sm pl-[24px] my-[8px]">聊天室</div>
        <MessageList />
      </div>
      <MessageSender />
    </div>
  );
};

export default ChatSection;
