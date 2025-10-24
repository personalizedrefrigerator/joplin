import CommandService, { CommandRuntime, CommandDeclaration, CommandContext } from '@joplin/lib/services/CommandService';
import InteropService from '@joplin/lib/services/interop/InteropService';
import { FileSystemItem, ImportModuleOutputFormat, ModuleType } from '@joplin/lib/services/interop/types';
import bridge from '../../../services/bridge';
import { WindowControl } from '../utils/useWindowControl';
import showFolderPicker from '../utils/showFolderPicker';
import { _ } from '@joplin/lib/locale';
import makeDiscourseDebugUrl from '@joplin/lib/makeDiscourseDebugUrl';
import PluginService from '@joplin/lib/services/plugins/PluginService';
import Setting from '@joplin/lib/models/Setting';
import { PackageInfo } from '@joplin/lib/versionInfo';
import { fileExtension } from '@joplin/utils/path';
import shim from '@joplin/lib/shim';
import { ImportModule } from '@joplin/lib/services/interop/Module';
const packageInfo: PackageInfo = require('../../../packageInfo.js');

export const declaration: CommandDeclaration = {
	name: 'importFrom',
	label: () => _('Import...'),
};

export interface ImportCommandOptions {
	sourcePath?: string;
	sourceType?: FileSystemItem;
	destinationFolderId?: string;
	importFormat?: string;
	outputFormat?: ImportModuleOutputFormat;
}

type AllCommandOptions = Required<ImportCommandOptions>;

const findImportModule = async (partialOptions: ImportCommandOptions, control: WindowControl) => {
	if (partialOptions.importFormat) {
		const module = InteropService.instance().findModuleByFormat(
			ModuleType.Importer, partialOptions.importFormat, partialOptions.sourceType, partialOptions.outputFormat);
		if (module) {
			return module as ImportModule;
		}
	}

	if (partialOptions.sourcePath) {
		const extension = fileExtension(partialOptions.sourcePath);
		const candidateModule = InteropService.instance().moduleByFileExtension(ModuleType.Importer, extension) as ImportModule;
		if (candidateModule) {
			return candidateModule;
		}
	}

	const importModules = InteropService.instance().modules().filter(module => module.type === ModuleType.Importer) as ImportModule[];
	return await control.showPrompt({
		label: _('Select the type of file to be imported:'),
		value: '',
		suggestions: importModules.map(module => {
			const label = module.fullLabel();
			return {
				key: `${module.type}--${label}`,
				value: module,
				label: module.fullLabel(),
			};
		}),
	});
};

const promptForSourcePath = async (module: ImportModule, sourceType: FileSystemItem|undefined) => {
	if (!sourceType) {
		if (!module.sources.includes(FileSystemItem.Directory)) {
			sourceType = FileSystemItem.File;
		}
		if (!module.sources.includes(FileSystemItem.File)) {
			sourceType = FileSystemItem.Directory;
		}
	}
	if (sourceType === FileSystemItem.File) {
		return await bridge().showOpenDialog({
			filters: [{ name: module.description, extensions: module.fileExtensions }],
		});
	} else if (sourceType === FileSystemItem.Directory) {
		return await bridge().showOpenDialog({
			properties: ['openDirectory', 'createDirectory'],
		});
	} else {
		return await bridge().showOpenDialog({
			properties: ['openDirectory', 'openFile'],
		});
	}
};

export const runtime = (control: WindowControl): CommandRuntime => {
	return {
		// Since this can be run from "go to anything", partialOptions needs to support being null or empty.
		execute: async (context: CommandContext, partialOptions: ImportCommandOptions = {}) => {
			const askUserForOptions = async (): Promise<AllCommandOptions|null> => {
				const importModule = await findImportModule(partialOptions, control);
				if (!importModule) return null;

				let sourcePath = partialOptions.sourcePath ?? await promptForSourcePath(importModule, partialOptions.sourceType);
				if (Array.isArray(sourcePath)) {
					sourcePath = sourcePath[0];
				}
				const destinationFolderId = 'destinationFolderId' in partialOptions ? (
					partialOptions.destinationFolderId
				) : await showFolderPicker(control, {
					allowSelectNone: true,
					excludeIds: new Set(),
				});
				const importFormat = importModule.format;
				const outputFormat = importModule.outputFormat;
				return {
					sourcePath,
					destinationFolderId,
					importFormat,
					outputFormat,
					sourceType: await shim.fsDriver().isDirectory(sourcePath) ? FileSystemItem.Directory : FileSystemItem.File,
				};
			};

			const options = await askUserForOptions();
			if (!options) return null; // Cancelled

			const modalMessage = _('Importing from "%s" as "%s" format. Please wait...', options.sourcePath, options.importFormat);
			void CommandService.instance().execute('showModalMessage', modalMessage);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
			const errors: any[] = [];

			const importOptions = {
				path: options.sourcePath,
				format: options.importFormat,
				outputFormat: options.outputFormat,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
				onProgress: (status: any) => {
					const statusStrings: string[] = Object.keys(status).map((key: string) => {
						return `${key}: ${status[key]}`;
					});

					void CommandService.instance().execute('showModalMessage', `${modalMessage}\n\n${statusStrings.join('\n')}`);
				},
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
				onError: (error: any) => {
					errors.push(error);
					console.warn(error);
				},
				destinationFolderId: options.destinationFolderId,
			};

			const service = InteropService.instance();
			try {
				const result = await service.import(importOptions);
				// eslint-disable-next-line no-console
				console.info('Import result: ', result);
			} catch (error) {
				bridge().showErrorMessageBox(error.message);
			}

			void CommandService.instance().execute('hideModalMessage');

			if (errors.length) {
				const response = bridge().showErrorMessageBox('There were some errors importing the notes - check the console for more details.\n\nPlease consider sending a bug report to the forum!', {
					buttons: [_('Close'), _('Send bug report')],
				});

				context.dispatch({ type: 'NOTE_DEVTOOLS_SET', value: true });

				if (response === 1) {
					const url = makeDiscourseDebugUrl(
						`Error importing notes from format: ${options.importFormat}`,
						`- Input format: ${options.importFormat}\n- Output format: ${options.outputFormat}`,
						errors,
						packageInfo,
						PluginService.instance(),
						Setting.value('plugins.states'),
					);

					void bridge().openExternal(url);
				}
			}
		},
		enabledCondition: '',
	};
};
