// Load environment variables from .env into process.env so `env("...")` works below.
import "dotenv/config";

const config = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL,
  },
};

export default config;
