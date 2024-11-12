import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks/hooks";
import { setSelfAction, setRoomIdAction } from "../../store/roomSlice";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { getRoomIdExistsReq, createRoomReq } from "../../api";
import Checkbox from "../../components/Checkbox";

const JoinRoomPage: React.FC = () => {
  const { search } = useLocation();
  const dispatch = useAppDispatch();
  const isHost = new URLSearchParams(search).get("host") === "true";
  const [roomId, setRoomId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [onlyAudio, setOnlyAudio] = useState<boolean>(false);
  const [errMessage, setErrMessage] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isHost) {
      dispatch(setSelfAction({ isRoomHost: isHost }));
    }
  }, []);

  function validParams() {
    if (!isHost) {
      if (!roomId) {
        setErrMessage("请输入会议ID！");
        throw new Error("请输入会议ID！");
      }
    }

    if (!name) {
      setErrMessage("请输入您的姓名！");
      throw new Error("请输入您的姓名！");
    }
  }
  async function joinRoom() {
    const { roomExists, full, memberId } = await getRoomIdExistsReq(roomId);

    if (!roomExists) {
      setErrMessage("会议房间不存在，请验证会议ID有效性！");
    } else {
      if (full) {
        setErrMessage("会议房间人数已满，请稍后再试！");
      } else {
        dispatch(setRoomIdAction({ roomId }));
        dispatch(setSelfAction({ memberId }));
        navigate(`/room`);
      }
    }
  }
  async function createRoom() {
    const { roomId, memberId } = await createRoomReq();
    dispatch(setRoomIdAction({ roomId }));
    dispatch(setSelfAction({ memberId }));
    navigate(`/room`);
  }

  async function handleJoinRoom(): Promise<void> {
    validParams();
    dispatch(setSelfAction({ identify: name }));
    dispatch(setSelfAction({ videoMuted: onlyAudio }));
    if (isHost) {
      await createRoom();
    } else {
      await joinRoom();
    }
  }

  return (
    <div className="flex justify-center items-center h-screen w-full">
      <div className="w-[520px] h-[400px] border-2 flex flex-col justify-center items-center  p-[32px]">
        <p className="text-2xl font-semibold self-start pb-[32px]">
          {isHost ? "主持会议" : "加入会议"}
        </p>
        <form className="w-full">
          <JoinRoomInputs
            roomId={roomId}
            name={name}
            isRoomHost={isHost}
            setRoomId={setRoomId}
            setName={setName}
          />
          <OnlyAudioCheckbox
            videoMuted={onlyAudio}
            setOnlyAudio={setOnlyAudio}
          />
        </form>
        <ErrorMessage errMessage={errMessage} />
        <JoinRoomButtons isRoomHost={isHost} joinRoomHandler={handleJoinRoom} />
      </div>
    </div>
  );
};

export default JoinRoomPage;

interface IJoinRoomInput {
  roomId: string;
  name: string;
  isRoomHost: boolean;
  setRoomId: (roomId: string) => void;
  setName: (name: string) => void;
}
const JoinRoomInputs: React.FC<IJoinRoomInput> = ({
  roomId,
  name,
  isRoomHost,
  setRoomId,
  setName,
}) => {
  return (
    <>
      {!isRoomHost && (
        <Input
          name="roomId"
          value={roomId}
          placeholder="请输入会议ID号"
          changeHandler={setRoomId}
        />
      )}
      <Input
        name="name"
        value={name}
        placeholder="请输入您的姓名"
        changeHandler={setName}
      />
    </>
  );
};

interface IInput {
  name: string;
  placeholder: string;
  value: string;
  changeHandler: (value: string) => void;
}
const Input: React.FC<IInput> = ({ name, placeholder, changeHandler }) => {
  return (
    <input
      className="block w-full border rounded px-[8px] py-[4px] mb-[16px]"
      type="text"
      name={name}
      placeholder={placeholder}
      onChange={(e) => changeHandler(e.target.value)}
    />
  );
};

interface IOnlyAudioCheckbox {
  videoMuted: boolean;
  setOnlyAudio: (videoMuted: boolean) => void;
}
const OnlyAudioCheckbox: React.FC<IOnlyAudioCheckbox> = ({
  videoMuted,
  setOnlyAudio,
}) => {
  return (
    <Checkbox
      id="videoMuted"
      name="videoMuted"
      checked={videoMuted}
      label="只开启音频"
      onChange={(checked) => setOnlyAudio(checked)}
    />
  );
};

const ErrorMessage: React.FC<{ errMessage: string }> = ({ errMessage }) => {
  return (
    <div className="h-[36px] text-red-600 text-sm self-start my-[8px]">
      {errMessage}
    </div>
  );
};

interface IJoinRoomButtons {
  isRoomHost: boolean;
  joinRoomHandler: () => Promise<void>;
}
const JoinRoomButtons: React.FC<IJoinRoomButtons> = ({
  isRoomHost,
  joinRoomHandler,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  async function handleJoinRoom() {
    try {
      setLoading(true);
      await joinRoomHandler();
    } catch (err) {
      console.log("加入会议失败：", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="self-end  flex items-center">
      <Button
        buttonText={
          loading ? (
            <AiOutlineLoading3Quarters className="w-[32px] h-[24px] text-sm animate-spin text-white" />
          ) : isRoomHost ? (
            "开启"
          ) : (
            "加入"
          )
        }
        onClickHandler={handleJoinRoom}
      />
      <Button buttonText="取消" cancel onClickHandler={() => navigate("/")} />
    </div>
  );
};

const Button: React.FC<{
  buttonText: React.ReactNode;
  cancel?: boolean;
  onClickHandler: () => void;
}> = ({ buttonText, cancel = false, onClickHandler }) => {
  const btnClass = cancel
    ? " border hover:text-blue-500"
    : " bg-blue-500 hover:bg-blue-400 text-white hover:text-black";
  return (
    <button
      className={"px-[16px] py-[4px] rounded mr-[16px]" + btnClass}
      onClick={onClickHandler}
    >
      {buttonText}
    </button>
  );
};
