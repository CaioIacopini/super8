import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./style.css";

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [super8s, setSuper8s] = useState([]);
  const [ranking, setRanking] = useState([]);
  const navigate = useNavigate();

  // carregar usuários
  useEffect(() => {
    async function fetchUsers() {
      const res = await api.get("/usuarios");
      setUsers(res.data);
    }
    fetchUsers();
  }, []);

  // carregar super 8
  const loadSuper8s = useCallback(async () => {
    const res = await api.get("/super8");
    setSuper8s(res.data);
  }, []);

  useEffect(() => {
    loadSuper8s();
  }, [loadSuper8s]);

  // carregar ranking global
  async function loadRanking() {
    const res = await api.get("/ranking");
    setRanking(res.data);
  }
  useEffect(() => {
    loadRanking();
  }, []);

  // criar super 8 e ir para a página dos jogos
  async function handleCreateSuper8() {
    try {
      const res = await api.post("/super8", {
        name: "Super 8 " + new Date().toLocaleDateString("pt-BR"),
      });
      navigate(`/super8/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert("Erro ao criar super 8");
    }
  }

  // deletar 1 super 8
  async function handleDeleteSuper8(id) {
    if (!window.confirm("Tem certeza que deseja excluir este Super 8?")) return;
    await api.delete(`/super8/${id}`);
    loadSuper8s();
    loadRanking();
  }

  // zerar ranking
  async function handleResetRanking() {
    if (!window.confirm("Deseja realmente zerar TODO o ranking?")) return;
    await api.delete("/ranking/reset");
    setRanking([]);
  }

  // apagar todos os super 8
  async function handleResetAll() {
    if (
      !window.confirm(
        "Tem certeza? Isso vai apagar TODOS os Super 8 e TODOS os resultados!"
      )
    )
      return;
    await api.delete("/super8/reset-all");
    setSuper8s([]);
    setRanking([]);
  }

  return (
    <div className="dashboard-container">
      <div className="top-nav">
        <button className="ghost-btn" onClick={() => navigate("/")}>
          ← Home
        </button>
      </div>

      <div className="dashboard-header">
        <h1>Super 8 – Dashboard</h1>
        <p>Crie torneios, veja quem está cadastrado e acompanhe o ranking.</p>
      </div>

      <div className="top-actions">
        <button className="primary-btn" onClick={handleCreateSuper8}>
          + Criar Super 8
        </button>
        <button className="danger-btn" onClick={handleResetRanking}>
          🧹 Zerar Ranking
        </button>
        <button className="danger-btn" onClick={handleResetAll}>
          ⚠️ Apagar todos os Super 8
        </button>
      </div>

      {/* jogadores */}
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
              <span>{user.email}</span>
            </div>
          ))}
          {users.length === 0 && <p>Nenhum jogador ainda.</p>}
        </div>
      </div>

      {/* super 8 anteriores */}
      <div className="section-card">
        <div className="section-title">
          <span>Super 8 anteriores</span>
        </div>
        <div className="super8-list">
          {super8s.map((s8) => (
            <div className="super8-item" key={s8.id}>
              <div className="super8-info">
                <span className="super8-name">{s8.name}</span>
                <small className="super8-date">
                  {s8.createdAt
                    ? new Date(s8.createdAt).toLocaleDateString("pt-BR")
                    : ""}
                </small>
              </div>
              <div className="super8-buttons">
                <button
                  className="open-btn"
                  onClick={() => navigate(`/super8/${s8.id}`)}
                >
                  Abrir →
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteSuper8(s8.id)}
                  title="Excluir"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {super8s.length === 0 && <p>Nenhum Super 8 criado.</p>}
        </div>
      </div>

      {/* ranking */}
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
