import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  HashRouter,
  Route,
  Routes,
} from "react-router-dom";
import Login from "./pages/loginPage/Login";
import Register from "./pages/registerPage/Register";
import Home from "./pages/homePage/Home";
import axios from "axios";
import Game from "./pages/game-page";
import Mock from "./pages/mockPage/Mock";
import CreateRoom from "./pages/roomCreation/CreateRoom";
import JoinRoom from "./pages/joinRoom/JoinRoom";
import { useEffect, useState } from "react";

const App = () => {
  const [isGaming, setIsGaming] = useState(false);

  axios.defaults.baseURL = "https://snakes-ladders.up.railway.app/";
  const ProtectedRoute = ({ children }) => {
    if (!sessionStorage.getItem("authenticated")) {
      console.log(sessionStorage.getItem("authenticated"));
      return <Navigate to="/login" />;
    } else return children;
  };
  const OngoingGame = ({ children }) => {
    if (isGaming) return <Navigate to="/game" />;
    return children;
  };
  useEffect(() => {
    const headers = {
      "x-access-token": sessionStorage.getItem("authenticated"),
    };
    axios
      .get(`/currentGame`, { headers: headers })
      .then((res) => {
        console.log("RESPONSE RECEIVED: ", res);
        setIsGaming(true);
      })
      .catch((err) => {
        console.log("AXIOS ERROR: ", err);
        setIsGaming(false);
      });
  }, []);
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <OngoingGame>
                <Home />
              </OngoingGame>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/game"
          element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          }
        />
        <Route path="/mock" element={<Mock />} />
        <Route
          path="/createRoom"
          element={
            <ProtectedRoute>
              <OngoingGame>
                <CreateRoom />
              </OngoingGame>
            </ProtectedRoute>
          }
        />
        <Route
          path="/joinRoom"
          element={
            <ProtectedRoute>
              <OngoingGame>
                <JoinRoom />
              </OngoingGame>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
