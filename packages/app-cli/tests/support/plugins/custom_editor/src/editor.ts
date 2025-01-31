import { WebViewMessage } from "./types";

interface EditorMessageEvent {
    message: WebViewMessage;
}

type OnMessageListener = (event: EditorMessageEvent)=>void;

declare const webviewApi: {
    onMessage(listener: OnMessageListener): void;
    postMessage(message: WebViewMessage): void;
};


const editor = document.createElement('textarea');
document.body.appendChild(editor);

let noteId = '';
webviewApi.onMessage(event => {
    editor.value = event.message.content;
    noteId = event.message.noteId;
});

editor.addEventListener('input', () => {
    webviewApi.postMessage({
        content: editor.value,
        noteId,
    });
});
