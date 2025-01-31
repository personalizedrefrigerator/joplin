interface EditorMessageEvent {
    message: string;
}

type OnMessageListener = (event: EditorMessageEvent)=>void;

declare const webviewApi: {
    onMessage(listener: OnMessageListener): void;
    postMessage(message: string): void;
};


const editor = document.createElement('textarea');
document.body.appendChild(editor);

webviewApi.onMessage(event => {
    editor.value = event.message;
});

editor.oninput = () => {
    webviewApi.postMessage(editor.value);
};
