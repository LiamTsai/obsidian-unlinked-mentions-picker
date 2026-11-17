# Unlinked Mentions Picker

An Obsidian plugin that lists every place in the current note where another note's name (or alias) appears without a link. Everything is pre-selected; uncheck what you don't want and create all the links with one click.

在目前筆記中，列出所有「提到其他筆記名稱或別名、但尚未連結」的地方，預設全選，取消不要的之後一鍵建立連結。

## Features

- Adds a tab to the right sidebar (icon: list with check marks).
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
4. Click **建立連結 (n)** (Create links). If the note is open in an editor, press `Ctrl+Z` once to undo the whole batch.
   按「建立連結（n）」。筆記開在編輯器中時，按一次 `Ctrl+Z` 即可全部復原。

Buttons: **全選** (Select all) / **全不選** (Select none) / **建立連結** (Create links).
按鈕：全選／全不選／建立連結。

## Installation

### Manual

1. Download `main.js`, `manifest.json` and `styles.css` from the latest [release](../../releases).
2. Put them in `<your vault>/.obsidian/plugins/unlinked-mentions-picker/`.
3. Reload Obsidian and enable **Unlinked Mentions Picker** under *Settings → Community plugins*.

## Command

- **Open unlinked mentions list** (開啟未連結提及清單)

## License

[MIT](LICENSE)
