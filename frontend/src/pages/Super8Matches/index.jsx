/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./style.css";

export default function Super8Matches() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [super8, setSuper8] = useState(null);
  const [users, setUsers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [showPodium, setShowPodium] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // carregar dados iniciais
  useEffect(() => {
    async function load() {
      try {
        const [s8Res, usersRes] = await Promise.all([
          api.get(`/super8/${id}`),
          api.get("/usuarios"),
        ]);
        setSuper8(s8Res.data);
        setUsers(usersRes.data);

        // 8 slots
        const initialPlayers = Array.from({ length: 8 }, (_, i) => {
          const u = usersRes.data[i];
          return { userId: u ? u.id : "" };
        });
        setPlayers(initialPlayers);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      }
    }
    load();
    loadRanking();
  }, [id]);

  async function loadRanking() {
    try {
      const res = await api.get(`/super8/${id}/ranking`);
      setRanking(res.data);
    } catch (err) {
      console.error("Erro ao carregar ranking do super 8:", err);
    }
  }

  // completa vazios com anjos numerados
  function handleFillAngels() {
    setPlayers((prev) =>
      prev.map((p, idx) => {
        if (!p.userId) return { userId: `angel-${idx + 1}` };
        return p;
      })
    );
  }

  function handlePlayerChange(index, userId) {
    setPlayers((prev) => {
      const copy = [...prev];
      copy[index] = { userId };
      return copy;
    });
  }

  // gerar os 14 jogos fixos
  function handleGenerateMatches() {
    if (players.length < 8 || players.some((p) => !p.userId)) {
      alert("Preencha as 8 posições primeiro (pode usar Anjo).");
      return;
    }

    const schedule = [
      [
        [0, 1],
        [2, 3],
      ],
      [
        [4, 5],
        [6, 7],
      ],
      [
        [5, 7],
        [1, 3],
      ],
      [
        [4, 6],
        [0, 2],
      ],
      [
        [0, 6],
        [1, 7],
      ],
      [
        [2, 4],
        [3, 5],
      ],
      [
        [2, 5],
        [0, 7],
      ],
      [
        [1, 6],
        [3, 4],
      ],
      [
        [2, 7],
        [1, 4],
      ],
      [
        [0, 5],
        [3, 6],
      ],
      [
        [0, 3],
        [4, 7],
      ],
      [
        [1, 2],
        [5, 6],
      ],
      [
        [1, 5],
        [0, 4],
      ],
      [
        [2, 6],
        [3, 7],
      ],
    ];

    const generated = schedule.map((game, idx) => {
      const [[a1, a2], [b1, b2]] = game;
      return {
        id: idx + 1,
        playerA1: players[a1].userId,
        playerA2: players[a2].userId,
        playerB1: players[b1].userId,
        playerB2: players[b2].userId,
        gamesA: "",
        gamesB: "",
      };
    });

    setMatches(generated);
    setShowPodium(false);
  }

  // nomezinho
  function getNameById(userId) {
    if (!userId) return "—";
    if (userId.startsWith("angel-")) {
      const num = userId.split("-")[1] || "";
      return `Anjo ${num}`;
    }
    const u = users.find((u) => u.id === userId);
    return u ? u.name : "Desconhecido";
  }

  // ranking denso
  function buildDenseRanking(list) {
    let currentPos = 0;
    let lastScore = null;
    return list.map((player) => {
      if (player.totalGames !== lastScore) {
        currentPos += 1;
        lastScore = player.totalGames;
      }
      return { ...player, position: currentPos };
    });
  }

  // limitar placar: 1..6 e soma <= 6
  function handleScoreChange(matchIndex, field, value) {
    let num = value === "" ? "" : Number(value);
    if (num !== "" && (num < 1 || num > 6)) {
      return;
    }

    setMatches((prev) => {
      const copy = [...prev];
      const current = { ...copy[matchIndex] };
      const otherField = field === "gamesA" ? "gamesB" : "gamesA";
      const otherVal =
        current[otherField] === "" ? "" : Number(current[otherField]);

      current[field] = num === "" ? "" : num;

      if (
        current[field] !== "" &&
        otherVal !== "" &&
        current[field] + otherVal > 6
      ) {
        current[otherField] = 6 - current[field];
        if (current[otherField] < 1) {
          current[otherField] = "";
        }
      }

      copy[matchIndex] = current;
      return copy;
    });
  }

  // botão único
  async function handleFinalResult() {
    if (matches.length === 0) {
      alert("Gere os jogos primeiro.");
      return;
    }

    const someEmpty = matches.some((m) => m.gamesA === "" || m.gamesB === "");
    if (someEmpty) {
      alert("Preencha o placar de todos os 14 jogos antes de finalizar.");
      return;
    }

    setIsSaving(true);

    try {
      for (const match of matches) {
        const duplas = [
          {
            player1: match.playerA1,
            player2: match.playerA2,
            games: Number(match.gamesA),
          },
          {
            player1: match.playerB1,
            player2: match.playerB2,
            games: Number(match.gamesB),
          },
        ];

        for (const d of duplas) {
          // jogador 1 (pode ser anjo-x)
          await api.post(`/super8/${id}/match`, {
            playerAId: d.player1,
            playerBId: null,
            gamesA: d.games,
            gamesB: 0,
          });
          // jogador 2
          await api.post(`/super8/${id}/match`, {
            playerAId: d.player2,
            playerBId: null,
            gamesA: d.games,
            gamesB: 0,
          });
        }
      }

      await loadRanking();
      setShowPodium(true);
      alert("Resultados registrados!");
    } catch (err) {
      console.error("Erro ao registrar resultados:", err);
      alert("Erro ao registrar resultados.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="super8-page">
      <div className="super8-topbar">
        <button onClick={() => navigate("/dashboard")} className="back-btn">
          ← Voltar
        </button>
        <h1>{super8 ? super8.name : "Carregando..."}</h1>
        <p>Jogos do Super 8 no formato oficial (14 jogos).</p>
      </div>

      {/* jogadores */}
      <div className="section-card">
        <div className="section-title">
          <span>Jogadores deste Super 8</span>
        </div>
        <div className="players-grid">
          {players.map((p, index) => (
            <select
              key={index}
              value={p.userId}
              onChange={(e) => handlePlayerChange(index, e.target.value)}
            >
              <option value="">-- vazio --</option>
              <option value={`angel-${index + 1}`}>Anjo {index + 1}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          ))}
        </div>
        <button className="secondary-btn" onClick={handleFillAngels}>
          Completar com Anjos
        </button>
        <button className="primary-btn" onClick={handleGenerateMatches}>
          Gerar jogos (14)
        </button>
      </div>

      {/* jogos */}
      <div className="section-card">
        <div className="section-title">
          <span>Jogos</span>
          <small>{matches.length} jogos</small>
        </div>

        {matches.length === 0 ? (
          <p>Nenhum jogo gerado ainda.</p>
        ) : (
          <div className="matches-list">
            {matches.map((m, idx) => (
              <div key={m.id} className="match-row">
                <span className="match-number">#{m.id}</span>
                <span>
                  {getNameById(m.playerA1)} / {getNameById(m.playerA2)}
                </span>
                <input
                  type="number"
                  min="1"
                  max="6"
                  placeholder="Games"
                  value={m.gamesA}
                  onChange={(e) =>
                    handleScoreChange(idx, "gamesA", e.target.value)
                  }
                />
                <span className="vs">x</span>
                <input
                  type="number"
                  min="1"
                  max="6"
                  placeholder="Games"
                  value={m.gamesB}
                  onChange={(e) =>
                    handleScoreChange(idx, "gamesB", e.target.value)
                  }
                />
                <span>
                  {getNameById(m.playerB1)} / {getNameById(m.playerB2)}
                </span>
              </div>
            ))}
          </div>
        )}

        {matches.length > 0 && (
          <button
            className="final-btn"
            onClick={handleFinalResult}
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Resultado final"}
          </button>
        )}
      </div>

      {/* pódio */}
      {showPodium && (
        <div className="section-card">
          <div className="section-title">
            <span>Pódio</span>
          </div>
          {ranking.length === 0 ? (
            <p>Ninguém pontuou.</p>
          ) : (
            (() => {
              const dense = buildDenseRanking(ranking);
              const top3 = dense.filter((p) => p.position <= 3);
              const countByPos = top3.reduce((acc, p) => {
                acc[p.position] = (acc[p.position] || 0) + 1;
                return acc;
              }, {});

              return (
                <div className="podium-wrapper">
                  {top3.map((p) => (
                    <div
                      key={p.userId}
                      className={`podium-card ${
                        p.position === 1 ? "champion" : ""
                      }`}
                    >
                      <span className="podium-place">
                        {p.position === 1
                          ? "🥇 Campeão"
                          : p.position === 2
                          ? "🥈 2º lugar"
                          : "🥉 3º lugar"}
                      </span>
                      {countByPos[p.position] > 1 && (
                        <span className="tie-badge">empate</span>
                      )}
                      <span className="podium-name">{p.name}</span>
                      <span className="podium-points">
                        {p.totalGames} games
                      </span>
                    </div>
                  ))}

                  <div className="others">
                    {dense
                      .filter((p) => p.position > 3)
                      .map((p) => (
                        <div key={p.userId} className="other-line">
                          {p.position}º — {p.name} ({p.totalGames} games)
                        </div>
                      ))}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
}
