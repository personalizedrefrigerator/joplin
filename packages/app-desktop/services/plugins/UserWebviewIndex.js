// This is the API that JS files loaded from the webview can see
(function() {
	const webviewApiPromises_ = {};
	let viewMessageHandler_ = () => {};
	const postMessage = (message) => {
		parent.postMessage(message, '*');
	};

	window.webviewApi = {
		postMessage: function(message) {
			const messageId = `userWebview_${Date.now()}${Math.random()}`;

			const promise = new Promise((resolve, reject) => {
				webviewApiPromises_[messageId] = { resolve, reject };
			});

			postMessage({
				target: 'postMessageService.message',
				message: {
					from: 'userWebview',
					to: 'plugin',
					id: messageId,
					content: message,
				},
			});

			return promise;
		},

		onMessage: function(viewMessageHandler) {
			viewMessageHandler_ = viewMessageHandler;
			postMessage({
				target: 'postMessageService.registerViewMessageHandler',
			});
		},

		menuPopupFromTemplate: (args) => {
			postMessage({
				target: 'webviewApi.menuPopupFromTemplate',
				args,
			});
		},
	};

	function docReady(fn) {
		if (document.readyState === 'complete' || document.readyState === 'interactive') {
			setTimeout(fn, 1);
		} else {
			document.addEventListener('DOMContentLoaded', fn);
		}
	}

	function fileExtension(path) {
		if (!path) throw new Error('Path is empty');

		const output = path.split('.');
		if (output.length <= 1) return '';
		return output[output.length - 1];
	}

	function serializeForm(form) {
		const output = {};
		const formData = new FormData(form);
		for (const key of formData.keys()) {
			output[key] = formData.get(key);
		}
		return output;
	}

	function serializeForms(document) {
		const forms = document.getElementsByTagName('form');
		const output = {};
		let untitledIndex = 0;

		for (const form of forms) {
			const name = `${form.getAttribute('name')}` || (`form${untitledIndex++}`);
			output[name] = serializeForm(form);
		}

		return output;
	}

	function watchElementSize(element, onChange) {
		const emitSizeChange = () => {
			onChange(element.getBoundingClientRect());
		};
		const observer = new ResizeObserver(emitSizeChange);
		observer.observe(element);

		// Initial size
		requestAnimationFrame(emitSizeChange);
	}

	docReady(() => {
		const rootElement = document.createElement('div');
		rootElement.setAttribute('id', 'joplin-plugin-content-root');
		document.getElementsByTagName('body')[0].appendChild(rootElement);

		const contentElement = document.createElement('div');
		contentElement.setAttribute('id', 'joplin-plugin-content');
		rootElement.appendChild(contentElement);

		const headElement = document.getElementsByTagName('head')[0];

		const addedScripts = {};

		function addScript(scriptPath, id = null) {
			const ext = fileExtension(scriptPath).toLowerCase();

			if (ext === 'js') {
				const script = document.createElement('script');
				script.src = scriptPath;
				if (id) script.id = id;
				headElement.appendChild(script);
			} else if (ext === 'css') {
				const link = document.createElement('link');
				link.rel = 'stylesheet';
				link.href = scriptPath;
				if (id) link.id = id;
				headElement.appendChild(link);
			} else {
				throw new Error(`Unsupported script: ${scriptPath}`);
			}
		}

		const ipc = {
			setHtml: (args) => {
				contentElement.innerHTML = args.html;

				// console.debug('UserWebviewIndex: setting html to', args.html);

				window.requestAnimationFrame(() => {
					// eslint-disable-next-line no-console
					console.debug('UserWebviewIndex: setting html callback', args.hash);
					postMessage({ target: 'UserWebview', message: 'htmlIsSet', hash: args.hash });
				});
			},

			setScript: (args) => {
				const { script, key } = args;

				const scriptPath = `joplin-content://plugin-webview/${script}`;
				const elementId = `joplin-script-${key}`;

				if (addedScripts[elementId]) {
					document.getElementById(elementId).remove();
					delete addedScripts[elementId];
				}

				addScript(scriptPath, elementId);
			},

			setScripts: (args) => {
				const scripts = args.scripts;

				if (!scripts) return;

				for (let i = 0; i < scripts.length; i++) {
					const scriptPath = `joplin-content://plugin-webview/${scripts[i]}`;

					if (addedScripts[scriptPath]) continue;
					addedScripts[scriptPath] = true;

					addScript(scriptPath);
				}
			},

			serializeForms: () => {
				postMessage({
					target: 'UserWebview',
					message: 'serializedForms',
					formData: serializeForms(document),
				});
			},

			'postMessageService.response': (event) => {
				const message = event.message;
				const promise = webviewApiPromises_[message.responseId];
				if (!promise) {
					console.warn('postMessageService.response: Could not find recorded promise to process message response', message);
					return;
				}

				if (message.error) {
					promise.reject(message.error);
				} else {
					promise.resolve(message.response);
				}
			},

			'postMessageService.plugin_message': (message) => {
				if (!viewMessageHandler_) {
					console.warn('postMessageService.plugin_message: Could not process message because no onMessage handler was defined', message);
					return;
				}
				viewMessageHandler_(message);
			},
		};

		// respond to window.postMessage({})
		window.addEventListener('message', ((event) => {
			if (!event.data || event.data.target !== 'webview') return;

			const callName = event.data.name;
			const args = event.data.args;

			if (!ipc[callName]) {
				console.warn('Missing IPC function:', event.data);
			} else {
				// eslint-disable-next-line no-console
				console.debug('UserWebviewIndex: Got message', callName, args);
				ipc[callName](args);
			}
		}));

		// Send a message to the containing component to notify it that the
		// view content is fully ready.
		//
		// Need to send it with a delay to make sure all listeners are
		// ready when the message is sent.
		window.requestAnimationFrame(() => {
			// eslint-disable-next-line no-console
			console.debug('UserWebViewIndex: calling isReady');
			postMessage({ target: 'UserWebview', message: 'ready' });
		});


		const sendFormSubmit = () => {
			postMessage({ target: 'UserWebview', message: 'form-submit' });
		};
		const sendDismiss = () => {
			postMessage({ target: 'UserWebview', message: 'dismiss' });
		};
		document.addEventListener('submit', () => {
			sendFormSubmit();
		});
		document.addEventListener('keydown', event => {
			if (event.key === 'Enter' && event.target.tagName === 'INPUT' && event.target.type === 'text') {
				sendFormSubmit();
			} else if (event.key === 'Escape') {
				sendDismiss();
			}
		});

		watchElementSize(document.getElementById('joplin-plugin-content'), size => {
			postMessage({
				target: 'UserWebview',
				message: 'updateContentSize',
				size,
			});
		});
	});
})();
