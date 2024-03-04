# Note viewer isolation

The desktop application's note viewer runs in an `iframe` with a different protocol from the main application's topmost frame.

## Rationale

Running the note viewer from a different protocol and/or domain significantly reduces the impact of bugs in Joplin's HTML sanitizer.

Doing so should
1. [enable Chromium's site isolation](https://www.chromium.org/developers/design-documents/site-isolation/) and
2. [prevent the note viewer from accessing the topmost context through `window.top`](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy#cross-origin_script_api_access).

## The protocol

We use Electron's [protocol.handle](https://www.electronjs.org/docs/latest/api/protocol#protocolhandlescheme-handler) to register the `joplin-content://` protocol.

We use a `file://` URL to load the base electron application.

We use a `joplin-content://note-viewer/` URL to load the note viewer and the resources it contains.

For compatibility with renderer plugins that use absolute resource paths `joplin-content://note-viewer/` fetches files relative to the `/` directory.

Here's an example:
- The note viewer loads with the URL `joplin-content://note-viewer/tmp/.mount_JoplinA7E0A/path/to/the/note/viewer/here.html`
- The note renders and includes a resource with the path `/home/user/.config/joplin-desktop/path/here.css`
- `/home/user/.config/joplin-desktop/path/here.css` is converted to `joplin-content://note-viewer/home/user/.config/joplin-desktop/path/here.css` by Electron.
- Joplin checks to make sure the `joplin-content://` protocol has access to `/home/user/.config/joplin-desktop/path/here.css`. If it does, it fetches and returns the file.


## `joplin-content://` only has access to specific directories

When `handleCustomProtocols` creates a handler for the `joplin-content://` protocol, it returns an object that allows certain directories to be marked as readable.

By default, the list of readable directories includes:
- The app bundle
- Data directories for each of the enabled plugins
- The resource directory
- The profile directory


## Why not the [`sandbox`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox) property?

Enabling `sandbox` disables Electron's PDF viewer ([related HTML spec change](https://github.com/whatwg/html/pull/6946)).

