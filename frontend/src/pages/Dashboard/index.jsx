import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./style.css";

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [super8s, setSuper8s] = useState([]);
  const [selectedSuper8, setSelectedSuper8] = useState("");
  const [results, setResults] = useState([]);
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

  // carregar super8
  const loadSuper8s = useCallback(async () => {
    const res = await api.get("/super8");
    setSuper8s(res.data);
    if (res.data.length > 0 && !selectedSuper8) {
      setSelectedSuper8(res.data[0].id);
    }
  }, [selectedSuper8]);

  useEffect(() => {
    loadSuper8s();
  }, [loadSuper8s]);

  // montar sempre 8 linhas
  useEffect(() => {
    const rows = Array.from({ length: 8 }, (_, i) => {
      const u = users[i];
      if (u) return { userId: u.id, gamesWon: "" };
      return { userId: "", gamesWon: "" };
    });
    setResults(rows);
  }, [users, selectedSuper8]);

  // carregar ranking global
  async function loadRanking() {
    const res = await api.get("/ranking");
    setRanking(res.data);
  }
  useEffect(() => {
    loadRanking();
  }, []);

  // criar super 8 e ir para a página 3
  async function handleCreateSuper8() {
    try {
      const res = await api.post("/super8", {
        name: "Super 8 " + new Date().toLocaleDateString("pt-BR"),
      });
      // vai pra página do torneio
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

  // completar com anjos
  function handleFillWithAngels() {
    setResults((prev) =>
      prev.map((row) => {
        if (!row.userId) return { ...row, userId: "angel" };
        return row;
      })
    );
  }

  // impedir jogadores duplicados (case-insensitive)
  function isUserAlreadyChosen(userId, currentIndex) {
    const user = users.find((u) => u.id === userId);
    if (!user) return false;
    const nameLower = user.name.toLowerCase();

    return results.some((row, i) => {
      if (i === currentIndex) return false;
      if (!row.userId || row.userId === "angel") return false;
      const rowUser = users.find((u) => u.id === row.userId);
      if (!rowUser) return false;
      return rowUser.name.toLowerCase() === nameLower;
    });
  }

  function handleUserChange(index, userId) {
    // anjo pode
    if (userId === "angel" || userId === "") {
      setResults((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], userId };
        return copy;
      });
      return;
    }

    const chosenUser = users.find((u) => u.id === userId);
    if (!chosenUser) return;

    const chosenNameLower = chosenUser.name.toLowerCase();

    const isAlreadyUsed = results.some((row, i) => {
      if (i === index) return false;
      if (!row.userId || row.userId === "angel") return false;
      const rowUser = users.find((u) => u.id === row.userId);
      if (!rowUser) return false;
      return rowUser.name.toLowerCase() === chosenNameLower;
    });

    if (isAlreadyUsed) {
      alert("Esse jogador já foi selecionado neste Super 8.");
      return;
    }

    setResults((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], userId };
      return copy;
    });
  }

  function handleGamesChange(index, value) {
    setResults((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], gamesWon: value };
      return copy;
    });
  }

  // salvar resultados em massa (modo antigo)
  async function handleSaveResults() {
    if (!selectedSuper8) {
      alert("Selecione um Super 8 primeiro");
      return;
    }

    const payload = results
      .filter((r) => r.userId !== "")
      .map((r) => ({
        userId: r.userId,
        gamesWon: Number(r.gamesWon || 0),
      }));

    if (payload.length === 0) {
      alert("Preencha pelo menos um jogador");
      return;
    }

    await api.post(`/super8/${selectedSuper8}/results/bulk`, {
      results: payload,
    });
    alert("Resultados salvos com sucesso!");
    loadRanking();
    // zera os games
    setResults((prev) => prev.map((r) => ({ ...r, gamesWon: "" })));
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Super 8 – Dashboard</h1>
        <p>Crie torneios, registre resultados e veja o ranking global.</p>
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
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600 }}>{s8.name}</span>
                <br />
                <small>
                  {s8.createdAt
                    ? new Date(s8.createdAt).toLocaleDateString("pt-BR")
                    : ""}
                </small>
              </div>
              <button
                className="secondary-btn"
                onClick={() => navigate(`/super8/${s8.id}`)}
              >
                Abrir
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDeleteSuper8(s8.id)}
              >
                🗑️
              </button>
            </div>
          ))}
          {super8s.length === 0 && <p>Nenhum Super 8 criado.</p>}
        </div>
      </div>

      {/* registrar resultados rapidão */}
      <div className="section-card">
        <div className="section-title">
          <span>Registrar resultados (modo rápido)</span>
        </div>
        <div className="results-select-row">
          <label>Super 8:</label>
          <select
            value={selectedSuper8}
            onChange={(e) => setSelectedSuper8(e.target.value)}
          >
            <option value="">Selecione...</option>
            {super8s.map((s8) => (
              <option key={s8.id} value={s8.id}>
                {s8.name}
              </option>
            ))}
          </select>
          <button className="secondary-btn" onClick={handleFillWithAngels}>
            Completar com Anjos
          </button>
        </div>
        <div className="results-list">
          {results.map((row, index) => (
            <div className="results-row" key={index}>
              <select
                value={row.userId}
                onChange={(e) => handleUserChange(index, e.target.value)}
              >
                <option value="">-- selecione --</option>
                <option value="angel">Anjo</option>
                {users.map((u) => (
                  <option
                    key={u.id}
                    value={u.id}
                    disabled={isUserAlreadyChosen(u.id, index)}
                  >
                    {u.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                placeholder="Games"
                value={row.gamesWon}
                onChange={(e) => handleGamesChange(index, e.target.value)}
              />
            </div>
          ))}
        </div>
        <button className="primary-btn" onClick={handleSaveResults}>
          Salvar resultados
        </button>
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
