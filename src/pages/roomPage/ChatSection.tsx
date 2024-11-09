import React from "react";
import { BsFillSendFill } from "react-icons/bs";

const ChatSection: React.FC = () => {
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
            placeholder="请输入消息..."
            className="outline-none w-[calc(100%-16px-8px)] text-sm"
          />
        </div>
        <div>
          <BsFillSendFill className="text-cyan-500 cursor-pointer" />
        </div>
      </div>
    </div>
  );
};

export default ChatSection;
