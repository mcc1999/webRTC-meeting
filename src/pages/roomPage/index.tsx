import React from "react";
import ParticipantsSection from "./ParticipantsSection";
import VideoSection from "./VideoSection";
import ChatSection from "./ChatSection";
import RoomLabel from "./RoomLabel";
import { useAppSelector } from "../../hooks/hooks";

const RoomPage: React.FC = () => {
  const roomId = useAppSelector((state) => state.room.roomId);
  return (
    <div className="flex flex-row w-full h-screen">
      <ParticipantsSection />
      <VideoSection />
      <ChatSection />
      <RoomLabel roomId={roomId} />
    </div>
  );
};

export default RoomPage;
