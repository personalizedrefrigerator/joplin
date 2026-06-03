import AsyncActionQueue from '@joplin/lib/AsyncActionQueue';
import uuid from '@joplin/lib/uuid';
import Setting from '@joplin/lib/models/Setting';
import shim from '@joplin/lib/shim';
import UndoRedoService from '@joplin/lib/services/UndoRedoService';
import NoteBodyViewer from '../../NoteBodyViewer/NoteBodyViewer';
import checkPermissions from '../../../utils/checkPermissions';
import NoteEditor from '../../NoteEditor/NoteEditor';
import { EditorControl } from '../../NoteEditor/types';
import * as React from 'react';
import { Keyboard, View, TextInput, Linking, Share, NativeSyntheticEvent, useWindowDimensions } from 'react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import { connect } from 'react-redux';
import Note from '@joplin/lib/models/Note';
import BaseItem from '@joplin/lib/models/BaseItem';
import Resource from '@joplin/lib/models/Resource';
import Folder from '@joplin/lib/models/Folder';
import Clipboard from '@react-native-clipboard/clipboard';
import BackButtonService from '../../../services/BackButtonService';
import NavService, { OnNavigateCallback as OnNavigateCallback } from '@joplin/lib/services/NavService';
import { ModelType } from '@joplin/lib/BaseModel';
import { fileExtension, safeFileExtension } from '@joplin/lib/path-utils';
import * as mimeUtils from '@joplin/lib/mime-utils';
import ScreenHeader, { FolderPickerOptions, MenuOptionType, ViewToggleButtonMode } from '../../ScreenHeader';
import NoteTagsDialog from '../NoteTagsDialog';
import time from '@joplin/lib/time';
import Checkbox from '../../Checkbox';
import { _, currentLocale } from '@joplin/lib/locale';
import { reg } from '@joplin/lib/registry';
import ResourceFetcher from '@joplin/lib/services/ResourceFetcher';
import { themeStyle } from '../../global-style';
import createRootStyle from '../../../utils/createRootStyle';
import shared, { AttachFileAsset, BaseNoteScreenComponent, Props as BaseProps } from '@joplin/lib/components/shared/note-screen-shared';
import getStyles from './styles';
import SelectDateTimeDialog from '../../SelectDateTimeDialog';
import ShareExtension from '../../../utils/ShareExtension.js';
import { FolderEntity, NoteEntity, ResourceEntity } from '@joplin/lib/services/database/types';
import Logger from '@joplin/utils/Logger';
import ImageEditor from '../../NoteEditor/ImageEditor/ImageEditor';
import promptRestoreAutosave from '../../NoteEditor/ImageEditor/promptRestoreAutosave';
import isEditableResource from '../../NoteEditor/ImageEditor/isEditableResource';
import { ChangeEvent as EditorChangeEvent, SelectionRangeChangeEvent, UndoRedoDepthChangeEvent } from '@joplin/editor/events';
import { join } from 'path';
import { Dispatch } from 'redux';
import { useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { getNoteCallbackUrl } from '@joplin/lib/callbackUrlUtils';
import { AppState } from '../../../utils/types';
import restoreItems from '@joplin/lib/services/trash/restoreItems';
import { getDisplayParentTitle } from '@joplin/lib/services/trash';
import { PluginHtmlContents, PluginStates, utils as pluginUtils } from '@joplin/lib/services/plugins/reducer';
import debounce from '../../../utils/debounce';
import { focus } from '@joplin/lib/utils/focusHandler';
import CommandService from '@joplin/lib/services/CommandService';
import { ResourceInfo } from '../../NoteBodyViewer/hooks/useRerenderHandler';
import getImageDimensions from '../../../utils/image/getImageDimensions';
import resizeImage from '../../../utils/image/resizeImage';
import { CameraResult } from '../../CameraView/types';
import { DialogContext, DialogControl } from '../../DialogManager';
import { CommandRuntimeProps, NoteViewerMode, PickerResponse } from './types';
import commands from './commands';
import { AttachFileAction, AttachFileOptions } from './commands/attachFile';
import PluginService from '@joplin/lib/services/plugins/PluginService';
import PluginUserWebView from '../../plugins/dialogs/PluginUserWebView';
import getShownPluginEditorView from '@joplin/lib/services/plugins/utils/getShownPluginEditorView';
import getActivePluginEditorView from '@joplin/lib/services/plugins/utils/getActivePluginEditorView';
import EditorPluginHandler from '@joplin/lib/services/plugins/EditorPluginHandler';
import AudioRecordingBanner from '../../voiceTyping/AudioRecordingBanner';
import SpeechToTextBanner from '../../voiceTyping/SpeechToTextBanner';
import CameraView from '../../CameraView/CameraView';
import ShareNoteDialog from '../ShareNoteDialog';
import stateToWhenClauseContext from '../../../services/commands/stateToWhenClauseContext';
import { defaultWindowId } from '@joplin/lib/reducer';
import useVisiblePluginEditorViewIds from '@joplin/lib/hooks/plugins/useVisiblePluginEditorViewIds';
import usePrevious from '@joplin/lib/hooks/usePrevious';
import useNowEffect from '@joplin/lib/hooks/useNowEffect';
import { SelectionRange } from '../../../contentScripts/markdownEditorBundle/types';
import { EditorType } from '../../NoteEditor/types';
import { IconButton } from 'react-native-paper';
import { writeTextToCacheFile } from '../../../utils/ShareUtils';
import shareFile from '../../../utils/shareFile';
import NotePositionService from '@joplin/lib/services/NotePositionService';
import useKeyboardState from '../../../utils/hooks/useKeyboardState';
import VoiceTyping from '../../../services/voiceTyping/VoiceTyping';
import useDebounced from '../../../utils/hooks/useDebounced';
import { Second } from '@joplin/utils/time';
import TextWrapCalculator from '../Notes/TextWrapCalculator';
import SearchEngine from '@joplin/lib/services/search/SearchEngine';
import { ALL_NOTES_FILTER_ID } from '@joplin/lib/reserved-ids';

const emptyArray: never[] = [];

const logger = Logger.create('screens/Note');

const requestGeoLocationPermissions = async () => {
	if (!Setting.value('trackLocation')) return;
	if (Platform.OS === 'web') return;

	const response = await checkPermissions(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
		onRequestConfirmation: async () => {
			const yesIndex = 0;
			const result = await shim.showMessageBox(
				_('Joplin supports saving the location at which notes are saved or created. Do you want to enable it? This can be changed at any time in settings.'),
				{
					buttons: [_('Yes'), _('No')],
					title: _('Save geolocation?'),
				},
			);
			return result === yesIndex;
		},
	});

	// If the user simply pressed "Deny", we don't automatically switch it off because they might accept
	// once we show the rationale again on second try. If they press "Never again" however we switch it off.
	// https://github.com/zoontek/react-native-permissions/issues/385#issuecomment-563132396
	if (response === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
		reg.logger().info('Geo-location tracking has been automatically disabled');
		Setting.setValue('trackLocation', false);
	}
};

interface InsertTextOptions {
	newLine?: boolean;
}

interface NoteNavigation {
	// Arguments passed to the NAV_GO action
	state: {
		newNoteAttachFileAction?: AttachFileAction;
	};
}

interface Props extends BaseProps {
	windowId: string;
	provisionalNoteIds: string[];
	navigation: NoteNavigation;
	dispatch: Dispatch;
	noteId: string;
	editorType: EditorType;
	useEditorBeta: boolean;
	plugins: PluginStates;
	themeId: number;
	editorFontSize: number;
	editorFont: number; // e.g. Setting.FONT_MENLO
	viewerFontSize: number;
	showSideMenu: boolean;
	searchQuery: string;
	ftsEnabled: number;
	highlightedWords: string[];
	noteHash: string;
	toolbarEnabled: boolean;
	pluginHtmlContents: PluginHtmlContents;
	editorNoteReloadTimeRequest: number;
	canPublish: boolean;
	noteVisiblePanes: string[];
}

interface ComponentProps extends Props {
	dialogs: DialogControl;
	visibleEditorPluginIds: string[];
	lowVerticalSpace: boolean;
}

interface State {
	note: NoteEntity;
	mode: NoteViewerMode;
	readOnly: boolean;
	searchVisible: boolean;
	folder: FolderEntity|null;
	lastSavedNote: NoteEntity | null;
	isLoading: boolean;
	titleTextInputHeight: number;
	alarmDialogShown: boolean;
	heightBumpView: number;
	noteTagDialogShown: boolean;
	publishDialogShown: boolean;
	fromShare: boolean;
	showCamera: boolean;
	showImageEditor: boolean;
	showAudioRecorder: boolean;
	imageEditorResource: ResourceEntity;
	imageEditorResourceFilepath: string;
	noteResources: Record<string, ResourceInfo>;
	newAndNoTitleChangeNoteId: boolean|null;
	noteLastLoadTime: number;

	undoRedoButtonState: {
		canUndo: boolean;
		canRedo: boolean;
	};

	showSpeechToTextDialog: boolean;
	multiline: boolean;
	showMultilineToggle: boolean | null;
	titleContainerWidth: number;
}

type ScrollEventSlice = { fraction: number };

// Emulates the partial-merge semantics of a class component's setState (accepts either a partial
// state object or an updater function returning one).
type StateAction = Partial<State> | ((prevState: State)=> Partial<State>);

const noteScreenStateReducer = (state: State, action: StateAction): State => {
	const partialState = typeof action === 'function' ? action(state) : action;
	return { ...state, ...partialState };
};

const makeInitialState = (props: ComponentProps): State => ({
	note: Note.new(),
	mode: props.noteVisiblePanes?.includes('editor') ? 'edit' : 'view',
	readOnly: false,
	folder: null,
	lastSavedNote: null,
	isLoading: true,
	titleTextInputHeight: 20,
	alarmDialogShown: false,
	heightBumpView: 0,
	noteTagDialogShown: false,
	publishDialogShown: false,
	fromShare: false,
	showCamera: false,
	showImageEditor: false,
	showAudioRecorder: false,
	searchVisible: false,
	imageEditorResource: null,
	noteResources: {},
	imageEditorResourceFilepath: null,
	newAndNoTitleChangeNoteId: null,
	noteLastLoadTime: Date.now(),

	undoRedoButtonState: {
		canUndo: false,
		canRedo: false,
	},

	showSpeechToTextDialog: false,
	multiline: false,
	showMultilineToggle: null,
	titleContainerWidth: 0,
});

// Returns a stable function reference that always invokes the latest version of the given callback.
// This mirrors how class methods keep a single identity while reading the current this.state/this.props.
const useStableCallback = <Args extends unknown[], Result>(callback: (...args: Args)=> Result) => {
	const callbackRef = useRef(callback);
	callbackRef.current = callback;
	return useRef((...args: Args) => callbackRef.current(...args)).current;
};

type NoteComponentShim = BaseNoteScreenComponent<State>;

const NoteScreenComponent: React.FC<ComponentProps> = props => {
	const [state, setState] = useReducer(noteScreenStateReducer, props, makeInitialState);

	// Mirror the committed state/props in refs so that stable callbacks and the shared note-screen
	// logic can read the current values (equivalent to this.state/this.props on a class instance).
	const stateRef = useRef(state);
	stateRef.current = state;
	const propsRef = useRef(props);
	propsRef.current = props;

	// Mutable, non-render instance fields (these intentionally do not trigger re-renders).
	const lastBodyScrollRef = useRef<number|undefined>(undefined);
	const selectionRef = useRef<SelectionRange>(undefined);
	const doFocusUpdateRef = useRef(false);
	const focusUpdateIIDRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const saveActionQueuesRef = useRef<Record<string, AsyncActionQueue>>({});
	const undoRedoServiceRef = useRef<UndoRedoService>(null);
	const folderPickerOptionsRef = useRef<FolderPickerOptions>(undefined);
	const editorRef = useRef<EditorControl>(null);
	const titleTextFieldRef = useRef<TextInput>(null);

	// refreshKey is state (rather than a ref) because changing it must force the NoteEditor to refresh.
	const [refreshKey, setRefreshKey] = useState<number | undefined>(undefined);

	// Seed the initial scroll/cursor position once, on mount. Ignore them when there's a note hash:
	// the editor/viewer should jump to the hash rather than the last position.
	const initialisedRef = useRef(false);
	if (!initialisedRef.current) {
		initialisedRef.current = true;
		if (!props.noteHash) {
			const initialScroll = NotePositionService.instance().getScrollPercent(props.noteId, defaultWindowId);
			const initialCursorLocation = NotePositionService.instance().getCursorPosition(props.noteId, defaultWindowId).markdown;
			if (initialCursorLocation) {
				selectionRef.current = { start: initialCursorLocation, end: initialCursorLocation };
			}
			lastBodyScrollRef.current = initialScroll;
		}
	}

	// These ref slots are filled in below, after the corresponding callbacks are defined. This
	// breaks the circular dependency between the shim and the callbacks that reference the shim.
	const scheduleSaveRef = useRef<(currentState: State)=> void>(null);
	const scheduleFocusUpdateRef = useRef<()=> void>(null);
	const attachFileRef = useRef<(asset: PickerResponse, fileType: string|null)=> Promise<ResourceEntity|null>>(null);
	const insertTextRef = useRef<(text: string, options?: InsertTextOptions)=> Promise<NoteEntity>>(null);

	const compRef = useRef<NoteComponentShim>(null);
	if (!compRef.current) {
		compRef.current = {
			get state() { return stateRef.current; },
			get props() { return propsRef.current; },
			setState: (action: StateAction) => setState(action),
			scheduleSave: (currentState: State) => scheduleSaveRef.current(currentState),
			scheduleFocusUpdate: () => scheduleFocusUpdateRef.current(),
			attachFile: (asset: AttachFileAsset, fileType: string|null) => { void attachFileRef.current(asset, fileType); },
			lastLoadedNoteId_: undefined,
		};
	}
	const comp = compRef.current;

	const editorPluginHandlerRef = useRef<EditorPluginHandler>(null);
	if (!editorPluginHandlerRef.current) {
		editorPluginHandlerRef.current = new EditorPluginHandler(PluginService.instance(), saveEvent => {
			return shared.noteComponent_change(comp, 'body', saveEvent.body);
		});
	}
	const editorPluginHandler = editorPluginHandlerRef.current;

	const isModified = useStableCallback(() => shared.isModified(comp));

	const emitEditorPluginUpdate = useStableCallback(() => {
		editorPluginHandler.emitUpdate({
			noteId: propsRef.current.noteId,
			newBody: stateRef.current.note.body,
		}, propsRef.current.visibleEditorPluginIds);
	});

	const undoState = useStableCallback((noteBody: string = null) => {
		return {
			body: noteBody === null ? stateRef.current.note.body : noteBody,
		};
	});

	const undoRedo = useStableCallback(async (type: 'undo'|'redo') => {
		const service = undoRedoServiceRef.current;
		if (!service) return;
		const newUndoState = await service[type](undoState()) as { body: string } | undefined;
		if (!newUndoState) return;

		setState((s) => {
			const newNote = { ...s.note };
			newNote.body = newUndoState.body;
			return {
				note: newNote,
			};
		});
	});

	const onUndoRedoDepthChange = useStableCallback((event: UndoRedoDepthChangeEvent) => {
		if (propsRef.current.useEditorBeta) {
			setState({ undoRedoButtonState: {
				canUndo: !!event.undoDepth,
				canRedo: !!event.redoDepth,
			} });
		}
	});

	const undoRedoService_stackChange = useStableCallback(() => {
		const service = undoRedoServiceRef.current;
		if (!propsRef.current.useEditorBeta && service) {
			setState({ undoRedoButtonState: {
				canUndo: service.canUndo,
				canRedo: service.canRedo,
			} });
		}
	});

	const screenHeader_undoButtonPress = useStableCallback(() => {
		if (propsRef.current.useEditorBeta) {
			editorRef.current.undo();
		} else {
			void undoRedo('undo');
		}
	});

	const screenHeader_redoButtonPress = useStableCallback(() => {
		if (propsRef.current.useEditorBeta) {
			editorRef.current.redo();
		} else {
			void undoRedo('redo');
		}
	});

	const onSearchVisibleChange = useStableCallback((visible: boolean) => {
		setState({ searchVisible: visible });
	});

	const onPublishDialogClose = useStableCallback(() => {
		setState({ publishDialogShown: false });
	});

	const onPublishDialogShow = useStableCallback(() => {
		setState({ publishDialogShown: true });
	});

	const onMarkForDownload = useStableCallback((event: { resourceId: string }) => {
		void ResourceFetcher.instance().markForDownload(event.resourceId);
	});

	const markAllAttachedResourcesForDownload = useStableCallback(async () => {
		const resourceIds = await Note.linkedResourceIds(stateRef.current.note.body);
		await ResourceFetcher.instance().markForDownload(resourceIds);
	});

	const reloadNoteAndUpdateRefreshKey = useStableCallback(async () => {
		await shared.reloadNote(comp);
		setRefreshKey(propsRef.current.editorNoteReloadTimeRequest);
	});

	const refreshResource = useStableCallback(async (resource: ResourceEntity, noteBody: string = null) => {
		if (noteBody === null && stateRef.current.note && stateRef.current.note.body) noteBody = stateRef.current.note.body;
		if (noteBody === null) return;

		const resourceIds = await Note.linkedResourceIds(noteBody);
		if (resourceIds.indexOf(resource.id) >= 0) {
			shared.clearResourceCache();
			const attachedResources = await shared.attachedResources(noteBody);
			setState({ noteResources: attachedResources });
		}
	});

	const title_changeText = useStableCallback((text: string) => {
		const newText = text.replace(/(\r\n|\n|\r)/gm, ' ');
		shared.noteComponent_change(comp, 'title', newText);
		setState({ newAndNoTitleChangeNoteId: null });
	});

	const onPlainEditorTextChange = useStableCallback((text: string) => {
		const service = undoRedoServiceRef.current;
		if (service) {
			if (!service.canUndo) {
				service.push(undoState());
			} else {
				service.schedulePush(undoState());
			}
		}

		shared.noteComponent_change(comp, 'body', text);
	});

	// Avoid saving immediately -- the NoteEditor's content isn't controlled by its props
	// and updating the note immediately causes slow rerenders.
	//
	// See https://github.com/laurent22/joplin/issues/10130
	const onMarkdownEditorTextChangeRef = useRef<(event: EditorChangeEvent)=> void>(null);
	if (!onMarkdownEditorTextChangeRef.current) {
		onMarkdownEditorTextChangeRef.current = debounce((event: EditorChangeEvent) => {
			shared.noteComponent_change(comp, 'body', event.value);
		}, 100);
	}
	const onMarkdownEditorTextChange = onMarkdownEditorTextChangeRef.current;

	const onPlainEditorSelectionChange = useStableCallback((event: NativeSyntheticEvent<{ selection: SelectionRange }>) => {
		selectionRef.current = event.nativeEvent.selection;
	});

	const onEditorSelectionChange = useStableCallback((event: SelectionRangeChangeEvent) => {
		selectionRef.current = { start: event.from, end: event.to };

		NotePositionService.instance().updateCursorPosition(
			propsRef.current.noteId, defaultWindowId, { markdown: event.from },
		);
	});

	const saveActionQueue = useStableCallback((noteId: string) => {
		if (!saveActionQueuesRef.current[noteId]) {
			saveActionQueuesRef.current[noteId] = new AsyncActionQueue(500);
		}
		return saveActionQueuesRef.current[noteId];
	});

	const scheduleSave = useStableCallback((currentState: State) => {
		saveActionQueue(currentState.note.id).push(async () => {
			return shared.saveNoteButton_press(comp, currentState, null, null);
		});
	});

	const saveNoteButton_press = useStableCallback(async (folderId: string = null) => {
		await shared.saveNoteButton_press(comp, stateRef.current, folderId, null);

		Keyboard.dismiss();
	});

	const saveOneProperty = useStableCallback(async (name: string, value: unknown) => {
		await shared.saveOneProperty(comp, name, value);
	});

	const resizeImageToFit = useStableCallback(async (localFilePath: string, targetPath: string, mimeType: string) => {
		const maxSize = Resource.IMAGE_MAX_DIMENSION;
		const dimensions = await getImageDimensions(localFilePath);
		reg.logger().info('Original dimensions ', dimensions);

		const saveOriginalImage = async () => {
			await shim.fsDriver().copy(localFilePath, targetPath);
			return true;
		};
		const saveResizedImage = async () => {
			dimensions.width = maxSize;
			dimensions.height = maxSize;
			reg.logger().info('New dimensions ', dimensions);

			await resizeImage({
				inputPath: localFilePath,
				outputPath: targetPath,
				maxWidth: dimensions.width,
				maxHeight: dimensions.height,
				quality: 0.85,
				format: mimeType === 'image/png' ? 'PNG' : 'JPEG',
			});
			return true;
		};

		const canResize = dimensions.width > maxSize || dimensions.height > maxSize;
		if (canResize) {
			const resizeLargeImages = Setting.value('imageResizing');
			if (resizeLargeImages === 'alwaysAsk') {
				const userAnswer = await propsRef.current.dialogs.showMenu(
					`${_('You are about to attach a large image (%dx%d pixels). Would you like to resize it down to %d pixels before attaching it?', dimensions.width, dimensions.height, maxSize)}\n\n${_('(You may disable this prompt in the options)')}`, [
						{ text: _('Yes'), id: 'yes' },
						{ text: _('No'), id: 'no' },
						{ text: _('Cancel'), id: 'cancel' },
					]);
				if (userAnswer === 'yes') return await saveResizedImage();
				if (userAnswer === 'no') return await saveOriginalImage();
				if (userAnswer === 'cancel' || !userAnswer) return false;
			} else if (resizeLargeImages === 'alwaysResize') {
				return await saveResizedImage();
			}
		}

		return await saveOriginalImage();
	});

	const insertText = useStableCallback(async (text: string, { newLine = false }: InsertTextOptions = {}) => {
		const newNote = { ...stateRef.current.note };
		const separator = newLine ? '\n' : '';

		if (stateRef.current.mode === 'edit') {
			let newText = '';

			if (selectionRef.current) {
				newText = `${separator}${text}${separator}`;
				const prefix = newNote.body.substring(0, selectionRef.current.start);
				const suffix = newNote.body.substring(selectionRef.current.end);
				newNote.body = `${prefix}${newText}${suffix}`;
			} else {
				newText = `${separator}${separator}${text}`;
				newNote.body = `${newNote.body}${newText}`;
			}

			if (propsRef.current.useEditorBeta) {
				// The beta editor needs to be explicitly informed of changes
				// to the note's body
				if (editorRef.current) {
					editorRef.current.insertText(newText);
				} else {
					logger.info(`Tried to insert text ${text} to the note when the editor is not visible -- updating the note body instead.`);
				}
			}
		} else {
			newNote.body += `${separator}${text}`;
		}

		setState({ note: newNote });
		return newNote;
	});

	const attachFile = useStableCallback(async (
		pickerResponse: PickerResponse,
		fileType: string,
	): Promise<ResourceEntity|null> => {
		logger.debug('Attaching file:', pickerResponse?.uri);
		if (!pickerResponse) {
			// User has cancelled
			return null;
		}

		const localFilePath = Platform.select({
			ios: decodeURIComponent(pickerResponse.uri),
			default: pickerResponse.uri,
		});

		let mimeType = pickerResponse.type;

		if (!mimeType) {
			const ext = fileExtension(localFilePath);
			mimeType = mimeUtils.fromFileExtension(ext);
		}

		if (!mimeType && fileType === 'image') {
			// Assume JPEG if we couldn't determine the file type. It seems to happen with the image picker
			// when the file path is something like content://media/external/images/media/123456
			// If the image is not a JPEG, something will throw an error below, but there's a good chance
			// it will work.
			reg.logger().info('Missing file type and could not detect it - assuming image/jpg');
			mimeType = 'image/jpg';
		}

		reg.logger().info(`Got file: ${localFilePath}`);
		reg.logger().info(`Got type: ${mimeType}`);

		let resource: ResourceEntity = Resource.new();
		resource.id = uuid.create();
		resource.mime = mimeType;
		resource.title = pickerResponse.fileName ? pickerResponse.fileName : '';
		resource.file_extension = safeFileExtension(fileExtension(pickerResponse.fileName ? pickerResponse.fileName : localFilePath));

		if (!resource.mime) resource.mime = 'application/octet-stream';

		const targetPath = Resource.fullPath(resource);

		try {
			if (mimeType === 'image/jpeg' || mimeType === 'image/jpg' || mimeType === 'image/png') {
				const done = await resizeImageToFit(localFilePath, targetPath, mimeType);
				if (!done) return null;
			} else {
				if (fileType === 'image' && mimeType !== 'image/svg+xml') {
					await propsRef.current.dialogs.error(_('Unsupported image type: %s', mimeType));
					return null;
				} else {
					await shim.fsDriver().copy(localFilePath, targetPath);
					const stat = await shim.fsDriver().stat(targetPath);

					if (stat.size >= 200 * 1024 * 1024) {
						await shim.fsDriver().remove(targetPath);
						throw new Error('Resources larger than 200 MB are not currently supported as they may crash the mobile applications. The issue is being investigated and will be fixed at a later time.');
					}
				}
			}
		} catch (error) {
			reg.logger().warn('Could not attach file:', error);
			await propsRef.current.dialogs.error(error.message);
			return null;
		}

		const itDoes = await shim.fsDriver().waitTillExists(targetPath);
		if (!itDoes) throw new Error(`Resource file was not created: ${targetPath}`);

		const fileStat = await shim.fsDriver().stat(targetPath);
		resource.size = fileStat.size;

		resource = await Resource.save(resource, { isNew: true });

		const resourceTag = Resource.markupTag(resource, stateRef.current.note.markup_language);
		const newNote = await insertText(resourceTag, { newLine: true });

		void refreshResource(resource, newNote.body);

		scheduleSave({ ...stateRef.current, note: newNote });

		return resource;
	});

	const cameraView_onPhoto = useStableCallback(async (data: CameraResult|CameraResult[]) => {
		if (!Array.isArray(data)) {
			data = [data];
		}

		for (const item of data) {
			await attachFile(
				item,
				'image',
			);
		}

		setState({ showCamera: false });
	});

	const cameraView_onInsertBarcode = useStableCallback((data: string) => {
		setState({ showCamera: false });
		void insertText(data, { newLine: true });
	});

	const cameraView_onCancel = useStableCallback(() => {
		setState({ showCamera: false });
	});

	const attachNewDrawing = useStableCallback(async (svgData: string) => {
		const filePath = `${Setting.value('resourceDir')}/saved-drawing.joplin.svg`;
		await shim.fsDriver().writeFile(filePath, svgData, 'utf8');
		logger.info('Saved new drawing to', filePath);

		return await attachFile({
			uri: filePath,
			fileName: _('Drawing'),
		}, 'image');
	});

	const updateDrawing = useStableCallback(async (svgData: string) => {
		let resource: ResourceEntity|null = stateRef.current.imageEditorResource;

		if (!resource) {
			resource = await attachNewDrawing(svgData);

			// Set resource and file path to allow
			// 1. subsequent saves to update the resource
			// 2. the editor to load from the resource's filepath (can happen
			//    if the webview is reloaded).
			setState({
				imageEditorResourceFilepath: Resource.fullPath(resource),
				imageEditorResource: resource,
			});
		} else {
			logger.info('Saving drawing to resource', resource.id);

			const tempFilePath = join(Setting.value('tempDir'), uuid.createNano());
			await shim.fsDriver().writeFile(tempFilePath, svgData, 'utf8');

			resource = await Resource.updateResourceBlobContent(
				resource.id,
				tempFilePath,
			);
			await shim.fsDriver().remove(tempFilePath);

			await refreshResource(resource);
		}
	});

	const onSaveDrawing = useStableCallback(async (svgData: string) => {
		await updateDrawing(svgData);
	});

	const onCloseDrawing = useStableCallback(() => {
		setState({ showImageEditor: false });
	});

	const drawPicture_onPress = useStableCallback(async () => {
		logger.info('Showing image editor...');
		setState({
			showImageEditor: true,
			imageEditorResourceFilepath: null,
			imageEditorResource: null,
		});
	});

	const editDrawing = useStableCallback((item: BaseItem) => {
		const filePath = Resource.fullPath(item);
		setState({
			showImageEditor: true,
			imageEditorResourceFilepath: filePath,
			imageEditorResource: item,
		});
	});

	const onEditResource = useStableCallback(async (message: string) => {
		const messageData = /^edit:(.*)$/.exec(message);
		if (!messageData) {
			throw new Error('onEditResource: Error: Invalid message');
		}

		const resourceId = messageData[1];

		const resource = await BaseItem.loadItemById(resourceId);
		await Resource.requireIsReady(resource);

		if (isEditableResource(resource.mime)) {
			editDrawing(resource);
		} else {
			throw new Error(_('Unable to edit resource of type %s', resource.mime));
		}
	});

	const toggleIsTodo_onPress = useStableCallback(() => {
		const newNote = shared.toggleIsTodo_onPress(comp);

		scheduleSave({ ...stateRef.current, note: newNote });
	});

	const share_onPress = useStableCallback(async () => {
		const note = stateRef.current.note;
		const shareText = `${note.title}\n\n${note.body}`;
		const filename = note.id ?? uuid.create();

		if (shareText.length > 100000) {
			let fileToShare;
			try {
				// Using a .txt file extension causes a "No valid provider found from URL" error
				// and blank share sheet on iOS for larger log files (around 200 KiB).
				fileToShare = await writeTextToCacheFile(shareText, `${filename}.md`);
				await shareFile(fileToShare, 'text/plain');
			} catch (e) {
				logger.error('Unable to share note data:', e);

				// Display a message to the user (e.g. in the case where the user is out of disk space).
				void shim.showErrorDialog(_('Unable to share note data. Reason: %s', e.toString()));
			} finally {
				if (fileToShare) {
					await shim.fsDriver().remove(fileToShare);
				}
			}
		} else {
			// A txt extension is automatically appended to the title when shared to a file via this route
			await Share.share({
				message: shareText,
				title: filename,
			});
		}
	});

	const properties_onPress = useStableCallback(() => {
		propsRef.current.dispatch({ type: 'SIDE_MENU_OPEN' });
	});

	const revealInNotebook_onPress = useStableCallback(() => {
		const folderId = stateRef.current.folder?.id;
		if (folderId) {
			void NavService.go('Notes', { folderId: folderId });
		} else {
			void NavService.go('Notes', { smartFilterId: ALL_NOTES_FILTER_ID });
		}
	});

	const onAlarmDialogAccept = useStableCallback(async (date: Date) => {
		if (Platform.OS === 'android') {
			const response = await checkPermissions(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);

			// The POST_NOTIFICATIONS permission isn't supported on Android API < 33.
			// (If unsupported, returns NEVER_ASK_AGAIN).
			// On earlier releases, notifications should work without this permission.
			if (response === PermissionsAndroid.RESULTS.DENIED) {
				logger.warn('POST_NOTIFICATIONS permission was not granted');
				return;
			}
		}

		if (Platform.OS === 'web') {
			alert('Warning: The due-date has been saved, but showing notifications is not supported by Joplin Web.');
		}

		await saveOneProperty('todo_due', date ? date.getTime() : 0);

		setState({ alarmDialogShown: false });
	});

	const onAlarmDialogReject = useStableCallback(() => {
		setState({ alarmDialogShown: false });
	});

	const showOnMap_onPress = useStableCallback(async () => {
		if (!stateRef.current.note.id) return;

		const note = await Note.load(stateRef.current.note.id);
		try {
			const url = Note.geolocationUrl(note);
			await Linking.openURL(url);
		} catch (error) {
			propsRef.current.dispatch({ type: 'SIDE_MENU_CLOSE' });
			await propsRef.current.dialogs.error(error.message);
		}
	});

	const showSource_onPress = useStableCallback(async () => {
		if (!stateRef.current.note.id) return;

		const note = await Note.load(stateRef.current.note.id);
		try {
			await Linking.openURL(note.source_url);
		} catch (error) {
			await propsRef.current.dialogs.error(error.message);
		}
	});

	const copyMarkdownLink_onPress = useStableCallback(() => {
		const note = stateRef.current.note;
		Clipboard.setString(Note.markdownTag(note));
	});

	const copyExternalLink_onPress = useStableCallback(() => {
		const note = stateRef.current.note;
		Clipboard.setString(getNoteCallbackUrl(note.id));
	});

	const sideMenuOptions = useStableCallback(() => {
		const note = stateRef.current.note;
		if (!note) return [];

		const output = [];

		const createdDateString = time.formatMsToLocal(note.user_created_time);
		const updatedDateString = time.formatMsToLocal(note.user_updated_time);

		output.push({ title: _('Created: %s', createdDateString) });
		output.push({ title: _('Updated: %s', updatedDateString) });
		output.push({ isDivider: true });

		output.push({
			title: _('View on map'),
			onPress: () => {
				void showOnMap_onPress();
			},
		});
		output.push({
			title: _('Previous versions'),
			onPress: () => {
				propsRef.current.dispatch({ type: 'SIDE_MENU_CLOSE' });
				void NavService.go('NoteRevisionViewer', {
					noteId: propsRef.current.noteId,
				});
			},
		});
		if (note.source_url) {
			output.push({
				title: _('Go to source URL'),
				onPress: () => {
					void showSource_onPress();
				},
			});
		}
		if (propsRef.current.canPublish) {
			output.push({
				title: _('Publish/unpublish'),
				onPress: onPublishDialogShow,
			});
		}

		return output;
	});

	const onAttach = useStableCallback(async (filePath?: string) => {
		await CommandService.instance().execute('attachFile', filePath);
	});

	const todoCheckbox_change = useStableCallback(async (checked: boolean) => {
		await saveOneProperty('todo_completed', checked ? time.unixMs() : 0);
	});

	const toggleVisiblePanes = useStableCallback(() => {
		const isSwitchingToEdit = stateRef.current.mode === 'view';
		void CommandService.instance().execute('toggleVisiblePanes');
		if (isSwitchingToEdit) {
			doFocusUpdateRef.current = true;
		}
	});

	const noteEditorVisible = useStableCallback(() => {
		return !stateRef.current.showCamera && !stateRef.current.showImageEditor;
	});

	const scheduleFocusUpdate = useStableCallback(() => {
		if (focusUpdateIIDRef.current) shim.clearInterval(focusUpdateIIDRef.current);

		const startTime = Date.now();

		focusUpdateIIDRef.current = shim.setInterval(() => {
			if (!stateRef.current.note) return;

			let fieldToFocus = stateRef.current.note.is_todo ? 'title' : 'body';
			if (stateRef.current.mode === 'view') fieldToFocus = '';

			let done = false;

			if (fieldToFocus === 'title' && titleTextFieldRef.current) {
				done = true;
				focus('Note::focusUpdate::title', titleTextFieldRef.current);
			} else if (fieldToFocus === 'body' && editorRef.current) {
				done = true;
				focus('Note::focusUpdate::body', editorRef.current);
			}

			if (Date.now() - startTime > 5000) {
				logger.warn(`Timeout while trying to set focus on ${fieldToFocus}`);
				done = true;
			}

			if (!noteEditorVisible()) {
				logger.info(`Note editor is not visible - not setting focus on ${fieldToFocus}`);
				done = true;
			}

			if (done) {
				shim.clearInterval(focusUpdateIIDRef.current);
				focusUpdateIIDRef.current = null;
			}
		}, 50);
	});

	const folderPickerOptions_valueChanged = useStableCallback(async (itemValue: string) => {
		const note = stateRef.current.note;
		const isProvisionalNote = propsRef.current.provisionalNoteIds.includes(note.id);

		if (isProvisionalNote) {
			await saveNoteButton_press(itemValue);
		} else {
			await Note.moveToFolder(
				note.id,
				itemValue,
				{ dispatchOptions: { preserveSelection: true } },
			);
		}

		note.parent_id = itemValue;

		const folder = await Folder.load(note.parent_id);

		setState({
			lastSavedNote: { ...note },
			note: note,
			folder: folder,
		});
	});

	const onBodyViewerScroll = useStableCallback((event: ScrollEventSlice) => {
		lastBodyScrollRef.current = event.fraction;

		NotePositionService.instance().updateScrollPosition(
			propsRef.current.noteId, defaultWindowId, event.fraction,
		);
	});

	const onMarkdownEditorScroll = useStableCallback(() => {});

	const onBodyViewerCheckboxChange = useStableCallback((newBody: string) => {
		void saveOneProperty('body', newBody);
	});

	const speechToTextDialog_onText = useStableCallback((text: string) => {
		if (stateRef.current.mode === 'view') {
			const newNote: NoteEntity = { ...stateRef.current.note };
			newNote.body = `${newNote.body} ${text}`;
			setState({ note: newNote });
			scheduleSave(stateRef.current);
		} else {
			if (propsRef.current.useEditorBeta) {
				// We add a space so that if the feature is used twice in a row,
				// the sentences are not stuck to each others.
				editorRef.current.insertText(`${text} `);
			} else {
				logger.warn('Voice typing is not supported in plaintext editor');
			}
		}
	});

	const audioRecordingDialog_onFile = useStableCallback((file: PickerResponse) => {
		return attachFile(file, 'audio');
	});

	const audioRecorderDialog_onDismiss = useStableCallback(() => {
		setState({ showSpeechToTextDialog: false, showAudioRecorder: false });
	});

	const speechToTextDialog_onDismiss = useStableCallback(() => {
		setState({ showSpeechToTextDialog: false });
	});

	const noteTagDialog_closeRequested = useStableCallback(() => {
		setState({ noteTagDialogShown: false });
	});

	const saveDialog = useStableCallback(async () => {
		if (isModified()) {
			const buttonId = await propsRef.current.dialogs.showMenu(
				_('This note has been modified:'),
				[{ text: _('Save changes'), id: 'save' }, { text: _('Discard changes'), id: 'discard' }, { text: _('Cancel'), id: 'cancel' }],
			);

			if (buttonId === 'cancel') return true;
			if (buttonId === 'save') await saveNoteButton_press();
		}

		return false;
	});

	const navHandler: OnNavigateCallback = useStableCallback(async () => {
		return await saveDialog();
	});

	const backHandler = useStableCallback(async () => {
		if (isModified()) {
			await saveNoteButton_press();
		}

		const isProvisionalNote = propsRef.current.provisionalNoteIds.includes(propsRef.current.noteId);

		if (isProvisionalNote) {
			return false;
		}

		if (stateRef.current.mode === 'edit') {
			Keyboard.dismiss();
			await undoRedoServiceRef.current?.reset();
		}

		if (stateRef.current.fromShare) {
			// Note: In the past, NAV_BACK caused undesired behaviour in this case:
			// - share to Joplin from some other app
			// - open Joplin and open any note
			// - go back -- with NAV_BACK this causes the app to exit rather than just showing notes
			// This no longer seems to happen, but this case should be checked when adjusting navigation
			// history behavior.
			propsRef.current.dispatch({
				type: 'NAV_BACK',
			});

			ShareExtension.close();
			return true;
		}

		return false;
	});

	// Point the shim's late-bound ref slots at the now-defined callbacks.
	scheduleSaveRef.current = scheduleSave;
	scheduleFocusUpdateRef.current = scheduleFocusUpdate;
	attachFileRef.current = attachFile;
	insertTextRef.current = insertText;

	const styles = useMemo(
		() => getStyles(props.themeId, props.editorFontSize, props.editorFont),
		[props.themeId, props.editorFontSize, props.editorFont],
	);
	const rootStyle = useMemo(() => createRootStyle(props.themeId), [props.themeId]);

	const folderPickerOptions = useMemo<FolderPickerOptions>(() => {
		const options = {
			visible: !state.readOnly,
			disabled: false,
			selectedFolderId: state.folder ? state.folder.id : null,
			onValueChange: folderPickerOptions_valueChanged,
		};

		if (
			folderPickerOptionsRef.current
			&& options.selectedFolderId === folderPickerOptionsRef.current.selectedFolderId
			&& options.visible === folderPickerOptionsRef.current.visible
		) {
			return folderPickerOptionsRef.current;
		}

		folderPickerOptionsRef.current = options;
		return options;
		// eslint-disable-next-line @seiyab/react-hooks/exhaustive-deps -- folderPickerOptions_valueChanged is a stable callback
	}, [state.readOnly, state.folder]);

	const menuOptions = useMemo<MenuOptionType[]>(() => {
		const note = state.note;
		const isTodo = note && !!note.is_todo;
		const isSaved = note && note.id;
		const readOnly = state.readOnly;
		const isDeleted = !!state.note.deleted_time;
		const isCodeView = props.editorType === EditorType.Markdown;

		const pluginCommands = pluginUtils.commandNamesFromViews(props.plugins, 'noteToolbar');

		const output: MenuOptionType[] = [];

		// The file attachment modules only work in Android >= 5 (Version 21)
		// https://github.com/react-community/react-native-image-picker/issues/606

		// As of 2020-10-13, support for attaching images from the gallery is removed
		// as the package react-native-image-picker has permission issues. It's still
		// possible to attach files, which has often a similar UI, with thumbnails for
		// images so normally it should be enough.
		let canAttachPicture = true;
		if (Platform.OS === 'android' && Platform.Version < 21) canAttachPicture = false;
		if (canAttachPicture) {
			output.push({
				title: _('Attach...'),
				onPress: () => onAttach(),
				disabled: readOnly,
			});
		}

		output.push({
			title: _('Draw picture'),
			onPress: () => drawPicture_onPress(),
			disabled: readOnly,
		});

		if (isTodo) {
			output.push({
				title: _('Set alarm'),
				onPress: () => {
					setState({ alarmDialogShown: true });
				},
				disabled: readOnly,
			});
		}

		const shareSupported = Platform.OS !== 'web' || !!navigator.share;
		if (shareSupported) {
			output.push({
				title: _('Share'),
				onPress: () => {
					void share_onPress();
				},
				disabled: readOnly,
			});
		}

		if (VoiceTyping.supported()) {
			output.push({
				title: _('Voice typing...'),
				onPress: () => {
					setState({ showSpeechToTextDialog: true });
				},
				disabled: readOnly,
			});
		}

		const commandService = CommandService.instance();
		const whenContext = commandService.currentWhenClauseContext();
		const addButtonFromCommand = (commandName: string, title?: string) => {
			if (commandName === '-') {
				output.push({ isDivider: true });
			} else {
				output.push({
					title: title ?? commandService.description(commandName),
					onPress: async () => {
						void commandService.execute(commandName);
					},
					disabled: !commandService.isEnabled(commandName, whenContext),
				});
			}
		};

		if (isSaved && !isDeleted) {
			addButtonFromCommand('setTags');
		}

		output.push({
			title: isTodo ? _('Convert to note') : _('Convert to todo'),
			onPress: () => {
				toggleIsTodo_onPress();
			},
			disabled: readOnly,
		});

		if (isSaved && !isDeleted) {
			output.push({
				title: _('Copy Markdown link'),
				onPress: () => {
					copyMarkdownLink_onPress();
				},
			});

			// External links are not supported on web.
			if (Platform.OS !== 'web') {
				output.push({
					title: _('Copy external link'),
					onPress: () => {
						copyExternalLink_onPress();
					},
				});
			}
		}

		output.push({
			title: _('Properties'),
			onPress: () => {
				properties_onPress();
			},
		});

		if (state.mode === 'edit') {
			const newCodeView = !isCodeView;
			output.push({
				title: newCodeView ? _('Edit as Markdown') : _('Edit as Rich Text'),
				onPress: () => {
					Setting.setValue('editor.codeView', newCodeView);
				},
			});
		}

		output.push({
			title: _('Reveal in notebook'),
			onPress: () => {
				revealInNotebook_onPress();
			},
		});

		if (isDeleted) {
			output.push({
				title: _('Restore'),
				onPress: async () => {
					await restoreItems(ModelType.Note, [stateRef.current.note.id]);
					propsRef.current.dispatch({
						type: 'NAV_GO',
						routeName: 'Notes',
					});
				},
			});
		}

		if (whenContext.inTrash) {
			addButtonFromCommand('permanentlyDeleteNote');
		} else {
			addButtonFromCommand('deleteNote', _('Delete'));
		}

		if (pluginCommands.length) {
			output.push({ isDivider: true });

			for (const commandName of pluginCommands) {
				addButtonFromCommand(commandName);
			}
		}

		return output;
		// The dependencies mirror the cache key used by the original class component. The handlers
		// referenced here are stable callbacks, so they're intentionally omitted.
		// eslint-disable-next-line @seiyab/react-hooks/exhaustive-deps
	}, [state.note?.is_todo, state.note?.id, state.note?.deleted_time, state.readOnly, state.mode, props.editorType, props.plugins]);

	// Commands must be registered before child components can render, so this uses useNowEffect
	// (which runs during render) rather than useEffect.
	useNowEffect(() => {
		const dispatch = propsRef.current.dispatch;
		const registration = CommandService.instance().componentRegisterCommands<CommandRuntimeProps>(
			{
				attachFile: (pickerResponse, fileType) => attachFileRef.current(pickerResponse, fileType),
				hideKeyboard: () => {
					if (propsRef.current.useEditorBeta) {
						editorRef.current?.hideKeyboard();
					} else {
						Keyboard.dismiss();
					}
				},
				insertText: (text) => { void insertTextRef.current(text); },
				get dialogs() {
					return propsRef.current.dialogs;
				},
				setCameraVisible: (visible) => {
					setState({ showCamera: visible });
				},
				setTagDialogVisible: (visible) => {
					if (!stateRef.current.note || !stateRef.current.note.id) return;

					setState({ noteTagDialogShown: visible });
				},
				setAudioRecorderVisible: (visible) => {
					setState({ showAudioRecorder: visible });
				},
				getMode: () => stateRef.current.mode,
				setMode: (mode: NoteViewerMode) => {
					setState({ mode });
				},
				dispatch,
			},
			commands,
			true,
		);

		return () => {
			registration.deregister();
		};
		// eslint-disable-next-line @seiyab/react-hooks/exhaustive-deps -- Registered once for the lifetime of the component
	}, []);

	// componentDidMount / componentWillUnmount
	useEffect(() => {
		BackButtonService.addHandler(backHandler);
		NavService.addHandler(navHandler);

		shared.clearResourceCache();
		shared.installResourceHandling(refreshResource);

		const timeouts: ReturnType<typeof setTimeout>[] = [];

		const init = async () => {
			await shared.initState(comp);

			undoRedoServiceRef.current = new UndoRedoService();
			undoRedoServiceRef.current.on('stackChange', undoRedoService_stackChange);

			// Although it is async, we don't wait for the answer so that if permission
			// has already been granted, it doesn't slow down opening the note. If it hasn't
			// been granted, the popup will open anyway.
			void requestGeoLocationPermissions();

			const action = propsRef.current.navigation.state?.newNoteAttachFileAction;
			if (action) {
				timeouts.push(setTimeout(async () => {
					if (action === AttachFileAction.AttachDrawing) {
						await drawPicture_onPress();
					} else {
						const options: AttachFileOptions = {
							action: action,
						};
						await CommandService.instance().execute('attachFile', '', options);
					}
				}, 100));
			}

			await editorPluginHandler.emitActivationCheck({
				noteId: propsRef.current.noteId,
				parentWindowId: defaultWindowId,
			});

			timeouts.push(setTimeout(() => {
				emitEditorPluginUpdate();
			}, 300));
		};
		void init();

		return () => {
			BackButtonService.removeHandler(backHandler);
			NavService.removeHandler(navHandler);

			shared.uninstallResourceHandling(refreshResource);

			void saveActionQueue(stateRef.current.note.id).processAllNow();

			// It cannot theoretically be undefined, since the mount effect should always run before
			// its cleanup, but with React Native the impossible often becomes possible.
			if (undoRedoServiceRef.current) undoRedoServiceRef.current.off('stackChange', undoRedoService_stackChange);

			for (const timeout of timeouts) {
				clearTimeout(timeout);
			}

			propsRef.current.dispatch({
				type: 'SET_NOTE_EDITOR_VISIBLE',
				visible: false,
			});
		};
		// eslint-disable-next-line @seiyab/react-hooks/exhaustive-deps -- Runs once on mount; all referenced values are stable
	}, []);

	// componentDidUpdate -- runs after every render except the first, replicating the class
	// component's change-only semantics (it compares the previous and current props/state).
	const prevProps = usePrevious(props);
	const prevState = usePrevious(state);
	const didMountRef = useRef(false);
	useEffect(() => {
		if (!didMountRef.current) {
			didMountRef.current = true;
			return;
		}

		if (doFocusUpdateRef.current) {
			doFocusUpdateRef.current = false;
			scheduleFocusUpdate();
		}

		if (prevProps.showSideMenu !== props.showSideMenu && props.showSideMenu) {
			props.dispatch({
				type: 'NOTE_SIDE_MENU_OPTIONS_SET',
				options: sideMenuOptions(),
			});
		}

		if (prevState.isLoading !== state.isLoading && !state.isLoading) {
			// If there's autosave data, prompt the user to restore it.
			void promptRestoreAutosave((drawingData: string) => {
				void attachNewDrawing(drawingData);
			});

			// Handle automatic resource downloading
			if (state.note?.body && Setting.value('sync.resourceDownloadMode') === 'auto') {
				void markAllAttachedResourcesForDownload();
			}
		}

		// Disable opening/closing the side menu with touch gestures
		// when the image editor is open.
		if (prevState.showImageEditor !== state.showImageEditor) {
			props.dispatch({
				type: 'SET_SIDE_MENU_TOUCH_GESTURES_DISABLED',
				disableSideMenuGestures: state.showImageEditor,
			});
		}

		if (prevState.mode !== state.mode) {
			props.dispatch({
				type: 'NOTE_EDITOR_VISIBLE_CHANGE',
				visible: state.mode === 'edit' && !state.showCamera && !state.showImageEditor,
			});
		}

		// Reset undo/redo button state when switching to edit mode or when switching between markdown and rich text editors, since the editor is
		// recreated and loses its undo/redo history
		if (state.mode === 'edit' && (prevState.mode !== state.mode || prevProps.editorType !== props.editorType)) {
			setState({
				undoRedoButtonState: {
					canUndo: false,
					canRedo: false,
				},
			});
		}

		if (prevProps.noteId && props.noteId && prevProps.noteId !== props.noteId) {
			// Easier to just go back, then go to the note since
			// the Note screen doesn't handle reloading a different note
			props.dispatch({
				type: 'NAV_GO',
				routeName: 'Note',
				noteId: props.noteId,
				noteHash: props.noteHash,
			});
		}

		const editorPluginIdsChanged = props.visibleEditorPluginIds !== prevProps.visibleEditorPluginIds;
		if (editorPluginIdsChanged || props.editorNoteReloadTimeRequest !== prevProps.editorNoteReloadTimeRequest) {
			const { editorPlugin } = getShownPluginEditorView(props.plugins, props.windowId);
			const explicitReloadRequired = !editorPlugin && props.editorNoteReloadTimeRequest > state.noteLastLoadTime;

			if (explicitReloadRequired) {
				void reloadNoteAndUpdateRefreshKey();
			}

			if (explicitReloadRequired || (editorPlugin && editorPluginIdsChanged)) {
				// Clear the undo / redo state, as undo / redo steps wont be in sync with the current content after the note editor has been refreshed
				if (!props.useEditorBeta) {
					void undoRedoServiceRef.current?.reset();
				}

				setState({
					undoRedoButtonState: {
						canUndo: false,
						canRedo: false,
					},
				});
			}
		}

		if (prevProps.noteId && props.noteId && prevProps.noteId !== props.noteId) {
			void editorPluginHandler.emitActivationCheck({
				noteId: props.noteId,
				parentWindowId: defaultWindowId,
			});
		}

		if (prevState.note.body !== state.note.body) {
			emitEditorPluginUpdate();
		}

		if (prevState.multiline !== state.multiline && titleTextFieldRef.current) {
			focus('Note::focusUpdate::title', titleTextFieldRef.current);
		}
	});

	const { editorPlugin, editorView } = getShownPluginEditorView(props.plugins, props.windowId);

	if (state.isLoading) {
		return (
			<View style={styles.screen}>
				<ScreenHeader />
			</View>
		);
	}

	const theme = themeStyle(props.themeId);
	const note: NoteEntity = state.note;
	const isTodo = !!Number(note.is_todo);

	if (state.showCamera) {
		return <CameraView
			onPhoto={cameraView_onPhoto}
			onInsertBarcode={cameraView_onInsertBarcode}
			onCancel={cameraView_onCancel}
			style={{ flex: 1 }}
		/>;
	} else if (state.showImageEditor) {
		return <ImageEditor
			resourceFilename={state.imageEditorResourceFilepath}
			themeId={props.themeId}
			onSave={onSaveDrawing}
			onExit={onCloseDrawing}
		/>;
	}

	const renderPluginEditor = () => {
		editorPluginHandler.onEditorPluginShown(editorView.id);
		return <PluginUserWebView
			viewInfo={{ plugin: editorPlugin, view: editorView }}
			themeId={props.themeId}
			onLoadEnd={() => {}}
			pluginHtmlContents={props.pluginHtmlContents}
			setDialogControl={() => {}}
			style={{}}
		/>;
	};

	// Currently keyword highlighting is supported only when FTS is available.
	const keywords = props.searchQuery && !!props.ftsEnabled ? props.highlightedWords : emptyArray;

	const increaseSpaceForEditor = props.lowVerticalSpace
		&& state.mode === 'edit'
		// For now, only dismiss other UI when search is visible. This provides a way to re-show the hidden UI (by dismissing search).
		&& state.searchVisible
		// Tapping on the title input when search is visible should edit the title, even if showing the keyboard decreases the
		// available space.
		&& !titleTextFieldRef.current?.isFocused();

	let bodyComponent = null;

	if (editorView) {
		bodyComponent = renderPluginEditor();
	} else {
		if (state.mode === 'view') {
			// Note: as of 2018-12-29 it's important not to display the viewer if the note body is empty,
			// to avoid the HACK_webviewLoadingState related bug.
			bodyComponent =
				!note || !note.body.trim() ? null : (
					<NoteBodyViewer
						style={styles.noteBodyViewer}
						paddingBottom={150}
						noteBody={note.body}
						noteMarkupLanguage={note.markup_language}
						noteResources={state.noteResources}
						highlightedKeywords={keywords}
						noteHash={props.noteHash}
						onCheckboxChange={onBodyViewerCheckboxChange}
						onMarkForDownload={onMarkForDownload}
						onRequestEditResource={onEditResource}
						onScroll={onBodyViewerScroll}
						initialScrollPercent={lastBodyScrollRef.current}
					/>
				);
		} else {
			// Note: In theory ScrollView can be used to provide smoother scrolling of the TextInput.
			// However it causes memory or rendering issues on older Android devices, probably because
			// the whole text input has to be in memory for the scrollview to work. So we keep it as
			// a plain TextInput for now.
			// See https://github.com/laurent22/joplin/issues/3041

			// IMPORTANT: The TextInput selection is unreliable and cannot be used in a controlled component
			// context. In other words, the selection should be considered read-only. For example, if the selection
			// is saved to the state in onSelectionChange and the current text in onChangeText, then set
			// back in `selection` and `value` props, it will mostly work. But when typing fast, sooner or
			// later the real selection will be different from what is stored in the state, thus making
			// the cursor jump around. Eg, when typing "abcdef", it will do this:
			//     abcd|
			//     abcde|
			//     abcde|f

			if (!props.useEditorBeta) {
				bodyComponent = (
					<TextInput
						autoCapitalize="sentences"
						style={styles.bodyTextInput}
						multiline={true}
						value={note.body}
						onChangeText={onPlainEditorTextChange}
						onSelectionChange={onPlainEditorSelectionChange}
						blurOnSubmit={false}
						selectionColor={theme.textSelectionColor}
						keyboardAppearance={theme.keyboardAppearance}
						placeholder={_('Add body')}
						placeholderTextColor={theme.colorFaded}
						// need some extra padding for iOS so that the keyboard won't cover last line of the note
						// see https://github.com/laurent22/joplin/issues/3607
						// Property is gone as of RN 0.72?
						// paddingBottom={ (Platform.OS === 'ios' ? 40 : 0) as any}
					/>
				);
			} else {
				const editorStyle = styles.bodyTextInput;
				const globalSearch = SearchEngine.instance().createQueryFromTerms(props.highlightedWords);

				bodyComponent = <NoteEditor
					ref={editorRef}
					toolbarEnabled={props.toolbarEnabled && !increaseSpaceForEditor}
					noteId={props.noteId}
					noteHash={props.noteHash}
					initialText={note.body}
					initialSelection={selectionRef.current}
					markupLanguage={note.markup_language}
					globalSearch={globalSearch}
					onChange={onMarkdownEditorTextChange}
					onSelectionChange={onEditorSelectionChange}
					onUndoRedoDepthChange={onUndoRedoDepthChange}
					onSearchVisibleChange={onSearchVisibleChange}
					onAttach={onAttach}
					noteResources={state.noteResources}
					readOnly={state.readOnly}
					plugins={props.plugins}
					style={{
						...editorStyle,

						// Allow the editor to set its own padding
						paddingLeft: 0,
						paddingRight: 0,
					}}

					// For now, only save/restore the scroll location for the Rich Text editor since that editor's
					// scroll should roughly match the viewer. In the future, it may make sense to refactor this to
					// use mapsToLine (similar to what's done on desktop) to sync the Markdown editor scroll, but this
					// will require refactoring.
					initialScroll={props.editorType === EditorType.RichText ? lastBodyScrollRef.current : undefined}
					onScroll={props.editorType === EditorType.RichText ? onBodyViewerScroll : onMarkdownEditorScroll}

					mode={props.editorType}
					refreshKey={refreshKey}
				/>;
			}
		}
	}

	// Save button is not really needed anymore with the improved save logic
	const showSaveButton = false; // state.mode === 'edit' || isModified() || this.saveButtonHasBeenShown_;
	const saveButtonDisabled = true;// !isModified();

	const titleContainerStyle = isTodo ? styles.titleContainerTodo : styles.titleContainer;

	const dueDate = Note.dueDateObject(note);

	const textWrapCalculator_updateState = (showToggle: boolean, enableMultiline: boolean) => {
		setState({ showMultilineToggle: showToggle, multiline: enableMultiline });
	};

	const titleToggleButton = !state.showMultilineToggle ? null :
		<IconButton
			icon={(!state.multiline && 'menu-down') || (state.multiline && 'menu-up')}
			accessibilityLabel={(!state.multiline && _('Expand title')) || (state.multiline && _('Collapse title'))}
			onPress={() => setState({ multiline: !state.multiline })}
			size={30}
			style={{ width: 30, height: 30, alignSelf: 'center' }}
		/>;

	const titleComp = (
		<View
			style={titleContainerStyle}
			onLayout={(e) => {
				const width = e.nativeEvent.layout.width;
				if (width !== state.titleContainerWidth) {
					setState({ titleContainerWidth: width });
				}
			}}

			// Making this focusable works around a tab ordering bug on Android
			// See https://github.com/laurent22/joplin/issues/14548
			accessible={Platform.OS === 'android'}
			// Since the group is focusable, it also needs a label (otherwise TalkBack reads "unlabelled"):
			aria-label={_('Title')}
		>
			<TextWrapCalculator
				textCompStyle={styles.titleTextInput}
				textCompContainerWidth={state.titleContainerWidth}
				showMultilineToggle={state.showMultilineToggle}
				multiline={state.multiline}
				text={note.title}
				updateState={textWrapCalculator_updateState}
				readOnly={false}
			/>
			{isTodo && <Checkbox style={styles.checkbox} checked={!!Number(note.todo_completed)} onChange={todoCheckbox_change} />}
			<TextInput
				key={state.multiline ? 'multiLine' : 'singleLine'}
				ref={titleTextFieldRef}
				underlineColorAndroid="#ffffff00"
				autoCapitalize="sentences"
				style={styles.titleTextInput}
				value={note.title}
				onChangeText={title_changeText}
				selectionColor={theme.textSelectionColor}
				keyboardAppearance={theme.keyboardAppearance}
				placeholder={_('Add title')}
				placeholderTextColor={theme.colorFaded}
				editable={!state.readOnly}
				multiline={state.multiline}
				submitBehavior = "blurAndSubmit"
			/>
			{ titleToggleButton }
		</View>
	);

	const noteTagDialog = !state.noteTagDialogShown ? null : <NoteTagsDialog onCloseRequested={noteTagDialog_closeRequested} />;

	const renderVoiceTypingDialogs = () => {
		const result = [];
		if (state.showAudioRecorder) {
			result.push(<AudioRecordingBanner
				key='audio-recorder'
				onFileSaved={audioRecordingDialog_onFile}
				onDismiss={audioRecorderDialog_onDismiss}
			/>);
		}
		if (state.showSpeechToTextDialog) {
			result.push(<SpeechToTextBanner
				key='speech-to-text'
				locale={currentLocale()}
				onText={speechToTextDialog_onText}
				onDismiss={speechToTextDialog_onDismiss}
			/>);
		}
		return result;
	};

	const { editorPlugin: activeEditorPlugin } = getActivePluginEditorView(props.plugins, props.windowId);

	let viewEditToggleMode = state.mode === 'edit' ? ViewToggleButtonMode.ShowViewer : ViewToggleButtonMode.ShowEditor;
	if (!state.note || state.note.deleted_time > 0 || editorView) {
		viewEditToggleMode = ViewToggleButtonMode.Hidden;
	}

	const header = <ScreenHeader
		folderPickerOptions={folderPickerOptions}
		menuOptions={menuOptions}
		showSaveButton={showSaveButton}
		saveButtonDisabled={saveButtonDisabled}
		onSaveButtonPress={saveNoteButton_press}
		showSideMenuButton={false}
		showSearchButton={false}
		showUndoButton={(state.undoRedoButtonState.canUndo || state.undoRedoButtonState.canRedo) && state.mode === 'edit'}
		showRedoButton={state.undoRedoButtonState.canRedo && state.mode === 'edit'}
		showPluginEditorButton={!!activeEditorPlugin}
		undoButtonDisabled={!state.undoRedoButtonState.canUndo && state.undoRedoButtonState.canRedo}
		onUndoButtonPress={screenHeader_undoButtonPress}
		onRedoButtonPress={screenHeader_redoButtonPress}
		viewToggleButtonMode={viewEditToggleMode}
		onViewTogglePress={toggleVisiblePanes}
		title={getDisplayParentTitle(state.note, state.folder)}
	/>;

	return (
		<View style={rootStyle.root}>
			{!increaseSpaceForEditor && header}
			{!increaseSpaceForEditor && titleComp}
			{bodyComponent}
			{renderVoiceTypingDialogs()}

			<SelectDateTimeDialog themeId={props.themeId} shown={state.alarmDialogShown} date={dueDate} onAccept={onAlarmDialogAccept} onReject={onAlarmDialogReject} />

			{noteTagDialog}
			<ShareNoteDialog
				noteId={props.noteId}
				visible={state.publishDialogShown}
				onClose={onPublishDialogClose}
			/>
		</View>
	);
};

const useHasLowAvailableSpace = () => {
	const windowDimensions = useWindowDimensions();
	const keyboardState = useKeyboardState();
	const verticalSpaceAvailable = windowDimensions.height - keyboardState.dockedKeyboardHeight;

	const lowVerticalScreenSpace = verticalSpaceAvailable < 270;
	// Debounce state updates to avoid multiple re-renders when the keyboard is hidden, then quickly
	// re-shown (e.g. when moving focus between text inputs).
	return useDebounced(lowVerticalScreenSpace, Second / 10);
};

// We added this change to reset the component state when the props.noteId is changed.
// NoteScreenComponent original implementation assumed that noteId would never change,
// which can cause some bugs where previously set state to another note would interfere
// how the new note should be rendered
const NoteScreenWrapper = (props: Props) => {
	const dialogs = useContext(DialogContext);
	const visibleEditorPluginIds = useVisiblePluginEditorViewIds(props.plugins, props.windowId);
	const lowVerticalSpace = useHasLowAvailableSpace();

	return (
		<NoteScreenComponent
			key={props.noteId}
			dialogs={dialogs}
			visibleEditorPluginIds={visibleEditorPluginIds}
			lowVerticalSpace={lowVerticalSpace}
			{...props}
		/>
	);
};

const NoteScreen = connect((state: AppState) => {
	const whenClause = stateToWhenClauseContext(state);
	return {
		windowId: state.windowId,
		noteId: state.selectedNoteIds.length ? state.selectedNoteIds[0] : null,
		noteHash: state.selectedNoteHash,
		itemType: state.selectedItemType,
		folders: state.folders,
		searchQuery: state.searchQuery,
		themeId: state.settings.theme,
		editorFont: state.settings['style.editor.fontFamily'] as number,
		editorFontSize: state.settings['style.editor.fontSize'],
		viewerFontSize: state.settings['style.viewer.fontSize'],
		toolbarEnabled: state.settings['editor.mobile.toolbarEnabled'],
		ftsEnabled: state.settings['db.ftsEnabled'],
		sharedData: state.sharedData,
		showSideMenu: state.showSideMenu,
		provisionalNoteIds: state.provisionalNoteIds,
		highlightedWords: state.highlightedWords,
		plugins: state.pluginService.plugins,
		pluginHtmlContents: state.pluginService.pluginHtmlContents,
		editorNoteReloadTimeRequest: state.editorNoteReloadTimeRequest,
		noteVisiblePanes: state.noteVisiblePanes,

		editorType: state.settings['editor.codeView'] ? EditorType.Markdown : EditorType.RichText,

		// What we call "beta editor" in this component is actually the (now
		// default) CodeMirror editor. That should be refactored to make it less
		// confusing.
		useEditorBeta: !state.settings['editor.usePlainText'],
		canPublish: whenClause.joplinServerConnected && !whenClause.inTrash,
	};
})(NoteScreenWrapper);

export default NoteScreen;
