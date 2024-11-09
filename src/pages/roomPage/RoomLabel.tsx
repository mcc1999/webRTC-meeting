import React, { useState } from "react";
import { TbCopy, TbCopyCheck } from "react-icons/tb";

const RoomLabel: React.FC<{ roomId: string }> = ({ roomId }) => {
  const [copied, setCopied] = useState<boolean>(false);
  function copyRoomId() {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  }
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[max-content] h-[64px] px-[32px] text-white bg-gradient-to-b from-blue-700 to-cyan-600 rounded-b-lg text-lg flex justify-center items-center translate-y-[-56px] hover:translate-y-0 transition-all">
      会议房间号：{roomId}
      <div onClick={copyRoomId} className="ml-[16px] cursor-pointer">
        {copied ? <TbCopyCheck /> : <TbCopy />}
      </div>
    </div>
  );
};

export default RoomLabel;
