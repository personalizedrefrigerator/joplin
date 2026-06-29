import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NoteEditor from './NoteEditor';
import StyleSheetContainer from '../StyleSheets/StyleSheetContainer';
import { connect } from 'react-redux';
import { AppState } from '../../app.reducer';
import { Dispatch } from 'redux';
import NewWindowOrIFrame, { WindowMode } from '../NewWindowOrIFrame';
import WindowCommandsAndDialogs from '../WindowCommandsAndDialogs/WindowCommandsAndDialogs';

import { StyleSheetManager } from 'styled-components';
// Note: Transitive dependencies used only by react-select. Remove if react-select is removed.
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { stateUtils } from '@joplin/lib/reducer';
import ResizableLayout from '../ResizableLayout/ResizableLayout';
import { LayoutItem } from '../ResizableLayout/utils/types';
import { PluginStates } from '@joplin/lib/services/plugins/reducer';
import layoutKeyToLabel from '../../utils/layout/layoutKeyToLabel';
import ChatPanel from '../ChatPanel/ChatPanel';

interface Props {
	dispatch: Dispatch;
	themeId: number;

	layout: LayoutItem;
	plugins: PluginStates;
	newWindow: boolean;
	windowId: string;
	startupPluginsLoaded: boolean;
}

const emptyCallback = () => {};
const useWindowTitle = (isNewWindow: boolean) => {
	const [title, setTitle] = useState('Untitled');

	if (!isNewWindow) {
		return {
			windowTitle: 'Editor',
			onNoteTitleChange: emptyCallback,
		};
	}

	return { windowTitle: `Joplin - ${title}`, onNoteTitleChange: setTitle };
};

const useLayout = ({ windowId, layout, plugins, dispatch }: Props) => {
	const [window, setWindow] = useState<Window|null>(null);

	const onUpdateLayout = useCallback((newLayout: LayoutItem) => {
		dispatch({
			type: 'WINDOW_LAYOUT_SET',
			windowId,
			value: newLayout,
		});
	}, [dispatch, windowId]);

	const onResize = useCallback((event: { layout: LayoutItem }) => {
		onUpdateLayout(event.layout);
	}, [onUpdateLayout]);

	const onKeyToLabel = useCallback((key: string) => {
		return layoutKeyToLabel(key, plugins);
	}, [plugins]);

	const currentLayoutRef = useRef(layout);
	currentLayoutRef.current = layout;

	const onRefreshLayoutSize = useCallback((window: Window) => {
		const layout = currentLayoutRef.current;
		if (layout.width !== window.innerWidth || layout.height !== window.innerHeight) {
			const newLayout = {
				...currentLayoutRef.current,
				width: window.innerWidth,
				height: window.innerHeight,
			};
			onUpdateLayout(newLayout);
		}
	}, [onUpdateLayout]);

	useEffect(() => {
		if (!window) return ()=>{};

		const onWindowResize = () => onRefreshLayoutSize(window);
		window.addEventListener('resize', onWindowResize);
		onWindowResize();

		return () => {
			window.removeEventListener('resize', onWindowResize);
		};
	}, [window, onRefreshLayoutSize]);

	return { layout, onWindow: setWindow, onResize, onKeyToLabel };
};

const SecondaryWindow: React.FC<Props> = props => {
	const containerRef = useRef<HTMLDivElement>(null);

	const { windowTitle, onNoteTitleChange } = useWindowTitle(props.newWindow);

	const newWindow = props.newWindow;
	const onWindowClose = useCallback(() => {
		if (newWindow) {
			props.dispatch({ type: 'WINDOW_CLOSE', windowId: props.windowId });
		}
	}, [props.dispatch, props.windowId, newWindow]);

	const layout = useLayout(props);

	const onRenderItem = useCallback((key: string) => {
		if (key === 'editor') {
			return <div key={key} className='note-editor-wrapper' ref={containerRef}>
				<NoteEditor
					windowId={props.windowId}
					onTitleChange={onNoteTitleChange}
					startupPluginsLoaded={props.startupPluginsLoaded}
				/>
			</div>;
		}
		if (key === 'chatPanel') {
			return <ChatPanel windowId={props.windowId} key={key} />;
		}
		return null;
	}, [props.windowId, props.startupPluginsLoaded, onNoteTitleChange, containerRef]);

	return <NewWindowOrIFrame
		onWindow={layout.onWindow}
		mode={newWindow ? WindowMode.NewWindow : WindowMode.Iframe}
		windowId={props.windowId}
		onClose={onWindowClose}
		title={windowTitle}
	>
		<LibraryStyleRoot>
			<WindowCommandsAndDialogs windowId={props.windowId} />
			<ResizableLayout
				layout={layout.layout}
				onResize={layout.onResize}
				onMoveButtonClick={() => {}}
				renderItem={onRenderItem}
				layoutKeyToLabel={layout.onKeyToLabel}
				moveMode={false}
				moveModeMessage={''}
			/>
		</LibraryStyleRoot>
		<StyleSheetContainer />
	</NewWindowOrIFrame>;
};

interface StyleProviderProps {
	children: React.ReactNode[]|React.ReactNode;
}

// Sets the root style container for libraries. At present, this is needed by react-select (which uses @emotion/...)
// and styled-components.
// See: https://github.com/JedWatson/react-select/issues/3680 and https://github.com/styled-components/styled-components/issues/659
const LibraryStyleRoot: React.FC<StyleProviderProps> = props => {
	const [dependencyStyleContainer, setDependencyStyleContainer] = useState<HTMLDivElement|null>(null);
	const cache = useMemo(() => {
		return createCache({
			key: 'new-window-cache',
			container: dependencyStyleContainer,
		});
	}, [dependencyStyleContainer]);

	return <>
		<div ref={setDependencyStyleContainer}></div>
		<StyleSheetManager target={dependencyStyleContainer}>
			<CacheProvider value={cache}>
				{props.children}
			</CacheProvider>
		</StyleSheetManager>
	</>;
};

interface ConnectProps {
	windowId: string;
}

export default connect((state: AppState, ownProps: ConnectProps) => {
	// May be undefined if the window hasn't opened
	const windowState = stateUtils.windowStateById(state, ownProps.windowId);

	return {
		themeId: state.settings.theme,
		isSafeMode: state.settings.isSafeMode,
		layout: windowState.windowLayout,
		codeView: windowState?.editorCodeView ?? state.settings['editor.codeView'],
		legacyMarkdown: state.settings['editor.legacyMarkdown'],
		startupPluginsLoaded: state.startupPluginsLoaded,
		plugins: state.pluginService.plugins,
	};
})(SecondaryWindow);
