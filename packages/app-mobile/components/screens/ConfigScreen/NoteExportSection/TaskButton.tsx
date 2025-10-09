import * as React from 'react';
import { Text } from 'react-native';
import { _ } from '@joplin/lib/locale';
import { ProgressBar } from 'react-native-paper';
import { FunctionComponent, useCallback, useContext, useState } from 'react';
import { ConfigScreenStyles } from '../configScreenStyles';
import SettingsButton from '../SettingsButton';
import Logger from '@joplin/utils/Logger';
import shim from '@joplin/lib/shim';
import { DialogContext, DialogControl } from '../../../DialogManager';

// Undefined = indeterminate progress
export type OnProgressCallback = (progressFraction: number|undefined)=> void;
export type AfterCompleteListener = (success: boolean)=> Promise<void>;
export type SetAfterCompleteListenerCallback = (listener: AfterCompleteListener)=> void;

const logger = Logger.create('TaskButton');

interface TaskResult {
	warnings: string[];
	success: boolean;
}

export enum TaskStatus {
	NotStarted,
	InProgress,
	Done,
}

export type OnRunTask = (
	setProgress: OnProgressCallback,
	setAfterCompleteListener: SetAfterCompleteListenerCallback,
	dialogs: DialogControl,
)=> Promise<TaskResult>;

interface Props {
	taskName: string;
	buttonLabel: (status: TaskStatus)=> string;
	finishedLabel: string;
	description?: string;
	styles: ConfigScreenStyles;
	onRunTask: OnRunTask;
}

const TaskButton: FunctionComponent<Props> = props => {
	const [taskStatus, setTaskStatus] = useState<TaskStatus>(TaskStatus.NotStarted);
	const [progress, setProgress] = useState<number|undefined>(0);
	const [warnings, setWarnings] = useState<string>('');

	const dialogs = useContext(DialogContext);

	const startTask = useCallback(async () => {
		// Don't run multiple task instances at the same time.
		if (taskStatus === TaskStatus.InProgress) {
			return;
		}

		logger.info(`Starting task: ${props.taskName}`);

		setTaskStatus(TaskStatus.InProgress);
		let completedSuccessfully = false;
		let afterCompleteListener: AfterCompleteListener = async () => {};

		try {
			// Initially, undetermined progress
			setProgress(undefined);

			const status = await props.onRunTask(setProgress, (afterComplete: AfterCompleteListener) => {
				afterCompleteListener = afterComplete;
			}, dialogs);

			setWarnings(status.warnings.join('\n'));
			if (status.success) {
				setTaskStatus(TaskStatus.Done);
				completedSuccessfully = true;
			}
		} catch (error) {
			logger.error(`Task ${props.taskName} failed`, error);
			await shim.showMessageBox(_('Task "%s" failed with error: %s', props.taskName, error.toString()), {
				title: _('Error'),
				buttons: [_('OK')],
			});
		} finally {
			if (!completedSuccessfully) {
				setTaskStatus(TaskStatus.NotStarted);
			}

			await afterCompleteListener(completedSuccessfully);
		}
	}, [props.onRunTask, props.taskName, taskStatus, dialogs]);

	let statusComponent = (
		<ProgressBar
			visible={taskStatus === TaskStatus.InProgress}
			indeterminate={progress === undefined}
			progress={progress}
		/>
	);
	if (taskStatus === TaskStatus.Done && warnings.length > 0) {
		statusComponent = (
			<Text style={props.styles.styleSheet.warningText}>
				{_('Completed with warnings:\n%s', warnings)}
			</Text>
		);
	}

	let buttonDescription = props.description;
	if (taskStatus === TaskStatus.Done) {
		buttonDescription = props.finishedLabel;
	}

	return (
		<SettingsButton
			title={props.buttonLabel(taskStatus)}
			disabled={taskStatus === TaskStatus.InProgress}
			description={buttonDescription}
			statusComponent={statusComponent}
			clickHandler={startTask}
			styles={props.styles}
		/>
	);
};

export default TaskButton;
