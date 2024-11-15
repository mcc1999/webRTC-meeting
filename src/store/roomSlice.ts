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
  privateMessageList?: Message[];
}
export interface Message {
  // sender
  identify: string;
  message: string;
  memberId: string;
  timestamp?: number;
}
export interface RoomState {
  self: Member;
  roomId: string;
  rtcEndpoints: Record<string, RTCEndpoint>;
  memberList: Member[];
  privateChatMemberId: string;
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
  privateChatMemberId: '',
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
    addPrivateChatMessage(
      state,
      action: PayloadAction<{ message: Message; memberId: string }>
    ) {
      state.memberList = state.memberList.map((m) => {
        if (m.memberId === action.payload.memberId) {
          state.privateChatMemberId = action.payload.memberId;
          if (m.privateMessageList) {
            m.privateMessageList.push(action.payload.message);
          } else {
            m.privateMessageList = [action.payload.message];
          }
        }
        return m;
      });
    },
    setPrivateChatMemberIdAction(state, action: PayloadAction<string>) {
      state.privateChatMemberId = action.payload;
    },
    toggleMemberAudioVideoStatusAction(
      state,
      action: PayloadAction<{
        kind: "video" | "audio";
        memberId: string;
        mute: boolean;
      }>
    ) {
      state.memberList = state.memberList.map((m) => {
        if (m.memberId === action.payload.memberId) {
          if (action.payload.kind === "video") {
            m.videoMuted = action.payload.mute;
          } else {
            m.audioMuted = action.payload.mute;
          }
        }
        return m;
      });
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
  addPrivateChatMessage,
  toggleMemberAudioVideoStatusAction,
  setPrivateChatMemberIdAction,
} = roomSlice.actions;
export default roomSlice.reducer;
