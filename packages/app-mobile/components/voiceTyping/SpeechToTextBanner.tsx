import * as React from 'react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Text, Button } from 'react-native-paper';
import { _, languageName } from '@joplin/lib/locale';
import useAsyncEffect, { AsyncEffectEvent } from '@joplin/lib/hooks/useAsyncEffect';
import { AppState } from '../../utils/types';
import { connect } from 'react-redux';
import Logger from '@joplin/utils/Logger';
import { RecorderState } from './types';
import RecordingControls from './RecordingControls';
import { PrimaryButton } from '../buttons';
import useQueuedAsyncEffect from '@joplin/lib/hooks/useQueuedAsyncEffect';
import { AudioDataSourceType, OnTextCallback, SpeechToTextSession } from '@joplin/lib/services/speechToText/types';
import SpeechToTextService from '@joplin/lib/services/speechToText/SpeechToTextService';
import shim from '@joplin/lib/shim';

const logger = Logger.create('VoiceTypingDialog');

interface Props {
	locale: string;
	provider: string;
	onDismiss: ()=> void;
	onText: (text: string)=> void;
}

interface UseVoiceTypingProps {
	locale: string;
	providerSetting: string;
	onSetPreview: OnTextCallback;
	onText: OnTextCallback;
}

const useVoiceTyping = ({ locale, providerSetting, onSetPreview, onText }: UseVoiceTypingProps) => {
	const [voiceTyping, setVoiceTyping] = useState<SpeechToTextSession>(null);
	const [error, setError] = useState<Error|null>(null);
	const [mustDownloadModel, setMustDownloadModel] = useState<boolean | null>(null);
	const [modelIsOutdated, setModelIsOutdated] = useState(false);

	const onTextRef = useRef(onText);
	onTextRef.current = onText;
	const onSetPreviewRef = useRef(onSetPreview);
	onSetPreviewRef.current = onSetPreview;

	const voiceTypingRef = useRef(voiceTyping);
	voiceTypingRef.current = voiceTyping;

	const provider = useMemo(() => {
		return SpeechToTextService.instance().getProvider(providerSetting);
	}, [providerSetting]);
	const downloadManager = useMemo(() => {
		return provider.getDownloadManager(locale);
	}, [provider, locale]);

	const [redownloadCounter, setRedownloadCounter] = useState(0);

	useEffect(() => {
		if (modelIsOutdated) {
			logger.info('The downloaded version of the model is from an outdated URL.');
		}
	}, [modelIsOutdated]);

	useQueuedAsyncEffect(async (event: AsyncEffectEvent) => {
		try {
			// Reset the error: If starting voice typing again resolves the error, the error
			// should be hidden (and voice typing should start).
			setError(null);

			await voiceTypingRef.current?.stop();
			onSetPreviewRef.current?.('');

			setModelIsOutdated(await downloadManager.canUpdateModel());

			if (!await downloadManager.isDownloaded()) {
				if (event.cancelled) return;
				await downloadManager.download();
			}
			if (event.cancelled) return;

			const voiceTyping = await provider.start({
				locale,
				callbacks: {
					onPreview: (text) => onSetPreviewRef.current(text),
					onFinalize: (text) => onTextRef.current(text),
				},
				dataSource: { kind: AudioDataSourceType.Microphone },
			});
			if (event.cancelled) return;
			setVoiceTyping(voiceTyping);
		} catch (error) {
			setError(error);
		} finally {
			setMustDownloadModel(false);
		}
	}, [downloadManager, redownloadCounter]);

	useAsyncEffect(async (event: AsyncEffectEvent) => {
		const downloaded = await downloadManager.isDownloaded();
		if (event.cancelled) return;
		setMustDownloadModel(!downloaded);
	}, [downloadManager]);

	useEffect(() => () => {
		void voiceTypingRef.current?.stop();
	}, []);

	const onRequestRedownload = useCallback(async () => {
		await voiceTypingRef.current?.stop();
		const result = await shim.showConfirmationDialog('This will delete the current model and re-download it. Continue?');
		if (result) {
			await downloadManager.clearCache();
			setMustDownloadModel(true);
			setRedownloadCounter(value => value + 1);
		}
	}, [downloadManager]);

	return {
		error, mustDownloadModel, voiceTyping, onRequestRedownload, modelIsOutdated,
	};
};

const SpeechToTextComponent: React.FC<Props> = props => {
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
		providerSetting: props.provider,
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

	const onDismiss = useCallback(() => {
		void voiceTyping?.stop();
		props.onDismiss();
	}, [voiceTyping, props.onDismiss]);

	const renderContent = () => {
		const components: Record<RecorderState, ()=> string> = {
			[RecorderState.Loading]: () => _('Loading...'),
			[RecorderState.Idle]: () => 'Waiting...', // Not used for now
			[RecorderState.Recording]: () => _('Please record your voice...'),
			[RecorderState.Processing]: () => _('Converting speech to text...'),
			[RecorderState.Downloading]: () => _('Downloading %s language files...', languageName(props.locale)),
			[RecorderState.Error]: () => _('Error: %s', modelError?.message),
		};

		return components[recorderState]();
	};

	const renderPreview = () => {
		return <Text variant='labelSmall'>{preview}</Text>;
	};

	const reDownloadButton = <Button onPress={onRequestRedownload}>
		{modelIsOutdated ? _('Download updated model') : _('Re-download model')}
	</Button>;
	const allowReDownload = recorderState === RecorderState.Error || modelIsOutdated;

	const actions = <>
		{allowReDownload ? reDownloadButton : null}
		<PrimaryButton
			onPress={onDismiss}
			accessibilityHint={_('Ends voice typing')}
		>{_('Done')}</PrimaryButton>
	</>;

	return <RecordingControls
		recorderState={recorderState}
		heading={_('Voice typing...')}
		content={renderContent()}
		preview={renderPreview()}
		actions={actions}
	/>;
};

export default connect((state: AppState) => ({
	provider: state.settings['voiceTyping.preferredProvider'],
}))(SpeechToTextComponent);
