#!/usr/bin/env node
/**
 * Genera el README del perfil de GitHub (DiegoCortes07/DiegoCortes07).
 *
 * Consulta la API de GitHub para verificar que los repositorios destacados
 * sigan existiendo y para traer sus estrellas y lenguaje principal.
 *
 * Uso: node scripts/generate-readme.mjs
 */

import { writeFile } from "node:fs/promises";

const USER = "DiegoCortes07";
const SITE = "https://diegocortes07.github.io/portfolio/";
const OUTPUT = new URL("../README.md", import.meta.url);

/**
 * Los 3 proyectos destacados. Para cambiar uno, edita esta lista:
 * el repositorio debe ser exactamente el nombre en GitHub.
 */
const FEATURED = [
  {
    name: "Frontend_Proyecto_Soluciones_Moviles",
    emoji: "🎵",
    title: "Tunesly",
    subtitle: "App móvil tipo Spotify (frontend + backend)",
    stack: ["React Native", "Expo", "TypeScript", "Node.js", "Express", "JWT"],
    summary:
      "Proyecto full stack completo: app multiplataforma con reproducción de audio en cola, favoritos, playlists, podcasts y verificación por correo, más la API REST con JWT que la alimenta.",
    /** Repositorios que se muestran juntos en una tabla. */
    pair: [
      {
        role: "Frontend",
        emoji: "📱",
        name: "Frontend_Proyecto_Soluciones_Moviles",
        stack: "React Native · Expo · TypeScript",
      },
      {
        role: "Backend",
        emoji: "🖥️",
        name: "Backend_Proyecto_Soluciones_Moviles",
        stack: "Node.js · Express · Sequelize · JWT",
      },
    ],
  },
  {
    name: "Hackadisc2026",
    emoji: "📊",
    title: "Hackadisc",
    subtitle: "Dashboard de ventas con ETL",
    award: "2° lugar en Hackadisc 2026",
    stack: ["Python", "FastAPI", "Next.js", "SQLite"],
    summary:
      "KPIs, metas y pronósticos por vendedor con un ETL re-ejecutable de Excel a SQLite, roles de gerencia/ejecutivo y CI completo.",
  },
  {
    name: "Backend-Ayudantia-DSM",
    emoji: "⚙️",
    title: "Backend Ayudantía DSM",
    subtitle: "API REST en tiempo real",
    stack: ["Node.js", "Express", "Sequelize", "Socket.IO"],
    summary:
      "API REST con migraciones, seeds transaccionales, autenticación con bcrypt y una simulación de delivery por WebSockets.",
  },
];

/** Stack que muestro como badges. */
const STACK = [
  ["TypeScript", "3178C6"],
  ["JavaScript", "F7DF1E"],
  ["Python", "3776AB"],
  ["React", "61DAFB"],
  ["React Native", "61DAFB"],
  ["Next.js", "000000"],
  ["Node.js", "5FA04E"],
  ["Express", "000000"],
  ["FastAPI", "009688"],
  ["SQLite", "003B57"],
  ["GitHub Actions", "2088FF"],
];

const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": `${USER}-profile-readme`,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API ${res.status} en ${path}`);
  return res.json();
}

const badge = (label, color) =>
  `![${label}](https://img.shields.io/badge/${label.replace(/ /g, "_").replace(/-/g, "--")}-${color}?style=for-the-badge&logoColor=white)`;

function featuredBlock(item, repos) {
  const reposByName = new Map(repos.filter(Boolean).map((r) => [r.name, r]));
  const primary = reposByName.get(item.name);
  const url = primary?.html_url ?? `https://github.com/${USER}/${item.name}`;
  const stars = primary?.stargazers_count ? ` · ⭐ ${primary.stargazers_count}` : "";
  const meta = [...item.stack.map((s) => `\`${s}\``), `${stars}`.trim()]
    .filter(Boolean)
    .join(" ");

  // Si el proyecto tiene frontend + backend, se muestran juntos en una tabla.
  const pairs = item.pair?.filter(
    (p, i) => i === 0 || reposByName.has(p.name),
  );

  const links = pairs
    ? [
        "| Parte | Repositorio | Stack |",
        "| :--- | :--- | :--- |",
        ...pairs.map((p) => {
          const repo = reposByName.get(p.name);
          const link = repo ? `[**${p.name}**](${repo.html_url})` : `**${p.name}**`;
          return `| ${p.emoji} **${p.role}** | ${link} | ${p.stack} |`;
        }),
      ].join("\n")
    : `**[→ Ver repositorio](${url})**`;

  return [
    `### ${item.emoji} ${item.title} — <sub>${item.subtitle}</sub>`,
    "",
    ...(item.award ? [`> 🥈 **${item.award}**`, ""] : []),
    item.summary,
    "",
    meta,
    "",
    links,
    "",
    "",
  ].join("\n");
}

async function main() {
  const allNames = [
    ...new Set(FEATURED.flatMap((f) => [f.name, ...(f.pair ?? []).map((p) => p.name)])),
  ];

  const [user, ...fetched] = await Promise.all([
    gh(`/users/${USER}`),
    ...allNames.map((name) => gh(`/repos/${USER}/${name}`)),
  ]);

  const reposByName = new Map(fetched.filter(Boolean).map((r) => [r.name, r]));
  const repos = [...reposByName.values()];

  const missing = allNames.filter((name) => !reposByName.has(name));
  if (missing.length > 0) {
    console.warn(`Aviso: no se pudo acceder a estos repositorios: ${missing.join(", ")}`);
  }

  const blocks = FEATURED.map((item) => ({ item, repos }));

  const updatedHuman = new Date().toLocaleDateString("es-CL", {
    dateStyle: "long",
    timeZone: "UTC",
  });

  const md = `<div align="center">

# Hola, soy Diego Cortés 👋

**Desarrollador Full Stack** · Construyo productos completos, de la base de datos a la interfaz

[${badge("Portafolio", "38bdf8")}](${SITE})
[![GitHub](https://img.shields.io/badge/GitHub-DiegoCortes07-181717?style=for-the-badge&logo=github&logoColor=white)](${user.html_url})

</div>

## 👨‍💻 Sobre mí

Me enfoco en el **desarrollo Full Stack**: me gusta tomar una idea, modelar los datos, exponer una API y entregar una interfaz que se sienta bien. Trabajo cómodo en cualquiera de las tres capas.

Uso la **IA como parte central de mi flujo de trabajo**: agentes de código para implementar y refactorizar, generación asistida de pruebas y documentación, y automatización de tareas repetitivas. No la uso como atajo, sino para sostener un ritmo de trabajo más rápido y con más calidad en cada entrega.

- 🧩 **Full Stack**: TypeScript y Python en el backend, React y React Native en el frontend
- 🤖 **IA aplicada**: agentes de desarrollo, automatización de flujos y revisión asistida de código
- ⚙️ **Automatización**: pipelines de CI/CD, ETL de datos y scripts de sincronización
- 🌐 Portafolio: **[${SITE.replace("https://", "")}](${SITE})**

## 🛠️ Stack

<div align="center">

${STACK.map(([name, color]) => badge(name, color)).join("\n")}

</div>

## 🚀 Proyectos destacados

${blocks.map((b) => featuredBlock(b.item, b.repos)).join("---\n\n")}
---

<div align="center">

<sub>🤖 Este README se sincroniza automáticamente con GitHub Actions.<br/>
Última sincronización: ${updatedHuman}</sub>

</div>
`;

  await writeFile(OUTPUT, md, "utf8");
  console.log(`README generado con ${blocks.length} proyectos destacados.`);
}

main().catch((error) => {
  console.error("No se pudo generar el README:", error);
  process.exit(1);
});
