import { createAsyncThunk } from "@reduxjs/toolkit";
import { createLocalStream } from "../utils/webRTC";

enum AsyncActions {
  CREATE_LOCALSTREAM = "CREATE_LOCALSTREAM",
  CREATE_LOCALSTREAM_SUCCESS = "CREATE_LOCALSTREAM_SUCCESS",
  CREATE_LOCALSTREAM_FAILURE = "CREATE_LOCALSTREAM_FAILURE",
}

export const createLocalStreamAsyncAction = createAsyncThunk(
  AsyncActions.CREATE_LOCALSTREAM,
  async (constraints: MediaStreamConstraints) => {
    const mediaStream = await createLocalStream(constraints);
    return mediaStream;
  }
);


export default AsyncActions;
