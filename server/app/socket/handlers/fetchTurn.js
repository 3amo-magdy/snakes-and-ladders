
const db = require("../../models");
const flattenObject = require("../../utils/flatten.js");

const Game = db.Game;
const GP = db.GamePlayer;
const ELEM = db.BoardElement;
const User = db.User;
const fetchTurn = async (game_id) => {
    try{
    let gameID = parseInt(game_id);
    console.log(gameID);
    if (isNaN(gameID)) {
       return(`failed parsing ${game_id}, make sure to include a proper gameID`);
    }
    const game = await Game.findOne({
        where: {
            Id: gameID,
        },
    });
    if(!game){
        return(`No game exists with gameID: ${gameID}`)
    }

    const currentPlayer = game.currentPlayer;

    let Players = await User.findAll({
        include: [{
            model: GP,
            required: true,
            attributes: ['color', 'lastPosition', 'order'],
            foreignKey: {
                name: 'playerId', // Name of the foreign key column in the User model
            },
            where: { gameID: gameID }
        }]
        , attributes: ['userId', 'userName']
    });
    console.log(Players)
    Players = Players.map(p => {
        return {
            name: p.userName,
            color: p.GamePlayers[0].color,
            position: p.GamePlayers[0].lastPosition,
            order:p.GamePlayers[0].order,
            id: p.userId
        }
    })

    Players.sort((a, b) => a.order - b.order)

    const pending_player_index = Players.findIndex(
        (p) => (p.id === currentPlayer)
    )
    if(pending_player_index==-1){
        pending_player_index = 0
    }

    const g = {
        game_status: game.status,
        game_capacity: game.capacity,
        board_id: game.boardId,
        pending_player_index: pending_player_index,
        players: Players,
        lastPlayTime: game.lastPlayTime
    }
    console.log(g)
    return (g)
}
catch(e){
    return `Error occured\n${e}`
}
}
module.exports = fetchTurn;