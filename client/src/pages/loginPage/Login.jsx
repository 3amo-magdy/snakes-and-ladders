import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const Login = () => {
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

  useEffect(() => {
    const headers = {
      "x-access-token": sessionStorage.getItem("authenticated"),
    };
    axios.get(`/currentGame`, { headers: headers }).then((res) => {
      console.log("RESPONSE RECEIVED: ", res);
      navigate("/game")
    })
    .catch((err) => {
      console.log("AXIOS ERROR: ", err);
    });
  }, []);


  const handleSubmit = (e) => {
    if (person.userName && person.password) {
      const send = async () => {
        try {
          let Isvalid = await axios.post(`/login`, person);
          if (Isvalid?.data) {
            sessionStorage.setItem("authenticated", Isvalid?.data.token);
            sessionStorage.setItem("username", person.userName);
            navigate(`/`);
            e.preventDefault();
          } else {
            alert("Wrong credentials");
          }
        } catch {
          toast.error("Invalid Credentials");
        }
      };
      send();
      e.preventDefault();
    } else {
      toast.error("WHAT IS THIS!!!!!");
      e.preventDefault();
    }
  };

  console.log(person);
  return (
    <>
      <div className="container">
        <ToastContainer />
        <div className="card">
          <div className="left">
            <h1>Snakes and Ladders</h1>
            <p className="text">
              Ready to embark on a wild adventure? Enter the secret code to
              unlock the gate and join the realm of Snakes and Ladders! Get
              ready to roll the dice, climb ladders, and dodge slippery snakes
              as you chase victory and loads of fun!.
            </p>
            <span className="reg">Don't have an account?</span>
            <Link to="/register">
              <button className="register">Register</button>
            </Link>
          </div>
          <div className="right">
            <h1 className="login">Login</h1>
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
              <button onClick={(e) => handleSubmit(e)}>login</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
export default Login;
