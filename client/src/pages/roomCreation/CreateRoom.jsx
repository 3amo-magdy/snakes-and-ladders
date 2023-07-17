import "./CreateRoom.css";
import boards from "../../boards";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

const CreateRoom = () => {
  const navigate = useNavigate();

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
      toast.error("Choose a Board");
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
        navigate("/game");
      })
      .catch((err) => {
        console.log("AXIOS ERROR: ", err);
      });
  };
  const fetchGame = ()=>{
    const headers = {
      "x-access-token": sessionStorage.getItem("authenticated"),
    };
    return axios.get(`/currentGame`, { headers: headers })
  }
  useEffect(() => {
    fetchGame().then((res) => {
      console.log("RESPONSE RECEIVED: ", res);
      navigate("/game")
    })
    .catch((err) => {
      console.log("AXIOS ERROR: ", err);
    });
  }, []);

  return (
    <>
      <div className="createRoom">
        <Link to="/" className="back">
          <span class="material-symbols-outlined">arrow_back</span>
        </Link>
        <ToastContainer />
        <h2 className="chooseMap">Choose a map</h2>
        <div onChange={onChangeRadio} className="mapsContainer">
          {boards.map((b, index) => (
            <div className="map" key={index}>
              <input
                class="input-hidden"
                type="radio"
                id={`${index + 1}`}
                name="board"
              />
              <label htmlFor={`${index + 1}`}>
                <img src={b} alt="" />
              </label>
            </div>
          ))}
          {/* <div className="map">
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
          </div> */}
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
