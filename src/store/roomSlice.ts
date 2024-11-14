import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createLocalStreamAsyncAction } from "./thunks";
import { RTCEndpoint } from "../utils/webRTC";
import { castDraft } from "immer";

export interface Member {
  identify: string;
  memberId: string;
  isRoomHost: boolean;
  videoMuted: boolean;
  audioMuted: boolean;
  shareScreen?: boolean;
  mediaStream: MediaStream | null;
}
export interface Message {
  // sender
  identify: string;
  message: string;
  timestamp: number;
}
export interface RoomState {
  self: Member;
  roomId: string;
  rtcEndpoints: Record<string, RTCEndpoint>;
  memberList: Member[];
  chatMessageList: Message[];
}

const initState: RoomState = {
  self: {
    identify: "",
    memberId: "",
    isRoomHost: false,
    videoMuted: false,
    audioMuted: false,
    shareScreen: false,
    mediaStream: null,
  },
  roomId: "",
  rtcEndpoints: {},
  memberList: [],
  chatMessageList: [],
};

const roomSlice = createSlice({
  name: "room",
  initialState: initState,
  reducers: {
    setRoomIdAction: (state, action: PayloadAction<{ roomId: string }>) => {
      state.roomId = action.payload.roomId;
    },
    setSelfAction(state, action: PayloadAction<Partial<Member>>) {
      state.self = { ...state.self, ...action.payload };
    },
    addNewMemberAction(state, action: PayloadAction<Member>) {
      state.memberList.push(action.payload);
    },
    removeMemberAction(state, action: PayloadAction<{ memberId: string }>) {
      state.memberList = state.memberList.filter(
        (m) => m.memberId !== action.payload.memberId
      );
      const rtcEndpoint = state.rtcEndpoints[action.payload.memberId];
      if (rtcEndpoint) rtcEndpoint.destroy();
      delete state.rtcEndpoints[action.payload.memberId];
    },
    setRTCEndpointAction(
      state,
      action: PayloadAction<{ memberId: string; rtcEndpoint: RTCEndpoint }>
    ) {
      state.rtcEndpoints[action.payload.memberId] = castDraft(
        action.payload.rtcEndpoint
      );
    },
    leaveRoomRTCCleanAction(state) {
      Object.values(state.rtcEndpoints).forEach((rtcEndpoint) => {
        rtcEndpoint.destroy();
      });
      if (state.self.mediaStream) {
        state.self.mediaStream.getTracks().forEach((t) => t.stop());
      }
      if (state.memberList.length) {
        state.memberList.forEach((member) => {
          if (member.mediaStream) {
            member.mediaStream.getTracks().forEach((t) => t.stop());
          }
        });
      }
    },
    addChatMessage(state, action: PayloadAction<Message>) {
      state.chatMessageList.push(action.payload);
    },
    resetRoomStateAction() {
      return initState;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(createLocalStreamAsyncAction.fulfilled, (state, action) => {
      state.self.mediaStream = action.payload;
    });
  },
});

export const {
  setRoomIdAction,
  setSelfAction,
  resetRoomStateAction,
  addNewMemberAction,
  setRTCEndpointAction,
  removeMemberAction,
  leaveRoomRTCCleanAction,
  addChatMessage,
} = roomSlice.actions;
export default roomSlice.reducer;
