import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const notesRootCandidates = [
  path.resolve(webRoot, "..", "oscp-cheatsheet"),
  path.resolve(webRoot, "..", "OSCP Cheatsheet"),
];
const notesRoot = notesRootCandidates.find((candidate) => fs.existsSync(candidate)) || notesRootCandidates[0];
const dataRoot = path.join(notesRoot, "_data");
const outDir = path.join(webRoot, "data");

const taxonomyPath = path.join(dataRoot, "taxonomy.yml");
const commandsPath = path.join(dataRoot, "commands.yml");

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function parseInlineList(value) {
  const inner = value.trim().slice(1, -1).trim();
  if (!inner) return [];

  const items = [];
  let current = "";
  let quote = null;

  for (const char of inner) {
    if ((char === '"' || char === "'") && !quote) {
      quote = char;
      current += char;
      continue;
    }

    if (char === quote) {
      quote = null;
      current += char;
      continue;
    }

    if (char === "," && !quote) {
      items.push(parseScalar(current.trim()));
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) items.push(parseScalar(current.trim()));
  return items;
}

function parseScalar(rawValue) {
  const value = rawValue.trim();

  if (value === "[]") return [];
  if (value.startsWith("[") && value.endsWith("]")) return parseInlineList(value);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function parseTaxonomy(text) {
  const taxonomy = { version: 1, groups: {}, matching_notes: [] };
  const lines = text.split(/\r?\n/);
  let section = null;
  let currentGroup = null;

  for (const line of lines) {
    const version = line.match(/^version:\s*(.+)$/);
    if (version) {
      taxonomy.version = parseScalar(version[1]);
      continue;
    }

    if (/^groups:\s*$/.test(line)) {
      section = "groups";
      currentGroup = null;
      continue;
    }

    if (/^matching_notes:\s*$/.test(line)) {
      section = "matching_notes";
      currentGroup = null;
      continue;
    }

    const group = line.match(/^  ([A-Za-z0-9_]+):\s*$/);
    if (section === "groups" && group) {
      currentGroup = group[1];
      taxonomy.groups[currentGroup] = [];
      continue;
    }

    const groupItem = line.match(/^    -\s*(.+)$/);
    if (section === "groups" && currentGroup && groupItem) {
      taxonomy.groups[currentGroup].push(parseScalar(groupItem[1]));
      continue;
    }

    const noteItem = line.match(/^  -\s*(.+)$/);
    if (section === "matching_notes" && noteItem) {
      taxonomy.matching_notes.push(parseScalar(noteItem[1]));
    }
  }

  return taxonomy;
}

function parseCommandsYaml(text) {
  const lines = text.split(/\r?\n/);
  const commands = [];
  let version = 1;
  let current = null;
  let currentListField = null;

  for (const line of lines) {
    const versionMatch = line.match(/^version:\s*(.+)$/);
    if (versionMatch) {
      version = parseScalar(versionMatch[1]);
      continue;
    }

    const idMatch = line.match(/^  - id:\s*(.+)$/);
    if (idMatch) {
      current = { id: parseScalar(idMatch[1]), source_type: "curated" };
      commands.push(current);
      currentListField = null;
      continue;
    }

    if (!current) continue;

    const fieldMatch = line.match(/^    ([A-Za-z0-9_]+):\s*(.*)$/);
    if (fieldMatch) {
      const [, key, rawValue] = fieldMatch;
      if (!rawValue.trim()) {
        current[key] = [];
        currentListField = key;
      } else {
        current[key] = parseScalar(rawValue);
        currentListField = null;
      }
      continue;
    }

    const listItem = line.match(/^      -\s*(.+)$/);
    if (currentListField && listItem) {
      current[currentListField].push(parseScalar(listItem[1]));
    }
  }

  return { version, commands };
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/\\/g, "/")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeCommand(command) {
  return command
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(#|::|--\s|\/\/|REM\b)/i.test(line))
    .join("\n")
    .toLowerCase();
}

function stripTrailingLineSpaces(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function normalizeFenceLang(value) {
  return String(value || "").trim().toLowerCase();
}

function isCommandFence(lang) {
  const normalized = normalizeFenceLang(lang);
  if (!normalized) return true;
  return ["sh", "bash", "shell", "powershell", "ps1", "pwsh", "cmd", "bat", "sql"].includes(normalized);
}

function isWorkflowFence(lang) {
  const normalized = normalizeFenceLang(lang);
  return isCommandFence(normalized) || normalized.startsWith("file-") || ["php", "aspx", "jsp", "xml", "html", "text", "c", "cpp", "ini"].includes(normalized);
}

function workflowFenceLabel(lang) {
  const normalized = normalizeFenceLang(lang);
  if (!normalized || isCommandFence(normalized)) return "";
  if (normalized.startsWith("file-")) return normalized.replace(/^file-/, "file ");
  return normalized;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function uniq(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function deriveTab(source, explicitTab) {
  if (explicitTab) return explicitTab;
  if (source.startsWith("Active Directory/")) return "Active Directory";
  if (source.startsWith("Enumeration/Services/")) return "Services";
  if (source.startsWith("Enumeration/")) return "Enum";
  if (source.startsWith("Privilege Escalation/")) return "Privesc";
  if (source.startsWith("Post-Exploitation/")) return "Post-Exploitation";
  if (source.startsWith("Credentials/")) return "Credentials";
  if (source.startsWith("Initial Access/")) return "Initial Access";
  if (source.startsWith("Exploitation/")) return "Exploitation";
  if (source.startsWith("Pivoting/")) return "Pivoting";
  if (source.startsWith("Payloads/")) return "Payloads";
  if (source.startsWith("Reporting/")) return "Reporting";
  if (source.startsWith("Tools/")) return "Tools";
  return "Enum";
}

function frontmatterEnd(markdown) {
  if (!markdown.startsWith("---")) return -1;
  return markdown.indexOf("\n---", 3);
}

function parseFrontmatter(markdown) {
  const end = frontmatterEnd(markdown);
  if (end === -1) return {};

  const frontmatter = markdown.slice(3, end).trim();
  const data = {};

  for (const line of frontmatter.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (!match) continue;
    data[match[1]] = parseScalar(match[2]);
  }

  return data;
}

function stripFrontmatter(markdown) {
  const end = frontmatterEnd(markdown);
  if (end === -1) return markdown;
  return markdown.slice(end + 4).replace(/^\r?\n/, "");
}

function getMarkdownFiles(dir) {
  const files = [];
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    if (entry.name === ".obsidian" || entry.name === "_data" || entry.name === "OSCP Template") continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

function shouldSkipMarkdownSource(source) {
  return (
    source === "prompt.md" ||
    source === "blacklog.md" ||
    source.endsWith("/00_Index.md") ||
    source === "00_Index.md"
  );
}

function extractTags(line) {
  return (line.match(/#[A-Za-z][A-Za-z0-9_-]*/g) || []).map((tag) => tag.slice(1));
}

function isTagOnlyLine(line) {
  return /^#[A-Za-z][A-Za-z0-9_-]*(\s+#[A-Za-z][A-Za-z0-9_-]*)*$/.test(line.trim());
}

function partitionTags(tags, taxonomy) {
  const groups = taxonomy.groups || {};
  const whatYouHave = new Set(groups.what_you_have || []);
  const services = new Set(groups.services || []);
  const attackTypes = new Set(groups.attack_types || []);
  const targetTypes = new Set(groups.target_types || []);

  return {
    requires: tags.filter((tag) => whatYouHave.has(tag)),
    services: tags.filter((tag) => services.has(tag)),
    attack_types: tags.filter((tag) => attackTypes.has(tag)),
    target_types: tags.filter((tag) => targetTypes.has(tag)),
  };
}

function inferTargetTypes(source, frontmatter, tags, taxonomy) {
  const targetTypes = new Set(taxonomy.groups?.target_types || []);
  const inferred = new Set(tags.filter((tag) => targetTypes.has(tag)));

  // Do not infer Linux/Windows from the runner, fence language, or note frontmatter.
  // OS target tags must describe the target/source context for this specific command.
  if (source.startsWith("Active Directory/")) inferred.add("ActiveDirectory");

  return [...inferred];
}

function nearestHeading(lines, startIndex) {
  for (let i = startIndex - 1; i >= 0; i -= 1) {
    const match = lines[i].trim().match(/^(#{2,6})\s+(.+)$/);
    if (match) return match[2].trim();
  }

  return "";
}

function nearestTagLine(lines, startIndex) {
  for (let i = startIndex; i >= 0; i -= 1) {
    const trimmed = lines[i].trim();
    if (/^(#{1,6})\s+/.test(trimmed)) break;
    const tags = extractTags(trimmed);
    if (tags.length && isTagOnlyLine(trimmed)) return tags;
  }

  return [];
}

function nextMethodBoundary(lines, startIndex) {
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (/^#{2,6}\s+/.test(trimmed)) return i;
    if (isTagOnlyLine(trimmed)) return i;
  }

  return lines.length;
}

function previousNonEmptyLine(lines, startIndex) {
  for (let i = startIndex; i >= 0; i -= 1) {
    const trimmed = lines[i].trim();
    if (trimmed) return { index: i, text: trimmed };
  }

  return null;
}

function firstParagraphAfterTag(lines, tagIndex, boundaryIndex) {
  for (let i = tagIndex + 1; i < boundaryIndex; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    if (/^```/.test(trimmed) || /^\d+\.\s+/.test(trimmed) || /^#{1,6}\s+/.test(trimmed)) {
      return "";
    }
    return trimmed;
  }

  return "";
}

function collectFences(lines, startIndex, boundaryIndex) {
  const fences = [];

  for (let i = startIndex; i < boundaryIndex; i += 1) {
    if (!lines[i].trim().startsWith("```")) continue;

    const fenceStart = i;
    const fenceLang = lines[i].trim().replace(/^```/, "").trim();
    let fenceEnd = i + 1;
    while (fenceEnd < boundaryIndex && !lines[fenceEnd].trim().startsWith("```")) fenceEnd += 1;
    if (fenceEnd >= boundaryIndex) break;

    fences.push({
      start: fenceStart,
      end: fenceEnd,
      lang: fenceLang,
      text: stripTrailingLineSpaces(lines.slice(fenceStart + 1, fenceEnd).join("\n")),
    });
    i = fenceEnd;
  }

  return fences;
}

function buildStepWorkflowGroups(lines, taxonomy, frontmatter, source) {
  const groups = new Map();

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!isTagOnlyLine(trimmed)) continue;

    const tags = extractTags(trimmed);
    if (!tags.length) continue;

    const boundary = nextMethodBoundary(lines, i);
    const fences = collectFences(lines, i + 1, boundary).filter((fence) => fence.text && isWorkflowFence(fence.lang));
    if (fences.length < 2) continue;

    const hasOrderedSteps = fences.some((fence) => {
      const previous = previousNonEmptyLine(lines, fence.start - 1);
      return previous && /^\d+\.\s+/.test(previous.text);
    });
    if (!hasOrderedSteps) continue;

    const fields = partitionTags(tags, taxonomy);
    fields.target_types = uniq([
      ...fields.target_types,
      ...inferTargetTypes(source, frontmatter, tags, taxonomy),
    ]);

    const title = nearestHeading(lines, i + 1);
    const description = firstParagraphAfterTag(lines, i, boundary);
    const commandParts = [];

    for (const fence of fences) {
      const previous = previousNonEmptyLine(lines, fence.start - 1);
      if (previous && /^\d+\.\s+/.test(previous.text)) {
        commandParts.push(`# ${previous.text}`);
      }
      const label = workflowFenceLabel(fence.lang);
      if (label) commandParts.push(`# --- ${label} ---`);
      commandParts.push(fence.text);
      if (label) commandParts.push(`# --- end ${label} ---`);
    }

    groups.set(fences[0].start, {
      end: fences[fences.length - 1].end,
      title,
      description,
      tags,
      fields,
      command: commandParts.join("\n\n"),
      lang: "",
    });
  }

  return groups;
}

function resolveTitle(frontmatter, source, markdown) {
  if (frontmatter.title) return String(frontmatter.title);

  const body = stripFrontmatter(markdown);
  const heading = body.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();

  return path.basename(source, ".md");
}

function parseNoteBlocks(markdown, title) {
  const body = stripFrontmatter(markdown);
  const lines = body.split(/\r?\n/);
  const blocks = [];
  let skippedTitle = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) continue;

    const fence = trimmed.match(/^```(.*)$/);
    if (fence) {
      const lang = fence[1].trim();
      const codeLines = [];
      let end = i + 1;
      while (end < lines.length && !lines[end].trim().startsWith("```")) {
        codeLines.push(lines[end]);
        end += 1;
      }
      blocks.push({ type: "code", lang, text: stripTrailingLineSpaces(codeLines.join("\n")) });
      i = end;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const depth = heading[1].length;
      const text = heading[2].trim();
      if (!skippedTitle && depth === 1 && normalizeText(text) === normalizeText(title)) {
        skippedTitle = true;
        continue;
      }
      blocks.push({ type: "heading", depth, text });
      continue;
    }

    if (trimmed.startsWith("#")) {
      const tags = extractTags(trimmed);
      if (tags.length && isTagOnlyLine(trimmed)) {
        blocks.push({ type: "tagline", tags });
        continue;
      }
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = [trimmed.replace(/^[-*]\s+/, "").trim()];
      while (i + 1 < lines.length && /^[-*]\s+/.test(lines[i + 1].trim())) {
        i += 1;
        items.push(lines[i].trim().replace(/^[-*]\s+/, "").trim());
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      const start = Number(orderedMatch[1]);
      const items = [orderedMatch[2].trim()];
      while (i + 1 < lines.length && /^\d+\.\s+/.test(lines[i + 1].trim())) {
        i += 1;
        items.push(lines[i].trim().replace(/^\d+\.\s+/, "").trim());
      }
      blocks.push({ type: "list", items, ordered: true, start });
      continue;
    }

    const paragraph = [trimmed];
    while (i + 1 < lines.length) {
      const next = lines[i + 1].trim();
      if (
        !next ||
        /^```/.test(next) ||
        /^(#{1,6})\s+/.test(next) ||
        /^[-*]\s+/.test(next) ||
        /^\d+\.\s+/.test(next) ||
        (next.startsWith("#") && extractTags(next).length && isTagOnlyLine(next))
      ) {
        break;
      }
      i += 1;
      paragraph.push(lines[i].trim());
    }

    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

function extractMarkdownCommands(taxonomy) {
  const commands = [];
  const markdownFiles = getMarkdownFiles(notesRoot);

  for (const filePath of markdownFiles) {
    const source = path.relative(notesRoot, filePath).replace(/\\/g, "/");
    if (shouldSkipMarkdownSource(source)) {
      continue;
    }

    const markdown = readText(filePath);
    const frontmatter = parseFrontmatter(markdown);
    const tab = deriveTab(source, frontmatter.tab);
    const lines = markdown.split(/\r?\n/);
    const stepWorkflowGroups = buildStepWorkflowGroups(lines, taxonomy, frontmatter, source);
    let extractedCount = 0;

    for (let i = 0; i < lines.length; i += 1) {
      if (!lines[i].trim().startsWith("```")) continue;

      const groupedWorkflow = stepWorkflowGroups.get(i);
      if (groupedWorkflow) {
        extractedCount += 1;
        commands.push({
          id: `note-${slugify(source)}-${extractedCount}`,
          title: groupedWorkflow.title,
          description:
            groupedWorkflow.description && groupedWorkflow.description !== groupedWorkflow.title
              ? groupedWorkflow.description
              : "",
          source,
          source_type: "markdown",
          tab,
          tags: groupedWorkflow.tags,
          ...groupedWorkflow.fields,
          outputs: Array.isArray(frontmatter.outputs) ? frontmatter.outputs : [],
          next: [],
          command: groupedWorkflow.command,
          lang: groupedWorkflow.lang,
        });
        i = groupedWorkflow.end;
        continue;
      }

      const start = i;
      const fenceLang = lines[i].trim().replace(/^```/, "").trim();
      let end = i + 1;
      while (end < lines.length && !lines[end].trim().startsWith("```")) end += 1;
      if (end >= lines.length) break;

      const commandText = stripTrailingLineSpaces(lines.slice(start + 1, end).join("\n"));
      if (!isCommandFence(fenceLang)) {
        i = end;
        continue;
      }
      if (!commandText) {
        i = end;
        continue;
      }

      let descriptionIndex = start - 1;
      while (descriptionIndex >= 0 && !lines[descriptionIndex].trim()) descriptionIndex -= 1;
      const description = descriptionIndex >= 0 ? lines[descriptionIndex].trim() : "";

      const tags = nearestTagLine(lines, descriptionIndex - 1);

      if (!tags.length) {
        i = end;
        continue;
      }

      const fields = partitionTags(tags, taxonomy);
      fields.target_types = uniq([
        ...fields.target_types,
        ...inferTargetTypes(source, frontmatter, tags, taxonomy),
      ]);
      extractedCount += 1;
      const title = nearestHeading(lines, start) || description || commandText.split(/\r?\n/)[0];

      commands.push({
        id: `note-${slugify(source)}-${extractedCount}`,
        title,
        description: description && description !== title ? description : "",
        source,
        source_type: "markdown",
        tab,
        tags,
        ...fields,
        outputs: Array.isArray(frontmatter.outputs) ? frontmatter.outputs : [],
        next: [],
        command: commandText,
        lang: fenceLang,
      });

      i = end;
    }
  }

  return commands;
}

function extractNotes() {
  const notes = [];
  const markdownFiles = getMarkdownFiles(notesRoot);

  for (const filePath of markdownFiles) {
    const source = path.relative(notesRoot, filePath).replace(/\\/g, "/");
    if (shouldSkipMarkdownSource(source)) {
      continue;
    }

    const markdown = readText(filePath);
    const frontmatter = parseFrontmatter(markdown);
    const title = resolveTitle(frontmatter, source, markdown);
    const tab = deriveTab(source, frontmatter.tab);
    const blocks = parseNoteBlocks(markdown, title);

    notes.push({
      id: `note-${slugify(source)}`,
      title,
      source,
      tab,
      type: frontmatter.type || "note",
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      blocks,
    });
  }

  return notes.sort((a, b) => {
    const tabCompare = String(a.tab).localeCompare(String(b.tab));
    if (tabCompare !== 0) return tabCompare;
    return String(a.source).localeCompare(String(b.source));
  });
}

function hydrateCuratedCommand(command, taxonomy) {
  const commandText = stripTrailingLineSpaces(command.command || (command.steps || []).join("\n"));
  const tags = uniq([
    ...(command.requires || []),
    ...(command.useful_when || []),
    ...(command.services || []),
    ...(command.attack_types || []),
    ...(command.target_types || []),
  ]);
  const frontmatter = { tags };
  const targetTypes = uniq([
    ...(command.target_types || []),
    ...inferTargetTypes(command.source || "", frontmatter, tags, taxonomy),
  ]);

  return {
    ...command,
    tab: deriveTab(command.source || "", command.tab),
    tags,
    command: commandText,
    lang: command.lang || "",
    requires: command.requires || [],
    useful_when: command.useful_when || [],
    services: command.services || [],
    attack_types: command.attack_types || [],
    target_types: targetTypes,
    outputs: command.outputs || [],
    next: command.next || [],
    executor: command.executor || [],
    source_type: "curated",
    _partitioned: partitionTags(tags, taxonomy),
  };
}

function mergeCommands(curated, markdown) {
  const byCommand = new Map();
  const merged = [];

  for (const command of curated) {
    const normalized = normalizeCommand(command.command || "");
    byCommand.set(normalized, command);
    merged.push(command);
  }

  for (const command of markdown) {
    const normalized = normalizeCommand(command.command || "");
    const existing = byCommand.get(normalized);

    if (!existing) {
      byCommand.set(normalized, command);
      merged.push(command);
      continue;
    }

    existing.tags = uniq([...(existing.tags || []), ...(command.tags || [])]);
    existing.requires = uniq([...(existing.requires || []), ...(command.requires || [])]);
    existing.services = uniq([...(existing.services || []), ...(command.services || [])]);
    existing.attack_types = uniq([...(existing.attack_types || []), ...(command.attack_types || [])]);
    existing.target_types = uniq([...(existing.target_types || []), ...(command.target_types || [])]);
    existing.outputs = uniq([...(existing.outputs || []), ...(command.outputs || [])]);
    if (!existing.description && command.description) existing.description = command.description;
    existing.source = existing.source || command.source;
    existing.tab = existing.tab || command.tab;
  }

  return merged.map((command) => {
    const clean = { ...command };
    delete clean._partitioned;
    return clean;
  });
}

function taxonomyValues(taxonomy) {
  const values = new Set();
  for (const group of Object.values(taxonomy.groups || {})) {
    for (const value of group || []) values.add(value);
  }
  return values;
}

function validateData(taxonomy, commands, notes) {
  const warnings = [];
  const knownTags = taxonomyValues(taxonomy);
  const knownTabs = new Set(taxonomy.groups?.tabs || []);
  const ids = new Set();
  const missingTargetByTab = new Map();

  for (const command of commands) {
    if (!command.id || ids.has(command.id)) warnings.push(`duplicate or missing command id: ${command.id || "(empty)"}`);
    ids.add(command.id);

    if (!command.title) warnings.push(`missing command title: ${command.source || command.id}`);
    if (!command.command) warnings.push(`missing command body: ${command.title || command.id}`);
    if (command.tab && command.tab !== "All" && !knownTabs.has(command.tab)) warnings.push(`unknown command tab: ${command.tab}`);

    for (const tag of command.tags || []) {
      if (!knownTags.has(tag)) warnings.push(`unknown tag "${tag}" in ${command.source || command.id}`);
    }

    if (!command.target_types?.length) {
      missingTargetByTab.set(command.tab, (missingTargetByTab.get(command.tab) || 0) + 1);
    }
  }

  for (const note of notes) {
    const hasHeading = (note.blocks || []).some((block) => block.type === "heading");
    if (!hasHeading) warnings.push(`note has no section headings: ${note.source}`);
    if (note.tab && !knownTabs.has(note.tab)) warnings.push(`unknown note tab: ${note.tab} (${note.source})`);
  }

  for (const [tab, count] of [...missingTargetByTab.entries()].sort()) {
    warnings.push(`commands without target_types in ${tab || "unknown"}: ${count}`);
  }

  return warnings;
}

function main() {
  if (!fs.existsSync(taxonomyPath) || !fs.existsSync(commandsPath)) {
    throw new Error(`Missing source data under ${dataRoot}`);
  }

  const taxonomy = parseTaxonomy(readText(taxonomyPath));
  const curated = parseCommandsYaml(readText(commandsPath)).commands.map((command) =>
    hydrateCuratedCommand(command, taxonomy),
  );
  const markdown = extractMarkdownCommands(taxonomy);
  const notes = extractNotes();
  const commands = mergeCommands(curated, markdown).sort((a, b) => {
    const tabCompare = String(a.tab).localeCompare(String(b.tab));
    if (tabCompare !== 0) return tabCompare;
    return String(a.title).localeCompare(String(b.title));
  });
  const warnings = validateData(taxonomy, commands, notes);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "taxonomy.json"),
    `${JSON.stringify(taxonomy, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(outDir, "commands.json"),
    `${JSON.stringify(
      {
        version: 1,
        generated_at: new Date().toISOString(),
        source_root: path.relative(webRoot, notesRoot).replace(/\\/g, "/"),
        commands,
        notes,
      },
      null,
      2,
    )}\n`,
  );

  console.log(
    `Generated ${commands.length} commands from ${curated.length} curated + ${markdown.length} markdown cards and ${notes.length} notes.`,
  );

  if (warnings.length) {
    console.warn(`Validation warnings (${warnings.length}):`);
    for (const warning of warnings.slice(0, 40)) console.warn(`- ${warning}`);
    if (warnings.length > 40) console.warn(`- ... ${warnings.length - 40} more`);
  }
}

main();
