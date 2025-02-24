import { setupDatabase } from '@joplin/lib/testing/test-utils';
import whisper from './whisper';
import { dirname, join } from 'path';
import { exists, mkdir, writeFile } from 'fs-extra';

describe('whisper', () => {
	beforeEach(async () => {
		await setupDatabase(0);
	});

	test('should remove legacy models when deleting cached models', async () => {
		const whisperDirectory = dirname(whisper.modelLocalFilepath('en'));
		const legacyModelPath = join(whisperDirectory, 'whisper_tiny.onnx');
		await mkdir(whisperDirectory);
		await writeFile(legacyModelPath, 'test', 'utf-8');

		await whisper.deleteCachedModels('en');

		expect(await exists(legacyModelPath)).toBe(false);
	});
});
