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

## Installation

### Manual

1. Download `main.js`, `manifest.json` and `styles.css` from the latest [release](../../releases).
2. Put them in `<your vault>/.obsidian/plugins/unlinked-mentions-picker/`.
3. Reload Obsidian and enable **Unlinked Mentions Picker** under *Settings → Community plugins*.

## Command

- **Open unlinked mentions list** (開啟未連結提及清單)

## License

[MIT](LICENSE)
