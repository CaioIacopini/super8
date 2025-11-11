import cors from "cors";
import express from "express";
import { PrismaClient } from "./generated/prisma/index.js";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());

// vamos mapear os anjos do front p/ ObjectId válido
const ANGEL_OBJECT_IDS = {
  "angel-1": "000000000000000000000001",
  "angel-2": "000000000000000000000002",
  "angel-3": "000000000000000000000003",
  "angel-4": "000000000000000000000004",
  "angel-5": "000000000000000000000005",
  "angel-6": "000000000000000000000006",
  "angel-7": "000000000000000000000007",
  "angel-8": "000000000000000000000008",
};

// helper: é anjo?
function isAngelId(userId) {
  return !userId || userId.startsWith("angel-");
}

// converte "angel-3" para um ObjectId fixo
function toAngelObjectId(userId) {
  return ANGEL_OBJECT_IDS[userId] || "0000000000000000000000ff";
}

/* ===================== USUÁRIOS ===================== */

app.post("/usuarios", async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: {
        email: req.body.email,
        name: req.body.name,
        age: req.body.age,
      },
    });
    res.status(201).json(user);
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    res.status(400).json({ error: "Erro ao criar usuário" });
  }
});

app.get("/usuarios", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (err) {
    console.error("Erro ao buscar usuários:", err);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

app.delete("/usuarios/:id", async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id },
    });
    res.status(200).json({ message: "User was deleted" });
  } catch (err) {
    console.error("Erro ao deletar usuário:", err);
    res.status(400).json({ error: "Erro ao deletar usuário" });
  }
});

/* ===================== SUPER 8 ===================== */

app.post("/super8", async (req, res) => {
  try {
    const super8 = await prisma.super8.create({
      data: {
        name: req.body.name || "Super 8",
      },
    });
    res.status(201).json(super8);
  } catch (err) {
    console.error("Erro ao criar Super 8:", err);
    res.status(400).json({ error: "Erro ao criar Super 8" });
  }
});

app.get("/super8", async (req, res) => {
  try {
    const list = await prisma.super8.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(list);
  } catch (err) {
    console.error("Erro ao listar Super 8:", err);
    res.status(500).json({ error: "Erro ao listar Super 8" });
  }
});

app.get("/super8/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const s8 = await prisma.super8.findUnique({
      where: { id },
    });
    if (!s8) return res.status(404).json({ error: "Super 8 não encontrado" });
    res.json(s8);
  } catch (err) {
    console.error("Erro ao buscar Super 8:", err);
    res.status(400).json({ error: "Erro ao buscar Super 8" });
  }
});

// apaga tudo
app.delete("/super8/reset-all", async (req, res) => {
  try {
    await prisma.super8Result.deleteMany({});
    await prisma.super8.deleteMany({});
    res
      .status(200)
      .json({ message: "Todos os Super 8 e resultados foram apagados" });
  } catch (err) {
    console.error("Erro ao resetar Super 8:", err);
    res.status(400).json({ error: "Erro ao resetar Super 8" });
  }
});

// apaga 1
app.delete("/super8/:id", async (req, res) => {
  try {
    const id = req.params.id;

    await prisma.super8Result.deleteMany({
      where: { super8Id: id },
    });

    await prisma.super8.delete({
      where: { id },
    });

    res.status(200).json({ message: "Super 8 deletado com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar Super 8:", err);
    res.status(400).json({ error: "Erro ao deletar Super 8" });
  }
});

/* =========== registrar jogo (usado pela página 3) =========== */

app.post("/super8/:id/match", async (req, res) => {
  const super8Id = req.params.id;
  const { playerAId, playerBId, gamesA, gamesB } = req.body;

  async function addGames(userId, games) {
    // anjo numerado
    if (isAngelId(userId)) {
      const angelObjId = toAngelObjectId(userId);
      // vamos somar por angelObjId (assim anjo-1 fica sempre o mesmo)
      const existingAngel = await prisma.super8Result.findFirst({
        where: {
          super8Id,
          userId: angelObjId,
        },
      });

      if (existingAngel) {
        await prisma.super8Result.update({
          where: { id: existingAngel.id },
          data: {
            gamesWon: existingAngel.gamesWon + games,
            isAngel: true,
          },
        });
      } else {
        await prisma.super8Result.create({
          data: {
            super8Id,
            userId: angelObjId,
            gamesWon: games,
            isAngel: true,
          },
        });
      }
      return;
    }

    // jogador normal
    const existing = await prisma.super8Result.findFirst({
      where: {
        super8Id,
        userId,
      },
    });

    if (existing) {
      await prisma.super8Result.update({
        where: { id: existing.id },
        data: {
          gamesWon: existing.gamesWon + games,
          isAngel: false,
        },
      });
    } else {
      await prisma.super8Result.create({
        data: {
          super8Id,
          userId,
          gamesWon: games,
          isAngel: false,
        },
      });
    }
  }

  try {
    if (playerAId) {
      await addGames(playerAId, Number(gamesA || 0));
    }
    if (playerBId) {
      await addGames(playerBId, Number(gamesB || 0));
    }

    res.status(201).json({ message: "Jogo registrado" });
  } catch (err) {
    console.error("Erro ao registrar jogo:", err);
    res.status(400).json({ error: "Erro ao registrar jogo" });
  }
});

/* =========== ranking de UM super 8 (com anjos numerados) =========== */

app.get("/super8/:id/ranking", async (req, res) => {
  const super8Id = req.params.id;
  try {
    const results = await prisma.super8Result.findMany({
      where: { super8Id },
      include: { user: true },
    });

    const map = {};

    for (const r of results) {
      if (r.isAngel) {
        // descobrir qual anjo é pelo userId salvo
        const angelEntry = Object.entries(ANGEL_OBJECT_IDS).find(
          ([, objId]) => objId === r.userId
        );
        const angelLabel = angelEntry ? angelEntry[0] : "angel-x";
        const angelNumber = angelLabel.split("-")[1] || "?";
        const key = r.userId; // objectId do anjo

        if (!map[key]) {
          map[key] = {
            userId: key,
            name: `Anjo ${angelNumber}`,
            email: "",
            totalGames: 0,
          };
        }
        map[key].totalGames += r.gamesWon;
        continue;
      }

      // jogador real
      const key = r.userId;
      if (!map[key]) {
        map[key] = {
          userId: key,
          name: r.user?.name || "Sem nome",
          email: r.user?.email || "",
          totalGames: 0,
        };
      }
      map[key].totalGames += r.gamesWon;
    }

    const ranking = Object.values(map).sort(
      (a, b) => b.totalGames - a.totalGames
    );

    res.json(ranking);
  } catch (err) {
    console.error("Erro ao pegar ranking do Super 8:", err);
    res.status(400).json({ error: "Erro ao pegar ranking do Super 8" });
  }
});

/* ===================== RANKING GLOBAL ===================== */
// aqui anjo NÃO conta

app.get("/ranking", async (req, res) => {
  try {
    const results = await prisma.super8Result.findMany({
      include: { user: true },
    });

    const map = {};

    for (const r of results) {
      if (r.isAngel || !r.userId) continue; // ignora anjo no global

      if (!map[r.userId]) {
        map[r.userId] = {
          userId: r.userId,
          name: r.user?.name || "Sem nome",
          email: r.user?.email || "",
          totalGames: 0,
        };
      }
      map[r.userId].totalGames += r.gamesWon;
    }

    const ranking = Object.values(map).sort(
      (a, b) => b.totalGames - a.totalGames
    );

    res.json(ranking);
  } catch (err) {
    console.error("Erro ao montar ranking:", err);
    res.status(500).json({ error: "Erro ao montar ranking" });
  }
});

app.delete("/ranking/reset", async (req, res) => {
  try {
    await prisma.super8Result.deleteMany({});
    res.status(200).json({ message: "Ranking zerado com sucesso" });
  } catch (err) {
    console.error("Erro ao zerar ranking:", err);
    res.status(400).json({ error: "Erro ao zerar ranking" });
  }
});

app.listen(3000, () => {
  console.log("API rodando na porta 3000");
});

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
