const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const inputPath = path.join(
  root,
  "Arquitectura_y_Diseno_Actual_Barberia_Cale.md"
);
const outputPath = path.join(root, "Arquitectura_y_Diseno_Actual_Barberia_Cale.html");

const source = fs.readFileSync(inputPath, "utf8").replace(/\r\n/g, "\n");

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(value) {
  let result = escapeHtml(value);
  const code = [];

  result = result.replace(/`([^`]+)`/g, (_, content) => {
    const index = code.push(`<code>${content}</code>`) - 1;
    return `@@CODE${index}@@`;
  });
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  result = result.replace(/@@CODE(\d+)@@/g, (_, index) => code[Number(index)]);

  return result;
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function tableCells(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line) {
  const cells = tableCells(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function markdownToHtml(markdown) {
  const lines = markdown.split("\n");
  const headings = [];
  const html = [];
  let index = 0;
  let inCode = false;
  let codeLines = [];
  let listType = null;

  function closeList() {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  }

  while (index < lines.length) {
    const line = lines[index];

    if (line.startsWith("```")) {
      closeList();
      if (!inCode) {
        inCode = true;
        codeLines = [];
      } else {
        html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        inCode = false;
      }
      index += 1;
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      index += 1;
      continue;
    }

    if (!line.trim()) {
      closeList();
      index += 1;
      continue;
    }

    const imageMatch = line.match(/^!\[([^\]]+)\]\(([^)]+)\)$/);
    if (imageMatch) {
      closeList();
      const src = imageMatch[2].replace(/\\/g, "/");
      html.push(
        `<figure class="diagram-page"><img src="${escapeHtml(src)}" alt="${escapeHtml(imageMatch[1])}"><figcaption>${inline(imageMatch[1])}</figcaption></figure>`
      );
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{2,4})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const title = headingMatch[2].replace(/\*\*/g, "").trim();
      const id = slugify(title);
      headings.push({ level, title, id });
      html.push(`<h${level} id="${id}">${inline(title)}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      closeList();
      html.push("<hr>");
      index += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      closeList();
      const quote = [];
      while (index < lines.length && lines[index].startsWith("> ")) {
        quote.push(lines[index].slice(2));
        index += 1;
      }
      html.push(`<div class="callout">${inline(quote.join(" "))}</div>`);
      continue;
    }

    if (
      line.trim().startsWith("|") &&
      index + 1 < lines.length &&
      isTableSeparator(lines[index + 1])
    ) {
      closeList();
      const headers = tableCells(line);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }
      html.push('<div class="table-wrap"><table><thead><tr>');
      headers.forEach((cell) => html.push(`<th>${inline(cell)}</th>`));
      html.push("</tr></thead><tbody>");
      rows.forEach((row) => {
        html.push("<tr>");
        headers.forEach((_, cellIndex) => {
          html.push(`<td>${inline(row[cellIndex] || "")}</td>`);
        });
        html.push("</tr>");
      });
      html.push("</tbody></table></div>");
      continue;
    }

    const unorderedMatch = line.match(/^\s*-\s+(.+)$/);
    const orderedMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (unorderedMatch || orderedMatch) {
      const nextType = unorderedMatch ? "ul" : "ol";
      if (listType !== nextType) {
        closeList();
        listType = nextType;
        html.push(`<${listType}>`);
      }
      html.push(`<li>${inline((unorderedMatch || orderedMatch)[1])}</li>`);
      index += 1;
      continue;
    }

    closeList();
    const paragraph = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{2,4})\s+/.test(lines[index]) &&
      !lines[index].startsWith("```") &&
      !lines[index].startsWith("> ") &&
      !/^\s*(-|\d+\.)\s+/.test(lines[index]) &&
      !lines[index].trim().startsWith("|") &&
      !/^!\[/.test(lines[index]) &&
      !/^---+$/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html.push(`<p>${inline(paragraph.join(" "))}</p>`);
  }

  closeList();
  if (inCode) {
    html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }

  return { body: html.join("\n"), headings };
}

const start = source.indexOf("## 1. Resumen ejecutivo");
const content = start >= 0 ? source.slice(start) : source;
const { body, headings } = markdownToHtml(content);
const toc = headings
  .filter(({ level }) => level <= 3)
  .map(
    ({ level, title, id }) =>
      `<li class="toc-${level}"><a href="#${id}">${inline(title)}</a></li>`
  )
  .join("\n");

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Arquitectura y Diseño Actual — Barbería Cale</title>
<style>
  @page { size: A4; margin: 2cm 1.8cm 2cm 1.8cm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #2f2420; background: #ffffff; font: 10.5pt/1.48 Arial, sans-serif; }
  .document { max-width: 18cm; margin: 0 auto; }
  .cover { min-height: 24.5cm; padding: 2.2cm 1.1cm 1cm; background: #f4efe6; border-top: 12pt solid #743b2f; page-break-after: always; position: relative; }
  .cover .eyebrow { color: #8d4638; font-weight: 700; letter-spacing: 1.8pt; text-transform: uppercase; }
  .cover h1 { margin: 1.2cm 0 0.4cm; font: 700 32pt/1.05 Georgia, serif; color: #2f2420; }
  .cover .subtitle { max-width: 14cm; color: #6f5d55; font-size: 14pt; }
  .cover .rule { width: 3.2cm; height: 5pt; background: #c89a3d; margin: 1cm 0; }
  .cover .meta { margin-top: 2cm; width: 100%; border-collapse: collapse; }
  .cover .meta td { border: 0; border-bottom: 1px solid #ddcfc5; padding: 9pt 4pt; background: transparent; }
  .cover .meta td:first-child { width: 38%; color: #743b2f; font-weight: 700; }
  .cover .statement { position: absolute; left: 1.1cm; right: 1.1cm; bottom: 1.2cm; padding: 12pt 14pt; border-left: 4pt solid #c89a3d; background: #fffdf9; color: #594941; }
  .toc-page { page-break-after: always; }
  .toc-page h2 { page-break-before: avoid; }
  .toc { columns: 2; column-gap: 1.2cm; list-style: none; padding: 0; }
  .toc li { break-inside: avoid; margin: 0 0 5pt; }
  .toc-2 { font-weight: 700; color: #743b2f; }
  .toc-3 { margin-left: 10pt !important; font-size: 9pt; }
  .toc a { color: inherit; text-decoration: none; }
  main { padding: 0 2pt; }
  h2 { color: #743b2f; font: 700 20pt/1.15 Georgia, serif; border-bottom: 2pt solid #c89a3d; padding-bottom: 5pt; margin: 18pt 0 10pt; page-break-after: avoid; }
  h2:not(:first-child) { page-break-before: always; }
  h3 { color: #3e2b26; font: 700 14pt/1.2 Georgia, serif; margin: 16pt 0 7pt; page-break-after: avoid; }
  h4 { color: #743b2f; font: 700 11pt/1.2 Arial, sans-serif; margin: 12pt 0 5pt; page-break-after: avoid; }
  p { margin: 0 0 8pt; text-align: justify; }
  ul, ol { margin: 4pt 0 10pt 20pt; padding: 0; }
  li { margin: 0 0 4pt; }
  a { color: #743b2f; }
  code { font: 8.8pt Consolas, monospace; color: #6f3026; background: #f7efe9; padding: 1pt 2pt; }
  pre { overflow-wrap: anywhere; white-space: pre-wrap; background: #2f2420; color: #fffdf9; border-left: 5pt solid #c89a3d; padding: 10pt; font: 8.2pt/1.35 Consolas, monospace; page-break-inside: avoid; }
  pre code { color: inherit; background: transparent; padding: 0; }
  .callout { margin: 10pt 0 14pt; padding: 11pt 13pt; border-left: 5pt solid #c89a3d; background: #fff8ed; color: #493932; }
  hr { border: 0; border-top: 1pt solid #ddcfc5; margin: 16pt 0; }
  .table-wrap { margin: 8pt 0 14pt; }
  table { width: 100%; border-collapse: collapse; table-layout: auto; font-size: 8.5pt; }
  th { background: #743b2f; color: #ffffff; text-align: left; vertical-align: top; padding: 6pt; border: 1px solid #743b2f; }
  td { vertical-align: top; padding: 5pt 6pt; border: 1px solid #d9cec7; }
  tbody tr:nth-child(even) td { background: #faf6f1; }
  .diagram-page { page-break-before: always; page-break-after: always; margin: 0; min-height: 23cm; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .diagram-page img { display: block; max-width: 100%; max-height: 21.5cm; width: auto; height: auto; margin: 0 auto; }
  figcaption { margin-top: 10pt; color: #5f4d45; font-size: 9pt; text-align: center; font-style: italic; }
  .footer-note { margin-top: 18pt; color: #806d64; font-size: 8pt; border-top: 1px solid #ddcfc5; padding-top: 6pt; }
</style>
</head>
<body>
<div class="document">
  <section class="cover">
    <div class="eyebrow">Procedimientos de diseño, arquitectura y patrones de software</div>
    <h1>Arquitectura y diseño<br>de software actual</h1>
    <div class="rule"></div>
    <div class="subtitle">Barbería Cale — aplicación Android y web para la gestión integral y trazable de citas</div>
    <table class="meta">
      <tr><td>Documento</td><td>Arquitectura y diseño de la versión actual</td></tr>
      <tr><td>Versión documentada</td><td>1.0 ampliada</td></tr>
      <tr><td>Fecha de corte</td><td>27 de agosto de 2026</td></tr>
      <tr><td>Equipo</td><td>Proyecto Barbería Cale</td></tr>
      <tr><td>Fuentes</td><td>Repositorio, contratos REST, esquema SQL, migraciones, configuración y prototipo implementado</td></tr>
    </table>
    <div class="statement">Este documento describe exclusivamente la implementación vigente. Los módulos, contratos, decisiones, datos y despliegues citados fueron contrastados con el repositorio; no se presentan microservicios ni patrones que el sistema no utiliza.</div>
  </section>
  <section class="toc-page">
    <h2>Contenido</h2>
    <ol class="toc">${toc}</ol>
    <div class="footer-note">Los doce diagramas incluidos poseen su fuente editable en PlantUML dentro de <code>proyecto/docs/arquitectura-actual/plantuml</code>.</div>
  </section>
  <main>${body}</main>
</div>
</body>
</html>`;

fs.writeFileSync(outputPath, html, "utf8");
console.log(outputPath);
