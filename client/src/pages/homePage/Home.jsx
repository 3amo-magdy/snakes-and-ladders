import { Link, useNavigate, useEffect } from "react-router-dom";
import "./Home.css";
import axios from "axios";

const Home = () => {
  const navigate = useNavigate();

  const logout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  useEffect(() => {
    const headers = {
      "x-access-token": sessionStorage.getItem("authenticated"),
    };
    axios.get(`/currentGame`, { headers: headers }).then((res) => {
      console.log("RESPONSE RECEIVED: ", res);
      // navigate("/game")
      window.reload()

    })
    .catch((err) => {
      console.log("AXIOS ERROR: ", err);
    });
  }, []);
  return (
    <>
      <div className="homeContainer">
        <button onClick={logout} className="logout">
          <span class="material-symbols-outlined">logout</span>
        </button>

        <h1 className="welcome">
          Welcome {sessionStorage.getItem("username")}
        </h1>
        <div className="buttonContainer">
          <Link to="./createRoom" class="button button--hoo">
            <div class="button__wrapper">
              <span class="button__text">Create room</span>
            </div>
            <div class="characterBox">
              <div class="character wakeup">
                <div class="character__face"></div>
                <div class="charactor__face2"></div>
                <div class="charactor__body"></div>
              </div>
              <div class="character wakeup">
                <div class="character__face"></div>
                <div class="charactor__face2"></div>
                <div class="charactor__body"></div>
              </div>
              <div class="character wakeup">
                <div class="character__face"></div>
                <div class="charactor__face2"></div>
                <div class="charactor__body"></div>
              </div>
            </div>
          </Link>

          <Link to="/joinRoom" class="button button--pen">
            <div class="button__wrapper">
              <span class="button__text">Join room</span>
            </div>
            <div class="characterBox">
              <div class="character wakeup">
                <div class="character__face"></div>
                <div class="charactor__face2"></div>
              </div>
              <div class="character wakeup">
                <div class="character__face"></div>
                <div class="charactor__face2"></div>
              </div>
              <div class="character wakeup">
                <div class="character__face"></div>
                <div class="charactor__face2"></div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Home;
