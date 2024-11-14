import React from "react";
import { useAppSelector } from "../../hooks/hooks";

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
  const self = useAppSelector((state) => state.room.self);

  return (
    <div className="">
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
          />
        ))}
      </div>
    </div>
  );
};
interface IParticipant {
  identify: string;
  lastItem: boolean;
}
const Participant: React.FC<IParticipant> = ({ identify, lastItem }) => {
  return (
    <div>
      <div className="p-[8px] text-sm truncate" title={identify}>
        {identify}
      </div>
      {!lastItem && <div className="border-b-2" />}
    </div>
  );
};
