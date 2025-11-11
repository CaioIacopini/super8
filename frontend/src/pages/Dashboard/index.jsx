import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./style.css";

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [super8s, setSuper8s] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [lastS8Ranking, setLastS8Ranking] = useState([]);
  const navigate = useNavigate();

  const savedUser = localStorage.getItem("super8_user");
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const isAdmin = currentUser?.role === "ADMIN";

  const loadSuper8s = useCallback(async () => {
    try {
      const res = await api.get("/super8");
      setSuper8s(res.data);

      // pega o mais recente e monta o pódio compacto
      if (res.data.length > 0) {
        const last = res.data[0];
        const r = await api.get(`/super8/${last.id}/ranking`);
        setLastS8Ranking(r.data);
      } else {
        setLastS8Ranking([]);
      }
    } catch (err) {
      console.error("Erro ao carregar super8:", err);
      if (err.response?.status === 401) {
        navigate("/");
      }
    }
  }, [navigate]);

  const loadRanking = useCallback(async () => {
    try {
      const res = await api.get("/ranking");
      setRanking(res.data);
    } catch (err) {
      console.error("Erro ao carregar ranking:", err);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get("/usuarios");
      setUsers(res.data);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    }
  }, [isAdmin]);

  useEffect(() => {
    const token = localStorage.getItem("super8_token");
    if (!token) {
      navigate("/");
      return;
    }
    loadSuper8s();
    loadRanking();
    loadUsers();
  }, [navigate, loadSuper8s, loadRanking, loadUsers]);

  async function handleCreateSuper8() {
    try {
      const res = await api.post("/super8", {
        name: "Super 8 " + new Date().toLocaleDateString("pt-BR"),
      });
      navigate(`/super8/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Erro ao criar super 8");
    }
  }

  async function handleResetRanking() {
    if (!window.confirm("Deseja realmente zerar TODO o ranking?")) return;
    try {
      await api.delete("/ranking/reset");
      setRanking([]);
    } catch (err) {
      console.error(err);
      alert("Erro ao zerar ranking");
    }
  }

  async function handleResetAll() {
    if (
      !window.confirm(
        "Tem certeza? Isso vai apagar TODOS os Super 8 e TODOS os resultados!"
      )
    )
      return;
    try {
      await api.delete("/super8/reset-all");
      setSuper8s([]);
      setRanking([]);
      setLastS8Ranking([]);
    } catch (err) {
      console.error(err);
      alert("Erro ao apagar todos os Super 8");
    }
  }

  function handleLogout() {
    localStorage.removeItem("super8_token");
    localStorage.removeItem("super8_user");
    navigate("/");
  }

  return (
    <div className="dashboard-container">
      <div className="top-nav">
        <button className="ghost-btn" onClick={() => navigate("/")}>
          ← Home
        </button>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "#1f4f75" }}>
            {currentUser ? `${currentUser.name} (${currentUser.role})` : ""}
          </span>
          <button className="ghost-btn" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </div>

      <div className="dashboard-header">
        <h1>Super 8 – Dashboard</h1>
        <p>
          {isAdmin
            ? "Gerencie torneios, jogadores e ranking."
            : "Crie seus Super 8 e acompanhe o ranking."}
        </p>
      </div>

      {/* todo mundo pode criar */}
      <div className="top-actions">
        <button className="primary-btn" onClick={handleCreateSuper8}>
          + Criar Super 8
        </button>
        {isAdmin && (
          <>
            <button className="danger-btn" onClick={handleResetRanking}>
              🧹 Zerar Ranking
            </button>
            <button className="danger-btn" onClick={handleResetAll}>
              ⚠️ Apagar todos os Super 8
            </button>
          </>
        )}
      </div>

      {/* jogadores cadastrados - só admin */}
      {isAdmin && (
        <div className="section-card">
          <div className="section-title">
            <span>Jogadores cadastrados</span>
          </div>
          <div className="player-list">
            {users.map((user) => (
              <div className="player-item" key={user.id}>
                <span>
                  {user.name} – {user.age} anos
                </span>
                <span>
                  {user.email} {user.role === "ADMIN" ? "(admin)" : ""}
                </span>
              </div>
            ))}
            {users.length === 0 && <p>Nenhum jogador ainda.</p>}
          </div>
        </div>
      )}

      {/* ÚLTIMO SUPER 8 – estilo de pódio compacto */}
      <div className="section-card last-super8-card">
        <div className="last-super8-header">
          <div>
            <h2>Último Super 8</h2>
            {super8s.length > 0 && (
              <p>
                {super8s[0].name} •{" "}
                {super8s[0].createdAt
                  ? new Date(super8s[0].createdAt).toLocaleDateString("pt-BR")
                  : ""}
              </p>
            )}
          </div>
        </div>

        {super8s.length === 0 ? (
          <p className="last-super8-empty">Nenhum Super 8 criado ainda.</p>
        ) : lastS8Ranking.length === 0 ? (
          <p className="last-super8-empty">Ainda não há resultados.</p>
        ) : (
          <div className="last-super8-podium">
            {lastS8Ranking.slice(0, 3).map((p, idx) => (
              <div
                key={p.userId}
                className={`last-super8-item ${
                  idx === 0 ? "first" : idx === 1 ? "second" : "third"
                }`}
              >
                <span className="place">
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                </span>
                <div className="info">
                  <span className="name">{p.name}</span>
                  <span className="points">{p.totalGames} games</span>
                </div>
              </div>
            ))}

            {lastS8Ranking.length > 3 && (
              <div className="last-super8-more">
                + {lastS8Ranking.length - 3} jogadores
              </div>
            )}
          </div>
        )}
      </div>

      {/* ranking geral - todo mundo vê */}
      <div className="section-card">
        <div className="section-title">
          <span>Ranking geral</span>
        </div>
        <div className="ranking-list">
          {ranking.map((p, idx) => (
            <div className="ranking-item" key={p.userId}>
              <span className="ranking-pos">#{idx + 1}</span>
              <span className="ranking-name">{p.name}</span>
              <span className="ranking-points">{p.totalGames} games</span>
            </div>
          ))}
          {ranking.length === 0 && <p>Nenhum resultado ainda.</p>}
        </div>
      </div>
    </div>
  );
}
