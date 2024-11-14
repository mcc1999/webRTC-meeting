import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { setPrivateChatMemberIdAction } from "../../store/roomSlice";
import MessageList from "./ChatSection/MessageList";
import MessageSender from "./ChatSection/MessageSender";

const ParticipantsSection: React.FC = () => {
  return (
    <div className="w-1/5">
      <ParticipantsList />
    </div>
  );
};

export default ParticipantsSection;

const ParticipantsList: React.FC = () => {
  const memberList = useAppSelector((state) => state.room.memberList);
  const privateChatMemberId = useAppSelector(
    (state) => state.room.privateChatMemberId
  );
  const self = useAppSelector((state) => state.room.self);
  const dispatch = useAppDispatch();  

  useEffect(() => {
    if (!memberList.find((m) => m.memberId === privateChatMemberId)) {
      dispatch(setPrivateChatMemberIdAction(""));
    }
  }, [memberList, privateChatMemberId]);

  return (
    <div>
      <div className="h-[calc(100vh-400px)]">
        <div className="p-[16px] pb-0 pl-[24px] flex justify-start items-center text-sm text-gray-400">
          <span>参与人员</span>
          <span>(共{memberList.length + 1}人)</span>
        </div>
        <div className="p-[16px]">
          {[self, ...memberList].map((item, index) => (
            <Participant
              key={index}
              identify={item.identify}
              lastItem={index === memberList.length}
              disabled={item.identify === self.identify}
              clickHandler={() => {
                if (item.identify !== self.identify)
                  dispatch(setPrivateChatMemberIdAction(item.memberId));
              }}
            />
          ))}
        </div>
      </div>
      <div className="h-[400px]">
        <div>
          <div className="text-white text-sm pl-[24px] py-[8px] flex justify-center items-center bg-gradient-to-b from-blue-700 to-cyan-600">
            <span>私聊</span>
            <span
              title={
                memberList.find((m) => m.memberId === privateChatMemberId)
                  ?.identify
              }
              className="text-gray-300 text-xs inline-block max-w-[135px] h-4 pl-[4px] truncate"
            >
              {privateChatMemberId
                ? "- " +
                  memberList.find((m) => m.memberId === privateChatMemberId)
                    ?.identify
                : "(点击上方成员进行私聊)"}
            </span>
          </div>
          <MessageList
            height="300px"
            chatMessageList={
              memberList.find((m) => m.memberId === privateChatMemberId)
                ?.privateMessageList || []
            }
          />
        </div>
        <MessageSender
          type="privateChat"
          privateChatTargetMemberId={privateChatMemberId}
          disabled={!privateChatMemberId}
        />
      </div>
    </div>
  );
};
interface IParticipant {
  identify: string;
  lastItem: boolean;
  disabled?: boolean;
  clickHandler: () => void;
}
const Participant: React.FC<IParticipant> = ({
  identify,
  lastItem,
  disabled,
  clickHandler,
}) => {
  return (
    <div
      className={disabled ? "cursor-not-allowed" : "cursor-pointer"}
      onClick={clickHandler}
    >
      <div className="p-[8px] text-sm truncate" title={identify}>
        {identify}
      </div>
      {!lastItem && <div className="border-b-2" />}
    </div>
  );
};
