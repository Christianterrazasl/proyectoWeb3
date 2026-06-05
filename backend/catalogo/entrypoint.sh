#!/bin/sh
set -e

node - <<'NODE'
const net = require("net");

function waitFor(host, port, label) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tryConnect = () => {
      const socket = net.createConnection({ host, port }, () => {
        socket.end();
        console.log(`✅ ${label} disponible`);
        resolve();
      });

      socket.on("error", () => {
        attempts += 1;
        if (attempts >= 30) {
          reject(new Error(`${label} no respondió a tiempo`));
          return;
        }
        setTimeout(tryConnect, 2000);
      });
    };

    tryConnect();
  });
}

async function main() {
  const postgresHost = process.env.POSTGRES_HOST || "catalogo-db";
  const mongoHost = process.env.MONGO_HOST || "catalogo-mongo";

  await waitFor(postgresHost, 5432, "PostgreSQL");
  await waitFor(mongoHost, 27017, "MongoDB");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
NODE

exec npm start
