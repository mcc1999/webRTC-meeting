import React from "react";

const ParticipantsSection: React.FC = () => {
  return (
    <div className="w-1/5">
      <ParticipantsList />
    </div>
  );
};

export default ParticipantsSection;

const ParticipantsList: React.FC = () => {
  const dummyParticipants = [
    {
      identify: "John Doe",
    },
    {
      identify: "Jane Doe",
    },
    {
      identify: "Jimmy Doe",
    },
  ];
  return (
    <div className="">
      <div className="p-[16px] pb-0 pl-[24px] flex justify-start items-center text-sm text-gray-400">
        <span>参与人员</span>
        <span>(共{}人)</span>
      </div>
      <div className="p-[16px]">
        {dummyParticipants.map((item, index) => (
          <Participant
            key={index}
            identify={item.identify}
            lastItem={index === dummyParticipants.length - 1}
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
      <div className="p-[8px] text-sm">{identify}</div>
      {!lastItem && <div className="border-b-2" />}
    </div>
  );
};
