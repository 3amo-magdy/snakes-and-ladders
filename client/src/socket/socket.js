import io from "socket.io-client";

const authToken = sessionStorage.getItem("authenticated");
export const socket = io("https://snakes-ladders.up.railway.app/", {
  auth: { authToken },
  autoConnect: false,
});

export const subscribeToRoom = (gameId, turnUpdate, roomUpdate) => {
  socket.on("connect", (socket) => {
    console.log("connected");
    socket.on("turn-update", turnUpdate);
    socket.on("room-update", roomUpdate);
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
  socket.emit("load-game", String(gameId), roomUpdate);
};
export const rollDice = (gameId) => {
  socket.emit("make-move", gameId);
};
export const leaveGame = (gameId) => {
  socket.emit("leave-game", gameId);
};
