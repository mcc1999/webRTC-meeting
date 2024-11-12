import axios from "axios";

const serverApi = "http://localhost:5050/api";

export async function getRoomIdExistsReq(roomId: string) {
  const response = await axios.get(`${serverApi}/room-exists/${roomId}`);  
  return response.data;
}

export async function createRoomReq() {
  const response = await axios.get(`${serverApi}/create-room`);  
  return response.data;
}

export async function getMemberInfoReq(memberId: string, roomId: string) {
  const response = await axios.get(`${serverApi}/member-info/${memberId}?roomId=${roomId}`);  
  return response.data;
}