function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures and continue with in-memory state.
  }
}

function getSystemTheme() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readSelectedTags() {
  try {
    const parsed = JSON.parse(readStorage("oscp-selected-tags", "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readVariables() {
  try {
    const parsed = JSON.parse(readStorage("oscp-command-vars", "{}"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const noteLikeViews = new Set(["notes"]);

const variableFields = [
  { key: "LHOST", label: "LHOST", aliases: ["LHOST", "LOCAL_IP", "ATTACKER_IP"] },
  { key: "LPORT", label: "LPORT", aliases: ["LPORT", "PORT"] },
  { key: "TARGET_IP", label: "Target IP", aliases: ["TARGET_IP", "RHOST", "RHOSTS", "IP", "VICTIM_IP"] },
  { key: "TARGET_HOST", label: "Target Host", aliases: ["TARGET_HOST", "HOST", "HOSTNAME"] },
  { key: "TARGET_SUBNET", label: "Subnet", aliases: ["TARGET_SUBNET", "SUBNET"] },
  { key: "DC_IP", label: "DC IP", aliases: ["DC_IP"] },
  { key: "DC_HOST", label: "DC Host", aliases: ["DC_HOST"] },
  { key: "DOMAIN", label: "Domain", aliases: ["DOMAIN"] },
  { key: "USER", label: "User", aliases: ["USER", "USERNAME"] },
  { key: "PASS", label: "Pass", aliases: ["PASS", "PASSWORD"] },
  { key: "HASH", label: "Hash", aliases: ["HASH", "NTLM_HASH"] },
  { key: "WORDLIST", label: "Wordlist", aliases: ["WORDLIST"] },
];

const sensitiveVariables = new Set(variableFields.filter((field) => field.sensitive).map((field) => field.key));
const variableAliasMap = new Map(
  variableFields.flatMap((field) => [[field.key, field.key], ...field.aliases.map((alias) => [alias, field.key])]),
);

const viewModes = {
  notes: {
    eyebrow: "OSCP Cheatsheet",
    title: "Cheatsheet Notes",
    lede: "Open one note at a time, browse it like a real cheatsheet page, and jump through subtopics from the right-side contents.",
    searchPlaceholder: "note / section / command",
    resultEyebrow: "Note Page",
    statusLabel: "Visible notes",
    noteIndexLabel: "Notes",
    buttonLabel: "Cheatsheet Notes",
    showTabs: true,
    showToolbar: true,
  },
  suggest: {
    eyebrow: "OSCP Cheatsheet",
    title: "Command Suggestions",
    lede: "Choose what you have, the target, and the service. This page will surface the most relevant commands from your notes.",
    searchPlaceholder: "command / note / subsection",
    resultEyebrow: "Suggestions",
    statusLabel: "Ready commands",
    noteIndexLabel: "Notes",
    buttonLabel: "Command Suggest",
    showTabs: true,
    showToolbar: true,
  },
  vars: {
    eyebrow: "OSCP Cheatsheet",
    title: "Variables",
    lede: "Set reusable values once, then placeholders like <TARGET_IP>, <USER>, and <PASS> will apply across command suggestions and notes.",
    searchPlaceholder: "",
    resultEyebrow: "Variables",
    statusLabel: "Set variables",
    noteIndexLabel: "Notes",
    buttonLabel: "Variables",
    showTabs: false,
    showToolbar: false,
  },
};

const state = {
  taxonomy: null,
  commands: [],
  notes: [],
  selected: new Set(readSelectedTags()),
  tab: readStorage("oscp-active-tab", "All"),
  noteId: readStorage("oscp-active-note", ""),
  query: "",
  readyOnly: false,
  theme: readStorage("oscp-theme", "") || getSystemTheme(),
  view: readStorage("oscp-active-view", "suggest"),
  variables: { ...readVariables() },
  routeSectionId: "",
  pendingScrollId: "",
  tocCollapsed: new Set(),
  sectionCollapsed: new Set(),
};

const els = {
  heroEyebrow: document.querySelector("#heroEyebrow"),
  heroTitle: document.querySelector("#heroTitle"),
  heroLede: document.querySelector("#heroLede"),
  statusCount: document.querySelector("#statusCount"),
  statusLabel: document.querySelector("#statusLabel"),
  readyMeter: document.querySelector("#readyMeter"),
  dataStamp: document.querySelector("#dataStamp"),
  searchLabel: document.querySelector("#searchLabel"),
  searchInput: document.querySelector("#searchInput"),
  toolbar: document.querySelector(".toolbar"),
  readyOnlyButton: document.querySelector("#readyOnlyButton"),
  copyVisibleButton: document.querySelector("#copyVisibleButton"),
  themeToggleButton: document.querySelector("#themeToggleButton"),
  resetButton: document.querySelector("#resetButton"),
  viewSwitch: document.querySelector("#viewSwitch"),
  tabs: document.querySelector("#tabs"),
  filters: document.querySelector(".filters"),
  selectionPanel: document.querySelector("#selectionPanel"),
  selectedQuery: document.querySelector("#selectedQuery"),
  noteIndexPanel: document.querySelector("#noteIndexPanel"),
  noteIndexHeading: document.querySelector("#noteIndexPanel h2"),
  noteIndex: document.querySelector("#noteIndex"),
  noteTocPanel: document.querySelector("#noteTocPanel"),
  noteTocHeading: document.querySelector("#noteTocHeading"),
  noteToc: document.querySelector("#noteToc"),
  tagGroups: document.querySelector("#tagGroups"),
  resultEyebrow: document.querySelector("#resultEyebrow"),
  resultTitle: document.querySelector("#resultTitle"),
  resultCount: document.querySelector("#resultCount"),
  results: document.querySelector("#results"),
  backToTopButton: document.querySelector("#backToTopButton"),
  commandTemplate: document.querySelector("#commandTemplate"),
  noteTemplate: document.querySelector("#noteTemplate"),
};

const tagGroups = [
  ["what_you_have", "What you have"],
  ["services", "Services"],
  ["target_types", "Target"],
  ["attack_types", "Attack type"],
];

const notePageCache = new Map();
let scrollSpyCleanup = null;
let scrollSpyFrame = 0;
let backToTopFrame = 0;

function list(value) {
  return Array.isArray(value) ? value : [];
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function cleanCodeText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trimEnd();
}

const codeKindLabels = {
  sh: "sh",
  bash: "bash",
  powershell: "PowerShell",
  ps1: "PowerShell",
  cmd: "cmd",
  c: "C/C++",
  cpp: "C/C++",
  python: "Python",
  py: "Python",
  ruby: "Ruby",
  rb: "Ruby",
  sql: "SQL",
  ini: "Config",
  html: "HTML",
  xml: "XML",
  php: "PHP",
  text: "Text",
};

const codeKindAliases = {
  shell: "sh",
  zsh: "sh",
  pwsh: "powershell",
  ps: "powershell",
  bat: "cmd",
  batch: "cmd",
  csharp: "c",
  cs: "c",
};

function normalizeCodeKind(value) {
  const kind = String(value || "").trim().toLowerCase();
  if (!kind) return "";
  return codeKindAliases[kind] || kind;
}

function inferCodeKind(text, declaredLang = "") {
  const declared = normalizeCodeKind(declaredLang);
  const scores = {
    powershell: 0,
    cmd: 0,
    sh: 0,
    html: 0,
    xml: 0,
    php: 0,
    c: 0,
    python: 0,
    ruby: 0,
    sql: 0,
  };
  if (declared && codeKindLabels[declared]) scores[declared] = (scores[declared] || 0) + 1;

  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^(Get-|Set-|New-|Invoke-|Enter-|Import-|Start-|Stop-|Remove-|Copy-|Move-|\$[A-Za-z_])/i.test(line)) scores.powershell += 2;
    if (/^(cmd\.exe|net\b|reg\b|sc\b|wmic\b|whoami\b|ipconfig\b|dir\b|type\b|copy\b|move\b)/i.test(line)) scores.cmd += 2;
    if (/^(sudo\b|chmod\b|chown\b|find\b|grep\b|awk\b|sed\b|curl\b|wget\b|nc\b|python3?\b|gcc\b|cat\b|echo\b|export\b|cd\b|ls\b|\/|\.\/)/i.test(line)) scores.sh += 2;
    if (/^(<\?php|php\b)/i.test(line)) scores.php += 3;
    if (/^(<svg\b|<\?xml\b|<!DOCTYPE\b)/i.test(line)) scores.xml += 3;
    if (/^<[^>]+>/.test(line)) scores.html += 2;
    if (/^(#include\b|static\b|int\b|void\b|BOOL\b|IMPLEMENT_|using namespace\b|class\b)/.test(line) || /;\s*$/.test(line)) scores.c += 2;
    if (/^(import\b|from\b|def\b|print\(|os\.|subprocess\.)/.test(line)) scores.python += 2;
    if (/^(require\b|exit if fork|TCPSocket|IO\.popen|exec\b)/.test(line)) scores.ruby += 2;
    if (/^(select\b|union\b|exec\b|execute\b|sp_configure\b|reconfigure\b|xp_cmdshell\b)/i.test(line)) scores.sql += 2;
  }

  const [winner, score] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0] || ["sh", 0];
  if (score > 0) return winner;
  return declared && codeKindLabels[declared] ? declared : "sh";
}

function codeKindLabel(kind) {
  return codeKindLabels[kind] || kind || "code";
}

function isHashCommentLine(trimmed, kind = "") {
  if (!trimmed.startsWith("#")) return false;
  const normalized = normalizeCodeKind(kind);
  if (["c", "cpp"].includes(normalized)) {
    return !/^#\s*(include|define|undef|if|ifdef|ifndef|elif|else|endif|pragma|error|warning|line)\b/i.test(trimmed);
  }
  return true;
}

function isCommentLine(line, kind = "") {
  const trimmed = String(line || "").trimStart();
  if (!trimmed) return false;
  const normalized = normalizeCodeKind(kind);

  if (["sh", "bash", "powershell", "ps1", "python", "py", "ruby", "rb"].includes(normalized)) {
    return isHashCommentLine(trimmed, normalized);
  }

  if (normalized === "cmd") return isHashCommentLine(trimmed, normalized) || /^::|^REM\b/i.test(trimmed);
  if (normalized === "sql") return trimmed.startsWith("--") || isHashCommentLine(trimmed, normalized);
  if (["c", "cpp", "php", "html", "xml"].includes(normalized)) {
    return (
      isHashCommentLine(trimmed, normalized) ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("<!--")
    );
  }
  if (normalized === "ini") return isHashCommentLine(trimmed, normalized) || trimmed.startsWith(";");

  return (
    isHashCommentLine(trimmed, normalized) ||
    trimmed.startsWith("::") ||
    /^REM\b/i.test(trimmed) ||
    trimmed.startsWith("--") ||
    trimmed.startsWith("//")
  );
}

function renderHighlightedCode(codeNode, text, kind = "") {
  codeNode.replaceChildren();
  const lines = String(text || "").split("\n");

  lines.forEach((line, index) => {
    const span = document.createElement("span");
    span.className = `code-line${isCommentLine(line, kind) ? " code-line-comment" : ""}`;
    span.textContent = line || " ";
    codeNode.append(span);
    if (index < lines.length - 1) codeNode.append(document.createTextNode("\n"));
  });
}

function commandBody(command) {
  if (command.command) return cleanCodeText(command.command);
  return cleanCodeText(list(command.steps).join("\n"));
}

function persistVariables() {
  const persisted = {};
  for (const field of variableFields) {
    const value = state.variables[field.key] || "";
    if (value && !sensitiveVariables.has(field.key)) persisted[field.key] = value;
  }
  writeStorage("oscp-command-vars", JSON.stringify(persisted));
}

function applyVariables(text) {
  const applied = String(text || "").replace(/<([A-Za-z0-9_]+)>/g, (match, rawName) => {
    const key = variableAliasMap.get(rawName.toUpperCase());
    if (!key) return match;
    const value = state.variables[key];
    return value ? value : match;
  });
  return cleanCodeText(applied);
}

function isNoteLikeView(view = state.view) {
  return noteLikeViews.has(view);
}

function selectableTags() {
  const groups = state.taxonomy?.groups || {};
  const targets = new Set(groups.target_types || []);
  const allowed = new Set();

  for (const [groupKey] of tagGroups) {
    let tags = list(groups[groupKey]);
    if (groupKey === "services") tags = tags.filter((tag) => !targets.has(tag));
    for (const tag of tags) allowed.add(tag);
  }

  return allowed;
}

function commandTags(command) {
  return uniq([
    ...list(command.tags),
    ...list(command.requires),
    ...list(command.useful_when),
    ...list(command.services),
    ...list(command.attack_types),
    ...list(command.target_types),
  ]);
}

function commandBag(command) {
  const fields = [
    command.title,
    command.description,
    command.source,
    command.tab,
    commandBody(command),
    ...commandTags(command),
    ...list(command.outputs),
    ...list(command.next),
  ];
  return fields.join(" ").toLowerCase();
}

function blockText(block) {
  if (block.type === "heading" || block.type === "paragraph") return block.text || "";
  if (block.type === "tagline") return list(block.tags).join(" ");
  if (block.type === "list") return list(block.items).join(" ");
  if (block.type === "code") return block.text || "";
  return "";
}

function noteBag(note) {
  const fields = [
    note.title,
    note.source,
    note.tab,
    ...list(note.tags),
    ...list(note.blocks).map((block) => blockText(block)),
  ];
  return fields.join(" ").toLowerCase();
}

function noteToText(note) {
  const lines = [note.title, `${note.tab} / ${note.source}`];

  for (const block of list(note.blocks)) {
    if (block.type === "heading") {
      lines.push(`${"#".repeat(block.depth || 2)} ${block.text}`);
      continue;
    }

    if (block.type === "tagline") {
      lines.push(list(block.tags).map((tag) => `#${tag}`).join(" "));
      continue;
    }

    if (block.type === "paragraph") {
      lines.push(block.text);
      continue;
    }

    if (block.type === "list") {
      const start = Number(block.start) || 1;
      list(block.items).forEach((item, index) => {
        lines.push(block.ordered ? `${start + index}. ${item}` : `- ${item}`);
      });
      continue;
    }

    if (block.type === "code") {
      lines.push(`\`\`\`${block.lang || ""}`.trimEnd());
      lines.push(block.text || "");
      lines.push("```");
    }
  }

  return lines.join("\n\n");
}

function routeHash(view = state.view, noteId = "", sectionId = "") {
  const params = new URLSearchParams();
  params.set("view", view);
  if (noteId) params.set("note", noteId);
  if (sectionId) params.set("section", sectionId);
  return `#${params.toString()}`;
}

function parseRouteHash() {
  const raw = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  if (!raw || !raw.includes("=")) return { view: "", noteId: "", sectionId: "" };
  const params = new URLSearchParams(raw);
  return {
    view: params.get("view") || "",
    noteId: params.get("note") || "",
    sectionId: params.get("section") || "",
  };
}

function setRoute(view = state.view, noteId = "", sectionId = "", mode = "push") {
  const target = routeHash(view, noteId, sectionId);
  if (window.location.hash === target) return;
  history[mode === "replace" ? "replaceState" : "pushState"](null, "", target);
}

function clearRoute(mode = "replace") {
  const clean = `${window.location.pathname}${window.location.search}`;
  history[mode === "replace" ? "replaceState" : "pushState"](null, "", clean);
}

function findNoteById(noteId) {
  return state.notes.find((note) => note.id === noteId) || null;
}

function clearNoteNavigationState() {
  state.routeSectionId = "";
  state.pendingScrollId = "";
  state.tocCollapsed.clear();
  state.sectionCollapsed.clear();
}

function applyRouteFromLocation() {
  const route = parseRouteHash();
  if (!isNoteLikeView(route.view)) return;

  state.view = route.view;
  const note = findNoteById(route.noteId);

  if (note) {
    if (state.noteId !== note.id) clearNoteNavigationState();
    state.noteId = note.id;
    state.tab = note.tab;
  }

  state.routeSectionId = route.sectionId || "";
  state.pendingScrollId = route.sectionId || "";
}

function makeUniqueId(base, text, seen) {
  const slug = slugify(text) || "section";
  const key = `${base}-${slug}`;
  const count = seen.get(key) || 0;
  seen.set(key, count + 1);
  return count ? `${key}-${count + 1}` : key;
}

function buildNotePage(note) {
  if (notePageCache.has(note.id)) return notePageCache.get(note.id);

  const intro = [];
  const sections = [];
  const seen = new Map();
  let currentSection = null;

  for (const rawBlock of list(note.blocks)) {
    const block = { ...rawBlock };

    if (block.type === "heading" && (block.depth || 2) <= 2) {
      currentSection = {
        id: makeUniqueId(note.id, block.text, seen),
        title: block.text,
        blocks: [],
        children: [],
      };
      sections.push(currentSection);
      continue;
    }

    const target = currentSection ? currentSection.blocks : intro;

    if (block.type === "heading") {
      block.anchorId = makeUniqueId(currentSection ? currentSection.id : note.id, block.text, seen);
      if (currentSection) {
        currentSection.children.push({
          id: block.anchorId,
          text: block.text,
          depth: block.depth || 3,
          parentId: currentSection.id,
        });
      }
    }

    target.push(block);
  }

  const page = { note, intro, sections };
  notePageCache.set(note.id, page);
  return page;
}

function missingRequires(command, selected = state.selected) {
  return list(command.requires).filter((tag) => !selected.has(tag));
}

function selectedMatches(command, selected = state.selected) {
  const tags = new Set(commandTags(command));
  return [...selected].filter((tag) => tags.has(tag));
}

function selectedTagsByGroup(selected = state.selected) {
  const groups = state.taxonomy?.groups || {};
  const whatYouHave = new Set(groups.what_you_have || []);
  const strictGroups = ["services", "target_types", "attack_types"];
  const strict = [];
  const soft = [];

  for (const tag of selected) {
    if (whatYouHave.has(tag)) {
      soft.push(tag);
      continue;
    }

    if (strictGroups.some((group) => list(groups[group]).includes(tag))) strict.push(tag);
    else soft.push(tag);
  }

  return { strict, soft };
}

function scoreCommand(command, selected = state.selected, tabOverride = state.tab) {
  if (tabOverride !== "All" && command.tab !== tabOverride) return null;

  const query = state.query.trim().toLowerCase();
  const bag = commandBag(command);
  if (query && !query.split(/\s+/).every((part) => bag.includes(part))) return null;

  const missing = missingRequires(command, selected);
  if (state.readyOnly && missing.length) return null;

  const selectedTags = [...selected];
  const matched = selectedMatches(command, selected);
  const { strict } = selectedTagsByGroup(selected);
  const commandTagSet = new Set(commandTags(command));
  if (strict.some((tag) => !commandTagSet.has(tag))) return null;
  if (selectedTags.length && !matched.length) return null;

  let score = missing.length ? Math.max(0, 24 - missing.length * 10) : 70;

  for (const tag of selectedTags) {
    if (list(command.requires).includes(tag)) score += 26;
    else if (list(command.useful_when).includes(tag)) score += 14;
    else if (list(command.target_types).includes(tag)) score += 14;
    else if (list(command.services).includes(tag)) score += 12;
    else if (list(command.attack_types).includes(tag)) score += 10;
    else if (commandTags(command).includes(tag)) score += 5;
  }

  if (query) score += 18;
  if (command.source_type === "curated") score += 4;
  return { command, score, missing, matched };
}

function getRankedCommands(selected = state.selected, tabOverride = state.tab) {
  return state.commands
    .map((command) => scoreCommand(command, selected, tabOverride))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.command.title.localeCompare(b.command.title));
}

function getVisibleNotes(tabOverride = state.tab, viewOverride = state.view) {
  const query = state.query.trim().toLowerCase();

  return state.notes.filter((note) => {
    if (viewOverride === "notes" && tabOverride !== "All" && note.tab !== tabOverride) return false;
    if (!query) return true;
    const bag = noteBag(note);
    return query.split(/\s+/).every((part) => bag.includes(part));
  });
}

function resolveActiveNote(visibleNotes) {
  if (!visibleNotes.length) {
    state.noteId = "";
    return null;
  }

  const active = visibleNotes.find((note) => note.id === state.noteId);
  if (active) return active;

  state.noteId = visibleNotes[0].id;
  clearNoteNavigationState();
  return visibleNotes[0];
}

function availableTagsInContext() {
  const available = new Set();
  for (const item of getRankedCommands()) {
    for (const tag of commandTags(item.command)) available.add(tag);
  }
  return available;
}

function saveState() {
  writeStorage("oscp-selected-tags", JSON.stringify([...state.selected]));
  writeStorage("oscp-active-tab", state.tab);
  writeStorage("oscp-active-view", state.view);
  writeStorage("oscp-active-note", state.noteId);
  persistVariables();
}

function sanitizeSelectedTags() {
  const allowed = selectableTags();
  state.selected = new Set([...state.selected].filter((tag) => allowed.has(tag)));
}

function syncThemeButton() {
  if (!els.themeToggleButton) return;
  const isDark = state.theme === "dark";
  els.themeToggleButton.textContent = isDark ? "Dark Mode" : "Light Mode";
  els.themeToggleButton.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  els.themeToggleButton.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  writeStorage("oscp-theme", theme);
  syncThemeButton();
}

function formatDate(value) {
  if (!value) return "generated data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "generated data";
  return `generated ${date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`;
}

function activeViewMeta() {
  return viewModes[state.view] || viewModes.suggest;
}

function normalizeView() {
  if (!viewModes[state.view]) state.view = "notes";
}

function renderViewSwitch() {
  els.viewSwitch.innerHTML = "";

  for (const [id, meta] of Object.entries(viewModes)) {
    const button = document.createElement("button");
    button.className = "view-button";
    button.type = "button";
    button.dataset.view = id;
    button.setAttribute("aria-pressed", String(state.view === id));
    button.textContent = meta.buttonLabel;
    els.viewSwitch.append(button);
  }
}

function renderVariables(container) {
  const grid = document.createElement("div");
  grid.className = "vars-grid";

  for (const field of variableFields) {
    const label = document.createElement("label");
    label.className = `var-field${field.sensitive ? " is-sensitive" : ""}`;

    const labelText = document.createElement("span");
    labelText.textContent = field.label;

    const input = document.createElement("input");
    input.type = field.sensitive ? "password" : "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.dataset.varKey = field.key;
    input.placeholder = `<${field.key}>`;
    input.value = state.variables[field.key] || "";

    label.append(labelText, input);
    grid.append(label);
  }

  container.append(grid);
}

function renderVarsStatus() {
  const setCount = variableFields.filter((field) => state.variables[field.key]).length;
  els.statusLabel.textContent = activeViewMeta().statusLabel;
  els.statusCount.textContent = String(setCount);
  els.readyMeter.style.width = `${Math.min(100, Math.round((setCount / variableFields.length) * 100))}%`;
}

function renderTabs() {
  if (!activeViewMeta().showTabs) {
    els.tabs.innerHTML = "";
    return;
  }

  const tabs = ["All", ...list(state.taxonomy.groups.tabs)];
  const counts = new Map();

  for (const tab of tabs) {
    const count =
      state.view === "suggest"
        ? getRankedCommands(state.selected, tab).length
        : getVisibleNotes(tab, "notes").length;
    counts.set(tab, count);
  }

  if (state.tab !== "All" && (counts.get(state.tab) || 0) === 0) {
    state.tab = tabs.find((tab) => tab !== "All" && (counts.get(tab) || 0) > 0) || "All";
  }

  els.tabs.innerHTML = "";
  for (const tab of tabs) {
    const button = document.createElement("button");
    const count = counts.get(tab) || 0;
    if (tab !== "All" && count === 0) continue;

    button.className = `tab${state.tab === tab ? " is-active" : ""}`;
    button.type = "button";
    button.dataset.tab = tab;
    button.innerHTML = `${tab}<span class="tab-count">${count}</span>`;
    els.tabs.append(button);
  }
}

function renderTagGroups() {
  if (state.view !== "suggest") {
    els.tagGroups.innerHTML = "";
    return;
  }

  const groups = state.taxonomy.groups || {};
  const targets = new Set(groups.target_types || []);
  const available = availableTagsInContext();

  els.tagGroups.innerHTML = "";
  for (const [groupKey, label] of tagGroups) {
    let tags = list(groups[groupKey]);
    if (groupKey === "services") tags = tags.filter((tag) => !targets.has(tag));
    if (!tags.length) continue;

    const section = document.createElement("section");
    section.className = "tag-group";
    section.innerHTML = `<h3>${label}</h3>`;

    const listNode = document.createElement("div");
    listNode.className = "tag-list";

    for (const tag of tags) {
      const isSelected = state.selected.has(tag);
      const isAvailable = isSelected || available.has(tag);
      if (!isAvailable) continue;
      const button = document.createElement("button");
      button.className = ["tag", isSelected ? "is-selected" : ""].filter(Boolean).join(" ");
      button.type = "button";
      button.dataset.tag = tag;
      button.title = `Filter by ${tag}`;
      button.textContent = tag;
      listNode.append(button);
    }

    if (!listNode.children.length) continue;

    section.append(listNode);
    els.tagGroups.append(section);
  }
}

function renderSelectedQuery() {
  if (state.view !== "suggest") return;
  const selected = [...state.selected];
  els.selectedQuery.textContent = selected.length ? selected.map((tag) => `+${tag}`).join(" ") : "Pick tags to begin";
}

function renderNoteIndex(notes, activeNote) {
  els.noteIndex.innerHTML = "";

  if (!notes.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No notes in this view yet.";
    els.noteIndex.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const note of notes) {
    const button = document.createElement("button");
    button.className = `note-link${activeNote && activeNote.id === note.id ? " is-active" : ""}`;
    button.type = "button";
    button.dataset.noteId = note.id;
    button.textContent = note.title;
    fragment.append(button);
  }

  els.noteIndex.append(fragment);
}

function renderSuggestStatus(ranked) {
  els.statusLabel.textContent = activeViewMeta().statusLabel;
  const ready = ranked.filter((item) => !item.missing.length).length;
  const total = ranked.length || state.commands.length || 1;
  els.statusCount.textContent = String(ready);
  els.readyMeter.style.width = `${Math.min(100, Math.round((ready / total) * 100))}%`;
}

function renderNotesStatus(visibleNotes) {
  els.statusLabel.textContent = activeViewMeta().statusLabel;

  let totalInScope = 1;
  if (state.tab === "All") {
    totalInScope = state.notes.length || 1;
  } else {
    totalInScope = state.notes.filter((note) => note.tab === state.tab).length || 1;
  }

  els.statusCount.textContent = String(visibleNotes.length);
  els.readyMeter.style.width = `${Math.min(100, Math.round((visibleNotes.length / totalInScope) * 100))}%`;
}

function badge(label, kind = "") {
  const node = document.createElement("span");
  node.className = `badge ${kind}`.trim();
  node.textContent = label;
  return node;
}

function createCodePanel(text, lang = "", options = {}) {
  const codeText = applyVariables(text);
  const kind = inferCodeKind(codeText, lang);
  const wrapper = document.createElement("div");
  wrapper.className = `code-panel code-kind-${kind}`;

  const head = document.createElement("div");
  head.className = "code-head";

  const label = document.createElement("span");
  label.className = "code-kind-badge";
  label.textContent = codeKindLabel(kind);
  head.append(label);

  if (options.copy !== false) {
    const button = document.createElement("button");
    button.className = "code-copy-button";
    button.type = "button";
    button.dataset.copyCode = codeText;
    button.textContent = "copy";
    head.append(button);
  }

  const pre = document.createElement("pre");
  pre.className = `code-kind-${kind}`;
  const code = document.createElement("code");
  renderHighlightedCode(code, codeText, kind);
  pre.append(code);

  wrapper.append(head, pre);
  return { wrapper, kind, text: codeText };
}

function renderCommand(item) {
  const { command, missing } = item;
  const node = els.commandTemplate.content.firstElementChild.cloneNode(true);
  const source = node.querySelector(".source");
  const title = node.querySelector("h3");
  const description = node.querySelector(".command-description");
  const codePanel = node.querySelector(".code-panel");
  const codeKindBadge = node.querySelector(".code-kind-badge");
  const code = node.querySelector("code");
  const pre = node.querySelector("pre");
  const statePill = node.querySelector(".state-pill");
  const badges = node.querySelector(".badges");
  const outputs = node.querySelector(".outputs");
  const copyButton = node.querySelector(".code-copy-button");
  const body = applyVariables(commandBody(command));
  const kind = inferCodeKind(body, command.lang || "");

  source.textContent = `${command.tab} / ${command.source || "generated"}`;
  title.textContent = command.title;
  description.textContent = command.description || "";
  description.classList.toggle("hidden", !command.description);
  codePanel.classList.add(`code-kind-${kind}`);
  pre.classList.add(`code-kind-${kind}`);
  codeKindBadge.textContent = codeKindLabel(kind);
  renderHighlightedCode(code, body, kind);

  if (missing.length) {
    statePill.classList.add("needs");
    statePill.textContent = `needs ${missing.join(", ")}`;
  } else {
    statePill.textContent = "ready";
  }

  for (const tag of commandTags(command).slice(0, 14)) {
    badges.append(badge(tag));
  }
  for (const need of missing) {
    badges.append(badge(`needs:${need}`, "need"));
  }

  const outputList = list(command.outputs);
  outputs.textContent = outputList.length ? `Outputs: ${outputList.join(", ")}` : "";
  outputs.classList.toggle("hidden", !outputList.length);

  copyButton.dataset.copyCode = body;
  return node;
}

function headingTag(depth) {
  if (depth <= 2) return "h3";
  if (depth === 3) return "h4";
  return "h5";
}

function renderNoteBlock(block) {
  if (block.type === "heading") {
    const node = document.createElement(headingTag(block.depth || 2));
    node.textContent = block.text;
    if (block.anchorId) node.id = block.anchorId;
    return node;
  }

  if (block.type === "paragraph") {
    const node = document.createElement("p");
    node.textContent = block.text;
    return node;
  }

  if (block.type === "tagline") {
    const node = document.createElement("div");
    node.className = "note-tags";
    for (const tag of list(block.tags)) node.append(badge(tag));
    return node;
  }

  if (block.type === "list") {
    const node = document.createElement(block.ordered ? "ol" : "ul");
    node.className = "note-list";
    if (block.ordered && Number(block.start) > 1) node.start = Number(block.start);
    for (const item of list(block.items)) {
      const li = document.createElement("li");
      li.textContent = item;
      node.append(li);
    }
    return node;
  }

  if (block.type === "code") {
    return createCodePanel(block.text || "", block.lang || "").wrapper;
  }

  return null;
}

function renderNoteSection(section) {
  const details = document.createElement("details");
  details.className = "note-section";
  details.id = section.id;
  details.open = !state.sectionCollapsed.has(section.id);

  const summary = document.createElement("summary");
  summary.className = "note-summary";
  summary.innerHTML = `<span class="note-summary-caret">></span><span>${section.title}</span>`;

  const body = document.createElement("div");
  body.className = "note-section-body";

  let activeSubsection = null;
  const appendBlock = (target, block) => {
    const rendered = renderNoteBlock(block);
    if (rendered) target.append(rendered);
  };

  for (const block of list(section.blocks)) {
    if (block.type === "heading" && (block.depth || 3) === 3) {
      activeSubsection = document.createElement("details");
      activeSubsection.className = "note-subsection";
      activeSubsection.id = block.anchorId || "";
      activeSubsection.open = !state.sectionCollapsed.has(activeSubsection.id);

      const subSummary = document.createElement("summary");
      subSummary.className = "note-summary note-subsummary";
      subSummary.innerHTML = `<span class="note-summary-caret">></span><span>${block.text}</span>`;

      const subBody = document.createElement("div");
      subBody.className = "note-section-body note-subsection-body";
      activeSubsection.append(subSummary, subBody);
      body.append(activeSubsection);
      continue;
    }

    const target = activeSubsection?.querySelector(".note-subsection-body") || body;
    appendBlock(target, block);
  }

  details.append(summary, body);
  return details;
}

function renderNote(page) {
  const node = els.noteTemplate.content.firstElementChild.cloneNode(true);
  const source = node.querySelector(".source");
  const title = node.querySelector("h3");
  const content = node.querySelector(".note-content");
  const wrapper = document.createElement("div");
  wrapper.className = "note-page";

  source.textContent = `${page.note.tab} / ${page.note.source}`;
  title.textContent = page.note.title;

  if (page.intro.length) {
    const intro = document.createElement("div");
    intro.className = "note-intro";
    for (const block of page.intro) {
      const rendered = renderNoteBlock(block);
      if (rendered) intro.append(rendered);
    }
    wrapper.append(intro);
  }

  if (page.sections.length) {
    const sections = document.createElement("div");
    sections.className = "note-sections";
    for (const section of page.sections) {
      sections.append(renderNoteSection(section));
    }
    wrapper.append(sections);
  }

  content.append(wrapper);
  return node;
}

function renderNoteToc(page) {
  els.noteToc.innerHTML = "";
  els.noteTocHeading.textContent = page ? page.note.title : "Contents";

  if (!page) {
    const empty = document.createElement("div");
    empty.className = "toc-empty";
    empty.textContent = "Select a note to browse its sections.";
    els.noteToc.append(empty);
    return;
  }

  if (!page.sections.length) {
    const empty = document.createElement("div");
    empty.className = "toc-empty";
    empty.textContent = "This note does not have section headings yet.";
    els.noteToc.append(empty);
    return;
  }

  const activeId = state.routeSectionId || page.sections[0]?.id || "";
  const fragment = document.createDocumentFragment();
  for (const section of page.sections) {
    const group = document.createElement("div");
    group.className = "toc-group";

    const row = document.createElement("div");
    row.className = "toc-row";

    const toggle = document.createElement("button");
    toggle.className = "toc-toggle";
    toggle.type = "button";
    toggle.dataset.toggleSection = section.id;
    toggle.textContent = state.tocCollapsed.has(section.id) ? ">" : "v";
    toggle.setAttribute("aria-label", `Toggle ${section.title}`);

    const link = document.createElement("button");
    link.className = `toc-link${activeId === section.id ? " is-active" : ""}`;
    link.type = "button";
    link.dataset.scrollId = section.id;
    link.textContent = section.title;

    row.append(toggle, link);
    group.append(row);

    if (section.children.length) {
      const children = document.createElement("div");
      children.className = `toc-children${state.tocCollapsed.has(section.id) ? " is-collapsed" : ""}`;

      for (const child of section.children) {
        const childButton = document.createElement("button");
        childButton.className = `toc-sublink${activeId === child.id ? " is-active" : ""}`;
        childButton.type = "button";
        childButton.dataset.scrollId = child.id;
        childButton.dataset.parentSection = section.id;
        childButton.textContent = child.text;
        children.append(childButton);
      }

      group.append(children);
    }

    fragment.append(group);
  }

  els.noteToc.append(fragment);
}

function setActiveTocId(anchorId) {
  if (!anchorId || state.routeSectionId === anchorId) return;
  state.routeSectionId = anchorId;

  const links = els.noteToc.querySelectorAll(".toc-link, .toc-sublink");
  for (const link of links) {
    link.classList.toggle("is-active", link.dataset.scrollId === anchorId);
  }

  if (isNoteLikeView() && state.noteId) {
    setRoute(state.view, state.noteId, anchorId, "replace");
  }
}

function currentSectionId(sectionIds) {
  const anchorLine = Math.max(120, Math.round(window.innerHeight * 0.24));
  let activeId = sectionIds[0] || "";

  for (const sectionId of sectionIds) {
    const section = document.getElementById(sectionId);
    if (!section) continue;
    const rect = section.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (rect.top <= anchorLine) activeId = sectionId;
    if (rect.top > anchorLine) break;
  }

  return activeId;
}

function teardownScrollSpy() {
  if (scrollSpyCleanup) scrollSpyCleanup();
  if (scrollSpyFrame) cancelAnimationFrame(scrollSpyFrame);
  scrollSpyCleanup = null;
  scrollSpyFrame = 0;
}

function setupScrollSpy(page) {
  teardownScrollSpy();
  const sectionIds = [];
  for (const section of list(page.sections)) {
    sectionIds.push(section.id);
    for (const child of list(section.children)) sectionIds.push(child.id);
  }
  if (!sectionIds.length) return;

  const updateActiveSection = () => {
    if (scrollSpyFrame) return;
    scrollSpyFrame = requestAnimationFrame(() => {
      scrollSpyFrame = 0;
      if (!isNoteLikeView()) return;
      setActiveTocId(currentSectionId(sectionIds));
    });
  };

  window.addEventListener("scroll", updateActiveSection, { passive: true });
  window.addEventListener("resize", updateActiveSection);
  scrollSpyCleanup = () => {
    window.removeEventListener("scroll", updateActiveSection);
    window.removeEventListener("resize", updateActiveSection);
  };

  updateActiveSection();
}

function updateBackToTopVisibility() {
  if (!els.backToTopButton) return;
  const shouldShow = window.scrollY > 420;
  els.backToTopButton.classList.toggle("is-visible", shouldShow);
  els.backToTopButton.setAttribute("aria-hidden", String(!shouldShow));
  els.backToTopButton.tabIndex = shouldShow ? 0 : -1;
}

function scheduleBackToTopVisibility() {
  if (backToTopFrame) return;
  backToTopFrame = requestAnimationFrame(() => {
    backToTopFrame = 0;
    updateBackToTopVisibility();
  });
}

function renderSuggestions() {
  teardownScrollSpy();
  const ranked = getRankedCommands();
  els.results.innerHTML = "";
  els.resultTitle.textContent = state.tab === "All" ? "All commands" : state.tab;
  els.resultCount.textContent = `${ranked.length} result${ranked.length === 1 ? "" : "s"}`;

  if (!ranked.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No matching commands yet. Try removing one tag or turning off ready only.";
    els.results.append(empty);
    renderSuggestStatus(ranked);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const item of ranked) {
    fragment.append(renderCommand(item));
  }
  els.results.append(fragment);
  renderSuggestStatus(ranked);
}

function scrollToNoteAnchor(anchorId) {
  if (!anchorId) return;
  const target = document.getElementById(anchorId);
  if (!target) return;

  const details = target.closest("details");
  if (details) {
    details.open = true;
    state.sectionCollapsed.delete(details.id);
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function syncNoteRoute(activeNote, mode = "replace") {
  if (!isNoteLikeView() || !activeNote) return;
  setRoute(state.view, activeNote.id, state.routeSectionId, mode);
}

function renderNotes() {
  teardownScrollSpy();
  const visibleNotes = getVisibleNotes();
  const activeNote = resolveActiveNote(visibleNotes);
  els.results.innerHTML = "";
  renderNoteIndex(visibleNotes, activeNote);
  renderNotesStatus(visibleNotes);

  if (!activeNote) {
    els.resultTitle.textContent = "No note selected";
    els.resultCount.textContent = "0 sections";
    renderNoteToc(null);
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No matching notes yet. Try another tab or a broader search.";
    els.results.append(empty);
    return;
  }

  const page = buildNotePage(activeNote);
  els.resultTitle.textContent = activeNote.title;
  els.resultCount.textContent = `${page.sections.length} section${page.sections.length === 1 ? "" : "s"}`;
  renderNoteToc(page);
  els.results.append(renderNote(page));
  setupScrollSpy(page);
  syncNoteRoute(activeNote, "replace");

  if (state.pendingScrollId) {
    requestAnimationFrame(() => {
      scrollToNoteAnchor(state.pendingScrollId);
      state.pendingScrollId = "";
    });
  }
}

function renderVarsView() {
  teardownScrollSpy();
  els.results.innerHTML = "";
  els.resultTitle.textContent = "Saved variables";
  els.resultCount.textContent = `${variableFields.length} fields`;
  renderVarsStatus();

  const card = document.createElement("section");
  card.className = "vars-card";

  const head = document.createElement("div");
  head.className = "vars-head";

  const copy = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = "Set command placeholders";
  const helper = document.createElement("p");
  helper.className = "vars-help";
  helper.textContent = "Values are applied to matching placeholders when commands are rendered. Sensitive values stay in memory only.";
  copy.append(title, helper);

  const actions = document.createElement("div");
  actions.className = "vars-actions";
  const clearButton = document.createElement("button");
  clearButton.className = "ghost-button";
  clearButton.type = "button";
  clearButton.dataset.clearVars = "true";
  clearButton.textContent = "Clear Vars";
  actions.append(clearButton);

  head.append(copy, actions);
  card.append(head);
  renderVariables(card);
  els.results.append(card);
}

function syncViewChrome() {
  const meta = activeViewMeta();
  const showSuggest = state.view === "suggest";
  const showNotes = isNoteLikeView();

  document.body.dataset.view = state.view;
  els.heroEyebrow.textContent = meta.eyebrow;
  els.heroTitle.textContent = meta.title;
  els.heroLede.textContent = meta.lede;
  els.searchLabel.textContent = "Search";
  els.searchInput.placeholder = meta.searchPlaceholder;
  els.resultEyebrow.textContent = meta.resultEyebrow;
  els.noteIndexHeading.textContent = meta.noteIndexLabel || "Notes";

  els.toolbar.classList.toggle("hidden", meta.showToolbar === false);
  els.readyOnlyButton.classList.toggle("hidden", !showSuggest);
  els.selectionPanel.classList.toggle("hidden", !showSuggest);
  els.tagGroups.classList.toggle("hidden", !showSuggest);
  els.filters.classList.toggle("hidden", !showSuggest && !showNotes);
  els.noteIndexPanel.classList.toggle("hidden", !showNotes);
  els.noteTocPanel.classList.toggle("hidden", !showNotes);
  els.tabs.classList.toggle("hidden", !meta.showTabs);
}

function render() {
  normalizeView();
  syncThemeButton();
  syncViewChrome();
  renderViewSwitch();
  renderTabs();

  if (state.view === "suggest") {
    renderTagGroups();
    renderSelectedQuery();
    renderSuggestions();
  } else if (isNoteLikeView()) {
    renderTagGroups();
    renderNotes();
  } else {
    renderTagGroups();
    renderVarsView();
  }

  saveState();
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  if (button) {
    const oldText = button.textContent;
    button.textContent = "copied";
    setTimeout(() => {
      button.textContent = oldText;
    }, 900);
  }
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    state.routeSectionId = "";
    state.pendingScrollId = "";
    render();
  });

  els.readyOnlyButton.addEventListener("click", () => {
    state.readyOnly = !state.readyOnly;
    els.readyOnlyButton.setAttribute("aria-pressed", String(state.readyOnly));
    render();
  });

  els.copyVisibleButton.addEventListener("click", () => {
    if (state.view === "suggest") {
      const commands = getRankedCommands().map((item) => applyVariables(commandBody(item.command)));
      copyText(commands.join("\n\n"), els.copyVisibleButton);
      return;
    }

    const activeNote = resolveActiveNote(getVisibleNotes());
    if (!activeNote) return;
    copyText(applyVariables(noteToText(activeNote)), els.copyVisibleButton);
  });

  els.themeToggleButton.addEventListener("click", () => {
    applyTheme(state.theme === "dark" ? "light" : "dark");
  });

  els.backToTopButton?.addEventListener("click", () => {
    const prefersReducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  els.resetButton.addEventListener("click", () => {
    state.selected.clear();
    state.query = "";
    state.tab = "All";
    state.readyOnly = false;
    clearNoteNavigationState();
    els.searchInput.value = "";
    els.readyOnlyButton.setAttribute("aria-pressed", "false");
    render();
  });

  els.viewSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (!button) return;

    const nextView = button.dataset.view;
    state.view = nextView;
    clearNoteNavigationState();

    if (nextView === "suggest" || nextView === "vars") {
      clearRoute("replace");
      render();
      return;
    }

    const visibleNotes = getVisibleNotes(state.tab, nextView);
    const activeNote = resolveActiveNote(visibleNotes);
    if (activeNote) setRoute(nextView, activeNote.id, "", "replace");
    else clearRoute("replace");
    render();
  });

  els.tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (!button) return;
    state.tab = button.dataset.tab;
    clearNoteNavigationState();
    render();
  });

  els.tagGroups.addEventListener("click", (event) => {
    if (state.view !== "suggest") return;
    const button = event.target.closest("[data-tag]");
    if (!button) return;
    const { tag } = button.dataset;
    if (state.selected.has(tag)) state.selected.delete(tag);
    else state.selected.add(tag);
    render();
  });

  els.noteIndex.addEventListener("click", (event) => {
    const button = event.target.closest("[data-note-id]");
    if (!button) return;
    const nextId = button.dataset.noteId;
    if (state.noteId !== nextId) clearNoteNavigationState();
    state.noteId = nextId;
    setRoute(state.view, state.noteId, "", "push");
    render();
  });

  els.noteToc.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-toggle-section]");
    if (toggle) {
      const sectionId = toggle.dataset.toggleSection;
      if (state.tocCollapsed.has(sectionId)) state.tocCollapsed.delete(sectionId);
      else state.tocCollapsed.add(sectionId);
      render();
      return;
    }

    const link = event.target.closest("[data-scroll-id]");
    if (!link) return;

    const anchorId = link.dataset.scrollId;
    const parentSection = link.dataset.parentSection || anchorId;
    state.routeSectionId = anchorId;
    state.pendingScrollId = anchorId;
    if (link.dataset.parentSection) state.tocCollapsed.delete(parentSection);
    setRoute(state.view, state.noteId, anchorId, "replace");
    render();
  });

  els.results.addEventListener("click", (event) => {
    const clearVarsButton = event.target.closest("[data-clear-vars]");
    if (clearVarsButton) {
      state.variables = {};
      persistVariables();
      render();
      return;
    }

    const codeCopyButton = event.target.closest("[data-copy-code]");
    if (codeCopyButton) {
      copyText(codeCopyButton.dataset.copyCode || "", codeCopyButton);
      return;
    }

    const button = event.target.closest(".copy-button");
    if (!button) return;
    copyText(button.dataset.command || button.dataset.note || "", button);
  });

  els.results.addEventListener("input", (event) => {
    const input = event.target.closest("[data-var-key]");
    if (!input) return;
    state.variables[input.dataset.varKey] = input.value.trim();
    persistVariables();
    renderVarsStatus();
  });

  els.results.addEventListener(
    "toggle",
    (event) => {
      const details = event.target;
      if (
        !(details instanceof HTMLDetailsElement) ||
        (!details.classList.contains("note-section") && !details.classList.contains("note-subsection"))
      ) {
        return;
      }
      if (details.open) state.sectionCollapsed.delete(details.id);
      else state.sectionCollapsed.add(details.id);
    },
    true,
  );

  window.addEventListener("popstate", () => {
    applyRouteFromLocation();
    render();
  });

  window.addEventListener("scroll", scheduleBackToTopVisibility, { passive: true });
  window.addEventListener("resize", scheduleBackToTopVisibility);
  updateBackToTopVisibility();
}

async function init() {
  applyTheme(state.theme);
  bindEvents();

  try {
    const [taxonomyResponse, commandsResponse] = await Promise.all([
      fetch("./data/taxonomy.json"),
      fetch("./data/commands.json"),
    ]);

    if (!taxonomyResponse.ok || !commandsResponse.ok) {
      throw new Error("Generated JSON not found. Run the data build script first.");
    }

    state.taxonomy = await taxonomyResponse.json();
    const commandData = await commandsResponse.json();
    state.commands = list(commandData.commands);
    state.notes = list(commandData.notes);
    sanitizeSelectedTags();
    applyRouteFromLocation();
    els.dataStamp.textContent = formatDate(commandData.generated_at);
    render();
  } catch (error) {
    els.dataStamp.textContent = "data unavailable";
    els.results.innerHTML = `<div class="empty-state">${error.message}</div>`;
    console.error(error);
  }
}

init();
