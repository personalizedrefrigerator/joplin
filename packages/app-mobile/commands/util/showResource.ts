import Resource from '@joplin/lib/models/Resource';
import { ResourceEntity } from '@joplin/lib/services/database/types';
import Logger from '@joplin/utils/Logger';
import showFile from '../../utils/showFile';

const logger = Logger.create('showResource');

const showResource = async (item: ResourceEntity) => {
	const resourcePath = Resource.fullPath(item);
	logger.info(`Opening resource: ${resourcePath}`);

	await showFile(resourcePath);
};

export default showResource;
