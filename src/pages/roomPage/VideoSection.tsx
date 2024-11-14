import React, {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { AiOutlineLaptop, AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsFillMicFill, BsFillMicMuteFill } from "react-icons/bs";
import { FaVideo, FaVideoSlash } from "react-icons/fa";
import {
  createLocalStream,
  defaultAudioConstraints,
  defaultVideoConstraints,
  muteAudio,
  muteVideo,
  startShareScreen,
  stopShareScreen,
  unmuteAudio,
  unmuteVideo,
} from "../../utils/webRTC";
import { setSelfAction } from "../../store/roomSlice";
import { getVideoPosition } from "../../utils/videoLayout";
import { useNavigate } from "react-router-dom";

const VideoSection: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const dispatch = useAppDispatch();
  const videoMuted = useAppSelector((state) => state.room.self.videoMuted);
  const audioMuted = useAppSelector((state) => state.room.self.audioMuted);
  const ignore = useRef(false);
  useEffect(() => {
    if (ignore.current) return;
    createLocalStream({
      video: !videoMuted ? defaultVideoConstraints : false,
      // audio: false /** DUMMY, !audioMuted */,
      audio: !audioMuted ? defaultAudioConstraints : false,
    })
      .then((stream) => {
        dispatch(setSelfAction({ mediaStream: stream }));
        setLoading(false);
      })
      .catch((e) => {
        switch (e.name) {
          case "NotFoundError":
            alert(
              "Unable to open your call because no camera and/or microphone" +
                "were found."
            );
            break;
          case "SecurityError":
          case "PermissionDeniedError":
            // Do nothing; this is the same as the user canceling the call.
            break;
          default:
            alert("Error opening your camera and/or microphone: " + e.message);
            break;
        }
      });
    ignore.current = true;
  }, []);

  return (
    <div className="w-3/5">
      {loading ? <LoadingOverlay /> : <VideosContainer />}
      <VideoButtons />
    </div>
  );
};

export default VideoSection;

const LoadingOverlay: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <AiOutlineLoading3Quarters className="text-6xl animate-spin text-white" />
    </div>
  );
};
interface IOutputVideo {
  videoMuted: boolean;
  audioMuted: boolean;
  memberId: string;
  mediaStream: MediaStream;
  rect: {
    top: number;
    left: number;
    w: number;
    h: number;
  };
}
const OutputVideo: React.FC<IOutputVideo> = ({
  videoMuted,
  memberId,
  audioMuted,
  mediaStream,
  rect,
}) => {
  const videoBoxRef = useRef<HTMLDivElement>(null);
  const [videoDom, setVideoDom] = useState<HTMLVideoElement>();

  useEffect(() => {
    if (!videoBoxRef.current || !mediaStream || rect.w === 0 || rect.h === 0) {
      return;
    }
    if (videoBoxRef.current.children.length !== 0) {
      if (!videoDom) return;
      videoDom.style.width = rect.w + "px";
      videoDom.style.height = rect.h + "px";
      videoDom.style.background = "black";
      videoDom.width = rect.w;
      videoDom.height = rect.h;
      return;
    }
    const videoEle = document.createElement("video");
    videoEle.autoplay = true;
    videoEle.style.width = rect.w + "px";
    videoEle.style.height = rect.h + "px";
    videoEle.style.background = "black";
    videoEle.width = rect.w;
    videoEle.height = rect.h;
    videoEle.srcObject = mediaStream;
    videoBoxRef.current.appendChild(videoEle);
    setVideoDom(videoEle);
  }, [rect]);

  return (
    <div className="absolute" style={{ left: rect.left, top: rect.top }}>
      <div ref={videoBoxRef} id={`output-video-${memberId}`} />
      {videoMuted && (
        <img
          src="/images/video-muted.png"
          alt="video muted"
          className="absolute w-full h-full top-0 left-0"
        />
      )}
      <div className="absolute bottom-0 right-0 m-[8px] text-white flex">
        <div className="mr-[8px]">
          {audioMuted ? <BsFillMicMuteFill /> : <BsFillMicFill />}
        </div>
        <div>{videoMuted ? <FaVideoSlash /> : <FaVideo />}</div>
      </div>
    </div>
  );
};
const VideosContainer: React.FC = () => {
  const self = useAppSelector((state) => state.room.self);
  const memberList = useAppSelector((state) => state.room.memberList);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!videoContainerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      forceUpdate();
    });
    resizeObserver.observe(videoContainerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  console.log(
    "videoContainer all members",
    [self, ...memberList].sort((a, b) => {
      if (a.isRoomHost) return -1;
      if (b.isRoomHost) return 1;
      return a.memberId.localeCompare(b.memberId);
    })
  );

  return (
    <div
      ref={videoContainerRef}
      id="video-container"
      className="w-full h-[calc(100vh-64px)] bg-gray-300 relative"
    >
      {[self, ...memberList]
        .sort((a, b) => {
          if (a.isRoomHost) return -1;
          if (b.isRoomHost) return 1;
          return a.memberId.localeCompare(b.memberId);
        })
        .map(
          (
            { memberId, audioMuted, videoMuted, mediaStream, isRoomHost },
            index
          ) => (
            <OutputVideo
              key={memberId}
              rect={getVideoPosition(memberList.length + 1, isRoomHost, index)}
              memberId={memberId}
              audioMuted={audioMuted}
              videoMuted={videoMuted}
              mediaStream={mediaStream!}
            />
          )
        )}
    </div>
  );
};
const VideoButtons: React.FC = () => {
  return (
    <div className="flex justify-between items-center h-[64px] bg-gradient-to-b from-blue-700 to-cyan-600 rounded-t-2xl">
      <div className="flex m-auto items-center">
        <MicButton />
        <VideoButton />
        <LeaveRoomButton />
        <ScreenShareButton />
      </div>
    </div>
  );
};
const MicButton: React.FC = () => {
  const audioMuted = useAppSelector((state) => state.room.self.audioMuted);
  const shareScreen = useAppSelector((state) => state.room.self.shareScreen);
  const disabledClassnames = shareScreen
    ? " cursor-not-allowed"
    : " cursor-pointer hover:bg-blue-800 rounded-full";
  function audioMuteChangeHandler() {
    if (shareScreen) return;
    audioMuted ? unmuteAudio() : muteAudio();
  }
  return (
    <div
      className={"mx-[16px] p-[8px] text-white" + disabledClassnames}
      title={audioMuted ? "开启麦克风" : "关闭麦克风"}
      onClick={audioMuteChangeHandler}
    >
      {audioMuted ? <BsFillMicMuteFill /> : <BsFillMicFill />}
    </div>
  );
};
const VideoButton: React.FC = () => {
  const videoMuted = useAppSelector((state) => state.room.self.videoMuted);
  const shareScreen = useAppSelector((state) => state.room.self.shareScreen);
  const disabledClassnames = shareScreen
    ? " cursor-not-allowed"
    : " cursor-pointer hover:bg-blue-800 rounded-full";
  function videoMuteChangeHandler() {
    if (shareScreen) return;
    videoMuted ? unmuteVideo() : muteVideo();
  }
  return (
    <div
      className={"mx-[16px] p-[8px] text-white" + disabledClassnames}
      title={videoMuted ? "开启摄像头" : "关闭摄像头"}
      onClick={videoMuteChangeHandler}
    >
      {videoMuted ? <FaVideoSlash /> : <FaVideo />}
    </div>
  );
};
const LeaveRoomButton: React.FC = () => {
  const isRoomHost = useAppSelector((state) => state.room.self.isRoomHost);
  const navigate = useNavigate();
  return (
    <div
      className="mx-[16px] px-[24px] py-[8px] bg-red-500 hover:bg-red-400 rounded-full text-white text-sm cursor-pointer"
      onClick={() => navigate("/")}
    >
      {isRoomHost ? "结束会议" : "离开会议"}
    </div>
  );
};
const ScreenShareButton: React.FC = () => {
  const shareScreen = useAppSelector((state) => state.room.self.shareScreen);
  const shareScreenClassName = shareScreen ? " text-red-500" : "";
  function shareScreenHandler() {
    shareScreen ? stopShareScreen() : startShareScreen();
  }
  return (
    <div
      className={
        "cursor-pointer mx-[16px] p-[8px] text-white hover:bg-blue-800 rounded-full" +
        shareScreenClassName
      }
      title={shareScreen ? "结束屏幕共享" : "屏幕共享"}
      onClick={shareScreenHandler}
    >
      <AiOutlineLaptop />
    </div>
  );
};
