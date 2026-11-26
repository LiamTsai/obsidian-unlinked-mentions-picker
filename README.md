# Unlinked Mentions Picker

An Obsidian plugin that lists every place in the current note where another note's name (or alias) appears without a link. Everything is pre-selected; uncheck what you don't want and create all the links with one click.

在目前筆記中，列出所有「提到其他筆記名稱或別名、但尚未連結」的地方，預設全選，取消不要的之後一鍵建立連結。

It also works the other way round: the **Mentioning this note** tab lists every place in *other* notes that mentions the current note's name (or alias) without a link, so you can link them all at once.

也可以反過來：切到「提及本筆記」分頁，會列出其他筆記中提到目前筆記名稱或別名、但尚未連結的地方，一次全部連結。

## Features

- Adds a tab to the right sidebar (icon: list with check marks).
- Two modes, switched at the top of the sidebar: **In this note** (mentions of other notes inside the current note) and **Mentioning this note** (mentions of the current note inside other notes, grouped by note).
- In **Mentioning this note**, a mention that is part of a longer note name (e.g. `Tokyo` inside `Tokyo Tower` when a `Tokyo Tower` note exists) is listed but not selected by default. Links in notes open in an editor can be undone per note with `Ctrl+Z`; links in closed notes are written directly to the file.
- Each item shows the target note, line number and surrounding text. Click the text to jump to it in the editor.
- When mentions overlap (e.g. `Tokyo` and `Tokyo Tower`), the longer one is selected by default; checking one unchecks the other.
- When a name matches several notes, pick the target from a dropdown before linking.
- Skips frontmatter, existing links/embeds and code blocks.
- Links are created with your link format settings (wikilink or Markdown). If the note is open in an editor, one `Ctrl+Z` undoes the whole batch.
- **CJK-friendly**: Latin words/digits need word boundaries (`NS` won't match inside `NSFW`), but Chinese/Japanese/Korean names match anywhere, so mentions inside a sentence are found — unlike Obsidian's built-in unlinked mentions.

Uses only the public Obsidian API.

## Usage / 使用方式

1. Click the list-with-check-marks icon at the top of the right sidebar, or run **Open unlinked mentions list** from the command palette.
   點右側欄頂端的 ✓ 清單圖示，或從指令面板執行「開啟未連結提及清單」。
2. Open a note. The list updates automatically and shows every unlinked mention in that note, all selected.
   打開一篇筆記，清單會自動列出這篇筆記裡所有未連結的提及，預設全部勾選。
3. Review the list. Click the surrounding text to jump to that spot in the editor, and uncheck anything you don't want linked. For a name shared by several notes, choose the target from the dropdown first.
   逐項檢查：點前後文可跳到編輯器中的位置確認，取消不想連結的項目。同名對應多篇筆記的項目，要先從下拉選單選擇目標。
4. Click **Create links (n)**. If the note is open in an editor, press `Ctrl+Z` once to undo the whole batch.
   按「建立連結（n）」。筆記開在編輯器中時，按一次 `Ctrl+Z` 即可全部復原。

Buttons: **Select all** / **Select none** / **Create links**.
按鈕：全選／全不選／建立連結。

## Languages / 介面語系

The interface follows Obsidian's display language: English, 繁體中文 (Traditional Chinese) and 日本語 (Japanese). Any other language falls back to English.

介面語言跟隨 Obsidian 的顯示語言，支援英文、繁體中文、日文；其他語系顯示英文。

## Installation

### Manual

1. Download `main.js`, `manifest.json` and `styles.css` from the latest [release](../../releases).
2. Put them in `<your vault>/.obsidian/plugins/unlinked-mentions-picker/`.
3. Reload Obsidian and enable **Unlinked Mentions Picker** under *Settings → Community plugins*.

## Command

- **Open unlinked mentions list** (開啟未連結提及清單 / 未リンクの言及リストを開く)
- **List unlinked mentions of this note in other notes** (列出其他筆記中提到本筆記的未連結提及 / 他のノートにあるこのノートへの未リンクの言及を表示)

## License

[MIT](LICENSE)
