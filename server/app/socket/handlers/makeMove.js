const { where } = require("sequelize");
const db = require("../../models");
const Game = db.Game;
const GP = db.GamePlayer;
const ELEM = db.BoardElement;
const User = db.User;
const TIMEOUT_DURATION = 10000;
const makeMove = async (game_id, user, io, force = false) => {
  const rollDice = () => Math.ceil(Math.random() * 6);
  let gameID = parseInt(game_id);
  if (isNaN(gameID)) {
    return `failed parsing ${game_id}, make sure to include a proper gameID field`;
  }
  const dice = rollDice();
  let game = await Game.findOne({
    where: {
      Id: gameID,
    },
  });
  if (game && game.status.toUpperCase() === "ACTIVE") {
    const currentPlayer = game.currentPlayer;
    const authUserId = user.userId;
    if (authUserId !== currentPlayer) {
      if (!force) {
        return ("No! Wait for your turn");
      }
      else {
        const t = Date.now();
        await Game.update(
          {
            lastPlayTime: t
          },
          {
            where: { Id: gameID },
          }
        );
        setTimeout(
          async (t, gameID) => {
            const g = await Game.findOne({ where: { Id: gameID } });
            console.log(g);
            if (!g) {
              return;
            }
            const lastPlay = g.lastPlayTime;
            if (
              lastPlay &&
              new Date(t).toISOString().slice(0, -4) ===
              lastPlay.toISOString().slice(0, -4)
            ) {
              console.log("the bot is playing");
              makeMove(
                gameID,
                {
                  userId: currentPlayer,
                },
                io, true
              ).then((update) => {
                io.in("team-C room-" + String(gameID)).emit("turn-update", update);
                console.log("the bot just played");
              });
            }
          },
          TIMEOUT_DURATION,
          t,
          gameID
        );
        return {
          game_status: game.status,
          pending_player_index: 0,
          lastPlayTime: t,
          move: null
        }
      }

    }
    const boardId = game.boardId;
    const gp = await GP.findOne({
      where: { gameID: gameID, playerId: currentPlayer },
    });
    if (!gp) { return "The bot won't dare to play for a gone player :/" }


    const currentOrder = gp.order;
    let nextOrder = Infinity;
    let next_player_id = currentPlayer;

    let foundHigher = false;
    let min = Infinity;
    let minPlayerId = game.currentPlayer;
    const players = await GP.findAll({ where: { gameID: gameID } })
    for (const element of players) {
      if (element.order > currentOrder && element.order < nextOrder) {
        nextOrder = element.order;
        next_player_id = element.playerId;
        foundHigher = true;
      }
      if (element.order < min) {
        minPlayerId = element.playerId
        min = element.order
      }
    }
    if (!foundHigher) {
      next_player_id = minPlayerId
    }

    const oldPosition = gp.lastPosition;
    let newPos = dice + oldPosition;
    let gameStatus = "ACTIVE";
    if (newPos <= 100) {
      const elem = await ELEM.findOne({
        where: { boardId: boardId, from: newPos },
      });
      if (elem) {
        newPos = elem.to;
      }
      await GP.update(
        {
          lastPosition: newPos,
        },
        {
          where: { playerId: currentPlayer },
        }
      );
      if (newPos == 100) {
        gameStatus = "FINISHED";
        await Game.update(
          {
            status: "FINISHED",
          },
          {
            where: { Id: gameID },
          }
        );
      }
    }
    else{
      newPos = oldPosition;
    }


    const t = Date.now();
    await Game.update(
      {
        currentPlayer: next_player_id,
        lastPlayTime: t,
      },
      {
        where: { Id: gameID },
      }
    );
    setTimeout(
      async (t, gameID) => {
        const g = await Game.findOne({ where: { Id: gameID } });
        console.log(g);
        if (!g) {
          return;
        }
        const lastPlay = g.lastPlayTime;
        if (
          lastPlay &&
          new Date(t).toISOString().slice(0, -4) ===
          lastPlay.toISOString().slice(0, -4)
        ) {
          console.log("the bot is playing");
          makeMove(
            gameID,
            {
              userId: next_player_id,
            },
            io, true
          ).then((update) => {
            io.in("team-C room-" + String(gameID)).emit("turn-update", update);
            console.log("the bot just played");
          });
        } else {
          console.log("the bot is sad :(");
        }
      },
      TIMEOUT_DURATION,
      t,
      gameID
    );

    let Players = await User.findAll({
      include: [
        {
          model: GP,
          required: true,
          attributes: ["color", "lastPosition", "order"],
          foreignKey: {
            name: "playerId", // Name of the foreign key column in the User model
          },
          where: { gameID: gameID },
        },
      ],
      attributes: ["userId", "userName"],
    });


    Players.sort((a, b) => a.order - b.order);


    let last_player_index = Players.findIndex((p) => p.userId === currentPlayer)
    let next_player_index = Players.findIndex((p) => p.userId === next_player_id)

    if (last_player_index == -1) {
      last_player_index = 0
    }
    if(next_player_index==-1){
      next_player_index = 0
    }


    return {
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
  } else {
    return ("No such on-going game exists");
  }

}
module.exports = makeMove;
