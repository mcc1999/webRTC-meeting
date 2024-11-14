import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { io, Socket } from "socket.io-client";
import { AppDispatch, RootState } from "./store";
import { castDraft } from "immer";

export interface WssState {
  wssUrl: string;
  socket: Socket | null;
  connected: boolean;
}

const initState: WssState = {
  wssUrl: "ws://localhost:5050",
  socket: null,
  connected: false,
};

const wssSlice = createSlice({
  name: "wss",
  initialState: initState,
  reducers: {
    setWssUrlAction: (state, action: PayloadAction<{ wssUrl: string }>) => {
      state.wssUrl = action.payload.wssUrl;
    },
    setConnectedAction: (
      state,
      action: PayloadAction<{ connected: boolean }>
    ) => {
      state.connected = action.payload.connected;
    },
    setSocketAction: (state, action: PayloadAction<Socket | null>) => {
      state.socket = castDraft(action.payload);
    },
    resetWssStateAction() {
      return initState;
    },
  },
});

export const {
  setWssUrlAction,
  setConnectedAction,
  setSocketAction,
  resetWssStateAction,
} = wssSlice.actions;

// 创建并连接 WebSocket
export const connectWebSocket =
  () => (dispatch: AppDispatch, getState: () => RootState) => {
    // 检查是否已有 WebSocket 连接
    const { socket, wssUrl } = getState().wss;
    if (socket) return;

    // 创建 WebSocket 实例
    const newSocket = io(wssUrl, {
      transports: ["polling", "websocket"],
      upgrade: true,
    });

    // 监听 WebSocket 连接成功事件
    newSocket.on("connect", () => {
      console.log("WebSocket 已连接");
      dispatch(setConnectedAction({ connected: true }));
    });

    // 监听消息事件
    newSocket.on("message", (message) => {
      console.log("收到服务器消息:", message);
    });

    // 监听 WebSocket 断开事件
    newSocket.on("disconnect", () => {
      console.log("WebSocket 已断开");
      dispatch(setConnectedAction({ connected: false }));
    });

    // 保存 WebSocket 实例到 Redux Store
    dispatch(setSocketAction(newSocket));
  };

// 断开 WebSocket 连接
export const disconnectWebSocket =
  () => (dispatch: AppDispatch, getState: () => RootState) => {
    const { socket } = getState().wss;
    if (socket) {
      socket.disconnect();
      dispatch(setSocketAction(null));
      dispatch(setConnectedAction({ connected: false }));
    }
  };

export default wssSlice.reducer;
