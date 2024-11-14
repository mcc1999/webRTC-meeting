import { BrowserRouter, Route, Routes } from "react-router-dom";
import JoinRoomPage from "./pages/joinRoomPage";
import IntroductionPage from "./pages/introductionPage";
import RoomPage from "./pages/roomPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IntroductionPage />} />
        <Route path="/join-room" element={<JoinRoomPage />} />
        <Route path="/room" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
