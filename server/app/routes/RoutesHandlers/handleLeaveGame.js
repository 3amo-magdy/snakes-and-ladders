const db = require("../../models");
const fetchTurn = require("../../socket/handlers/fetchTurn");
const GamePlayer = db.GamePlayer;
const Game = db.Game;
const Op = db.Sequelize.Op;

require("dotenv").config()

const handleLeaveGame = async (req, res, next) => {
    const playerId = req.user.userId
    const { gameId } = req.body;
    try {
      let player = await GamePlayer.findOne({ where: { playerId, gameId } });
      if (!player) throw new Error("Player Not in The Game");
      let game = await Game.findByPk(gameId);
      const p_num = game.playersNumber
      if (!game) throw new Error("Game Doesn't Exist");

      if (parseInt(p_num) === 1) {
        await GamePlayer.destroy({ where: { playerId } });
        await Game.destroy({ where: { Id:gameId } })
      }
      else {
        if (game.currentPlayer === parseInt(playerId)) {
          const currentOrder = player.order;
          let nextOrder = Infinity;
          let nextPlayerId = game.currentPlayer;
          let foundHigher = false;
          let min = Infinity;
          let minPlayerId = game.currentPlayer;
          const players = await GamePlayer.findAll({ where: { gameID: gameId } })
          for (const element of players) {
            if (element.order > currentOrder && element.order < nextOrder) {
              nextOrder = element.order;
              nextPlayerId = element.playerId;
              foundHigher = true;
            }
            if(element.order < min){
              minPlayerId = element.playerId
              min = element.order
            }
          }
          if(!foundHigher){
            nextPlayerId = minPlayerId
          }
          await Game.update(
            { currentPlayer: nextPlayerId },
            { where: { Id: gameId } }
          );
        }
        await GamePlayer.destroy({ where: { playerId } });
        await Game.update(
          { playersNumber: p_num - 1 },
          { where: { Id: gameId } }
        );
      }
      fetchTurn(gameId).then((data) => {
        socket.to("team-C room-" + String(gameId)).emit('room-update', data)
      });
      res.status(200).send("Done");
    } catch (e) {
      next(e);
    }
  };

module.exports = handleLeaveGame;
