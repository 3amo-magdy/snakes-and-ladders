import "./JoinRoom.css";
import boards from "../../boards";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";

const headers = {
  "x-access-token": sessionStorage.getItem("authenticated"),
};

const JoinRoom = () => {
  const navigate = useNavigate();

  const [games, setGames] = useState([]);
  const [gameId, setGameId] = useState(-1);
  const headers = {
    "x-access-token": sessionStorage.getItem("authenticated"),
  };
  useEffect(() => {
    axios
      .get(`/retrieveGames?status=pending`, { headers: headers })
      .then((res) => {
        console.log("RESPONSE RECEIVED: ", res);
        console.log(res.data == games);
        setGames(res.data);
      })
      .catch((err) => {
        console.log("AXIOS ERROR: ", err);
      });
  }, []);

  const onChangeRadio = (e) => {
    setGameId(e.target.id);
  };

  const handleClick = (e) => {
    axios
      .get(`/getGame?id=${gameId}`, { headers: headers })
      .then((res) => {
        console.log("RESPONSE RECEIVED: ", res);
        if (!res.data.game) {
          toast.error("Choose a Game");
        } else if (res.data.game.status !== "pending") {
          toast.error("Game Started");
        } else if (res.data.game.playersNumber === res.data.game.capacity) {
          toast.error("Game Full");
          setGames((prevGames) =>
            prevGames.filter((G) => G?.Id !== parseInt(gameId))
          );
        } else {
          axios
            .post(
              `/joinGame`,
              { gameId: parseInt(gameId) },
              { headers: headers }
            )
            .then((res) => {
              console.log("RESPONSE RECEIVED: ", res);
              navigate("/game");
            })
            .catch((err) => {
              console.log("AXIOS ERROR: ", err);
            });
        }
      })
      .catch((err) => {
        console.log("AXIOS ERROR: ", err);
      });
  };

  return (
    <>
      <div className="createRoom">
        <Link to="/" className="back">
          <span class="material-symbols-outlined">arrow_back</span>
        </Link>
        <ToastContainer />
        <h2 className="chooseRoom">Join a game</h2>
        <div className="mapsContainer">
          {games.length === 0 ? (
            <div className="noGames">
              OOPS!! No available rooms at the moment 🥺
            </div>
          ) : (
            games.length !== 0 &&
            games.map((G) => (
              <div className="map" key={G?.Id}>
                <input
                  className="input-hidden"
                  onChange={onChangeRadio}
                  type="radio"
                  id={`${G.Id}`}
                  name="board"
                />
                <label htmlFor={`${G.Id}`}>
                  <img src={boards[G?.boardId - 1]} alt="" />
                </label>
                <span>{`players joined ${G?.playersNumber}/${G?.capacity}`}</span>
              </div>
            ))
          )}
        </div>
        <button onClick={handleClick}>Join</button>
      </div>
    </>
  );
};

export default JoinRoom;
