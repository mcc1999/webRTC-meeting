import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import roomReducer from "./roomSlice";
import wssReducer from "./wssSlice";

export const store = configureStore({
  reducer: {
    room: roomReducer,
    wss: wssReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
