import io from "socket.io-client";

const authToken = sessionStorage.getItem("authenticated");
// export const socket = io("https://snakes-ladders.up.railway.app/", {
//   auth: { authToken },
//   autoConnect: false,
// });
let socket = null ;
export const subscribeToRoom = (gameId, turnUpdate, roomUpdate) => {
  const socket = io("https://snakes-ladders.up.railway.app/", {
  auth: { authToken },
  autoConnect: false,
  });
  socket.on("turn-update", turnUpdate);
  socket.on("room-update", roomUpdate);
  socket.on("connect", () => {
    console.log("connected");
    socket.emit("join-game", gameId);
    loadGame(gameId, (data) => {
      roomUpdate(data);
    });
  });
  socket.on("disconnect", () => {
    console.log("disconnected");
    roomUpdate("Bye bye");
  });
  socket.connect();
};

export const loadGame = (gameId, roomUpdate) => {
  if(socket){
    socket.emit("load-game", String(gameId), roomUpdate);
  }
};
export const rollDice = (gameId) => {
  if(socket){
  socket.emit("make-move", gameId);}
};
export const leaveGame = (gameId) => {
  if(socket){
  socket.emit("leave-game", gameId);}
};
