import { attributesHtml } from './htmlUtils';
import { ItemIdToUrlHandler, OptionsResourceModel, ResourceInfo, ResourceInfos } from './types';

const Entities = require('html-entities').AllHtmlEntities;
const htmlentities = new Entities().encode;

// Imported from models/Resource.js
const FetchStatuses = {
	FETCH_STATUS_IDLE: 0,
	FETCH_STATUS_STARTED: 1,
	FETCH_STATUS_DONE: 2,
	FETCH_STATUS_ERROR: 3,
};

export const getAttr = function(attrs: string[], name: string, defaultValue: string = null) {
	for (let i = 0; i < attrs.length; i++) {
		if (attrs[i][0] === name) return attrs[i].length > 1 ? attrs[i][1] : null;
	}
	return defaultValue;
};

export const notDownloadedResource = function() {
	return `
		<svg width="1700" height="1536" xmlns="http://www.w3.org/2000/svg">
		    <path d="M1280 1344c0-35-29-64-64-64s-64 29-64 64 29 64 64 64 64-29 64-64zm256 0c0-35-29-64-64-64s-64 29-64 64 29 64 64 64 64-29 64-64zm128-224v320c0 53-43 96-96 96H96c-53 0-96-43-96-96v-320c0-53 43-96 96-96h465l135 136c37 36 85 56 136 56s99-20 136-56l136-136h464c53 0 96 43 96 96zm-325-569c10 24 5 52-14 70l-448 448c-12 13-29 19-45 19s-33-6-45-19L339 621c-19-18-24-46-14-70 10-23 33-39 59-39h256V64c0-35 29-64 64-64h256c35 0 64 29 64 64v448h256c26 0 49 16 59 39z"/>
		</svg>
	`;
};

export const notDownloadedImage = function() {
	// https://github.com/ForkAwesome/Fork-Awesome/blob/master/src/icons/svg/file-image-o.svg
	// Height changed to 1795
	return `
		<svg width="1925" height="1792" xmlns="http://www.w3.org/2000/svg">
		    <path d="M640 576c0 106-86 192-192 192s-192-86-192-192 86-192 192-192 192 86 192 192zm1024 384v448H256v-192l320-320 160 160 512-512zm96-704H160c-17 0-32 15-32 32v1216c0 17 15 32 32 32h1600c17 0 32-15 32-32V288c0-17-15-32-32-32zm160 32v1216c0 88-72 160-160 160H160c-88 0-160-72-160-160V288c0-88 72-160 160-160h1600c88 0 160 72 160 160z"/>
		</svg>
	`;
};

export const notDownloadedFile = function() {
	// https://github.com/ForkAwesome/Fork-Awesome/blob/master/src/icons/svg/file-o.svg
	return `
		<svg width="1925" height="1792" xmlns="http://www.w3.org/2000/svg">
		    <path d="M1468 380c37 37 68 111 68 164v1152c0 53-43 96-96 96H96c-53 0-96-43-96-96V96C0 43 43 0 96 0h896c53 0 127 31 164 68zm-444-244v376h376c-6-17-15-34-22-41l-313-313c-7-7-24-16-41-22zm384 1528V640H992c-53 0-96-43-96-96V128H128v1536h1280z"/>
		</svg>
	`;
};

export const errorImage = function() {
	// https://github.com/ForkAwesome/Fork-Awesome/blob/master/src/icons/svg/times-circle.svg
	return `
		<svg width="1795" height="1795" xmlns="http://www.w3.org/2000/svg">
		    <path d="M1149 1122c0-17-7-33-19-45L949 896l181-181c12-12 19-28 19-45s-7-34-19-46l-90-90c-12-12-29-19-46-19s-33 7-45 19L768 715 587 534c-12-12-28-19-45-19s-34 7-46 19l-90 90c-12 12-19 29-19 46s7 33 19 45l181 181-181 181c-12 12-19 28-19 45s7 34 19 46l90 90c12 12 29 19 46 19s33-7 45-19l181-181 181 181c12 12 28 19 45 19s34-7 46-19l90-90c12-12 19-29 19-46zm387-226c0 424-344 768-768 768S0 1320 0 896s344-768 768-768 768 344 768 768z"/>
		</svg>
	`;
};

export const loaderImage = function() {
	// https://github.com/ForkAwesome/Fork-Awesome/blob/master/src/icons/svg/hourglass-half.svg
	return `
		<svg width="1536" height="1790" xmlns="http://www.w3.org/2000/svg">
    		<path d="M1408 128c0 370-177 638-373 768 196 130 373 398 373 768h96c18 0 32 14 32 32v64c0 18-14 32-32 32H32c-18 0-32-14-32-32v-64c0-18 14-32 32-32h96c0-370 177-638 373-768-196-130-373-398-373-768H32c-18 0-32-14-32-32V32C0 14 14 0 32 0h1472c18 0 32 14 32 32v64c0 18-14 32-32 32h-96zm-128 0H256c0 146 33 275 85 384h854c52-109 85-238 85-384zm-57 1216c-74-193-207-330-340-384H653c-133 54-266 191-340 384h910z"/>
		</svg>
	`;
};

export const resourceStatusImage = function(status: string) {
	if (status === 'notDownloaded') return notDownloadedResource();
	return resourceStatusFile(status);
};

export const resourceStatusFile = function(status: string) {
	if (status === 'notDownloaded') return notDownloadedResource();
	if (status === 'downloading') return loaderImage();
	if (status === 'encrypted') return loaderImage();
	if (status === 'error') return errorImage();

	throw new Error(`Unknown status: ${status}`);
};

export const resourceStatusIndex = function(status: string) {
	if (status === 'error') return -1;
	if (status === 'notDownloaded') return 0;
	if (status === 'downloading') return 1;
	if (status === 'encrypted') return 2;
	if (status === 'ready') return 10;

	throw new Error(`Unknown status: ${status}`);
};

export const resourceStatusName = function(index: number) {
	if (index === -1) return 'error';
	if (index === 0) return 'notDownloaded';
	if (index === 1) return 'downloading';
	if (index === 2) return 'encrypted';
	if (index === 10) return 'ready';

	throw new Error(`Unknown index: ${index}`);
};

export const resourceStatus = function(ResourceModel: OptionsResourceModel, resourceInfo: ResourceInfo) {
	if (!ResourceModel) return 'ready';

	let status = 'ready';

	if (resourceInfo) {
		const resource = resourceInfo.item;
		const localState = resourceInfo.localState;

		if (localState.fetch_status === FetchStatuses.FETCH_STATUS_IDLE) {
			status = 'notDownloaded';
		} else if (localState.fetch_status === FetchStatuses.FETCH_STATUS_STARTED) {
			status = 'downloading';
		} else if (localState.fetch_status === FetchStatuses.FETCH_STATUS_DONE) {
			if (resource.encryption_blob_encrypted || resource.encryption_applied) {
				status = 'encrypted';
			}
		}
	} else {
		status = 'notDownloaded';
	}

	return status;
};

type ImageMarkupData = {
	src: string;
	alt: string;
	title: string;
}|{ src: string; before: string; after: string };

export const imageReplacement = function(ResourceModel: OptionsResourceModel, markup: ImageMarkupData, resources: ResourceInfos, resourceBaseUrl: string, itemIdToUrl: ItemIdToUrlHandler = null) {
	if (!ResourceModel || !resources) return null;

	const src = markup.src;
	if (!ResourceModel.isResourceUrl(src)) return null;

	const resourceId = ResourceModel.urlToId(src);
	const result = resources[resourceId];
	const resource = result ? result.item : null;
	const status = resourceStatus(ResourceModel, result);

	if (status !== 'ready') {
		const icon = resourceStatusImage(status);

		// Preserve information necessary to restore the original markup when converting
		// from HTML to markdown.
		const attrs: Record<string, string> = {
			class: `not-loaded-resource not-loaded-image-resource resource-status-${status}`,
			['data-resource-id']: resourceId,
		};
		if ('alt' in markup) {
			attrs['data-original-alt'] = markup.alt;
			attrs['data-original-title'] = markup.title;
		} else {
			attrs['data-original-before'] = markup.before;
			attrs['data-original-after'] = markup.after;
		}

		// contenteditable="false": Improves support for the Rich Text Editor -- without this,
		// users can add content within the <span>, which breaks the html-to-md conversion.
		//
		// Use a <span> and not a <div> to allow the placeholder to appear in <p> elements.
		return (
			`<span ${attributesHtml(attrs)} contenteditable="false">`
				+ `<img src="data:image/svg+xml;utf8,${htmlentities(icon)}"/>`
			+ '</span>'
		);
	}
	const mime = resource.mime ? resource.mime.toLowerCase() : '';
	if (ResourceModel.isSupportedImageMimeType(mime)) {
		let newSrc = '';

		const timestampParameter = `?t=${resource.updated_time}`;
		const idToUrlResult = itemIdToUrl?.(resource.id, timestampParameter) ?? null;
		if (idToUrlResult !== null) {
			newSrc = idToUrlResult;
		} else {
			const temp = [];

			if (resourceBaseUrl) {
				temp.push(resourceBaseUrl);
			} else {
				temp.push('./');
			}

			temp.push(ResourceModel.filename(resource));
			temp.push(timestampParameter);

			newSrc = temp.join('');
		}

		// let newSrc = `./${ResourceModel.filename(resource)}`;
		// newSrc += `?t=${resource.updated_time}`;
		return {
			'data-resource-id': resource.id,
			src: newSrc,
		};
	}

	return null;
};

// Used in mobile app when enableLongPress = true. Tells for how long
// the resource should be pressed before the menu is shown.
export const longPressDelay = 500;
