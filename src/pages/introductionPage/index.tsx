import React, { useEffect } from "react";
import { AiFillPhone } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks/hooks";
import { resetRoomStateAction } from "../../store/roomSlice";
import { resetWssStateAction } from "../../store/wssSlice";

const IntroductionPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  function pushToJoinRoomPage(isHost = false) {
    navigate(`/join-room${isHost ? "?host=true" : ""}`);
  }

  useEffect(() => {
    dispatch(resetRoomStateAction());
    dispatch(resetWssStateAction());
  }, []);

  return (
    <div className="flex justify-center items-center h-screen w-full">
      <div className="w-[520px] h-[400px] border-2 flex flex-col justify-center items-center  ">
        <div className="flex items-center">
          <AiFillPhone className="text-blue-500 text-4xl mx-[8px] border-2 rounded-full border-blue-500" />
          <p className="text-xl font-bold ">WebRTC Meeting音视频会议</p>
        </div>
        <div>
          <ConnectionButton
            buttonText="加入会议"
            onClickHandler={() => pushToJoinRoomPage()}
          />
          <ConnectionButton
            isHost
            buttonText="主持会议"
            onClickHandler={() => pushToJoinRoomPage(true)}
          />
        </div>
      </div>
    </div>
  );
};

export default IntroductionPage;

interface IConnectionButton {
  isHost?: boolean;
  buttonText: string;
  onClickHandler: () => void;
}
const ConnectionButton: React.FC<IConnectionButton> = ({
  isHost = false,
  buttonText,
  onClickHandler,
}) => {
  const btnClass = isHost
    ? " bg-blue-500 text-white hover:bg-blue-400 hover:text-black"
    : " border hover:border-blue-500 hover:text-blue-500";
  return (
    <button
      className={
        "block px-[64px] py-[2px] my-[16px] rounded-lg text-sm" + btnClass
      }
      onClick={onClickHandler}
    >
      {buttonText}
    </button>
  );
};
