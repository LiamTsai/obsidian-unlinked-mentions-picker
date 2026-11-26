# Unlinked Mentions Picker

**English** | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md)

An Obsidian plugin that finds note names (or aliases) mentioned without a link and lets you link them in one click. It works in two directions:

- **In this note** — every place in the current note that mentions *another* note.
- **Mentioning this note** — every place in *other* notes that mentions the current note.

Everything is pre-selected; uncheck what you don't want and create all the links at once.

## Features

- Adds a tab to the right sidebar (icon: list with check marks), with the two modes switched at the top.
- Each item shows the line number and surrounding text. Click the text to jump to it in the editor.
- **In this note**
  - Each item shows its target note. When a name matches several notes, pick the target from a dropdown before linking.
  - When mentions overlap (e.g. `Tokyo` and `Tokyo Tower`), the longer one is selected by default; checking one unchecks the other.
- **Mentioning this note**
  - Items are grouped by the note they appear in, and links are created across all of those notes in one click.
  - A mention that is part of a longer note name (e.g. `Tokyo` inside `Tokyo Tower` when a `Tokyo Tower` note exists) is listed but not selected by default.
- Skips frontmatter, existing links/embeds and code blocks. Pipes are escaped inside tables.
- Links follow your link format settings (wikilink or Markdown).
- Undo: changes to a note open in an editor can be undone with one `Ctrl+Z` per note; notes that aren't open are written directly to the file.
- **CJK-friendly**: Latin words/digits need word boundaries (`NS` won't match inside `NSFW`), but Chinese/Japanese/Korean names match anywhere, so mentions inside a sentence are found — unlike Obsidian's built-in unlinked mentions.
- Uses only the public Obsidian API.

## Usage

1. Click the list-with-check-marks icon at the top of the right sidebar, or run a command from the command palette (see below).
2. Choose **In this note** or **Mentioning this note** at the top of the sidebar.
3. Open a note. The list updates automatically, with everything selected.
4. Review the list. Click the surrounding text to check the spot in the editor, and uncheck anything you don't want linked.
5. Click **Create links (n)**.

Buttons: **Select all** / **Select none** / **Create links**.

## Commands

- **Open unlinked mentions list**
- **List unlinked mentions of this note in other notes**

## Languages

The interface follows Obsidian's display language: English, Traditional Chinese and Japanese. Any other language falls back to English.

## Installation

### Manual

1. Download `main.js`, `manifest.json` and `styles.css` from the latest [release](../../releases).
2. Put them in `<your vault>/.obsidian/plugins/unlinked-mentions-picker/`.
3. Reload Obsidian and enable **Unlinked Mentions Picker** under *Settings → Community plugins*.

## License

[MIT](LICENSE)
