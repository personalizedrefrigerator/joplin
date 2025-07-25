import Logger, { LoggerWrapper, TargetType } from '@joplin/utils/Logger';
import { PluginMessage } from './services/plugins/PluginRunner';
import AutoUpdaterService, { defaultUpdateInterval, initialUpdateStartup } from './services/autoUpdater/AutoUpdaterService';
import type ShimType from '@joplin/lib/shim';
const shim: typeof ShimType = require('@joplin/lib/shim').default;
import { isCallbackUrl } from '@joplin/lib/callbackUrlUtils';
import { FileLocker } from '@joplin/utils/fs';
import { IpcMessageHandler, IpcServer, Message, newHttpError, sendMessage, SendMessageOptions, startServer, stopServer } from '@joplin/utils/ipc';
import { BrowserWindow, Tray, WebContents, screen, App, nativeTheme } from 'electron';
import bridge from './bridge';
import * as url from 'url';
const path = require('path');
const { dirname } = require('@joplin/lib/path-utils');
const fs = require('fs-extra');

import { dialog, ipcMain } from 'electron';
import { _ } from '@joplin/lib/locale';
import restartInSafeModeFromMain from './utils/restartInSafeModeFromMain';
import handleCustomProtocols, { CustomProtocolHandler } from './utils/customProtocols/handleCustomProtocols';
import { clearTimeout, setTimeout } from 'timers';
import { resolve } from 'path';
import { defaultWindowId } from '@joplin/lib/reducer';
import { msleep, Second } from '@joplin/utils/time';
import determineBaseAppDirs from '@joplin/lib/determineBaseAppDirs';
import getAppName from '@joplin/lib/getAppName';

interface RendererProcessQuitReply {
	canClose: boolean;
}

interface PluginWindows {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	[key: string]: any;
}

type SecondaryWindowId = string;
interface SecondaryWindowData {
	electronId: number;
}

export interface Options {
	env: string;
	profilePath: string|null;
	isDebugMode: boolean;
	isEndToEndTesting: boolean;
	initialCallbackUrl: string;
}

export default class ElectronAppWrapper {
	private logger_: Logger = null;
	private electronApp_: App;
	private env_: string;
	private isDebugMode_: boolean;
	private profilePath_: string;
	private isEndToEndTesting_: boolean;

	private win_: BrowserWindow = null;
	private mainWindowHidden_ = true;
	private pluginWindows_: PluginWindows = {};
	private secondaryWindows_: Map<SecondaryWindowId, SecondaryWindowData> = new Map();

	private willQuitApp_ = false;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	private tray_: any = null;
	private buildDir_: string = null;
	private rendererProcessQuitReply_: RendererProcessQuitReply = null;

	private initialCallbackUrl_: string = null;
	private updaterService_: AutoUpdaterService = null;
	private customProtocolHandler_: CustomProtocolHandler = null;
	private updatePollInterval_: ReturnType<typeof setTimeout>|null = null;

	private profileLocker_: FileLocker|null = null;
	private ipcServer_: IpcServer|null = null;
	private ipcStartPort_ = 2658;

	private ipcLogger_: Logger;
	private ipcLoggerFilePath_: string;

	public constructor(electronApp: App, { env, profilePath, isDebugMode, initialCallbackUrl, isEndToEndTesting }: Options) {
		this.electronApp_ = electronApp;
		this.env_ = env;
		this.isDebugMode_ = isDebugMode;
		this.profilePath_ = profilePath;
		this.initialCallbackUrl_ = initialCallbackUrl;
		this.isEndToEndTesting_ = isEndToEndTesting;

		this.profileLocker_ = new FileLocker(`${this.profilePath_}/lock`);

		// Note: in certain contexts `this.logger_` doesn't seem to be available, especially for IPC
		// calls, either because it hasn't been set or other issue. So we set one here specifically
		// for this.
		this.ipcLogger_ = new Logger();
		this.ipcLoggerFilePath_ = `${profilePath}/log-cross-app-ipc.txt`;
		this.ipcLogger_.addTarget(TargetType.File, {
			path: this.ipcLoggerFilePath_,
		});
	}

	public electronApp() {
		return this.electronApp_;
	}

	public setLogger(v: Logger) {
		this.logger_ = v;
	}

	public logger() {
		return this.logger_;
	}

	public mainWindow() {
		return this.win_;
	}

	public activeWindow() {
		return BrowserWindow.getFocusedWindow() ?? this.win_;
	}

	public ipcServerStarted() {
		return !!this.ipcServer_;
	}

	public ipcLoggerFilePath() {
		return this.ipcLoggerFilePath_;
	}

	public windowById(joplinId: string) {
		if (joplinId === defaultWindowId) {
			return this.mainWindow();
		}

		const windowData = this.secondaryWindows_.get(joplinId);
		if (windowData !== undefined) {
			return BrowserWindow.fromId(windowData.electronId);
		}
		return null;
	}

	private windowIdFromWebContents(webContents: WebContents): SecondaryWindowId|null {
		const browserWindow = BrowserWindow.fromWebContents(webContents);
		// Convert from electron IDs to Joplin IDs.
		const targetElectronId = browserWindow.id;

		if (this.win_?.id === targetElectronId) {
			return 'default';
		}

		for (const [joplinId, { electronId }] of this.secondaryWindows_) {
			if (electronId === targetElectronId) {
				return joplinId;
			}
		}

		return null;
	}

	public allAppWindows() {
		const allWindowIds = [...this.secondaryWindows_.keys(), defaultWindowId];
		return allWindowIds.map(id => this.windowById(id));
	}

	public env() {
		return this.env_;
	}

	public initialCallbackUrl() {
		return this.initialCallbackUrl_;
	}

	// Call when the app fails in a significant way.
	//
	// Assumes that the renderer process may be in an invalid state and so cannot
	// be accessed.
	public async handleAppFailure(errorMessage: string, canIgnore: boolean, isTesting?: boolean) {
		await bridge().captureException(new Error(errorMessage));

		const buttons = [];
		buttons.push(_('Quit'));
		const exitIndex = 0;

		if (canIgnore) {
			buttons.push(_('Ignore'));
		}
		const restartIndex = buttons.length;
		buttons.push(_('Restart in safe mode'));

		const { response } = await dialog.showMessageBox({
			message: _('An error occurred: %s', errorMessage),
			buttons,
		});

		if (response === restartIndex) {
			await restartInSafeModeFromMain();

			// A hung renderer seems to prevent the process from exiting completely.
			// In this case, crashing the renderer allows the window to close.
			//
			// Also only run this if not testing (crashing the renderer breaks automated
			// tests).
			if (this.win_ && !this.win_.webContents.isCrashed() && !isTesting) {
				this.win_.webContents.forcefullyCrashRenderer();
			}
		} else if (response === exitIndex) {
			process.exit(1);
		}
	}

	public createWindow() {
		// Set to true to view errors if the application does not start
		const debugEarlyBugs = this.env_ === 'dev' || this.isDebugMode_;

		const windowStateKeeper = require('electron-window-state');


		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		const stateOptions: any = {
			defaultWidth: Math.round(0.8 * screen.getPrimaryDisplay().workArea.width),
			defaultHeight: Math.round(0.8 * screen.getPrimaryDisplay().workArea.height),
			file: `window-state-${this.env_}.json`,
		};

		if (this.profilePath_) stateOptions.path = this.profilePath_;

		// Load the previous state with fallback to defaults
		const windowState = windowStateKeeper(stateOptions);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		const windowOptions: any = {
			x: windowState.x,
			y: windowState.y,
			width: windowState.width,
			height: windowState.height,
			minWidth: 100,
			minHeight: 100,
			// A backgroundColor is needed to enable sub-pixel rendering.
			// Based on https://www.electronjs.org/docs/latest/faq#the-font-looks-blurry-what-is-this-and-what-can-i-do,
			// this needs to be a non-transparent color:
			backgroundColor: nativeTheme.shouldUseDarkColors ? '#333' : '#fff',
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				spellcheck: true,
				enableRemoteModule: true,
			},
			// We start with a hidden window, which is then made visible depending on the showTrayIcon setting
			// https://github.com/laurent22/joplin/issues/2031
			//
			// On Linux/GNOME, however, the window doesn't show correctly if show is false initially:
			// https://github.com/laurent22/joplin/issues/8256
			show: debugEarlyBugs || shim.isGNOME(),
		};

		// Linux icon workaround for bug https://github.com/electron-userland/electron-builder/issues/2098
		// Fix: https://github.com/electron-userland/electron-builder/issues/2269
		if (shim.isLinux()) windowOptions.icon = path.join(__dirname, '..', 'build/icons/128x128.png');

		this.win_ = new BrowserWindow(windowOptions);

		require('@electron/remote/main').enable(this.win_.webContents);

		if (!screen.getDisplayMatching(this.win_.getBounds())) {
			const { width: windowWidth, height: windowHeight } = this.win_.getBounds();
			const { width: primaryDisplayWidth, height: primaryDisplayHeight } = screen.getPrimaryDisplay().workArea;
			this.win_.setPosition(primaryDisplayWidth / 2 - windowWidth, primaryDisplayHeight / 2 - windowHeight);
		}

		let unresponsiveTimeout: ReturnType<typeof setTimeout>|null = null;

		this.win_.webContents.on('unresponsive', () => {
			// Don't show the "unresponsive" dialog immediately -- the "unresponsive" event
			// can be fired when showing a dialog or modal (e.g. the update dialog).
			//
			// This gives us an opportunity to cancel it.
			if (unresponsiveTimeout === null) {
				const delayMs = 1000;

				unresponsiveTimeout = setTimeout(() => {
					unresponsiveTimeout = null;
					void this.handleAppFailure(_('Window unresponsive.'), true);
				}, delayMs);
			}
		});

		this.win_.webContents.on('responsive', () => {
			if (unresponsiveTimeout !== null) {
				clearTimeout(unresponsiveTimeout);
				unresponsiveTimeout = null;
			}
		});

		this.win_.webContents.on('render-process-gone', async _event => {
			await this.handleAppFailure('Renderer process gone.', false);
		});

		this.win_.webContents.on('did-fail-load', async event => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
			if ((event as any).isMainFrame) {
				await this.handleAppFailure('Renderer process failed to load', false);
			}
		});

		this.mainWindowHidden_ = !windowOptions.show;
		this.win_.on('hide', () => {
			this.mainWindowHidden_ = true;
		});

		this.win_.on('show', () => {
			this.mainWindowHidden_ = false;
		});

		void this.win_.loadURL(url.format({
			pathname: path.join(__dirname, 'index.html'),
			protocol: 'file:',
			slashes: true,
		}));

		// Note that on Windows, calling openDevTools() too early results in a white window with no error message.
		// Waiting for one of the ready events might work but they might not be triggered if there's an error, so
		// the easiest is to use a timeout. Keep in mind that if you get a white window on Windows it might be due
		// to this line though.
		//
		// Don't show the dev tools while end-to-end testing to simplify the logic that finds the main window.
		if (debugEarlyBugs && !this.isEndToEndTesting_) {
			// Since a recent release of Electron (v34?), calling openDevTools() here does nothing
			// if a plugin devtool window is already opened. Maybe because they do a check on
			// `isDevToolsOpened` which indeed returns `true` (but shouldn't since it's for a
			// different window). However, if you open the dev tools twice from the Help menu it
			// works. So instead we do that here and call openDevTool() three times.
			let openDevToolCount = 0;
			const openDevToolInterval = setInterval(() => {
				try {
					this.win_.webContents.openDevTools();
					openDevToolCount++;
					if (openDevToolCount >= 3) {
						clearInterval(openDevToolInterval);
					}
				} catch (error) {
					// This will throw an exception "Object has been destroyed" if the app is closed
					// in less that the timeout interval. It can be ignored.
					console.warn('Error opening dev tools', error);
				}
			}, 1000);
		}

		const sendWindowFocused = (focusedWebContents: WebContents) => {
			const joplinId = this.windowIdFromWebContents(focusedWebContents);

			if (joplinId !== null) {
				this.win_.webContents.send('window-focused', joplinId);
			}
		};

		const addWindowEventHandlers = (webContents: WebContents) => {
			// will-frame-navigate is fired by clicking on a link within the BrowserWindow.
			webContents.on('will-frame-navigate', event => {
				// If the link changes the URL of the browser window,
				if (event.isMainFrame) {
					event.preventDefault();
					void bridge().openExternal(event.url);
				}
			});

			// Override calls to window.open and links with target="_blank": Open most in a browser instead
			// of Electron:
			webContents.setWindowOpenHandler((event) => {
				if (event.url === 'about:blank') {
					// Script-controlled pages: Used for opening notes in new windows
					return {
						action: 'allow',
						overrideBrowserWindowOptions: {
							webPreferences: {
								preload: resolve(__dirname, './utils/window/secondaryWindowPreload.js'),
							},
						},
					};
				} else if (event.url.match(/^https?:\/\//)) {
					void bridge().openExternal(event.url);
				}
				return { action: 'deny' };
			});

			webContents.on('did-create-window', (event) => {
				addWindowEventHandlers(event.webContents);
			});

			const onFocus = () => {
				sendWindowFocused(webContents);
			};
			webContents.on('focus', onFocus);
		};
		addWindowEventHandlers(this.win_.webContents);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		this.win_.on('close', (event: any) => {
			// If it's on macOS, the app is completely closed only if the user chooses to close the app (willQuitApp_ will be true)
			// otherwise the window is simply hidden, and will be re-open once the app is "activated" (which happens when the
			// user clicks on the icon in the task bar).

			// On Windows and Linux, the app is closed when the window is closed *except* if the tray icon is used. In which
			// case the app must be explicitly closed with Ctrl+Q or by right-clicking on the tray icon and selecting "Exit".

			let isGoingToExit = false;

			if (process.platform === 'darwin') {
				if (this.willQuitApp_) {
					isGoingToExit = true;
				} else {
					event.preventDefault();
					this.hide();
				}
			} else {
				const hasBackgroundWindows = this.secondaryWindows_.size > 0;
				if ((hasBackgroundWindows || this.trayShown()) && !this.willQuitApp_) {
					event.preventDefault();
					this.win_.hide();
				} else {
					isGoingToExit = true;
				}
			}

			if (isGoingToExit) {
				if (!this.rendererProcessQuitReply_) {
					// If we haven't notified the renderer process yet, do it now
					// so that it can tell us if we can really close the app or not.
					// Search for "appClose" event for closing logic on renderer side.
					event.preventDefault();
					if (this.win_) this.win_.webContents.send('appClose');
				} else {
					// If the renderer process has responded, check if we can close or not
					if (this.rendererProcessQuitReply_.canClose) {
						// Really quit the app
						this.rendererProcessQuitReply_ = null;
						this.win_ = null;
					} else {
						// Wait for renderer to finish task
						event.preventDefault();
						this.rendererProcessQuitReply_ = null;
					}
				}
			}
		});

		ipcMain.on('secondary-window-added', (event, windowId: string) => {
			const window = BrowserWindow.fromWebContents(event.sender);
			const electronWindowId = window?.id;
			this.secondaryWindows_.set(windowId, { electronId: electronWindowId });

			// Match the main window's zoom:
			window.webContents.setZoomFactor(this.mainWindow().webContents.getZoomFactor());

			window.once('close', () => {
				this.secondaryWindows_.delete(windowId);

				const allSecondaryWindowsClosed = this.secondaryWindows_.size === 0;
				const mainWindowVisuallyClosed = this.mainWindowHidden_;
				if (allSecondaryWindowsClosed && mainWindowVisuallyClosed && !this.trayShown()) {
					// Gracefully quit the app if the user has closed all windows
					this.win_.close();
				}
			});

			if (window.isFocused()) {
				sendWindowFocused(window.webContents);
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		ipcMain.on('asynchronous-message', (_event: any, message: string, args: any) => {
			if (message === 'appCloseReply') {
				// We got the response from the renderer process:
				// save the response and try quit again.
				this.rendererProcessQuitReply_ = args;
				this.quit();
			}
		});

		// This handler receives IPC messages from a plugin or from the main window,
		// and forwards it to the main window or the plugin window.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		ipcMain.on('pluginMessage', (_event: any, message: PluginMessage) => {
			try {
				if (message.target === 'mainWindow') {
					this.win_.webContents.send('pluginMessage', message);
				}

				if (message.target === 'plugin') {
					const win = this.pluginWindows_[message.pluginId];
					if (!win) {
						this.ipcLogger_.error(`Trying to send IPC message to non-existing plugin window: ${message.pluginId}`);
						return;
					}

					win.webContents.send('pluginMessage', message);
				}
			} catch (error) {
				// An error might happen when the app is closing and a plugin
				// sends a message. In which case, the above code would try to
				// access a destroyed webview.
				// https://github.com/laurent22/joplin/issues/4570
				console.error('Could not process plugin message:', message);
				console.error(error);
			}
		});

		ipcMain.on('apply-update-now', () => {
			this.updaterService_.updateApp();
		});

		ipcMain.on('check-for-updates', () => {
			void this.updaterService_.checkForUpdates(true);
		});

		// Let us register listeners on the window, so we can update the state
		// automatically (the listeners will be removed when the window is closed)
		// and restore the maximized or full screen state
		windowState.manage(this.win_);

		// HACK: Ensure the window is hidden, as `windowState.manage` may make the window
		// visible with isMaximized set to true in window-state-${this.env_}.json.
		// https://github.com/laurent22/joplin/issues/2365
		if (!windowOptions.show) {
			this.win_.hide();
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public registerPluginWindow(pluginId: string, window: any) {
		this.pluginWindows_[pluginId] = window;
	}

	public async waitForElectronAppReady() {
		if (this.electronApp().isReady()) return Promise.resolve();

		return new Promise<void>((resolve) => {
			const iid = setInterval(() => {
				if (this.electronApp().isReady()) {
					clearInterval(iid);
					resolve(null);
				}
			}, 10);
		});
	}

	private onExit() {
		this.stopPeriodicUpdateCheck();
		this.profileLocker_.unlockSync();

		// Probably doesn't matter if the server is not closed cleanly? Thus the lack of `await`
		// eslint-disable-next-line promise/prefer-await-to-then -- Needed here because onExit() is not async
		void stopServer(this.ipcServer_).catch(_error => {
			// Ignore it since we're stopping, and to prevent unnecessary messages.
		});
	}

	public quit() {
		this.onExit();
		this.electronApp_.quit();
	}

	public exit(errorCode = 0) {
		this.onExit();
		this.electronApp_.exit(errorCode);
	}

	public trayShown() {
		return !!this.tray_;
	}

	// This method is used in macOS only to hide the whole app (and not just the main window)
	// including the menu bar. This follows the macOS way of hiding an app.
	public hide() {
		this.electronApp_.hide();
	}

	public buildDir() {
		if (this.buildDir_) return this.buildDir_;
		let dir = `${__dirname}/build`;
		if (!fs.pathExistsSync(dir)) {
			dir = `${dirname(__dirname)}/build`;
			if (!fs.pathExistsSync(dir)) throw new Error('Cannot find build dir');
		}

		this.buildDir_ = dir;
		return dir;
	}

	private trayIconFilename_() {
		let output = '';

		if (process.platform === 'darwin') {
			output = 'macos-16x16Template.png'; // Electron Template Image format
		} else {
			output = '16x16.png';
		}

		if (this.env_ === 'dev') output = '16x16-dev.png';

		return output;
	}

	// Note: this must be called only after the "ready" event of the app has been dispatched
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public createTray(contextMenu: any) {
		try {
			this.tray_ = new Tray(`${this.buildDir()}/icons/${this.trayIconFilename_()}`);
			this.tray_.setToolTip(this.electronApp_.name);
			this.tray_.setContextMenu(contextMenu);

			this.tray_.on('click', () => {
				if (!this.mainWindow()) {
					console.warn('The window object was not available during the click event from tray icon');
					return;
				}
				this.mainWindow().show();
			});
		} catch (error) {
			console.error('Cannot create tray', error);
		}
	}

	public destroyTray() {
		if (!this.tray_) return;
		this.tray_.destroy();
		this.tray_ = null;
	}

	public async sendCrossAppIpcMessage(message: Message, port: number|null = null, options: SendMessageOptions = null) {
		this.ipcLogger_.info('Sending message:', message);

		if (port === null) port = this.ipcStartPort_;

		if (this.ipcServer_) {
			return await sendMessage(port, {
				...message,
				sourcePort: this.ipcServer_.port,
				secretKey: this.ipcServer_.secretKey,
			}, {
				logger: this.ipcLogger_,
				...options,
			});
		} else {
			return [];
		}
	}

	public async ensureSingleInstance() {
		// When end-to-end testing, multiple instances of Joplin are intentionally created at the same time,
		// or very close to one another. The single instance handling logic can interfere with this, so disable it.
		if (this.isEndToEndTesting_) return false;

		interface OnSecondInstanceMessageData {
			profilePath: string;
			argv: string[];
		}

		const activateWindow = (argv: string[]) => {
			const win = this.mainWindow();
			if (!win) return;
			if (win.isMinimized()) win.restore();
			win.show();
			// eslint-disable-next-line no-restricted-properties
			win.focus();
			if (process.platform !== 'darwin') {
				const url = argv.find((arg) => isCallbackUrl(arg));
				if (url) {
					void this.openCallbackUrl(url);
				}
			}
		};

		const messageHandlers: Record<string, IpcMessageHandler> = {
			'onSecondInstance': async (message) => {
				const data = message.data as OnSecondInstanceMessageData;
				if (data.profilePath === this.profilePath_) activateWindow(data.argv);
			},

			'restartAltInstance': async (message) => {
				if (bridge().altInstanceId()) return false;

				// We do this in a timeout after a short interval because we need this call to
				// return the response immediately, so that the caller can call `quit()`
				setTimeout(async () => {
					const maxWait = 10000;
					const interval = 300;
					const loopCount = Math.ceil(maxWait / interval);
					let callingAppGone = false;

					for (let i = 0; i < loopCount; i++) {
						const response = await this.sendCrossAppIpcMessage({
							action: 'ping',
							data: null,
							secretKey: this.ipcServer_.secretKey,
						}, message.sourcePort, {
							sendToSpecificPortOnly: true,
						});

						if (!response.length) {
							callingAppGone = true;
							break;
						}

						await msleep(interval);
					}

					if (callingAppGone) {
						// Wait a bit more because even if the app is not responding, the process
						// might still be there for a short while.
						await msleep(1000);
						this.ipcLogger_.warn('restartAltInstance: App is gone - restarting it');
						void bridge().launchAltAppInstance(this.env());
					} else {
						this.ipcLogger_.warn('restartAltInstance: Could not restart calling app because it was still open');
					}
				}, 100);

				return true;
			},

			'ping': async (_message) => {
				return true;
			},
		};

		const defaultProfileDir = determineBaseAppDirs('', getAppName(true, this.env() === 'dev'), '').rootProfileDir;
		const secretKeyFilePath = `${defaultProfileDir}/ipc_secret_key.txt`;

		this.ipcLogger_.info('Starting server using secret key:', secretKeyFilePath);

		try {
			this.ipcServer_ = await startServer(this.ipcStartPort_, secretKeyFilePath, async (message) => {
				if (messageHandlers[message.action]) {
					this.ipcLogger_.info('Got message:', message);
					return messageHandlers[message.action](message);
				}

				throw newHttpError(404);
			}, {
				logger: this.ipcLogger_,
			});
		} catch (error) {
			this.ipcLogger_.error('Could not start server:', error);
			this.ipcServer_ = null;
		}

		// First check that no other app is running from that profile folder
		const gotAppLock = await this.profileLocker_.lock();
		if (gotAppLock) return false;

		if (this.ipcServer_) {
			const message: Message = {
				action: 'onSecondInstance',
				data: {
					senderPort: this.ipcServer_.port,
					profilePath: this.profilePath_,
					argv: process.argv,
				},
				secretKey: this.ipcServer_.secretKey,
			};

			await this.sendCrossAppIpcMessage(message);
		}

		this.quit();
		if (this.env() === 'dev') console.warn(`Closing the application because another instance is already running, or the previous instance was force-quit within the last ${Math.round(this.profileLocker_.options.interval / Second)} seconds.`);
		return true;
	}

	// Electron's autoUpdater has to be init from the main process
	public initializeAutoUpdaterService(logger: LoggerWrapper, devMode: boolean, includePreReleases: boolean) {
		if (shim.isWindows() || shim.isMac()) {
			if (!this.updaterService_) {
				this.updaterService_ = new AutoUpdaterService(this.win_, logger, devMode, includePreReleases);
				this.startPeriodicUpdateCheck();
			}
		}
	}

	private startPeriodicUpdateCheck = (updateInterval: number = defaultUpdateInterval): void => {
		this.stopPeriodicUpdateCheck();
		this.updatePollInterval_ = setInterval(() => {
			void this.updaterService_.checkForUpdates(false);
		}, updateInterval);
		setTimeout(this.updaterService_.checkForUpdates, initialUpdateStartup);
	};

	private stopPeriodicUpdateCheck = (): void => {
		if (this.updatePollInterval_) {
			clearInterval(this.updatePollInterval_);
			this.updatePollInterval_ = null;
			this.updaterService_ = null;
		}
	};

	public getCustomProtocolHandler() {
		return this.customProtocolHandler_;
	}

	public async start() {
		// Since we are doing other async things before creating the window, we might miss
		// the "ready" event. So we use the function below to make sure that the app is ready.
		await this.waitForElectronAppReady();

		const alreadyRunning = await this.ensureSingleInstance();
		if (alreadyRunning) return;

		this.customProtocolHandler_ = handleCustomProtocols();
		this.createWindow();

		this.electronApp_.on('before-quit', () => {
			this.willQuitApp_ = true;
		});

		this.electronApp_.on('window-all-closed', () => {
			this.quit();
		});

		this.electronApp_.on('activate', () => {
			this.win_.show();
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		this.electronApp_.on('open-url', (event: any, url: string) => {
			event.preventDefault();
			void this.openCallbackUrl(url);
		});
	}

	public async openCallbackUrl(url: string) {
		this.win_.webContents.send('asynchronous-message', 'openCallbackUrl', {
			url: url,
		});
	}

}
