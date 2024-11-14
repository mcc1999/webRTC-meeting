import { Socket } from "socket.io-client";
import { addNewMemberAction, setSelfAction } from "../store/roomSlice";
import { store } from "../store/store";
import { Topic } from "./socket";
import { getMemberInfoReq } from "../api";

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
    store.getState().wss.socket?.emit(Topic.AUDIO_STATUS_CHANGE, {
      mute: true,
      memberId: store.getState().room.self.memberId,
    });
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
  store.getState().wss.socket?.emit(Topic.AUDIO_STATUS_CHANGE, {
    mute: false,
    memberId: store.getState().room.self.memberId,
  });
}
export async function muteVideo() {
  const videoTrack = getValidTrack("video");
  if (videoTrack) {
    videoTrack.enabled = false;
    store.dispatch(setSelfAction({ videoMuted: true }));
    store.getState().wss.socket?.emit(Topic.VIDEO_STATUS_CHANGE, {
      mute: true,
      memberId: store.getState().room.self.memberId,
    });
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
  store.getState().wss.socket?.emit(Topic.VIDEO_STATUS_CHANGE, {
    mute: false,
    memberId: store.getState().room.self.memberId,
  });
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
export interface RTCEndpointInitOptions {
  memberId: string;
  target: string;
  roomId: string;
  socket: Socket;
  videoMuted: boolean;
  audioMuted: boolean;
  polite: boolean;
  createAt?: string;
}
export interface RTCEndpointOptions extends RTCEndpointInitOptions {
  videoConstraints: MediaTrackConstraints;
  audioConstraints: MediaTrackConstraints;
  targetIdentify: string;
}
export class RTCEndpoint {
  pc: RTCPeerConnection;
  options: RTCEndpointOptions;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;

  makingOffer: boolean;
  ignoreOffer: boolean;
  polite: boolean;

  constructor(options: RTCEndpointInitOptions) {
    this.pc = this.createPeerConnection();
    const defaultOptions = {
      videoConstraints: defaultAudioConstraints,
      audioConstraints: defaultAudioConstraints,
      videoMuted: false,
      audioMuted: false,
      targetIdentify: "",
    };
    this.options = {
      ...defaultOptions,
      ...options,
    };
    this.localStream = null;
    this.remoteStream = null;
    /**
     * Parameters for 完美信令协商
     */
    this.makingOffer = false;
    this.ignoreOffer = false;
    this.polite = this.options.polite;

    this.pc.onnegotiationneeded = this._negotiationNeeded.bind(this);
    this.pc.onicecandidate = this._iceCandidate.bind(this);
    this.pc.oniceconnectionstatechange =
      this._iceConnectionStateChange.bind(this);
    this.pc.onicegatheringstatechange =
      this._iceGatheringStateChange.bind(this);
    this.pc.onsignalingstatechange = this._signalingStateChange.bind(this);
    this.pc.ontrack = this._trackEvent.bind(this);
    this.pc.onconnectionstatechange = this._connectionStateChange.bind(this);

    // 信令服务器监听
    this.options.socket.on(
      Topic.RECEIVE_VIDEO_OFFER_ANSWER,
      this.handleVideoOfferMsg.bind(this)
    );
    this.options.socket.on(
      Topic.RECEIVE_ICE_CANDIDATE,
      this.handleIceCandidateMsg.bind(this)
    );
  }

  async initialize() {
    await this.createLocalStream();
    this.addLocalStream2RTCPeerConnection();
  }

  createPeerConnection() {
    return new RTCPeerConnection({
      iceServers: [
        // Information about ICE servers - Use your own!
        {
          urls: "stun:stun1.l.google.com:19302",
        },
      ],
    });
  }

  /**
   * 需要重启会话协商触发,创建一个新的SDP offer并发送给对端,要求它与本端联系
   * SDP offer:
   *    - supported configurations for the connection;
   *    - info about mediaStream we've add to the connection by addTrack();
   *    - ICE candidates gathered by the ICE layer already
   * setLocalDescription:
   *    configures the connection and media configuration states
   * setLocalDescription完成后,ICE代理会将可能的candidate通过RTCPeerConnection的onicecandidate事件回调中发送给对端
   */
  async _negotiationNeeded() {
    try {
      this.makingOffer = true;
      /**
       * 不带参数的setLocalDescription()会根据当前的signalingState自动创建并设置适当的description(sdp offer)。
       * description要么是an answer to the most recent offer from the remote peer
       * 要么是新创建的offer（如果没有正在进行协商）。
       * 基于上述原因注释了下面这行代码,不再手动创建offer
       */
      // const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(/** offer */);
      console.log(
        "==== [RTCEndpoint _negotiationNeeded]",
        this.options.memberId,
        "send an Offer to ",
        this.options.target,
        " ===="
      );

      this.options.socket.emit(Topic.SEND_VIDEO_OFFER_ANSWER, {
        name: this.options.memberId,
        target: this.options.target,
        roomId: this.options.roomId,
        type: "video-offer",
        sdp: this.pc.localDescription,
      });
    } catch (err) {
      console.error(err);
    } finally {
      this.makingOffer = false;
    }
  }
  /**
   * ICE层收集到Candidate时触发,将其发送给对端
   */
  _iceCandidate(e: RTCPeerConnectionIceEvent) {
    console.log(
      "==== [RTCEndpoint _iceCandidate]",
      this.options.memberId,
      "send an ice candidate to ",
      this.options.target,
      " ===="
    );
    this.options.socket.emit(Topic.SEND_ICE_CANDIDATE, {
      name: this.options.memberId,
      target: this.options.target,
      candidate: e.candidate,
    });
  }
  /**
   * 本地ICE层连接状态改变时触发,包括连接失败或丢失
   */
  _iceConnectionStateChange() {
    if (this.pc.iceConnectionState === "failed") {
      this.pc.restartIce();
    }
  }
  /**
   * 本地ICE层收集candidates的处理状态改变时触发,例如开始收集candidates或完成协商
   */
  _iceGatheringStateChange() {
    console.log(
      "==== [RTCEndpoint _iceGatheringStateChange]ICE gathering state changed ====",
      this.pc.iceGatheringState
    );
  }
  /**
   * 信令服务状态改变或连接更改时触发
   */
  _signalingStateChange() {
    console.log(
      "==== [RTCEndpoint _signalingStateChange] Signaling state changed ====",
      this.pc.signalingState
    );
  }
  /**
   * 将mediaStreamTrack被添加到RTCPeerConnection时触发
   */
  _trackEvent({ track, streams }: RTCTrackEvent) {
    console.log("Remote Track event:", track, streams);
    track.onunmute = () => {
      if (!this.remoteStream) {
        this.remoteStream = streams[0];
        const memberList = store.getState().room.memberList;
        const memberExists = !!memberList.find(
          (m) => m.memberId === this.options.target
        );
        if (memberExists) return;
        getMemberInfoReq(this.options.target, this.options.roomId).then(
          ({ memberInfo }) => {
            const { identify, memberId, isRoomHost } = memberInfo;
            const newMember = {
              identify,
              memberId,
              isRoomHost,
              audioMuted: !this.remoteStream?.getAudioTracks()[0]?.enabled,
              videoMuted: !this.remoteStream?.getVideoTracks()[0]?.enabled,
              mediaStream: this.remoteStream,
            };

            store.dispatch(addNewMemberAction(newMember));
          }
        );
      }
    };
  }

  _connectionStateChange() {
    console.log(
      "==== [RTCEndpoint _connectionStateChange] RTCPeerConnection connect state change:",
      this.pc.connectionState,
      " ===="
    );
  }

  /** 处理远端通过wss发来的 video-offer 事件 */
  async handleVideoOfferMsg(data: any) {
    const { name, sdp, target } = data;
    if (this.options.memberId !== target || this.options.target !== name) {
      return;
    }
    console.log(
      `==== [WS-MSG:RECEIVE_VIDEO_OFFER_ANSWER RTCEndpoint handleVideoOfferMsg] ${target} receive a Video ${
        sdp.type === "offer" ? "Offer" : "Answer"
      } from ${name} ====`
    );
    const offerCollision =
      sdp.type === "offer" &&
      (this.makingOffer || this.pc.signalingState !== "stable");
    this.ignoreOffer = !this.polite && offerCollision;

    console.log(
      "[WS-MSG:RECEIVE_VIDEO_OFFER_ANSWER RTCEndpoint handleVideoOfferMsg] 1. polite",
      this.polite,
      " 2. offerCollision-sdy type:",
      sdp.type,
      " makingOffer:",
      this.makingOffer,
      " pc.signaling:",
      this.pc.signalingState,
      " createAt",
      this.options.createAt
    );
    if (this.ignoreOffer) {
      console.log(
        "[WS-MSG:RECEIVE_VIDEO_OFFER_ANSWER RTCEndpoint handleVideoOfferMsg]: Result Ignore Offer.",
        !this.polite,
        offerCollision
      );
      return;
    }

    // if (
    //   this.pc.signalingState === "have-local-offer"
    // ) {
    // }
    console.log("debug", this.pc.signalingState);

    await this.pc.setRemoteDescription(sdp);
    if (sdp.type === "offer") {
      // 根据上一行setRemoteDescription存入的offer 自动创建 answer
      await this.pc.setLocalDescription();
      this.options.socket.emit(Topic.SEND_VIDEO_OFFER_ANSWER, {
        name: this.options.memberId,
        target: name,
        roomId: this.options.roomId,
        type: "video-answer",
        sdp: this.pc.localDescription,
      });
    }
  }
  /** 处理远端通过wss发来的 ice candidate 事件 */
  async handleIceCandidateMsg(data: any) {
    try {
      const { name, target } = data;
      if (this.options.memberId !== target || this.options.target !== name) {
        return;
      }
      console.log(
        `==== [WS-MSG: RECEIVE_ICE_CANDIDATE RTCEndpoint handleIceCandidateMsg] ${target} receive an ice candidate from ${name}  ====`
      );
      await this.pc.addIceCandidate(data.candidate);
    } catch (error) {
      if (!this.ignoreOffer) throw error;
    }
  }

  async createLocalStream() {
    const localStreamInRedux = store.getState().room.self.mediaStream;
    if (localStreamInRedux) {
      this.localStream = localStreamInRedux;
    } else {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: !this.options.videoMuted ? this.options.videoConstraints : false,
        audio: !this.options.audioMuted ? this.options.audioConstraints : false,
      });
      store.dispatch(setSelfAction({ mediaStream: this.localStream }));
    }
    console.log(
      "==== [RTCEndpoint createLocalStream] localStream",
      this.localStream
    );
  }

  addLocalStream2RTCPeerConnection() {
    if (!this.localStream) return;
    this.localStream.getTracks().forEach((track) => {
      this.pc.addTrack(track, this.localStream!);
    });
  }

  getValidTrack(kind: "video" | "audio"): MediaStreamTrack | undefined {
    if (!this.localStream) return;
    if (kind === "video") return this.localStream.getVideoTracks()[0];
    else if (kind === "audio") return this.localStream.getAudioTracks()[0];
    return;
  }
  async toggleAudioStatus(mute: boolean) {
    if (!this.localStream) return;
    const audioTrack = this.getValidTrack("audio");
    if (!mute) {
      // 打开声音,若没有audioTrack,则创建一个
      if (!audioTrack) {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: this.options.audioConstraints,
        });
        this.localStream.addTrack(audioStream.getAudioTracks()[0]);
      } else {
        audioTrack.enabled = !mute;
      }
    } else {
      if (!audioTrack) return;
      audioTrack.enabled = !mute;
    }
    this.options.socket.emit(Topic.AUDIO_STATUS_CHANGE, {
      memberId: this.options.memberId,
      mute,
    });
    store.dispatch(setSelfAction({ audioMuted: mute }));
  }
  async toggleVideoStatus(mute: boolean) {
    if (!this.localStream) return;
    const videoTrack = this.getValidTrack("video");
    if (!mute) {
      // 打开摄像头画面若没有videoTrack,则创建一个
      if (!videoTrack) {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: this.options.videoConstraints,
        });
        this.localStream.addTrack(videoStream.getVideoTracks()[0]);
      } else {
        videoTrack.enabled = !mute;
      }
    } else {
      if (!videoTrack) return;
      videoTrack.enabled = !mute;
    }
    this.options.socket.emit(Topic.VIDEO_STATUS_CHANGE, {
      memberId: this.options.memberId,
      mute,
    });
    store.dispatch(setSelfAction({ videoMuted: mute }));
  }

  destroy() {
    console.log(
      "==== destroy RTCEndpoint ",
      this.options.memberId,
      " to ",
      this.options.target,
      " ===="
    );

    if (this.pc) this.pc.close();
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((t) => t.stop());
    }
  }
}
