#!/usr/bin/env node
/**
 * Genera el README del perfil de GitHub (DiegoCortes07/DiegoCortes07).
 *
 * Consulta la API de GitHub para obtener los repositorios públicos y construye
 * el README. Los repos nuevos aparecen solos; los repos listados en `CURATED`
 * llevan una descripción y viñetas escritas a mano.
 *
 * Uso: node scripts/generate-readme.mjs
 */

import { writeFile } from "node:fs/promises";

const USER = "DiegoCortes07";
const SITE = "https://diegocortes07.github.io/portfolio/";
const OUTPUT = new URL("../README.md", import.meta.url);

/** Repos que no se listan: el propio repo de perfil y pruebas sueltas. */
const EXCLUDED = new Set(["DiegoCortes07", "Test"]);

const PALETTE = ["5eead4", "a5b4fc", "f9a8d4", "fcd34d", "7dd3fc", "fdba74"];

/**
 * Proyectos destacados: orden, descripción y viñetas curadas a mano.
 * La clave es el nombre del repositorio en GitHub.
 */
const CURATED = [
  {
    name: "Frontend_Proyecto_Soluciones_Moviles",
    title: "Tunesly — App móvil tipo Spotify",
    emoji: "🎵",
    description:
      "Aplicación móvil multiplataforma (Android, iOS y web) tipo Spotify construida con React Native + Expo + TypeScript. Catálogo de música y podcasts, reproductor global con cola, favoritos y playlists contra una API REST propia.",
    highlights: [
      "Reproductor global con **cola de reproducción**, seek y mini-reproductor persistente entre pantallas",
      "Autenticación completa: registro, login y verificación de correo con contexto de sesión por token",
      "Biblioteca personal con **favoritos optimistas** y playlists con portada, descripción y CRUD de canciones",
      "Tema claro/oscuro, idioma, filtro de contenido explícito y plan de suscripción persistidos vía API",
    ],
    stack: ["React Native", "Expo", "TypeScript", "React Navigation", "expo-audio", "axios"],
  },
  {
    name: "Hackadisc2026",
    title: "Hackadisc — Dashboard de ventas",
    emoji: "📊",
    description:
      "Dashboard de ventas de Insecap: KPIs por vendedor y por equipo, metas, pronóstico de cierre mensual y oportunidades comerciales priorizadas, con vistas separadas para gerencia y ejecutivos.",
    highlights: [
      "ETL re-ejecutable de Excel a SQLite: **24.664 comercializaciones** y **18.570 cotizaciones**",
      "Autenticación con roles de gerencia/ejecutivo y seed de usuarios con claves aleatorias",
      "CI en GitHub Actions con pytest, lint, typecheck y build del frontend",
      "Bandeja de alertas unificada, cartera de clientes, cobranza por antigüedad y exportación a CSV",
    ],
    stack: ["Python", "FastAPI", "Next.js", "SQLite", "ETL", "CI/CD"],
  },
  {
    name: "Backend-Ayudantia-DSM",
    title: "Backend Ayudantía DSM — API REST educativa",
    emoji: "⚙️",
    description:
      "Backend construido sesión a sesión para las ayudantías de DSM: API REST sobre Express con Sequelize, migraciones, seeds transaccionales y una simulación de delivery en tiempo real con Socket.IO.",
    highlights: [
      "Modelos **Role**, **User** y **Product** con migraciones y asociaciones Sequelize",
      "Contraseñas hasheadas con bcrypt y validación de duplicados en una sola query con `Op.or`",
      "Seeds ejecutados dentro de una transacción con rollback automático ante errores",
      "Simulación pub/sub de ubicación de delivery con **Socket.IO** y salas",
    ],
    stack: ["Node.js", "Express", "Sequelize", "SQLite", "Socket.IO", "bcrypt"],
  },
  {
    name: "Frontend-Ayudantia-DSM",
    title: "Frontend Ayudantía DSM — Expo Router",
    emoji: "📱",
    description:
      "Proyecto de apoyo de las ayudantías de DSM con Expo y Expo Router, donde se implementan pantalla a pantalla las funcionalidades del curso.",
    highlights: [
      "Navegación con Expo Router y ruta raíz que redirige a `/login`",
      "Pantalla de login con campos controlados y contador para practicar estado en React Native",
      "Documentación progresiva por ayudantía dentro del propio README",
    ],
    stack: ["React Native", "Expo Router", "JavaScript"],
  },
  {
    name: "Proyecto-Rayman-5",
    title: "Proyecto Rayman 5 — Experiencia de Realidad Aumentada",
    emoji: "🕶️",
    description:
      "Experiencia de Realidad Aumentada desarrollada en Unity, explorando la integración de objetos virtuales sobre entornos físicos reales.",
    highlights: [
      "Desarrollado en **Unity con C#**",
      "Experiencia interactiva de AR",
    ],
    stack: ["Unity", "C#", "Realidad Aumentada"],
  },
  {
    name: "ProyectoIngSoftware2025-1",
    title: "Proyecto Ingeniería de Software 2025-1",
    emoji: "🎓",
    description:
      "Proyecto del curso de Ingeniería de Software, aplicando el ciclo completo de análisis, diseño e implementación de una aplicación web.",
    highlights: [
      "Desarrollado en **PHP** como parte del ramo de Ingeniería de Software",
      "Enfoque en levantamiento de requerimientos, modelado y diseño",
    ],
    stack: ["PHP", "SQL", "Ingeniería de Software"],
  },
  {
    name: "vite-project",
    title: "Calculadora React + Vite",
    emoji: "🧮",
    description:
      "Calculadora web construida como proyecto de práctica con React y Vite, explorando el manejo de estado y la lógica de eventos en el frontend.",
    highlights: [
      "Bundle y dev server con **Vite**",
      "Componentes de React con estado controlado",
    ],
    stack: ["React", "Vite", "CSS"],
  },
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
  if (!res.ok) throw new Error(`GitHub API ${res.status} en ${path}`);
  return res.json();
}

const badge = (label, color) =>
  `![${label}](https://img.shields.io/badge/${encodeURIComponent(label).replace(/%20/g, "_").replace(/-/g, "--")}-${color}?style=flat-square)`;

const escapeCell = (text) => String(text ?? "").replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("es-CL", { year: "numeric", month: "short", day: "numeric" })
    : "—";

function curatedBlock(project, repo) {
  const url = repo?.html_url ?? `https://github.com/${USER}/${project.name}`;
  const stars = repo?.stargazers_count ? ` · ⭐ ${repo.stargazers_count}` : "";
  const lang = repo?.language ?? project.stack[0];

  const lines = [
    `<h3>${project.emoji} <a href="${url}">${project.name}</a></h3>`,
    "",
    `> **${project.title}**`,
    "",
    project.description,
    "",
    ...project.highlights.map((h) => `- ${h}`),
    "",
    `${project.stack.map((s) => `\`${s}\``).join(" ")}${lang ? ` · **${lang}**` : ""}${stars}`,
    "",
  ];
  return lines.join("\n");
}

function autoRow(repo) {
  const lang = repo.language ?? "—";
  const desc = repo.description ?? "Sin descripción";
  return `| [**${repo.name}**](${repo.html_url}) | ${escapeCell(desc)} | ${lang} | ${formatDate(repo.pushed_at)} |`;
}

async function main() {
  const [user, repos] = await Promise.all([gh(`/users/${USER}`), gh(`/users/${USER}/repos?per_page=100&sort=pushed&direction=desc`)]);

  const visible = repos.filter((r) => !r.fork && !r.archived && !EXCLUDED.has(r.name));
  const byName = new Map(visible.map((r) => [r.name, r]));

  const featured = CURATED.filter((c) => byName.has(c.name));
  const featuredNames = new Set(featured.map((c) => c.name));
  const others = visible.filter((r) => !featuredNames.has(r.name));

  const totalStars = visible.reduce((sum, r) => sum + r.stargazers_count, 0);
  const languages = [...new Set(visible.map((r) => r.language).filter(Boolean))];
  const updatedAt = new Date().toISOString();
  const updatedHuman = new Date().toLocaleString("es-CL", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  });

  const md = `<div align="center">

# ¡Hola! Soy Diego Cortés 👋

**Desarrollador Full Stack · Estudiante de Ingeniería**

[${badge("Portafolio web", "38bdf8")}](${SITE})
[![GitHub](https://img.shields.io/badge/GitHub-DiegoCortes07-181717?style=flat-square&logo=github&logoColor=white)](${user.html_url})

</div>

## 🧑‍💻 Sobre mí

Construyo software de punta a punta: apps móviles multiplataforma, APIs REST, dashboards de datos y experiencias de realidad aumentada.

- 🔭 Actualmente trabajando en **apps móviles con React Native + Expo** y **backends con Node.js / Python**
- 🎓 Estudiante de Ingeniería — Universidad Católica del Norte
- 📊 Me interesa el **análisis de datos** (ETL, dashboards, KPIs) y el **CI/CD**
- 🌐 Portafolio: **[${SITE.replace("https://", "")}](${SITE})**

## 🛠️ Stack habitual

${["TypeScript", "JavaScript", "Python", "C#", "PHP", "React Native", "Expo", "React", "Next.js", "Node.js", "Express", "FastAPI", "Sequelize", "SQLite", "Unity", "GitHub Actions"].map((s) => `\`${s}\``).join(" ")}

---

## 🚀 Proyectos destacados

${featured.map((p) => curatedBlock(p, byName.get(p.name))).join("\n---\n\n")}${
    others.length > 0
      ? `---

## 📁 Otros repositorios públicos

| Proyecto | Descripción | Lenguaje | Última actualización |
| --- | --- | --- | --- |
${others.map(autoRow).join("\n")}

`
      : ""
  }---

<div align="center">

**${visible.length}** repositorios públicos · **${totalStars}** estrellas · **${languages.length}** lenguajes

<sub>🤖 Este README se genera y actualiza automáticamente con GitHub Actions.<br/>
Última sincronización: ${updatedHuman} (UTC)</sub>

</div>
`;

  await writeFile(OUTPUT, md, "utf8");
  console.log(
    `README generado: ${featured.length} destacados + ${others.length} otros (${visible.length} repos públicos).`,
  );
}

main().catch((error) => {
  console.error("No se pudo generar el README:", error);
  process.exit(1);
});
