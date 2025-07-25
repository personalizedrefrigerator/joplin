import ElectronAppWrapper from './ElectronAppWrapper';
import shim, { MessageBoxType } from '@joplin/lib/shim';
import { _, setLocale } from '@joplin/lib/locale';
import { BrowserWindow, nativeTheme, nativeImage, shell, dialog, MessageBoxSyncOptions, safeStorage, Menu, MenuItemConstructorOptions, MenuItem } from 'electron';
import { dirname, toSystemSlashes } from '@joplin/lib/path-utils';
import { fileUriToPath } from '@joplin/utils/url';
import { urlDecode } from '@joplin/lib/string-utils';
import * as Sentry from '@sentry/electron/main';
import { homedir } from 'os';
import { msleep } from '@joplin/utils/time';
import { pathExists, pathExistsSync, writeFileSync } from 'fs-extra';
import { extname, normalize } from 'path';
import isSafeToOpen from './utils/isSafeToOpen';
import { closeSync, openSync, readSync, statSync } from 'fs';
import { KB } from '@joplin/utils/bytes';
import { defaultWindowId } from '@joplin/lib/reducer';
import { execCommand } from '@joplin/utils';

interface LastSelectedPath {
	file: string;
	directory: string;
}

interface OpenDialogOptions {
	properties?: string[];
	defaultPath?: string;
	createDirectory?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	filters?: any[];
}

type OnAllowedExtensionsChange = (newExtensions: string[])=> void;
interface MessageDialogOptions extends Omit<MessageBoxSyncOptions, 'message'> {
	message?: string;
}

export class Bridge {

	private electronWrapper_: ElectronAppWrapper;
	private lastSelectedPaths_: LastSelectedPath;
	private autoUploadCrashDumps_ = false;
	private rootProfileDir_: string;
	private appName_: string;
	private appId_: string;
	private logFilePath_ = '';
	private altInstanceId_ = '';

	private extraAllowedExtensions_: string[] = [];
	private onAllowedExtensionsChangeListener_: OnAllowedExtensionsChange = ()=>{};

	public constructor(electronWrapper: ElectronAppWrapper, appId: string, appName: string, rootProfileDir: string, autoUploadCrashDumps: boolean, altInstanceId: string) {
		this.electronWrapper_ = electronWrapper;
		this.appId_ = appId;
		this.appName_ = appName;
		this.rootProfileDir_ = rootProfileDir;
		this.autoUploadCrashDumps_ = autoUploadCrashDumps;
		this.altInstanceId_ = altInstanceId;
		this.lastSelectedPaths_ = {
			file: null,
			directory: null,
		};

		this.sentryInit();
	}

	public setLogFilePath(v: string) {
		this.logFilePath_ = v;
	}

	private sentryInit() {
		const getLogLines = () => {
			try {
				if (!this.logFilePath_ || !pathExistsSync(this.logFilePath_)) return '';
				const { size } = statSync(this.logFilePath_);
				if (!size) return '';

				const bytesToRead = Math.min(size, 100 * KB);
				const handle = openSync(this.logFilePath_, 'r');
				const position = size - bytesToRead;
				const buffer = Buffer.alloc(bytesToRead);
				readSync(handle, buffer, 0, bytesToRead, position);
				closeSync(handle);
				return buffer.toString('utf-8');
			} catch (error) {
				// Can't do anything in this context
				return '';
			}
		};

		const getLogAttachment = () => {
			const lines = getLogLines();
			if (!lines) return null;
			return { filename: 'joplin-log.txt', data: lines };
		};

		const options: Sentry.ElectronMainOptions = {
			beforeSend: (event, hint) => {
				try {
					const logAttachment = getLogAttachment();
					if (logAttachment) hint.attachments = [logAttachment];
					const date = (new Date()).toISOString().replace(/[:-]/g, '').split('.')[0];

					type ErrorEventWithLog = (typeof event) & {
						log: string[];
					};

					const errorEventWithLog: ErrorEventWithLog = {
						...event,
						log: logAttachment ? logAttachment.data.trim().split('\n') : [],
					};

					writeFileSync(`${homedir()}/joplin_crash_dump_${date}.json`, JSON.stringify(errorEventWithLog, null, '\t'), 'utf-8');
				} catch (error) {
					// Ignore the error since we can't handle it here
				}

				if (!this.autoUploadCrashDumps_) {
					return null;
				} else {
					return event;
				}
			},

			integrations: [Sentry.electronMinidumpIntegration()],

			// Using the default ipcMode value causes <iframe>s that use custom protocols to
			// have isSecureOrigin: false, limiting which browser APIs are available.
			ipcMode: Sentry.IPCMode.Classic,
		};

		if (this.autoUploadCrashDumps_) options.dsn = 'https://cceec550871b1e8a10fee4c7a28d5cf2@o4506576757522432.ingest.sentry.io/4506594281783296';

		// eslint-disable-next-line no-console
		console.info('Sentry: Initialized with autoUploadCrashDumps:', this.autoUploadCrashDumps_);

		Sentry.init(options);
	}

	public appId() {
		return this.appId_;
	}

	public appName() {
		return this.appName_;
	}

	public rootProfileDir() {
		return this.rootProfileDir_;
	}

	public electronApp() {
		return this.electronWrapper_;
	}

	public electronIsDev() {
		return !this.electronApp().electronApp().isPackaged;
	}

	public get autoUploadCrashDumps() {
		return this.autoUploadCrashDumps_;
	}

	public set autoUploadCrashDumps(v: boolean) {
		this.autoUploadCrashDumps_ = v;
	}

	public get extraAllowedOpenExtensions() {
		return this.extraAllowedExtensions_;
	}

	public set extraAllowedOpenExtensions(newValue: string[]) {
		const oldValue = this.extraAllowedExtensions_;
		const changed = newValue.length !== oldValue.length || newValue.some((v, idx) => v !== oldValue[idx]);
		if (changed) {
			this.extraAllowedExtensions_ = newValue;
			this.onAllowedExtensionsChangeListener_?.(this.extraAllowedExtensions_);
		}
	}

	public setOnAllowedExtensionsChangeListener(listener: OnAllowedExtensionsChange) {
		this.onAllowedExtensionsChangeListener_ = listener;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public async captureException(error: any) {
		Sentry.captureException(error);
		// We wait to give the "beforeSend" event handler time to process the crash dump and write
		// it to file.
		await msleep(10);
	}

	// The build directory contains additional external files that are going to
	// be packaged by Electron Builder. This is for files that need to be
	// accessed outside of the Electron app (for example the application icon).
	//
	// Any static file that's accessed from within the app such as CSS or fonts
	// should go in /vendor.
	//
	// The build folder location is dynamic, depending on whether we're running
	// in dev or prod, which makes it hard to access it from static files (for
	// example from plain HTML files that load CSS or JS files). For this reason
	// it should be avoided as much as possible.
	public buildDir() {
		return this.electronApp().buildDir();
	}

	// The vendor directory and its content is dynamically created from other
	// dir (usually by pulling files from node_modules). It can also be accessed
	// using a relative path such as "../../vendor/lib/file.js" because it will
	// be at the same location in both prod and dev mode (unlike the build dir).
	public vendorDir() {
		return `${__dirname}/vendor`;
	}

	public env() {
		return this.electronWrapper_.env();
	}

	public processArgv() {
		return process.argv;
	}

	public getLocale = () => {
		return this.electronApp().electronApp().getLocale();
	};

	public altInstanceId() {
		return this.altInstanceId_;
	}

	// Applies to electron-context-menu@3:
	//
	// For now we have to disable spell checking in non-editor text
	// areas (such as the note title) because the context menu lives in
	// the main process, and the spell checker service is in the
	// renderer process. To get the word suggestions, we need to call
	// the spellchecker service but that can only be done in an async
	// way, and the menu is built synchronously.
	//
	// Moving the spellchecker to the main process would be hard because
	// it depends on models and various other classes which are all in
	// the renderer process.
	//
	// Perhaps the easiest would be to patch electron-context-menu to
	// support the renderer process again. Or possibly revert to an old
	// version of electron-context-menu.
	// eslint-disable-next-line @typescript-eslint/ban-types -- Old code before rule was applied
	public setupContextMenu(_spellCheckerMenuItemsHandler: Function) {
		require('./services/electron-context-menu')({
			allWindows: [this.mainWindow()],

			electronApp: this.electronApp(),

			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
			shouldShowMenu: (_event: any, params: any) => {
				return params.isEditable;
			},

			// menu: (actions: any, props: any) => {
			// 	const items = spellCheckerMenuItemsHandler(props.misspelledWord, props.dictionarySuggestions);
			// 	const spellCheckerMenuItems = items.map((item: any) => new MenuItem(item)); //SpellCheckerService.instance().contextMenuItems(props.misspelledWord, props.dictionarySuggestions).map((item: any) => new MenuItem(item));

			// 	const output = [
			// 		actions.cut(),
			// 		actions.copy(),
			// 		actions.paste(),
			// 		...spellCheckerMenuItems,
			// 	];

			// 	return output;
			// },
		});
	}

	public mainWindow() {
		return this.electronWrapper_.mainWindow();
	}

	public activeWindow() {
		return this.electronWrapper_.activeWindow();
	}

	public windowById(id: string) {
		return this.electronWrapper_.windowById(id);
	}

	// Switches to the window with the given ID, but only if that window was not the
	// last focused window
	public switchToWindow(windowId: string) {
		const targetWindow = this.windowById(windowId);
		if (this.activeWindow() !== this.windowById(windowId)) {
			targetWindow.show();
		}
	}

	public switchToMainWindow() {
		this.switchToWindow(defaultWindowId);
	}

	// zoom should be in the range [0..1]
	public setZoomFactor(zoom: number) {
		for (const window of this.electronWrapper_.allAppWindows()) {
			window.webContents.setZoomFactor(zoom);
		}
	}

	public showItemInFolder(fullPath: string) {
		return require('electron').shell.showItemInFolder(toSystemSlashes(fullPath));
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public newBrowserWindow(options: any) {
		return new BrowserWindow(options);
	}

	public windowSetSize(width: number, height: number) {
		if (!this.mainWindow()) return;
		return this.mainWindow().setSize(width, height);
	}

	public openDevTools() {
		return this.activeWindow().webContents.openDevTools();
	}

	public closeDevTools() {
		return this.activeWindow().webContents.closeDevTools();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public async showSaveDialog(options: any) {
		if (!options) options = {};
		if (!('defaultPath' in options) && this.lastSelectedPaths_.file) options.defaultPath = this.lastSelectedPaths_.file;
		const { filePath } = await dialog.showSaveDialog(this.activeWindow(), options);
		if (filePath) {
			this.lastSelectedPaths_.file = filePath;
		}
		return filePath;
	}

	public async showOpenDialog(options: OpenDialogOptions = null) {
		if (!options) options = {};
		let fileType = 'file';
		if (options.properties && options.properties.includes('openDirectory')) fileType = 'directory';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		if (!('defaultPath' in options) && (this.lastSelectedPaths_ as any)[fileType]) options.defaultPath = (this.lastSelectedPaths_ as any)[fileType];
		if (!('createDirectory' in options)) options.createDirectory = true;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		const { filePaths } = await dialog.showOpenDialog(this.activeWindow(), options as any);
		if (filePaths && filePaths.length) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
			(this.lastSelectedPaths_ as any)[fileType] = dirname(filePaths[0]);
		}
		return filePaths;
	}

	// Don't use this directly - call one of the showXxxxxxxMessageBox() instead
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	private showMessageBox_(window: any, options: MessageDialogOptions): number {
		if (!window) window = this.activeWindow();
		return dialog.showMessageBoxSync(window, { message: '', ...options });
	}

	public showErrorMessageBox(message: string, options: MessageDialogOptions = null) {
		options = {
			buttons: [_('OK')],
			...options,
		};

		return this.showMessageBox_(this.activeWindow(), {
			type: 'error',
			message: message,
			buttons: options.buttons,
		});
	}

	public showConfirmMessageBox(message: string, options: MessageDialogOptions = null) {
		options = {
			buttons: [_('OK'), _('Cancel')],
			...options,
		};

		const result = this.showMessageBox_(this.activeWindow(), { type: 'question',
			message: message,
			cancelId: 1,
			buttons: options.buttons, ...options });

		return result === 0;
	}

	/* returns the index of the clicked button */
	public showMessageBox(message: string, options: MessageDialogOptions = {}) {
		const defaultButtons = [_('OK')];
		if (options.type !== MessageBoxType.Error && options.type !== MessageBoxType.Info) {
			defaultButtons.push(_('Cancel'));
		}

		const result = this.showMessageBox_(this.activeWindow(), { type: 'question',
			message: message,
			buttons: defaultButtons, ...options });

		return result;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public showInfoMessageBox(message: string, options: any = {}) {
		const result = this.showMessageBox_(this.activeWindow(), { type: 'info',
			message: message,
			buttons: [_('OK')], ...options });
		return result === 0;
	}

	public setLocale(locale: string) {
		setLocale(locale);
	}

	public get Menu() {
		return require('electron').Menu;
	}

	public get MenuItem() {
		return require('electron').MenuItem;
	}

	public async openExternal(url: string) {
		const protocol = new URL(url).protocol;

		if (protocol === 'file:') {
			await this.openItem(url);
		} else {
			return shell.openExternal(url);
		}
	}

	public async openItem(fullPath: string) {
		if (fullPath.startsWith('file:/')) {
			fullPath = fileUriToPath(urlDecode(fullPath), shim.platformName());
		}
		fullPath = normalize(fullPath);
		// Note: pathExists is intended to mitigate a security issue related to network drives
		//       on Windows.
		if (await pathExists(fullPath)) {
			const fileExtension = extname(fullPath);
			const userAllowedExtension = this.extraAllowedOpenExtensions.includes(fileExtension);
			if (userAllowedExtension || await isSafeToOpen(fullPath)) {
				return shell.openPath(fullPath);
			} else {
				const allowOpenId = 2;
				const learnMoreId = 1;
				const fileExtensionDescription = JSON.stringify(fileExtension);
				const result = await dialog.showMessageBox(this.activeWindow(), {
					title: _('Unknown file type'),
					message:
						_('Joplin doesn\'t recognise the %s extension. Opening this file could be dangerous. What would you like to do?', fileExtensionDescription),
					type: 'warning',
					checkboxLabel: _('Always open %s files without asking.', fileExtensionDescription),
					buttons: [
						_('Cancel'),
						_('Learn more'),
						_('Open it'),
					],
				});

				if (result.response === learnMoreId) {
					void this.openExternal('https://joplinapp.org/help/apps/attachments#unknown-filetype-warning');
					return 'Learn more shown';
				} else if (result.response !== allowOpenId) {
					return 'Cancelled by user';
				}

				if (result.checkboxChecked) {
					this.extraAllowedOpenExtensions = this.extraAllowedOpenExtensions.concat(fileExtension);
				}

				return shell.openPath(fullPath);
			}
		} else {
			return 'Path does not exist.';
		}
	}

	public screen() {
		return require('electron').screen;
	}

	public shouldUseDarkColors() {
		return nativeTheme.shouldUseDarkColors;
	}

	public addEventListener(name: string, fn: ()=> void) {
		if (name === 'nativeThemeUpdated') {
			nativeTheme.on('updated', fn);
		} else {
			throw new Error(`Unsupported event: ${name}`);
		}
	}

	public appLaunchCommand(env: string, altInstanceId = '') {
		const altInstanceArgs = altInstanceId ? ['--alt-instance-id', altInstanceId] : [];

		if (env === 'dev') {
			// This is convenient to quickly test on dev, but the path needs to be adjusted
			// depending on how things are setup.

			return {
				execPath: `${homedir()}/.npm-global/bin/electron`,
				args: [
					`${homedir()}/src/joplin/packages/app-desktop`,
					'--env', 'dev',
					'--log-level', 'debug',
					'--open-dev-tools',
					'--no-welcome',
				].concat(altInstanceArgs),
			};
		} else {
			return {
				execPath: bridge().electronApp().electronApp().getPath('exe'),
				args: [].concat(altInstanceArgs),
			};
		}
	}

	private async launchAppInstanceById(env: string, altInstanceId: string) {
		if (this.electronApp().ipcServerStarted()) {
			const cmd = this.appLaunchCommand(env, altInstanceId);
			await execCommand([cmd.execPath].concat(cmd.args), { detached: true });
		} else {
			const buttonIndex = this.showErrorMessageBox('Cannot launch another instance because IPC server could not start.', {
				buttons: [
					_('OK'),
					_('Open log'),
				],
			});

			if (buttonIndex === 1) {
				void this.openItem(this.electronApp().ipcLoggerFilePath());
			}
		}
	}

	public async launchAltAppInstance(env: string) {
		await this.launchAppInstanceById(env, 'alt1');
	}

	public async launchMainAppInstance(env: string) {
		await this.launchAppInstanceById(env, '');
	}

	public async restart() {
		// Note that in this case we are not sending the "appClose" event
		// to notify services and component that the app is about to close
		// but for the current use-case it's not really needed.
		const { app } = require('electron');

		if (shim.isPortable()) {
			const options = {
				execPath: process.env.PORTABLE_EXECUTABLE_FILE,
			};
			app.relaunch(options);
		} else if (this.altInstanceId_) {
			// Couldn't get it to work using relaunch() - it would just "close" the app, but it
			// would still be open in the tray except unusable. Or maybe it reopens it quickly but
			// in a broken state. It might be due to the way it is launched from the main instance.
			// So here we ask the main instance to relaunch this app after a short delay.

			const responses = await this.electronApp().sendCrossAppIpcMessage({
				action: 'restartAltInstance',
				data: null,
			});

			// However is the main instance is not running, we're stuck, so the user needs to
			// manually restart. `relaunch()` doesn't appear to work even when the main instance is
			// not running.
			const r = responses.find(r => !!r.response);

			if (!r || !r.response) {
				this.showInfoMessageBox(_('The app is now going to close. Please relaunch it to complete the process.'));

				// Note: this should work, but doesn't:

				// const cmd = this.appLaunchCommand(this.env(), this.altInstanceId_);

				// app.relaunch({
				// 	execPath: cmd.execPath,
				// 	args: cmd.args,
				// });
			}
		} else {
			app.relaunch();
		}

		this.electronApp().exit();
	}

	public createImageFromPath(path: string) {
		return nativeImage.createFromPath(path);
	}

	public menuPopupFromTemplate(template: ((MenuItemConstructorOptions) | (MenuItem))[]) {
		const menu = Menu.buildFromTemplate(template);
		return menu.popup({ window: this.mainWindow() });
	}

	public safeStorage = {
		isEncryptionAvailable() {
			return safeStorage.isEncryptionAvailable();
		},
		encryptString(data: string) {
			return safeStorage.encryptString(data).toString('base64');
		},
		decryptString(base64Data: string) {
			return safeStorage.decryptString(Buffer.from(base64Data, 'base64'));
		},

		getSelectedStorageBackend() {
			return safeStorage.getSelectedStorageBackend();
		},
	};
}

let bridge_: Bridge = null;

export function initBridge(wrapper: ElectronAppWrapper, appId: string, appName: string, rootProfileDir: string, autoUploadCrashDumps: boolean, altInstanceId: string) {
	if (bridge_) throw new Error('Bridge already initialized');
	bridge_ = new Bridge(wrapper, appId, appName, rootProfileDir, autoUploadCrashDumps, altInstanceId);
	return bridge_;
}

export default function bridge() {
	if (!bridge_) throw new Error('Bridge not initialized');
	return bridge_;
}
