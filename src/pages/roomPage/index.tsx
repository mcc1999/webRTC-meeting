import React, { useEffect, useRef } from "react";
import ParticipantsSection from "./ParticipantsSection";
import VideoSection from "./VideoSection";
import ChatSection from "./ChatSection";
import RoomLabel from "./RoomLabel";
import { useAppSelector, useAppDispatch } from "../../hooks/hooks";
import { setConnectedAction, setSocketAction } from "../../store/wssSlice";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Topic } from "../../utils/socket";
import { RTCEndpoint } from "../../utils/webRTC";
import {
  leaveRoomRTCCleanAction,
  removeMemberAction,
  setRTCEndpointAction,
} from "../../store/roomSlice";

const RoomPage: React.FC = () => {
  const roomId = useAppSelector((state) => state.room.roomId);
  const {
    memberId: selfMemberId,
    audioMuted,
    videoMuted,
    isRoomHost,
    identify,
  } = useAppSelector((state) => state.room.self);
  const wssUrl = useAppSelector((state) => state.wss.wssUrl);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const rtcEndpointRef = useRef<{
    firstSdpOfferReceivedList: string[];
    hasPeerConnectionTargets: string[];
  }>({ firstSdpOfferReceivedList: [], hasPeerConnectionTargets: [] });

  useEffect(() => {
    const socket = io(wssUrl, {
      query: { roomId, identify, memberId: selfMemberId },
    });
    dispatch(setSocketAction(socket));
    socket.on("connect", () => {
      console.log("==== [WS-MSG: CONNECT] ws connected ====");
      dispatch(setConnectedAction({ connected: true }));
    });
    socket.on(Topic.MEMBER_JOIN, ({ memberId }) => {
      console.log(`==== [WS_MSG: MEMBER_JOIN] 成员${memberId}加入房间====`);
      if (selfMemberId === memberId) return;
      const rtcEndpoint = new RTCEndpoint({
        roomId,
        memberId: selfMemberId,
        target: memberId,
        socket,
        audioMuted, // TODO 拿不到最新值, 这俩属性什么用处暂时不知道
        videoMuted,
        polite: true,
        createAt: "MEMBER_JOIN",
      });
      rtcEndpoint.initialize();
      rtcEndpointRef.current.hasPeerConnectionTargets.push(memberId);
      dispatch(setRTCEndpointAction({ memberId, rtcEndpoint }));
    });
    socket.on(Topic.MEMBER_LEAVE, ({ memberId }) => {
      console.log(`==== [WS_MSG: MEMBER_LEAVE] 成员${memberId}离开房间====`);
      dispatch(removeMemberAction({ memberId }));
    });
    socket.on(Topic.RECEIVE_VIDEO_OFFER_ANSWER, (data) => {
      console.log(
        "==== [WS_MSG: RECEIVE_VIDEO_OFFER_ANSWER] useEffect ====",
        data
      );
      const { target, name, sdp } = data;
      const hasPeerConnectionWithTarget =
        rtcEndpointRef.current.hasPeerConnectionTargets.includes(name);
      const hasFirstSdpOfferReceived =
        rtcEndpointRef.current.firstSdpOfferReceivedList.includes(name);
      if (
        target === selfMemberId &&
        sdp.type === "offer" &&
        !hasFirstSdpOfferReceived &&
        !hasPeerConnectionWithTarget
      ) {
        const newRtcEndpoint = new RTCEndpoint({
          roomId,
          memberId: selfMemberId,
          target: name,
          socket,
          audioMuted,
          videoMuted,
          polite: false,
          createAt: "RECEIVE_VIDEO_OFFER_ANSWER",
        });
        newRtcEndpoint.handleVideoOfferMsg(data);
        newRtcEndpoint.initialize();
        rtcEndpointRef.current.firstSdpOfferReceivedList.push(name);
        rtcEndpointRef.current.hasPeerConnectionTargets.push(name);
        dispatch(
          setRTCEndpointAction({ memberId: name, rtcEndpoint: newRtcEndpoint })
        );
      }
    });

    socket.on(Topic.ROOM_DISBAND, () => {
      console.log("==== [WS-MSG: ROOM_DISBAND] 房间解散 ====");
      navigate("/");
    });

    socket.on("disconnect", () => {
      console.log("==== [WS-MSG: DISCONNECT] ws disconnected ====");
      dispatch(setConnectedAction({ connected: false }));
      navigate("/");
    });

    return () => {
      dispatch(leaveRoomRTCCleanAction());
      socket.disconnect();
    };
  }, []);

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
