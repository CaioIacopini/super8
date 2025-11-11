import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import Trash from "../../assets/trash.png";
import api from "../../services/api";

function Home() {
  const [users, setUsers] = useState([]);

  const inputName = useRef();
  const inputAge = useRef();
  const inputEmail = useRef();
  const navigate = useNavigate();

  async function getUsers() {
    const usersFromApi = await api.get("/usuarios");
    setUsers(usersFromApi.data);
  }

  async function createUsers(e) {
    e.preventDefault();
    await api.post("/usuarios", {
      name: inputName.current.value,
      age: inputAge.current.value,
      email: inputEmail.current.value,
    });
    inputName.current.value = "";
    inputAge.current.value = "";
    inputEmail.current.value = "";
    getUsers();
  }

  async function deleteUsers(id) {
    await api.delete(`/usuarios/${id}`);
    getUsers();
  }

  useEffect(() => {
    getUsers();
  }, []);

  return (
    <div className="container">
      <form className="form1" onSubmit={createUsers}>
        <h1>Create your account</h1>
        <input name="name" type="text" placeholder="Username" ref={inputName} />
        <input name="age" type="number" placeholder="Age" ref={inputAge} />
        <input
          name="email"
          type="email"
          placeholder="E-mail"
          ref={inputEmail}
        />

        <button className="submitBtn" type="submit">
          Login
        </button>
        <button
          type="button"
          className="submitBtn"
          onClick={() => navigate("/dashboard")}
        >
          Ir para Dashboard
        </button>
      </form>

      {users.map((user) => (
        <div className="Usercards" key={user.id}>
          <div className="UserInfo">
            <form className="form2">
              <p>
                Name: <span>{user.name}</span>
              </p>
              <p>
                Age: <span>{user.age}</span>
              </p>
              <p>
                Email: <span>{user.email}</span>{" "}
              </p>
            </form>
          </div>
          <button onClick={() => deleteUsers(user.id)} className="trashBtn">
            <img src={Trash} alt="Delete User" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default Home;
