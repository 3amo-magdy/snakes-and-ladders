import React, { useEffect, useRef, useState, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import styles from "./styles.module.css";
import "./style.css";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import * as io from "../../socket/socket";

import axios from "axios";

import boards from "../../boards";
function Game() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [progress, setProgress] = React.useState(0);
  const gameId = useRef(null);
  const [t, setT] = useState(false);
  let [turnUpdate, setturnUpdate] = useState(null);
  const [msg, setMsg] = useState("The game is Loading");
  let diceRef = useRef(null);
  let rollRef = useRef(null);
  let [lastPlayTime, setLastPlayTime] = useState(Date.now());
  let [timer, setTimer] = useState(Date.now());
  let [game, setGame] = useState(null);
  let [gameUpdate, setGameUpdate] = useState(null);

  useEffect(() => {
    const headers = {
      "x-access-token": sessionStorage.getItem("authenticated"),
    };
    axios
      .get(`/currentGame`, { headers: headers })
      .then((res) => {
        console.log("RESPONSE RECEIVED: ", res);
        gameId.current = res.data.Id;
        console.log("Id: " + gameId.current);
        io.subscribeToRoom(gameId.current, handleTurnUpdate, handleRoomUpdate);
      })
      .catch((err) => {
        console.log("AXIOS ERROR: ", err);
        navigate("/");
      });

      // return ()=>{
      //   if (io.socket.connected){
      //     io.socket.disconnect();
      //   }
      // }
  }, []);

  useEffect(() => {
    if (
      game &&
      game.game_status.toLowerCase() === "active" &&
      (timer - lastPlayTime) / 1000.0 <= 10
    ) {
      setProgress((timer - lastPlayTime) / 1000.0);
    }
  }, [timer]);

  useEffect(() => {
    if (game && turnUpdate && turnUpdate.move) {
      let x = cloneDeep(game);
      x.game_status = turnUpdate?.game_status;
      x.pending_player_index = x.players.findIndex(
        (a) => a.id === turnUpdate.pending_player_index
      );
      x.lastPlayTime = turnUpdate.pending_player_index;
      setMsg(`It's ${x.players[turnUpdate.pending_player_index].name}'s turn`);
      if (x.players[turnUpdate.move.player_index].position) {
        x.players[turnUpdate.move.player_index].position = turnUpdate.move.to;
      }
      setGame(x);
      if (!t) {
        setInterval(() => {
          setTimer((p) => p + 1000);
        }, 1000);
        setT(true);
      }
    }
  }, [turnUpdate]);

  const handleTurnUpdate = (gameTurnObject) => {
    if (typeof gameTurnObject === "string") {
      setMsg(gameTurnObject);
      return;
    }
    if (gameTurnObject.move) {
      rollDice(gameTurnObject.move.dice_outcome);
      setTimeout(() => {
        setturnUpdate(gameTurnObject);
      }, 1000);
    }
    console.log(gameTurnObject);
    const { lastPlayTime } = gameTurnObject;
    setLastPlayTime(lastPlayTime);
    setTimer(lastPlayTime);
  };

  const handleRoomUpdate = (gameObject) => {
    console.log(gameObject)
    console.log(gameObject == game)

    if (typeof gameObject === "string") {
      setMsg(gameObject);
    } else {
      if (
        gameObject.game_status.toLowerCase() === "pending" &&
        gameObject.players
      ) {
        setMsg(
          `Waiting for more players [${gameObject.players.length}/${gameObject.game_capacity}] ...`
        );
      } else if (
        gameObject.game_status.toLowerCase() === "finished" &&
        gameObject.players
      ) {
        const W = gameObject.players.findIndex(
          (a) => Number(a.position) === 100
        );
        setMsg(`${W.name} HAS WON !`);
      } else{
        setMsg(
          `It's ${
            gameObject.players[gameObject.pending_player_index]?.name
          }'s turn`
        );
      }
      setGameUpdate(gameObject);
      return gameObject;
    }
  };

  useEffect(()=>{
    if(gameUpdate){
      setGame(gameUpdate);
    }
  },[gameUpdate])

  function rollDice(elComeOut) {
    var elDiceOne = diceRef?.current;
    if (elDiceOne) {
      for (let i = 1; i <= 6; i++) {
        elDiceOne.classList.remove("show-" + i);
        console.log(elComeOut, i);
        if (elComeOut == i) {
          elDiceOne.classList.add("show-" + i);
          console.log(elDiceOne.classList);
        }
      }
    }
  }
  const pos = (pos_1) => {
    const pos_0 = pos_1 - 1;
    const y = 9 - Math.floor(pos_0 / 10);
    let x = pos_0 % 10;
    if (y % 2 == 0) {
      x = 9 - x;
    }
    return { x, y };
  };
  useEffect(() => {
    //
    if (diceRef.current && rollRef.current && canvasRef.current) {
      drawCanvas(game);
      var elComeOut = rollRef.current;
      console.log(elComeOut);

      elComeOut.onclick = function () {
        io.rollDice(gameId.current);
      };
    }
  }, [diceRef.current, rollRef.current, canvasRef.current]);
  /*
  {
      game_status: gameStatus,
      pending_player_index: next_player_index,
      lastPlayTime: t,
      move: {
          player_index: last_player_index,
          dice_outcome: dice,
          from: oldPosition,
          to: newPos
      }
  }
  */
  useEffect(() => {
    if (game && turnUpdate) {
      const { from, to, dice_outcome, player_index } = turnUpdate.move;
      let newPlayersObject = [...game.players];
      let intermediate = from + dice_outcome;
      if (intermediate > 100) {
        intermediate = to;
      }
      if (
        player_index < newPlayersObject.length &&
        newPlayersObject[player_index]
      ) {
        newPlayersObject[player_index].position = intermediate;
      }
      let gameObject = {
        ...game,
        players: [...newPlayersObject],
      };
      console.log("hiii");
      drawCanvas(gameObject);
      if (intermediate !== to) {
        setTimeout(() => {
          if (
            player_index < gameObject.players.length &&
            gameObject.players[player_index]
          ) {
            gameObject.players[player_index].position = to;
          }
          drawCanvas(gameObject);
        }, 1000);
      }
    } else {
      if (game) {
        drawCanvas(game);
      }
    }
  }, [game, turnUpdate]);

  let drawCanvas = (game) => {
    if (!game) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = boards[game.board_id - 1];
    img.onload = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const cellW = canvas.width / 10.0;
      const cellH = canvas.height / 10.0;
      //draw pieces:
      let i = 0;
      for (const p of game.players) {
        if (p?.position === 0) {
          continue;
        }
        const { x, y } = pos(p.position);

        ctx.beginPath();
        ctx.arc(
          x * cellW + cellW / 2.0,
          y * cellH + cellH / 2.0,
          cellW,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        i = i + 1;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(
          x * cellW + cellW / 2.0,
          y * cellH + cellH / 2.0,
          cellW / 3.0,
          0,
          2 * Math.PI
        );
        if (p === game.players[game.pending_player_index]) {
          ctx.fillStyle = "green";
        } else {
          ctx.fillStyle = "white";
        }
        ctx.fill();

        ctx.beginPath();
        ctx.arc(
          x * cellW + cellW / 2.0,
          y * cellH + cellH / 2.0,
          cellW / 3.5,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = p.color;
        ctx.fill();
      }
    };
  };

  const leaveGame = (e) => {
    e.preventDefault();
    console.log("lol" + gameId.current);
    const headers = {
      "x-access-token": sessionStorage.getItem("authenticated"),
    };
    axios
      .post(
        `/leaveGame`,
        { gameId: parseInt(gameId.current) },
        { headers: headers }
      )
      .then((res) => {
        console.log("RESPONSE RECEIVED: ", res);
        io.leaveGame(gameId);
        window.location.reload(true);
      })
      .catch((err) => {
        console.log("AXIOS ERROR: ", err);
      });
  };

  return (
    <>
      <div
        className="confetti-container"
        id="celebration"
        style={{
          display:
            game?.game_status.toLowerCase() === "finished" ? "block" : "none",
        }}
      >
        <div className="confetti">
          <i style={{ "--speed": 10, "--bg": "yellow" }} className="square"></i>
          <i
            style={{ "--speed": 18, "--bg": "white" }}
            className="pentagram"
          ></i>
          <i
            style={{ "--speed": 29, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i style={{ "--speed": 17, "--bg": "blue" }} className="hexagram"></i>
          <i style={{ "--speed": 33, "--bg": "red" }} className="pentagram"></i>
          <i
            style={{ "--speed": 26, "--bg": "yellow" }}
            className="dodecagram"
          ></i>
          <i
            style={{ "--speed": 24, "--bg": "pink" }}
            className="wavy-line"
          ></i>
          <i style={{ "--speed": 5, "--bg": "blue" }} className="wavy-line"></i>
          <i style={{ "--speed": 40, "--bg": "white" }} className="square"></i>
          <i
            style={{ "--speed": 17, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i style={{ "--speed": 25, "--bg": "white" }} className="square"></i>
          <i
            style={{ "--speed": 18, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i
            style={{ "--speed": 15, "--bg": "yellow" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 32, "--bg": "yellow" }}
            className="pentagram"
          ></i>
          <i style={{ "--speed": 25, "--bg": "white" }} className="square"></i>
          <i
            style={{ "--speed": 18, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i
            style={{ "--speed": 37, "--bg": "yellow" }}
            className="dodecagram"
          ></i>
          <i
            style={{ "--speed": 23, "--bg": "pink" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 37, "--bg": "red" }}
            className="dodecagram"
          ></i>
          <i
            style={{ "--speed": 37, "--bg": "pink" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 36, "--bg": "white" }}
            className="hexagram"
          ></i>
          <i
            style={{ "--speed": 32, "--bg": "green" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 32, "--bg": "yellow" }}
            className="pentagram"
          ></i>
          <i style={{ "--speed": 29, "--bg": "white" }} className="square"></i>
          <i
            style={{ "--speed": 18, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i
            style={{ "--speed": 37, "--bg": "red" }}
            className="dodecagram"
          ></i>
          <i
            style={{ "--speed": 23, "--bg": "pink" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 30, "--bg": "pink" }}
            className="rectangle"
          ></i>
          <i style={{ "--speed": 30, "--bg": "red" }} className="square"></i>
          <i style={{ "--speed": 18, "--bg": "red" }} className="pentagram"></i>
          <i
            style={{ "--speed": 19, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i style={{ "--speed": 16, "--bg": "blue" }} className="hexagram"></i>
          <i style={{ "--speed": 23, "--bg": "red" }} className="pentagram"></i>
          <i
            style={{ "--speed": 34, "--bg": "yellow" }}
            className="dodecagram"
          ></i>
          <i
            style={{ "--speed": 39, "--bg": "pink" }}
            className="wavy-line"
          ></i>
          <i style={{ "--speed": 40, "--bg": "purple" }} className="square"></i>
          <i
            style={{ "--speed": 21, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i style={{ "--speed": 14, "--bg": "white" }} className="square"></i>
          <i
            style={{ "--speed": 38, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i
            style={{ "--speed": 19, "--bg": "red" }}
            className="dodecagram"
          ></i>
          <i
            style={{ "--speed": 29, "--bg": "pink" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 21, "--bg": "white" }}
            className="hexagram"
          ></i>
          <i
            style={{ "--speed": 17, "--bg": "purple" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 32, "--bg": "yellow" }}
            className="pentagram"
          ></i>
          <i style={{ "--speed": 23, "--bg": "white" }} className="square"></i>
          <i
            style={{ "--speed": 18, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i
            style={{ "--speed": 37, "--bg": "red" }}
            className="dodecagram"
          ></i>
          <i
            style={{ "--speed": 48, "--bg": "pink" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 38, "--bg": "pink" }}
            className="rectangle"
          ></i>
          <i style={{ "--speed": 13, "--bg": "red" }} className="pentagram"></i>
          <i
            style={{ "--speed": 49, "--bg": "yellow" }}
            className="dodecagram"
          ></i>
          <i
            style={{ "--speed": 19, "--bg": "cyan" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 15, "--bg": "steelblue" }}
            className="square"
          ></i>
          <i style={{ "--speed": 10, "--bg": "yellow" }} className="square"></i>
          <i
            style={{ "--speed": 18, "--bg": "white" }}
            className="pentagram"
          ></i>
          <i
            style={{ "--speed": 29, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i style={{ "--speed": 17, "--bg": "blue" }} className="hexagram"></i>
          <i style={{ "--speed": 33, "--bg": "red" }} className="pentagram"></i>
          <i
            style={{ "--speed": 26, "--bg": "yellow" }}
            className="dodecagram"
          ></i>
          <i
            style={{ "--speed": 24, "--bg": "pink" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 5, "--bg": "white" }}
            className="wavy-line"
          ></i>
          <i style={{ "--speed": 40, "--bg": "purple" }} className="square"></i>
          <i
            style={{ "--speed": 17, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i style={{ "--speed": 25, "--bg": "white" }} className="square"></i>
          <i
            style={{ "--speed": 18, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i
            style={{ "--speed": 15, "--bg": "cyan" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 32, "--bg": "yellow" }}
            className="pentagram"
          ></i>
          <i style={{ "--speed": 45, "--bg": "white" }} className="square"></i>
          <i
            style={{ "--speed": 18, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i
            style={{ "--speed": 37, "--bg": "red" }}
            className="dodecagram"
          ></i>
          <i
            style={{ "--speed": 23, "--bg": "pink" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 37, "--bg": "red" }}
            className="dodecagram"
          ></i>
          <i
            style={{ "--speed": 37, "--bg": "pink" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 26, "--bg": "white" }}
            className="hexagram"
          ></i>
          <i
            style={{ "--speed": 32, "--bg": "cyan" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 32, "--bg": "yellow" }}
            className="pentagram"
          ></i>
          <i style={{ "--speed": 45, "--bg": "white" }} className="square"></i>
          <i
            style={{ "--speed": 18, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i
            style={{ "--speed": 37, "--bg": "red" }}
            className="dodecagram"
          ></i>
          <i
            style={{ "--speed": 23, "--bg": "pink" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 50, "--bg": "pink" }}
            className="rectangle"
          ></i>
          <i style={{ "--speed": 30, "--bg": "red" }} className="square"></i>
          <i style={{ "--speed": 18, "--bg": "red" }} className="pentagram"></i>
          <i
            style={{ "--speed": 19, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i style={{ "--speed": 16, "--bg": "blue" }} className="hexagram"></i>
          <i style={{ "--speed": 23, "--bg": "red" }} className="pentagram"></i>
          <i
            style={{ "--speed": 33, "--bg": "yellow" }}
            className="dodecagram"
          ></i>
          <i
            style={{ "--speed": 39, "--bg": "white" }}
            className="wavy-line"
          ></i>
          <i style={{ "--speed": 40, "--bg": "orange" }} className="square"></i>
          <i
            style={{ "--speed": 21, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i style={{ "--speed": 14, "--bg": "white" }} className="square"></i>
          <i
            style={{ "--speed": 38, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i
            style={{ "--speed": 19, "--bg": "red" }}
            className="dodecagram"
          ></i>
          <i
            style={{ "--speed": 29, "--bg": "pink" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 34, "--bg": "white" }}
            className="hexagram"
          ></i>
          <i
            style={{ "--speed": 17, "--bg": "indigo" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 32, "--bg": "yellow" }}
            className="pentagram"
          ></i>
          <i style={{ "--speed": 23, "--bg": "white" }} className="square"></i>
          <i
            style={{ "--speed": 18, "--bg": "green" }}
            className="rectangle"
          ></i>
          <i
            style={{ "--speed": 37, "--bg": "red" }}
            className="dodecagram"
          ></i>
          <i
            style={{ "--speed": 48, "--bg": "pink" }}
            className="wavy-line"
          ></i>
          <i
            style={{ "--speed": 38, "--bg": "pink" }}
            className="rectangle"
          ></i>
          <i style={{ "--speed": 13, "--bg": "red" }} className="pentagram"></i>
          <i
            style={{ "--speed": 49, "--bg": "yellow" }}
            className="dodecagram"
          ></i>
          <i
            style={{ "--speed": 19, "--bg": "purple" }}
            className="wavy-line"
          ></i>
          <i style={{ "--speed": 15, "--bg": "cyan" }} className="square"></i>
        </div>
      </div>
      <div className={styles.gameContainer}>
        <div className={styles.playersList}>
          <table className={styles.playersTable}>
            <thead>
              <th>Player</th>
              <th>Position</th>
            </thead>
            <tbody>
              {game?.players?.map((player) => (
                <tr
                  key={player.id}
                  className={styles.player}
                  style={{
                    color:
                      player?.name ==
                      game.players[game?.pending_player_index]?.name
                        ? "rgb(141, 206, 206)"
                        : "black",
                  }}
                >
                  <td>
                    <div
                      className={styles.playerColor}
                      style={{ backgroundColor: player?.color }}
                    ></div>
                    <div>{player?.name}</div>
                  </td>
                  <td>{player?.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <canvas ref={canvasRef} width={749} height={749} />

        <div className={styles.timerDiceContainer}>
          <button className="leaveGame" onClick={(e) => leaveGame(e)}>
            Leave
          </button>
          <div className="msg" id="msssg">
            {msg}
          </div>
          <div className={styles.timer}>
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <CircularProgress
                variant="determinate"
                value={(progress / 10) * 100}
                style={{
                  width: "150px",
                  height: "150px",
                  color: "rgb(141, 206, 206)",
                  backgroundColor: "#fff",
                  borderRadius: "50%",
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="caption"
                  component="div"
                  color="text.secondary"
                  style={{
                    fontSize: "4rem",
                    color: "black",
                    fontFamily: "Bungee",
                  }}
                >
                  {`${progress}`}
                </Typography>
              </Box>
            </Box>
          </div>

          <div ref={rollRef}>
            <div className="dice dice-one" ref={diceRef}>
              <div id="dice-one-side-one" className="side one">
                <div className="dot one-1"></div>
              </div>
              <div id="dice-one-side-two" className="side two">
                <div className="dot two-1"></div>
                <div className="dot two-2"></div>
              </div>
              <div id="dice-one-side-three" className="side three">
                <div className="dot three-1"></div>
                <div className="dot three-2"></div>
                <div className="dot three-3"></div>
              </div>
              <div id="dice-one-side-four" className="side four">
                <div className="dot four-1"></div>
                <div className="dot four-2"></div>
                <div className="dot four-3"></div>
                <div className="dot four-4"></div>
              </div>
              <div id="dice-one-side-five" className="side five">
                <div className="dot five-1"></div>
                <div className="dot five-2"></div>
                <div className="dot five-3"></div>
                <div className="dot five-4"></div>
                <div className="dot five-5"></div>
              </div>
              <div id="dice-one-side-six" className="side six">
                <div className="dot six-1"></div>
                <div className="dot six-2"></div>
                <div className="dot six-3"></div>
                <div className="dot six-4"></div>
                <div className="dot six-5"></div>
                <div className="dot six-6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Game;
