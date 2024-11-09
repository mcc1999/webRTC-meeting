import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createLocalStreamAsyncAction } from "./thunks";

export interface Member {
  identify: string;
  memberId: string;
  isRoomHost: boolean;
  videoMuted: boolean;
  audioMuted: boolean;
  shareScreen: boolean;
  mediaStream: MediaStream | null;
}
export interface InitState {
  self: Member;
  roomId: string;
  memberList: Member[];
}

const initState: InitState = {
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
  memberList: [],
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
  },
  extraReducers: (builder) => {
    builder.addCase(createLocalStreamAsyncAction.fulfilled, (state, action) => {
      state.self.mediaStream = action.payload;
    });
  },
});

export const { setRoomIdAction, setSelfAction } = roomSlice.actions;
export default roomSlice.reducer;
