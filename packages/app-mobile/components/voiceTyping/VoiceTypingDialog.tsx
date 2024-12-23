import * as React from 'react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Icon, ActivityIndicator, Text, Surface, Button } from 'react-native-paper';
import { _, languageName } from '@joplin/lib/locale';
import useAsyncEffect, { AsyncEffectEvent } from '@joplin/lib/hooks/useAsyncEffect';
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon';
import VoiceTyping, { OnTextCallback, VoiceTypingSession } from '../../services/voiceTyping/VoiceTyping';
import whisper from '../../services/voiceTyping/whisper';
import vosk from '../../services/voiceTyping/vosk';
import { AppState } from '../../utils/types';
import { connect } from 'react-redux';
import { View, StyleSheet } from 'react-native';
import AccessibleView from '../accessibility/AccessibleView';
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('VoiceTypingDialog');

interface Props {
	locale: string;
	provider: string;
	onDismiss: ()=> void;
	onText: (text: string)=> void;
}

enum RecorderState {
	Loading = 1,
	Recording = 2,
	Processing = 3,
	Error = 4,
	Downloading = 5,
}

interface UseVoiceTypingProps {
	locale: string;
	provider: string;
	onSetPreview: OnTextCallback;
	onText: OnTextCallback;
}

const useVoiceTyping = ({ locale, provider, onSetPreview, onText }: UseVoiceTypingProps) => {
	const [voiceTyping, setVoiceTyping] = useState<VoiceTypingSession>(null);
	const [error, setError] = useState<Error>(null);
	const [mustDownloadModel, setMustDownloadModel] = useState<boolean | null>(null);
	const [modelIsOutdated, setModelIsOutdated] = useState(false);

	const onTextRef = useRef(onText);
	onTextRef.current = onText;
	const onSetPreviewRef = useRef(onSetPreview);
	onSetPreviewRef.current = onSetPreview;

	const voiceTypingRef = useRef(voiceTyping);
	voiceTypingRef.current = voiceTyping;

	const builder = useMemo(() => {
		return new VoiceTyping(locale, provider?.startsWith('whisper') ? [whisper] : [vosk]);
	}, [locale, provider]);

	const [redownloadCounter, setRedownloadCounter] = useState(0);

	useEffect(() => {
		if (modelIsOutdated) {
			logger.info('The downloaded version of the model is from an outdated URL.');
		}
	}, [modelIsOutdated]);

	useAsyncEffect(async (event: AsyncEffectEvent) => {
		try {
			await voiceTypingRef.current?.stop();
			onSetPreviewRef.current?.('');

			setModelIsOutdated(await builder.isDownloadedFromOutdatedUrl());

			if (!await builder.isDownloaded()) {
				if (event.cancelled) return;
				await builder.download();
			}
			if (event.cancelled) return;

			const voiceTyping = await builder.build({
				onPreview: (text) => onSetPreviewRef.current(text),
				onFinalize: (text) => onTextRef.current(text),
			});
			if (event.cancelled) return;
			setVoiceTyping(voiceTyping);
		} catch (error) {
			setError(error);
		} finally {
			setMustDownloadModel(false);
		}
	}, [builder, redownloadCounter]);

	useAsyncEffect(async (_event: AsyncEffectEvent) => {
		setMustDownloadModel(!(await builder.isDownloaded()));
	}, [builder]);

	useEffect(() => () => {
		void voiceTypingRef.current?.stop();
	}, []);

	const onRequestRedownload = useCallback(async () => {
		await voiceTypingRef.current?.stop();
		await builder.clearDownloads();
		setMustDownloadModel(true);
		setRedownloadCounter(value => value + 1);
	}, [builder]);

	return {
		error, mustDownloadModel, voiceTyping, onRequestRedownload, modelIsOutdated,
	};
};

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 1,
		width: '100%',
		maxWidth: 680,
		alignSelf: 'center',
	},
	contentWrapper: {
		flexDirection: 'row',
	},
	iconWrapper: {
		margin: 8,
		marginTop: 16,
	},
	content: {
		marginTop: 16,
		marginHorizontal: 8,
	},
	actionContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
});

const VoiceTypingDialog: React.FC<Props> = props => {
	const [recorderState, setRecorderState] = useState<RecorderState>(RecorderState.Loading);
	const [preview, setPreview] = useState<string>('');
	const {
		error: modelError,
		mustDownloadModel,
		voiceTyping,
		onRequestRedownload,
		modelIsOutdated,
	} = useVoiceTyping({
		locale: props.locale,
		onSetPreview: setPreview,
		onText: props.onText,
		provider: props.provider,
	});

	useEffect(() => {
		if (modelError) {
			setRecorderState(RecorderState.Error);
		} else if (voiceTyping) {
			setRecorderState(RecorderState.Recording);
		}
	}, [voiceTyping, modelError]);

	useEffect(() => {
		if (mustDownloadModel) {
			setRecorderState(RecorderState.Downloading);
		}
	}, [mustDownloadModel]);

	useEffect(() => {
		if (recorderState === RecorderState.Recording) {
			void voiceTyping.start();
		}
	}, [recorderState, voiceTyping, props.onText]);

	const onDismiss = useCallback(() => {
		void voiceTyping?.stop();
		props.onDismiss();
	}, [voiceTyping, props.onDismiss]);

	const renderContent = () => {
		const components: Record<RecorderState, ()=> string> = {
			[RecorderState.Loading]: () => _('Loading...'),
			[RecorderState.Recording]: () => _('Please record your voice...'),
			[RecorderState.Processing]: () => _('Converting speech to text...'),
			[RecorderState.Downloading]: () => _('Downloading %s language files...', languageName(props.locale)),
			[RecorderState.Error]: () => _('Error: %s', modelError.message),
		};

		return components[recorderState]();
	};

	const renderIcon = () => {
		const components: Record<RecorderState, IconSource> = {
			[RecorderState.Loading]: ({ size }: { size: number }) => <ActivityIndicator animating={true} style={{ width: size, height: size }} />,
			[RecorderState.Recording]: 'microphone',
			[RecorderState.Processing]: 'microphone',
			[RecorderState.Downloading]: ({ size }: { size: number }) => <ActivityIndicator animating={true} style={{ width: size, height: size }} />,
			[RecorderState.Error]: 'alert-circle-outline',
		};

		return components[recorderState];
	};

	const renderPreview = () => {
		return <Text variant='labelSmall'>{preview}</Text>;
	};

	const reDownloadButton = <Button onPress={onRequestRedownload}>
		{modelIsOutdated ? _('Download updated model') : _('Re-download model')}
	</Button>;
	const allowReDownload = recorderState === RecorderState.Error || modelIsOutdated;

	return (
		<Surface>
			<View style={styles.container}>
				<View style={styles.contentWrapper}>
					<View style={styles.iconWrapper}>
						<Icon source={renderIcon()} size={40}/>
					</View>
					<View style={styles.content}>
						<AccessibleView
							// Auto-focus
							refocusCounter={1}
							aria-live='polite'
							role='heading'
						>
							<Text variant='bodyMedium'>
								{_('Voice typing...')}
							</Text>
						</AccessibleView>
						<Text
							variant='bodyMedium'
							// role="status" might fit better here. However, react-native
							// doesn't seem to support it.
							role='alert'
							// Although on web, role=alert should imply aria-live=polite,
							// this does not seem to be the case for React Native:
							accessibilityLiveRegion='polite'
						>{renderContent()}</Text>
						{renderPreview()}
					</View>
				</View>
				<View style={styles.actionContainer}>
					{allowReDownload ? reDownloadButton : null}
					<Button
						onPress={onDismiss}
						accessibilityHint={_('Ends voice typing')}
					>{_('Done')}</Button>
				</View>
			</View>
		</Surface>
	);
};

export default connect((state: AppState) => ({
	provider: state.settings['voiceTyping.preferredProvider'],
}))(VoiceTypingDialog);
