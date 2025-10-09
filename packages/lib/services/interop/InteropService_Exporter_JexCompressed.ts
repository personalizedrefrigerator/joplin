import InteropService_Exporter_Base from './InteropService_Exporter_Base';
import InteropService_Exporter_Raw from './InteropService_Exporter_Raw';
import shim from '../../shim';
import { BaseItemEntity, ResourceEntity } from '../database/types';

export default class InteropService_Exporter_JexCompressed extends InteropService_Exporter_Base {

	private tempDir_: string;
	private destPath_: string;
	private rawExporter_: InteropService_Exporter_Raw;

	public async init(destPath: string) {
		if (await shim.fsDriver().isDirectory(destPath)) throw new Error(`Path is a directory: ${destPath}`);

		this.tempDir_ = await this.temporaryDirectory_(true);
		this.destPath_ = destPath;
		this.rawExporter_ = new InteropService_Exporter_Raw();
		await this.rawExporter_.init(this.tempDir_);
	}

	public async processItem(itemType: number, item: BaseItemEntity) {
		return this.rawExporter_.processItem(itemType, item);
	}

	public async processResource(resource: ResourceEntity, filePath: string) {
		return this.rawExporter_.processResource(resource, filePath);
	}

	public async close() {
		await this.rawExporter_.close();

		await shim.fsDriver().zipCreate({
			inputDirectory: this.tempDir_,
			output: this.destPath_,
			password: undefined,
		});

		await shim.fsDriver().remove(this.tempDir_);
	}
}
