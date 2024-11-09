import { setSelfAction } from "../store/roomSlice";
import { store } from "../store/store";

export const defaultVideoConstraints: MediaTrackConstraints = {
  aspectRatio: 16 / 9,
  width: 1280,
  height: 720,
};
export const defaultAudioConstraints: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

export async function createLocalStream(constraints: MediaStreamConstraints) {
  return await navigator.mediaDevices.getUserMedia(constraints);
}

export async function muteAudio() {
  const audioTrack = getValidTrack("audio");
  if (audioTrack) {
    audioTrack.enabled = false;
    store.dispatch(setSelfAction({ audioMuted: true }));
  }
}
export async function unmuteAudio() {
  const localStream = store.getState().room.self.mediaStream;
  if (!localStream) return;
  const audioTrack = getValidTrack("audio", localStream);
  if (audioTrack) {
    audioTrack.enabled = true;
  } else {
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: defaultAudioConstraints,
      video: false,
    });
    const newAudioTrack = newStream.getAudioTracks()[0];
    localStream.addTrack(newAudioTrack);
  }
  store.dispatch(setSelfAction({ audioMuted: false }));
}
export async function muteVideo() {
  const videoTrack = getValidTrack("video");
  if (videoTrack) {
    videoTrack.enabled = false;
    store.dispatch(setSelfAction({ videoMuted: true }));
  }
}
export async function unmuteVideo() {
  const localStream = store.getState().room.self.mediaStream;
  if (!localStream) return;
  const videoTrack = getValidTrack("video", localStream);
  if (videoTrack) {
    videoTrack.enabled = true;
  } else {
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: defaultVideoConstraints,
    });
    const newVideoTrack = newStream.getVideoTracks()[0];
    localStream.addTrack(newVideoTrack);
  }
  store.dispatch(setSelfAction({ videoMuted: false }));
}
export async function startShareScreen() {
  const localStream = store.getState().room.self.mediaStream;
  if (!localStream) return;
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: defaultVideoConstraints,
      audio: true,
    });
    screenStream.addEventListener("inactive", () => {
      stopShareScreen();
    });
    const originVideoTrack = getValidTrack("video", localStream);
    const originAudioTrack = getValidTrack("audio", localStream);
    if (originVideoTrack) {
      originVideoTrack.stop();
      localStream.removeTrack(originVideoTrack);
    }
    if (originAudioTrack) {
      originAudioTrack.stop();
      localStream.removeTrack(originAudioTrack);
    }
    localStream.addTrack(screenStream.getVideoTracks()[0]);
    localStream.addTrack(screenStream.getAudioTracks()[0]);
    store.dispatch(setSelfAction({ shareScreen: true }));
  } catch (error) {
    console.log("屏幕共享失败：", error);
  }
}
export async function stopShareScreen() {
  const {
    mediaStream: localStream,
    audioMuted,
    videoMuted,
  } = store.getState().room.self;
  if (!localStream) return;
  const originVideoTrack = getValidTrack("video", localStream);
  const originAudioTrack = getValidTrack("audio", localStream);
  if (originVideoTrack) {
    originVideoTrack.stop();
    localStream.removeTrack(originVideoTrack);
  }
  if (originAudioTrack) {
    originAudioTrack.stop();
    localStream.removeTrack(originAudioTrack);
  }
  const newMediaStream = await navigator.mediaDevices.getUserMedia({
    audio: !audioMuted ? defaultAudioConstraints : false,
    video: !videoMuted ? defaultVideoConstraints : false,
  });
  if (!videoMuted) localStream.addTrack(newMediaStream.getVideoTracks()[0]);
  if (!audioMuted) localStream.addTrack(newMediaStream.getAudioTracks()[0]);
  store.dispatch(setSelfAction({ shareScreen: false }));
}

function getValidTrack(
  kind: "video" | "audio",
  mediaStream?: MediaStream | null
): MediaStreamTrack | undefined {
  const localStream = mediaStream || store.getState().room.self.mediaStream;
  if (!localStream) return;
  if (kind === "video") return localStream.getVideoTracks()[0];
  else if (kind === "audio") return localStream.getAudioTracks()[0];
  return;
}
