import "./Register.css";
import { Link } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useEffect } from "react";

const Register = () => {
  const navigate = useNavigate();
  const [person, setPerson] = useState({
    userName: "",
    password: "",
  });
  const handleUser = (e) => {
    const user = { ...person };
    user[e.target.id] = e.target.value;
    setPerson(user);
  };

  const handleSubmit = (e) => {
    if (person.userName && person.password) {
      const send = async () => {
        try {
          let Isvalid = await axios.post(`/register`, person);
          if (Isvalid?.data) {
            sessionStorage.setItem("authenticated", Isvalid?.data.token);
            sessionStorage.setItem("username", person.userName);
            e.preventDefault();
            navigate(`/`);
          } else {
            toast.error("Wrong Credentials");
          }
        } catch {
          toast.error("Duplicate Username");
        }
      };
      send();
      e.preventDefault();
    } else {
      toast.error("WHAT IS THIS!!!!!");
      e.preventDefault();
    }
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
      <div className="Register">
        <ToastContainer />
        <div className="card">
          <div className="left">
            <h1>Snakes and Ladders</h1>
            <p className="text">
              Join the fun! Create your account and get ready to experience the
              thrill of playing Snakes and Ladders with friends and opponents
              from around the world. (if u can see this, fork sync works!)
            </p>
            <span className="log">Do you have an account?</span>
            <Link to="/login">
              <button className="login">Login</button>
            </Link>
          </div>
          <div className="right">
            <h1 className="register">Register</h1>
            <form>
              <input
                id="userName"
                onChange={(e) => {
                  handleUser(e);
                }}
                type="text"
                placeholder="username"
              />
              <input
                id="password"
                onChange={(e) => {
                  handleUser(e);
                }}
                type="password"
                placeholder="password"
              />
              <button onClick={(e) => handleSubmit(e)}>register</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
export default Register;
