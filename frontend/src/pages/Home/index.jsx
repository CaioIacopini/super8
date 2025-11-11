// src/pages/Home/index.jsx
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import api from "../../services/api";

function Home() {
  const [mode, setMode] = useState("login"); // 'login' ou 'register'
  const navigate = useNavigate();

  const nameRef = useRef();
  const ageRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();

  const loginEmailRef = useRef();
  const loginPasswordRef = useRef();

  async function handleRegister(e) {
    e.preventDefault();
    try {
      const res = await api.post("/auth/register", {
        name: nameRef.current.value,
        age: ageRef.current.value,
        email: emailRef.current.value,
        password: passwordRef.current.value,
      });

      // salva token e user
      localStorage.setItem("super8_token", res.data.token);
      localStorage.setItem("super8_user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      alert(
        err.response?.data?.error || "Erro ao criar conta. Tente outro email."
      );
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", {
        email: loginEmailRef.current.value,
        password: loginPasswordRef.current.value,
      });
      localStorage.setItem("super8_token", res.data.token);
      localStorage.setItem("super8_user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao logar");
    }
  }

  return (
    <div className="container">
      <form className="form1">
        <h1>Super 8</h1>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button
            type="button"
            className={mode === "login" ? "submitBtn" : "secondaryBtn"}
            onClick={() => setMode("login")}
          >
            Entrar
          </button>
          <button
            type="button"
            className={mode === "register" ? "submitBtn" : "secondaryBtn"}
            onClick={() => setMode("register")}
          >
            Criar conta
          </button>
        </div>

        {mode === "register" ? (
          <>
            <input name="name" type="text" placeholder="Nome" ref={nameRef} />
            <input name="age" type="number" placeholder="Idade" ref={ageRef} />
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              ref={emailRef}
            />
            <input
              name="password"
              type="password"
              placeholder="Senha"
              ref={passwordRef}
            />

            <button className="submitBtn" onClick={handleRegister}>
              Criar conta
            </button>
          </>
        ) : (
          <>
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              ref={loginEmailRef}
            />
            <input
              name="password"
              type="password"
              placeholder="Senha"
              ref={loginPasswordRef}
            />
            <button className="submitBtn" onClick={handleLogin}>
              Entrar
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default Home;
