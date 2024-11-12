export enum Topic {
  // 业务Topic
  CHAT_MESSAGE = "CHAT_MESSAGE",
  MEMBER_JOIN = "MEMBER_JOIN",
  MEMBER_LEAVE = "MEMBER_LEAVE",
  ROOM_DISBAND = "ROOM_DISBAND",

  // webRTC 信令 Send
  SEND_VIDEO_OFFER_ANSWER = "SEND_VIDEO_OFFER_ANSWER",
  SEND_ICE_CANDIDATE = "SEND_ICE_CANDIDATE",

  // webRTC 信令 Receive
  RECEIVE_VIDEO_OFFER_ANSWER = "RECEIVE_VIDEO_OFFER_ANSWER",
  RECEIVE_ICE_CANDIDATE = "RECEIVE_ICE_CANDIDATE",
}