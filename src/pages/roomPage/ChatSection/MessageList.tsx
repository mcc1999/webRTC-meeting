import React, { useEffect, useRef } from "react";
import { VariableSizeList } from "react-window";
import { useAppSelector } from "../../../hooks/hooks";
import { Message } from "../../../store/roomSlice";

const MessageList: React.FC<{chatMessageList: Message[], height: string}> = ({chatMessageList, height}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<VariableSizeList>(null);
  const rowHeights = useRef<Record<number, number>>({});

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollToItem(chatMessageList.length - 1);
  }, [listRef, chatMessageList]);

  function getItemSize(index: number) {
    return rowHeights.current[index] || 64;
  }

  const setRowHeight = (index: number, size: number) => {
    listRef.current?.resetAfterIndex(0);
    rowHeights.current = {
      ...rowHeights.current,
      [index]: size,
    };
  };

  const Row = ({ index, style }: any) => {
    const { rowRef } = useRowHeightChanged({ index, setRowHeight });
    delete style.height;
    return (
      <div style={style} ref={rowRef}>
        <MessageItem messageItem={chatMessageList[index]} />
      </div>
    );
  };
  return (
    <div ref={containerRef} className="border" style={{height}}>
      {containerRef.current && (
        <VariableSizeList
          ref={listRef}
          width={containerRef.current.clientWidth}
          height={containerRef.current.clientHeight}
          itemCount={chatMessageList.length}
          itemSize={(index) => getItemSize(index)}
        >
          {Row}
        </VariableSizeList>
      )}
    </div>
  );
};

export default MessageList;

interface MessageItemProps {
  messageItem: Message;
}
const MessageItem: React.FC<MessageItemProps> = ({ messageItem }) => {
  const identify = useAppSelector((state) => state.room.self.identify);
  const selfStyle =
    identify === messageItem.identify
      ? " justify-end bg-gradient-to-r from-blue-600 to-cyan-500"
      : " justify-start bg-gray-300";
  return (
    <div
      className={
        "m-[8px] p-[8px] rounded-xl text-sm break-all flex items-center" +
        selfStyle
      }
    >
      {identify !== messageItem.identify && (
        <div
          className="text-xs text-white w-[64px] truncate border-r mr-[8px] pr-[8px] shrink-0"
          title={identify}
        >
          {messageItem.identify}
        </div>
      )}
      <div>{messageItem.message}</div>
      {identify === messageItem.identify && (
        <div
          className="text-xs text-white w-[64px] truncate border-l ml-[4px] pl-[8px] shrink-0"
          title={identify}
        >
          {messageItem.identify}
        </div>
      )}
    </div>
  );
};
const useRowHeightChanged = ({ index, setRowHeight }: any) => {
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (rowRef.current) {
      setRowHeight(index, rowRef.current.clientHeight);
    }
  }, [rowRef]);

  return {
    rowRef,
  };
};
