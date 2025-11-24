import cors from "cors";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "./generated/prisma/index.js";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());

const JWT_SECRET = "super8-secret-very-strong";

// ============== helpers de anjo ==============
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

function isAngelId(userId) {
  return !userId || userId.startsWith("angel-");
}
function toAngelObjectId(userId) {
  return ANGEL_OBJECT_IDS[userId] || "0000000000000000000000ff";
}

// ============== middlewares ==============
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token não enviado" });

  const [, token] = authHeader.split(" ");
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

function isAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Apenas admin pode fazer isso" });
  }
  next();
}

// ===================== AUTH =====================

app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Nome, e-mail e senha são obrigatórios." });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: "Já existe um usuário com este e-mail." });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "USER", // padrão
      },
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // nunca devolve senha
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("Erro no /auth/register:", err);
    res.status(500).json({ error: "Erro ao criar usuário." });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Usuário não encontrado" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Senha inválida" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Erro ao logar:", err);
    res.status(400).json({ error: "Erro ao logar" });
  }
});

// rota pra promover alguém (precisa de admin)
app.post("/auth/make-admin", auth, isAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Informe o email" });

    const user = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });

    res.json({ message: `Usuário ${user.email} agora é ADMIN` });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Erro ao promover admin" });
  }
});

// ===================== USUÁRIOS =====================

// lista básica para TODOS logados (id + name) -> pra montar selects
app.get("/usuarios/basic", auth, async (req, res) => {
  try {
    const { search } = req.query;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const list = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true, // ajuda a exibir no app na lista de busca
      },
      orderBy: { name: "asc" },
      take: 30, // limita a quantidade, opcional
    });

    res.json(list);
  } catch (err) {
    console.error("Erro ao buscar usuários básicos:", err);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// lista completa -> só admin
app.get("/usuarios", auth, isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        role: true,
      },
    });
    res.status(200).json(users);
  } catch (err) {
    console.error("Erro ao buscar usuários:", err);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

app.delete("/usuarios/:id", auth, isAdmin, async (req, res) => {
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

// ===================== SUPER 8 =====================

// criar -> QUALQUER logado
app.post("/super8", auth, async (req, res) => {
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

app.get("/super8", auth, async (req, res) => {
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

app.get("/super8/:id", auth, async (req, res) => {
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

// apaga tudo -> admin
app.delete("/super8/reset-all", auth, isAdmin, async (req, res) => {
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

// apaga 1 -> admin
app.delete("/super8/:id", auth, isAdmin, async (req, res) => {
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

// registrar jogo
app.post("/super8/:id/match", auth, async (req, res) => {
  const super8Id = req.params.id;
  const { playerAId, playerBId, gamesA, gamesB } = req.body;

  async function addGames(userId, games) {
    if (isAngelId(userId)) {
      const angelObjId = toAngelObjectId(userId);
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

// ranking de UM super 8 (anjos contam aqui)
app.get("/super8/:id/ranking", auth, async (req, res) => {
  const super8Id = req.params.id;
  try {
    const results = await prisma.super8Result.findMany({
      where: { super8Id },
      include: { user: true },
    });

    const map = {};

    for (const r of results) {
      if (r.isAngel) {
        const angelEntry = Object.entries(ANGEL_OBJECT_IDS).find(
          ([, objId]) => objId === r.userId
        );
        const angelLabel = angelEntry ? angelEntry[0] : "angel-x";
        const angelNumber = angelLabel.split("-")[1] || "?";
        const key = r.userId;

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

// ===================== RANKING GLOBAL =====================
// anjo NÃO conta aqui
app.get("/ranking", auth, async (req, res) => {
  try {
    const results = await prisma.super8Result.findMany({
      include: { user: true },
    });

    const map = {};

    for (const r of results) {
      if (r.isAngel || !r.userId) continue;

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

app.delete("/ranking/reset", auth, isAdmin, async (req, res) => {
  try {
    await prisma.super8Result.deleteMany({});
    res.status(200).json({ message: "Ranking zerado com sucesso" });
  } catch (err) {
    console.error("Erro ao zerar ranking:", err);
    res.status(400).json({ error: "Erro ao zerar ranking" });
  }
});

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve build do React
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"))
);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// no fim do server.js
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
