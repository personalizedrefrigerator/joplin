import { CommandRuntime, CommandDeclaration } from '@joplin/lib/services/CommandService';
import { _ } from '@joplin/lib/locale';
import shim from '@joplin/lib/shim';
import Resource, { resourceOcrStatusToString } from '@joplin/lib/models/Resource';
import { ResourceOcrStatus } from '@joplin/lib/services/database/types';
import Setting from '@joplin/lib/models/Setting';
import bridge from '../services/bridge';
import { openFileWithExternalEditor } from '@joplin/lib/services/ExternalEditWatcher/utils';

export const declaration: CommandDeclaration = {
	name: 'viewOcrText',
	label: () => 'View the OCR text associated with a resource',
};

export const runtime = (): CommandRuntime => {
	return {
		execute: async (_context: unknown, resourceId: string) => {
			if (!resourceId) {
				throw new Error('Missing resource ID');
			}

			const resource = await Resource.load(resourceId);
			if (resource.ocr_status === ResourceOcrStatus.Done) {
				const tempFilePath = `${Setting.value('tempDir')}/${resource.id}_ocr.txt`;
				await shim.fsDriver().writeFile(tempFilePath, resource.ocr_text, 'utf8');
				await openFileWithExternalEditor(tempFilePath, bridge());
			} else {
				bridge().showInfoMessageBox(_('This attachment does not have OCR data (Status: %s)', resourceOcrStatusToString(resource.ocr_status)));
			}
		},
	};
};
