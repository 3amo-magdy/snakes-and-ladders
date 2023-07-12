import "./CreateRoom.css";
import board1 from "../../boardImages/board1.jpg";
import board2 from "../../boardImages/board2.jpg";
import board3 from "../../boardImages/board3.png";
import board4 from "../../boardImages/board4.jpg";
import board5 from "../../boardImages/board5.jpg";
import board6 from "../../boardImages/board6.jpeg";
import axios from "axios";
import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CreateRoom = () => {
  const [board, setBoard] = useState(-1);
  const [capacity, setCapacity] = useState(-1);
  const onChangeText = (e) => {
    setCapacity(e.target.value);
    console.log(e.target.value);
  };
  const onChangeRadio = (e) => {
    setBoard(e.target.id);
  };
  const handleClick = (e) => {
    if (board === -1) {
      toast.error("Choose a Map");
      return;
    }
    if (isNaN(capacity) || capacity > 10 || capacity < 2) {
      toast.error("Invalid Capacity");
      return;
    }
    const headers = {
      "x-access-token": sessionStorage.getItem("authenticated"),
    };
    const data = { capacity: parseInt(capacity), boardId: parseInt(board) };
    axios
      .post(`/createGame`, data, { headers: headers })
      .then((res) => {
        console.log("RESPONSE RECEIVED: ", res);
      })
      .catch((err) => {
        console.log("AXIOS ERROR: ", err);
      });
  };
  return (
    <>
      <div className="createRoom">
        <ToastContainer />
        <h2 className="chooseMap">Choose a map</h2>
        <div onChange={onChangeRadio} className="mapsContainer">
          <div className="map">
            <input class="input-hidden" type="radio" id="1" name="board" />
            <label htmlFor="1">
              <img src={board1} alt="" />
            </label>
          </div>
          <div className="map">
            <input class="input-hidden" type="radio" id="2" name="board" />
            <label htmlFor="2">
              <img src={board2} alt="" />
            </label>
          </div>
          <div className="map">
            <input class="input-hidden" type="radio" id="3" name="board" />
            <label htmlFor="3">
              <img src={board3} alt="" />
            </label>
          </div>
          <div className="map">
            <input class="input-hidden" type="radio" id="4" name="board" />
            <label htmlFor="4">
              <img src={board4} alt="" />
            </label>
          </div>
          <div className="map">
            <input class="input-hidden" type="radio" id="5" name="board" />
            <label htmlFor="5">
              <img src={board5} alt="" />
            </label>
          </div>
          <div className="map">
            <input class="input-hidden" type="radio" id="6" name="board" />
            <label htmlFor="6">
              <img src={board6} alt="" />
            </label>
          </div>
        </div>
        <div onChange={onChangeText} className="playerNumbers">
          <input type="text" placeholder="Enter players number:" />
        </div>
        <button onClick={handleClick}>Create</button>
      </div>
    </>
  );
};

export default CreateRoom;
