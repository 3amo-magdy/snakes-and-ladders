const express = require("express");
const cors = require("cors");
const auth = require("./middlewares/auth");
const socketAuth = require("./middlewares/socketAuth");

const app = express();
const seed = require("./backup/seed");
var corsOptions = {
  origin: "*",
};
app.use(cors(corsOptions));

const http = require("http").Server(app);
const socketIO = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});
const fetchTurn = require("./app/socket/handlers/fetchTurn");
const makeMove = require("./app/socket/handlers/makeMove");
socketIO.use(socketAuth).on("connection", (socket) => {
  console.log(`${socket.id} just connected!`);

  socket.on("join-game", async (gameId) => {
    if (socket.rooms.has(`team-C room-${gameId}`)) {
      return;
    }
    if(!socket.user){
      return;
    }
    const actual_game_id = await isPlayerGaming(socket.user.userId);
    console.log(actual_game_id);
    console.log(gameId);
    if (actual_game_id !== gameId) {
      console.log(`${socket.id} attempted to join another room!`);
      return;
    }

    console.log(`${socket.id} joined (team-C room-${gameId})`);
    socket.join(`team-C room-${gameId}`);
    // notify room
    fetchTurn(gameId).then((data) => {
      socket.in(`team-C room-` + `${gameId}`).emit("room-update", data);
    });
  });

  socket.on("leave-game",async (gameId)=>{
    const room = `team-C room-${gameId}`;
    if(!socket.rooms.has(room) || !socket.user || await isPlayerGaming(socket.user.userId)){
      return;
    }
    socket.leave(room);
    fetchTurn(gameId).then((data) => {
      socket.in(`team-C room-` + `${gameId}`).emit("room-update", data);
    });
  })
  socket.on("load-game", (gameId, callback) => {
    try{
    fetchTurn(gameId).then((game) => {
      console.log("loading ?")
      callback(game);
    });
    }
    catch(e){
      console.log("Error occured"+e)
    }
  });

  socket.on("make-move", (gameID) => {
    try {
      makeMove(gameID, socket.user, socketIO).then((update) => {
        console.log(`${socket.id} made a move in (team-C room-${gameID})`);
        console.log(update);
        if(typeof update == 'string'){
            socketIO.to(socket.id).emit("turn-update", update);
        }
        else{
          socketIO.in(`team-C room-` + `${gameID}`).emit("turn-update", update);
        }
      });
    } catch (e) {
      console.log(e);
    }
  });

  socket.on("disconnect", () => {
    console.log(`${socket.id} disconnected`);
  });
});

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const handleRegister = require("./app/routes/RoutesHandlers/handleRegister.js");
const handleLogin = require("./app/routes/RoutesHandlers/handleLogin.js");
const handleRetrieveGames = require("./app/routes/RoutesHandlers/handleRetrieveGames.js");
const handleJoinGame = require("./app/routes/RoutesHandlers/handleJoinGame.js");
const handleLeaveGame = require("./app/routes/RoutesHandlers/handleLeaveGame.js");
const handleCreateGame = require("./app/routes/RoutesHandlers/handleCreateGame.js");
const handleGetGame = require("./app/routes/RoutesHandlers/handleGetGame.js");
const handleMock = require("./app/routes/RoutesHandlers/__handleMock");
const handleCurrentGame = require("./app/routes/RoutesHandlers/handleCurrentGame");

app.post("/test", handleMock);
// app.post("/makeMove", auth, handleMakeMove.create(socketIO));
app.post("/login", handleLogin);
app.post("/register", handleRegister);
app.get("/retrieveGames", auth, handleRetrieveGames);

app.get("/getGame", auth, handleGetGame);
app.post("/joinGame", auth, handleJoinGame);
app.post("/leaveGame", auth, handleLeaveGame);
app.post("/createGame", auth, handleCreateGame);
app.get("/currentGame", auth, handleCurrentGame);
const db = require("./app/models");
const isPlayerGaming = require("./app/routes/helpers/isPlayerGaming");

app.use((error, req, res, next) => {
  res.status(error.status ?? 500).json({ message: " exception : " + error });
});
// set port, listen for requests
const PORT =  8080;
http.listen(process.env.PORT || PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
seed();
