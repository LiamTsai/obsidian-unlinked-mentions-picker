"use strict";
// Unlinked Mentions Picker — 只使用 Obsidian 公開 API。
// 右側欄多一個分頁（圖示出現在側欄頂端那排按鈕），有兩種模式：
// 「本筆記內」：列出目前筆記裡提到其他筆記名稱/別名、但還沒連結的地方。
// 「提及本筆記」：列出其他筆記裡提到目前筆記名稱/別名、但還沒連結的地方。
// 預設全選，取消不要的後一次建立連結。

const obsidian = require("obsidian");
const { Plugin, ItemView, MarkdownView, Notice, debounce, parseFrontMatterAliases } = obsidian;

const VIEW_TYPE = "unlinked-mentions-picker";
const MODE_OUT = "outgoing"; // 本筆記內提到其他筆記
const MODE_IN = "incoming";  // 其他筆記提到本筆記

// ---------- 介面語系：繁中、日文、英文，其他語系一律英文 ----------

const STRINGS = {
  en: {
    viewTitle: "Unlinked mentions",
    commandOpen: "Open unlinked mentions list",
    commandOpenIncoming: "List unlinked mentions of this note in other notes",
    tabOutgoing: "In this note",
    tabIncoming: "Mentioning this note",
    openNoteFirst: "Open a note first.",
    summary: (name, n) => `${name} — ${n} unlinked mention${n === 1 ? "" : "s"}`,
    summaryIncoming: (name, n, files) =>
      `${name} — ${n} unlinked mention${n === 1 ? "" : "s"} in ${files} note${files === 1 ? "" : "s"}`,
    selectAll: "Select all",
    selectNone: "Select none",
    createLinks: (n) => `Create links (${n})`,
    noMentions: "No unlinked mentions.",
    noMentionsIncoming: "No other note mentions this note without a link.",
    chooseTargetFirst: "This name matches several notes. Choose a target first.",
    chooseTargetOption: (n) => `(${n} notes with this name — choose one)`,
    shadowedBy: (name) => `Part of “${name}” (not selected by default)`,
    result: (done, stale, undoable) =>
      `Created ${done} link${done === 1 ? "" : "s"}` +
      (stale ? ` (${stale} skipped because the note changed)` : "") +
      (undoable ? ". Press Ctrl+Z to undo." : "."),
    resultIncoming: (done, files, stale) =>
      `Created ${done} link${done === 1 ? "" : "s"} in ${files} note${files === 1 ? "" : "s"}` +
      (stale ? ` (${stale} skipped because the note changed)` : "") + ".",
  },
  "zh-TW": {
    viewTitle: "未連結提及",
    commandOpen: "開啟未連結提及清單",
    commandOpenIncoming: "列出其他筆記中提到本筆記的未連結提及",
    tabOutgoing: "本筆記內",
    tabIncoming: "提及本筆記",
    openNoteFirst: "請先開啟一篇筆記。",
    summary: (name, n) => `${name} — ${n} 個未連結提及`,
    summaryIncoming: (name, n, files) => `${name} — ${files} 篇筆記中有 ${n} 個未連結提及`,
    selectAll: "全選",
    selectNone: "全不選",
    createLinks: (n) => `建立連結（${n}）`,
    noMentions: "沒有未連結的提及。",
    noMentionsIncoming: "沒有其他筆記在未連結的情況下提到這篇筆記。",
    chooseTargetFirst: "這個名稱對應多篇筆記，請先選擇目標。",
    chooseTargetOption: (n) => `（${n} 篇同名，請選擇）`,
    shadowedBy: (name) => `屬於「${name}」的一部分（預設不勾）`,
    result: (done, stale, undoable) =>
      `已建立 ${done} 個連結` +
      (stale ? `（${stale} 個因內容已變動而略過）` : "") +
      (undoable ? "，可用 Ctrl+Z 復原。" : "。"),
    resultIncoming: (done, files, stale) =>
      `已在 ${files} 篇筆記建立 ${done} 個連結` +
      (stale ? `（${stale} 個因內容已變動而略過）` : "") + "。",
  },
  ja: {
    viewTitle: "未リンクの言及",
    commandOpen: "未リンクの言及リストを開く",
    commandOpenIncoming: "他のノートにあるこのノートへの未リンクの言及を表示",
    tabOutgoing: "このノート内",
    tabIncoming: "このノートへの言及",
    openNoteFirst: "ノートを開いてください。",
    summary: (name, n) => `${name} — 未リンクの言及 ${n} 件`,
    summaryIncoming: (name, n, files) => `${name} — ${files} 件のノートに未リンクの言及 ${n} 件`,
    selectAll: "すべて選択",
    selectNone: "選択解除",
    createLinks: (n) => `リンクを作成（${n}）`,
    noMentions: "未リンクの言及はありません。",
    noMentionsIncoming: "このノートをリンクせずに言及している他のノートはありません。",
    chooseTargetFirst: "この名前は複数のノートに該当します。先にリンク先を選択してください。",
    chooseTargetOption: (n) => `（同名のノートが ${n} 件。選択してください）`,
    shadowedBy: (name) => `「${name}」の一部（既定では未選択）`,
    result: (done, stale, undoable) =>
      `${done} 件のリンクを作成しました` +
      (stale ? `（${stale} 件は内容が変更されたためスキップ）` : "") +
      (undoable ? "。Ctrl+Z でまとめて元に戻せます。" : "。"),
    resultIncoming: (done, files, stale) =>
      `${files} 件のノートに ${done} 件のリンクを作成しました` +
      (stale ? `（${stale} 件は内容が変更されたためスキップ）` : "") + "。",
  },
};

// Obsidian 1.8.7 起有公開的 getLanguage()；舊版退回讀 localStorage 的 "language"（英文時為空）
function detectLanguage() {
  let lang = "";
  try {
    lang = typeof obsidian.getLanguage === "function"
      ? obsidian.getLanguage()
      : window.localStorage.getItem("language");
  } catch (e) { /* 取不到就用英文 */ }
  return Object.prototype.hasOwnProperty.call(STRINGS, lang) ? lang : "en";
}

const T = STRINGS[detectLanguage()];

// ---------- 比對邏輯（純函式，不碰 Obsidian 物件，方便測試） ----------

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const WORD = /[\p{L}\p{N}_]/u;
// 英數字需要斷詞邊界（"NS" 不會比對到 "NSFW"）；中日韓文字沒有空白分詞，直接比對。
const needsBoundary = (ch) => !!ch && WORD.test(ch) && !CJK.test(ch);

/**
 * @param content 筆記全文
 * @param names   Map<小寫名稱, targets[]>
 * @param excluded [start, end][] 不可比對的範圍（frontmatter、既有連結、程式碼區塊）
 * @returns {start, end, key, targets}[]，依位置排序，含重疊項
 */
function findMentions(content, names, excluded) {
  const lower = content.toLowerCase();
  const out = [];
  const isExcluded = (s, e) => excluded.some(([a, b]) => s < b && e > a);
  for (const [key, targets] of names) {
    if (!key) continue;
    const headB = needsBoundary(key[0]);
    const tailB = needsBoundary(key[key.length - 1]);
    let i = lower.indexOf(key);
    while (i !== -1) {
      const end = i + key.length;
      const okHead = !headB || !needsBoundary(lower[i - 1]);
      const okTail = !tailB || !needsBoundary(lower[end]);
      if (okHead && okTail && !isExcluded(i, end)) out.push({ start: i, end, key, targets });
      i = lower.indexOf(key, i + 1);
    }
  }
  out.sort((a, b) => a.start - b.start || b.end - a.end);
  return out;
}

/** 預設勾選：較長者優先、不重疊、只有單一目標的。回傳被選的 index Set。 */
function defaultSelection(mentions) {
  const order = mentions.map((m, i) => i).sort((a, b) =>
    (mentions[b].end - mentions[b].start) - (mentions[a].end - mentions[a].start) || mentions[a].start - mentions[b].start);
  const sel = new Set();
  for (const i of order) {
    const m = mentions[i];
    if (m.targets.length !== 1 || m.shadowedBy) continue;
    if ([...sel].some((j) => overlaps(m, mentions[j]))) continue;
    sel.add(i);
  }
  return sel;
}

// 同一個檔案裡範圍重疊才算重疊（「提及本筆記」模式會跨多個檔案）
const overlaps = (a, b) => a.file === b.file && a.start < b.end && b.start < a.end;

/** 從 metadata cache 取出不可比對的範圍與表格位置 */
function blockedRanges(cache) {
  const excluded = [];
  if (cache?.frontmatterPosition) excluded.push([0, cache.frontmatterPosition.end.offset]);
  for (const l of [...(cache?.links || []), ...(cache?.embeds || [])]) {
    excluded.push([l.position.start.offset, l.position.end.offset]);
  }
  for (const s of cache?.sections || []) {
    if (s.type === "code") excluded.push([s.position.start.offset, s.position.end.offset]);
  }
  const tables = (cache?.sections || []).filter((s) => s.type === "table");
  return { excluded, tables };
}

// ---------- 側欄視圖 ----------

class PickerView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.mode = MODE_OUT;
    this.file = null;
    this.mentions = [];  // {file, content, start, end, key, targets, inTable}
    this.selected = new Set();
    this.targetChoice = new Map(); // mention index -> 選定的目標 TFile（多目標時）
    this.holdFor = null; // 「提及本筆記」模式點了前後文而跳去的檔案；停在那裡時清單不切換
    this.seq = 0;
    this.refresh = debounce(() => this.recompute(), 300, true);
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return T.viewTitle; }
  getIcon() { return "list-checks"; }

  getState() { return { ...super.getState(), mode: this.mode }; }
  async setState(state, result) {
    if (state?.mode === MODE_IN || state?.mode === MODE_OUT) await this.setMode(state.mode);
    await super.setState(state, result);
  }

  async setMode(mode) {
    if (mode === this.mode) return;
    this.mode = mode;
    this.mentions = [];
    this.selected = new Set();
    this.targetChoice = new Map();
    this.holdFor = null;
    this.app.workspace.requestSaveLayout();
    if (this.opened) await this.recompute();
  }

  async onOpen() {
    this.opened = true;
    this.registerEvent(this.app.workspace.on("file-open", () => this.refresh()));
    this.registerEvent(this.app.metadataCache.on("changed", () => this.refresh()));
    this.registerEvent(this.app.vault.on("rename", () => this.refresh()));
    this.registerEvent(this.app.vault.on("delete", () => this.refresh()));
    await this.recompute();
  }

  async recompute() {
    const seq = ++this.seq;
    const active = this.app.workspace.getActiveFile();
    let file = active;
    if (this.mode === MODE_IN && this.holdFor && active === this.holdFor && this.file) file = this.file;
    else this.holdFor = null;
    if (!file || file.extension !== "md") {
      // 焦點在側欄或非筆記檔時，保留上一次的結果
      if (!this.file) this.render();
      return;
    }
    const prev = this.file !== file ? null : (this.pendingSnap || this.snapshotChoices());
    this.pendingSnap = null;
    const mentions = this.mode === MODE_IN ? await this.collectIncoming(file) : await this.collectOutgoing(file);
    if (seq !== this.seq) return; // 讀檔期間又觸發了新的重算
    this.file = file;
    this.mentions = mentions;
    this.selected = defaultSelection(this.mentions);
    this.targetChoice = new Map();
    if (prev) this.restoreChoices(prev);
    this.render();
  }

  /** 本筆記內：提到其他筆記的地方 */
  async collectOutgoing(file) {
    const mc = this.app.metadataCache;
    const content = await this.app.vault.cachedRead(file);
    const names = new Map();
    const add = (name, f) => {
      const k = String(name).trim().toLowerCase();
      if (!k) return;
      const list = names.get(k) || [];
      if (!list.includes(f)) list.push(f);
      names.set(k, list);
    };
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (f === file) continue;
      add(f.basename, f);
      for (const a of parseFrontMatterAliases(mc.getFileCache(f)?.frontmatter) || []) add(a, f);
    }
    const { excluded, tables } = blockedRanges(mc.getFileCache(file));
    return findMentions(content, names, excluded).map((m) => decorate(m, file, content, tables));
  }

  /** 提及本筆記：其他筆記裡提到本筆記名稱/別名的地方，依檔案路徑排序 */
  async collectIncoming(file) {
    const mc = this.app.metadataCache;
    const names = new Map();
    const add = (name) => {
      const k = String(name).trim().toLowerCase();
      if (k) names.set(k, [file]);
    };
    add(file.basename);
    for (const a of parseFrontMatterAliases(mc.getFileCache(file)?.frontmatter) || []) add(a);
    const keys = [...names.keys()];

    // 其他筆記中「包含本筆記名稱的較長名稱」（例如本筆記「東京」、另有「東京塔」）。
    // 提及落在這種較長名稱裡時預設不勾，避免把「東京塔」連成「[[東京]]塔」。
    const longer = [];
    for (const g of this.app.vault.getMarkdownFiles()) {
      if (g === file) continue;
      const own = [g.basename, ...(parseFrontMatterAliases(mc.getFileCache(g)?.frontmatter) || [])];
      for (const n of own) {
        const ln = String(n).trim().toLowerCase();
        if (ln && keys.some((k) => ln.length > k.length && ln.includes(k))) longer.push({ ln, name: String(n).trim() });
      }
    }
    const shadowOf = (lower, m) => {
      for (const { ln, name } of longer) {
        for (let off = ln.indexOf(m.key); off !== -1; off = ln.indexOf(m.key, off + 1)) {
          const s = m.start - off;
          if (s >= 0 && lower.startsWith(ln, s)) return name;
        }
      }
      return null;
    };

    const out = [];
    const others = this.app.vault.getMarkdownFiles()
      .filter((g) => g !== file)
      .sort((a, b) => a.path.localeCompare(b.path));
    for (const g of others) {
      const content = await this.app.vault.cachedRead(g);
      const lower = content.toLowerCase();
      if (!keys.some((k) => lower.includes(k))) continue; // 先粗篩，沒出現就不必解析
      const { excluded, tables } = blockedRanges(mc.getFileCache(g));
      for (const m of findMentions(content, names, excluded)) {
        out.push({ ...decorate(m, g, content, tables), shadowedBy: shadowOf(lower, m) });
      }
    }
    return out;
  }

  // 筆記編輯時偏移會變，用「檔案 + 名稱 + 第幾次出現」記住使用者的勾選
  // skip：即將被連結掉的項目，不列入編號（套用後它們就不再是未連結提及）
  snapshotChoices(skip = new Set()) {
    const snap = new Map();
    const count = new Map();
    this.mentions.forEach((m, i) => {
      if (skip.has(i)) return;
      const base = m.file.path + "\u0000" + m.key;
      const nth = count.get(base) || 0;
      count.set(base, nth + 1);
      snap.set(base + "#" + nth, { on: this.selected.has(i), target: this.targetChoice.get(i) });
    });
    return snap;
  }
  restoreChoices(snap) {
    const count = new Map();
    this.mentions.forEach((m, i) => {
      const base = m.file.path + "\u0000" + m.key;
      const nth = count.get(base) || 0;
      count.set(base, nth + 1);
      const s = snap.get(base + "#" + nth);
      if (!s) return;
      if (s.target) this.targetChoice.set(i, s.target);
      if (s.on) this.select(i); else this.selected.delete(i);
    });
  }

  // 勾選時，自動取消與它重疊的其他項目
  select(i) {
    for (const j of [...this.selected]) if (j !== i && overlaps(this.mentions[i], this.mentions[j])) this.selected.delete(j);
    this.selected.add(i);
  }

  targetOf(i) {
    return this.targetChoice.get(i) || (this.mentions[i].targets.length === 1 ? this.mentions[i].targets[0] : null);
  }

  render() {
    const root = this.contentEl;
    root.empty();

    const tabs = root.createDiv("ump-tabs");
    for (const [mode, label] of [[MODE_OUT, T.tabOutgoing], [MODE_IN, T.tabIncoming]]) {
      const b = tabs.createEl("button", { cls: "ump-tab" + (this.mode === mode ? " is-active" : ""), text: label });
      b.onclick = () => this.setMode(mode);
    }

    if (!this.file) {
      root.createDiv({ cls: "ump-empty", text: T.openNoteFirst });
      return;
    }
    const incoming = this.mode === MODE_IN;
    const fileCount = new Set(this.mentions.map((m) => m.file)).size;
    root.createDiv({
      cls: "ump-file",
      text: incoming
        ? T.summaryIncoming(this.file.basename, this.mentions.length, fileCount)
        : T.summary(this.file.basename, this.mentions.length),
    });

    const bar = root.createDiv("ump-toolbar");
    bar.createEl("button", { text: T.selectAll }).onclick = () => {
      this.selected = defaultSelection(this.mentions);
      this.mentions.forEach((m, i) => { if (this.targetOf(i) && ![...this.selected].some((j) => overlaps(m, this.mentions[j]))) this.selected.add(i); });
      this.render();
    };
    bar.createEl("button", { text: T.selectNone }).onclick = () => { this.selected.clear(); this.render(); };
    const apply = bar.createEl("button", { cls: "mod-cta ump-apply", text: T.createLinks(this.selected.size) });
    apply.disabled = this.selected.size === 0;
    apply.onclick = () => this.apply();

    if (this.mentions.length === 0) {
      root.createDiv({ cls: "ump-empty", text: incoming ? T.noMentionsIncoming : T.noMentions });
      return;
    }

    let lastFile = null;
    this.mentions.forEach((m, i) => {
      if (incoming && m.file !== lastFile) {
        root.createDiv({ cls: "ump-group", text: m.file.path.replace(/\.md$/, "") });
        lastFile = m.file;
      }
      const row = root.createDiv("ump-row");
      const cb = row.createEl("input", { type: "checkbox" });
      cb.checked = this.selected.has(i);
      cb.onchange = () => {
        if (cb.checked) {
          if (!this.targetOf(i)) { cb.checked = false; new Notice(T.chooseTargetFirst); return; }
          this.select(i);
        } else this.selected.delete(i);
        this.render();
      };

      const body = row.createDiv("ump-body");
      // 「提及本筆記」模式的目標一律是本筆記，不必每列重複顯示
      if (incoming) {
        if (m.shadowedBy) body.createDiv({ cls: "ump-target ump-shadowed", text: T.shadowedBy(m.shadowedBy) });
      } else {
        const tgt = body.createDiv("ump-target");
        if (m.targets.length === 1) {
          tgt.setText("→ " + m.targets[0].path.replace(/\.md$/, ""));
        } else {
          const sel = tgt.createEl("select");
          sel.createEl("option", { text: T.chooseTargetOption(m.targets.length), value: "" });
          m.targets.forEach((f, k) => sel.createEl("option", { text: f.path, value: String(k) }));
          const cur = this.targetChoice.get(i);
          if (cur) sel.value = String(m.targets.indexOf(cur));
          sel.onchange = () => {
            if (sel.value === "") { this.targetChoice.delete(i); this.selected.delete(i); }
            else { this.targetChoice.set(i, m.targets[Number(sel.value)]); this.select(i); }
            this.render();
          };
        }
      }

      const ctx = body.createDiv("ump-context");
      const text = m.content;
      const lineStart = text.lastIndexOf("\n", m.start - 1) + 1;
      let lineEnd = text.indexOf("\n", m.end);
      if (lineEnd === -1) lineEnd = text.length;
      const from = Math.max(lineStart, m.start - 30);
      const to = Math.min(lineEnd, m.end + 30);
      const lineNo = text.slice(0, m.start).split("\n").length;
      ctx.createSpan({ cls: "ump-line", text: `L${lineNo}` });
      ctx.appendText((from > lineStart ? "…" : "") + text.slice(from, m.start));
      ctx.createEl("mark", { text: text.slice(m.start, m.end) });
      ctx.appendText(text.slice(m.end, to) + (to < lineEnd ? "…" : ""));
      ctx.onclick = () => this.reveal(m);
    });
  }

  findEditorView(file) {
    return this.app.workspace.getLeavesOfType("markdown")
      .map((l) => l.view)
      .find((v) => v instanceof MarkdownView && v.file === file);
  }

  async reveal(m) {
    // 跳到別的檔案時，清單要停在原本的筆記上
    if (this.mode === MODE_IN) this.holdFor = m.file;
    let view = this.findEditorView(m.file);
    if (!view && this.mode === MODE_IN) {
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(m.file);
      if (leaf.view instanceof MarkdownView) view = leaf.view;
    }
    if (!view) return;
    const ed = view.editor;
    if (ed.getValue().slice(m.start, m.end).toLowerCase() !== m.key) return;
    const from = ed.offsetToPos(m.start), to = ed.offsetToPos(m.end);
    this.app.workspace.setActiveLeaf(view.leaf, { focus: true });
    ed.setSelection(from, to);
    ed.scrollIntoView({ from, to }, true);
  }

  async apply() {
    const mode = this.mode;
    const picks = [...this.selected].map((i) => ({ ...this.mentions[i], target: this.targetOf(i) }))
      .filter((p) => p.target);
    if (!picks.length) return;
    // 套用後剩下的項目維持使用者原本的勾選狀態
    this.pendingSnap = this.snapshotChoices(new Set([...this.selected].filter((i) => this.targetOf(i))));

    const byFile = new Map();
    for (const p of picks) {
      if (!byFile.has(p.file)) byFile.set(p.file, []);
      byFile.get(p.file).push(p);
    }
    let done = 0, stale = 0, files = 0, undoable = false;
    for (const [file, list] of byFile) {
      list.sort((a, b) => b.start - a.start); // 由後往前替換，前面的偏移才不會跑掉
      const r = await this.applyToFile(file, list);
      done += r.done;
      stale += r.stale;
      if (r.done) files++;
      if (r.viaEditor) undoable = true;
    }
    new Notice(mode === MODE_IN ? T.resultIncoming(done, files, stale) : T.result(done, stale, undoable));
    this.refresh();
  }

  async applyToFile(file, picks) {
    const makeLink = (p, original) => {
      let link = this.app.fileManager.generateMarkdownLink(p.target, file.path, "", original);
      if (p.inTable) link = link.replace("|", "\\|");
      return link;
    };

    let done = 0, stale = 0;
    const view = this.findEditorView(file);
    if (view) {
      // 走 editor.transaction → 一次 Ctrl+Z 就能復原這個檔案的全部變更
      const ed = view.editor;
      const text = ed.getValue();
      const changes = [];
      for (const p of picks) {
        const original = text.slice(p.start, p.end);
        if (original.toLowerCase() !== p.key) { stale++; continue; }
        changes.push({ from: ed.offsetToPos(p.start), to: ed.offsetToPos(p.end), text: makeLink(p, original) });
      }
      if (changes.length) ed.transaction({ changes });
      done = changes.length;
    } else {
      await this.app.vault.process(file, (text) => {
        for (const p of picks) {
          const original = text.slice(p.start, p.end);
          if (original.toLowerCase() !== p.key) { stale++; continue; }
          text = text.slice(0, p.start) + makeLink(p, original) + text.slice(p.end);
          done++;
        }
        return text;
      });
    }
    return { done, stale, viaEditor: !!view };
  }
}

function decorate(m, file, content, tables) {
  const inTable = tables.some((s) => s.position.start.offset <= m.start && s.position.end.offset >= m.end);
  return { ...m, file, content, inTable };
}

// ---------- 插件本體 ----------

module.exports = class UnlinkedMentionsPicker extends Plugin {
  onload() {
    this.registerView(VIEW_TYPE, (leaf) => new PickerView(leaf, this));

    // 第一次啟用時放進右側欄；之後位置由 Obsidian 的版面配置記住
    this.app.workspace.onLayoutReady(async () => {
      if (this.app.workspace.getLeavesOfType(VIEW_TYPE).length === 0) {
        await this.app.workspace.getRightLeaf(false)?.setViewState({ type: VIEW_TYPE, active: false });
      }
    });

    this.addCommand({
      id: "open-unlinked-mentions-picker",
      name: T.commandOpen,
      callback: () => this.openView(),
    });
    this.addCommand({
      id: "open-incoming-unlinked-mentions",
      name: T.commandOpenIncoming,
      callback: () => this.openView(MODE_IN),
    });
  }

  async openView(mode) {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
    if (mode && leaf.view instanceof PickerView) await leaf.view.setMode(mode);
  }
};

module.exports.findMentions = findMentions;
module.exports.defaultSelection = defaultSelection;
