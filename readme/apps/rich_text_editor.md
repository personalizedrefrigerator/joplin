# About the Rich Text editor

**TLDR:** Avoid using Markdown plugins if you primarily intend to use the Rich Text editor, and be aware of the editor's limitations.

At its core, Joplin stores notes in [Markdown format](https://github.com/laurent22/joplin/blob/dev/readme/apps/markdown.md). Markdown is a simple way to format text that looks great on any device and, while it's formatted text, it still looks perfectly readable in a plain text editor.

In some cases however, the extra markup format that appears in notes can be seen as a drawback. Bold text will `look **like this**` for example, and tables might not be particularly readable. For that reason, Joplin also features a Rich Text editor, which allows you to edit notes with a [WYSIWYG](https://en.wikipedia.org/wiki/WYSIWYG) editing experience. Bold text will "look **like this**" and tables will be more readable, among others.

## Limitations

However **there is a catch**: in Joplin, notes, even when edited with this Rich Text editor, are **still Markdown** under the hood. This is generally a good thing, because it means you can switch at any time between Markdown and Rich Text editor, and the note is still readable. It is also good if you sync with the mobile application, which doesn't have a rich text editor. The catch is that since Markdown is used under the hood, it means the rich text editor has a number of limitations it inherits from that format:

- For a start, **most Markdown plugins will not be compatible**. If you open a Markdown note that makes use of such plugin in the Rich Text editor, it is likely you will lose the plugin special formatting. The only supported plugins are the "fenced" plugins - those that wrap a section of text in triple backticks (for example, KaTeX, Mermaid, etc. are working). You can see a plugin's compatibility on the Markdown config screen.

- Tables must have a header, because this is a requirement in Markdown. When you create a table, it will let you create it without a header, but under the hood it will add an empty one. And next time you open the note, this empty header will be present.

- All items in a list must be of the same type, so for example all checkboxes, or all bullet points. If you require two different types, you should create two different lists separated by a horizontal rule or similar.

- Special keyboard modes "vim" and "emacs" are not supported.

- If a note is of 'Markup - Markdown' and contains HTML formatting, this may be lost when editing in the Rich Text editor as it cannot be converted to Markdown. Notes of 'Markup - HTML' are not affected by edits in the Rich Text editor as this conversion does not take place.

- All reference links (`[title][link-name]`) are converted to inline links (`[title](https://example.com)`) when Joplin saves changes from the Rich Text editor.

Those are the known limitations but if you notice any other issue not listed here, please let us know [in the forum](https://discourse.joplinapp.org/).

## Markup autocompletion

By default, the Rich Text Editor automatically replaces certain text patterns with formatted content. Replacements are applied after each pattern is typed.

By default, the following patterns are replaced:

- `**bold**`: Formats `bold` as **bold**.
- `*italic*`: Formats `italic` as *italic*.
- `==highlighted==`: Highlights `highlighted`.
- <code>`code`</code>: Formats `code` as inline code.
- `$math$`: Auto-formats to inline math (using KaTeX math syntax). After rendering, equations can be edited by double-clicking or with the "edit" option in the right click menu.
- `# Heading 1`: Creates a level 1 heading. The `#` should be at the start of the line.
- `## Heading 2`: Creates a level 2 heading.
- `## Heading 3`: Creates a level 3 heading.
- `- List`: Creates a bulleted list.
- `1. List`: Creates a numbered list.
- `---`, `___`, or `***`: Creates a horizontal rule.

Most replacements require pressing the <kbd>space</kbd> or <kbd>enter</kbd> key after the closing formatting character. For example, typing `==test==` does not highlight "test", but pressing a space after the last `=` does.

These replacements can be disabled in settings &gt; note, using the "Auto-format Markdown" setting.
