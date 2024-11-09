import axios from "axios";

const serverApi = "http://localhost:5050/api";

export async function getRoomIdExists(roomId: string) {
  const response = await axios.get(`${serverApi}/room-exists/${roomId}`);  
  return response.data;
}
