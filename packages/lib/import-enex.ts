import uuid from './uuid';
import Note from './models/Note';
import Tag from './models/Tag';
import Resource from './models/Resource';
import Setting from './models/Setting';
import shim from './shim';
import { NoteEntity, ResourceEntity } from './services/database/types';
import { enexXmlToMd } from './import-enex-md-gen';
import { MarkupToHtml } from '@joplin/renderer';
import { fileExtension, friendlySafeFilename, safeFileExtension } from './path-utils';
import { extractUrls as extractUrlsFromHtml } from '@joplin/utils/html';
import { extractUrls as extractUrlsFromMarkdown } from '@joplin/utils/markdown';
const moment = require('moment');
const { wrapError } = require('./errorUtils');
const { enexXmlToHtml } = require('./import-enex-html-gen.js');
const md5 = require('md5');
const { Base64Decode } = require('base64-stream');
import * as mime from './mime-utils';
import type * as FsExtra from 'fs-extra';

let fs_: typeof FsExtra = null;
const fs = () => {
	fs_ ??= shim.requireDynamic('fs-extra');
	return fs_;
};

function dateToTimestamp(s: string, defaultValue: number = null): number {
	// Most dates seem to be in this format
	let m = moment(s, 'YYYYMMDDTHHmmssZ');

	// But sometimes they might be in this format eg. 20180306T91108 AMZ
	// https://github.com/laurent22/joplin/issues/557
	if (!m.isValid()) m = moment(s, 'YYYYMMDDThmmss AZ');

	if (!m.isValid()) {
		if (defaultValue !== null) return defaultValue;
		throw new Error(`Invalid date: ${s}`);
	}

	return m.toDate().getTime();
}

function extractRecognitionObjId(recognitionXml: string) {
	const r = recognitionXml.match(/objID="(.*?)"/);
	return r && r.length >= 2 ? r[1] : null;
}

async function decodeBase64File(sourceFilePath: string, destFilePath: string) {
	// When something goes wrong with streams you can get an error "EBADF, Bad file descriptor"
	// with no strack trace to tell where the error happened.

	// Also note that this code is not great because there's a source and a destination stream
	// and while one stream might end, the other might throw an error or vice-versa. However
	// we can only throw one error from a promise. So before one stream
	// could end with resolve(), then another stream would get an error and call reject(), which
	// would be ignored. I don't think it's happening anymore, but something to keep in mind
	// anyway.

	return new Promise((resolve, reject) => {
		// Note: we manually handle closing the file so that we can
		// force flusing it before close. This is needed because
		// "end" might be called before the file has been flushed
		// to disk, thus resulting in the calling code to find a
		// file with size 0.

		const destFile = fs().openSync(destFilePath, 'w');
		const sourceStream = fs().createReadStream(sourceFilePath);
		const destStream = fs().createWriteStream(destFilePath, {
			fd: destFile,
			autoClose: false,
		});
		sourceStream.pipe(new Base64Decode()).pipe(destStream);

		// We wait for the destination stream "finish" event, not the source stream "end" event
		// because even if the source has finished sending data, the destination might not have
		// finished receiving it and writing it to disk.
		destStream.on('finish', () => {
			fs().fdatasyncSync(destFile);
			fs().closeSync(destFile);
			resolve(null);
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		sourceStream.on('error', (error: any) => reject(error));
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		destStream.on('error', (error: any) => reject(error));
	});
}

function removeUndefinedProperties(note: NoteEntity) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	const output: any = {};
	for (const n in note) {
		if (!note.hasOwnProperty(n)) continue;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		const v = (note as any)[n];
		if (v === undefined || v === null) continue;
		output[n] = v;
	}
	return output;
}

interface ExtractedResource {
	hasData?: boolean;
	id?: string;
	size?: number;
	dataFilePath?: string;
	dataEncoding?: string;
	data?: string;
	filename?: string;
	sourceUrl?: string;
	mime?: string;
	title?: string;
}

interface ExtractedTask {
	title: string;
	completed: boolean;
	groupId: string;
}

interface ExtractedNote extends NoteEntity {
	resources?: ExtractedResource[];
	tasks: ExtractedTask[];
	tags?: string[];
	title?: string;
	bodyXml?: string;
}

// Those are the notes that have been parsed and saved to Joplin. We don't keep
// in memory the whole `ExtractedNote` because it contains resource data, etc.
// We only keep what is needed to restore the note links.
interface SavedNote {
	id: string;
	body: string;
}

// At this point we have the resource as it's been parsed from the XML, but
// additional processing needs to be done to get the final resource file, its
// size, MD5, etc.
async function processNoteResource(resource: ExtractedResource) {
	const handleNoDataResource = async (resource: ExtractedResource, setId: boolean) => {
		if (setId) resource.id = md5(Date.now() + Math.random());
		resource.size = 0;
		resource.dataFilePath = `${Setting.value('tempDir')}/${resource.id}.empty`;
		await shim.fsDriver().writeFile(resource.dataFilePath, '');
	};

	if (!resource.hasData) {
		// Some resources have no data, go figure, so we need a special case for this.
		await handleNoDataResource(resource, true);
	} else {
		if (resource.dataEncoding === 'base64') {
			const decodedFilePath = `${resource.dataFilePath}.decoded`;
			await decodeBase64File(resource.dataFilePath, decodedFilePath);
			resource.dataFilePath = decodedFilePath;
		} else if (resource.dataEncoding) {
			throw new Error(`Cannot decode resource with encoding: ${resource.dataEncoding}`);
		}

		const stats = await shim.fsDriver().stat(resource.dataFilePath);
		resource.size = stats.size;

		if (!resource.id) {
			// If no resource ID is present, the resource ID is actually the MD5
			// of the data. This ID will match the "hash" attribute of the
			// corresponding <en-media> tag. resourceId = md5(decodedData);
			resource.id = await shim.fsDriver().md5File(resource.dataFilePath);
		}

		if (!resource.id || !resource.size) {
			// Don't throw an error because it happens semi-frequently,
			// especially on notes that comes from the Evernote Web Clipper and
			// we can't do anything about it. Previously we would throw the
			// error "This resource was not added because it has no ID or no
			// content".
			await handleNoDataResource(resource, !resource.id);
		}
	}

	return resource;
}

async function saveNoteResources(note: ExtractedNote) {
	let resourcesCreated = 0;
	for (let i = 0; i < note.resources.length; i++) {
		const resource = note.resources[i];

		const toSave: ResourceEntity = { ...resource };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		delete (toSave as any).dataFilePath;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		delete (toSave as any).dataEncoding;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		delete (toSave as any).hasData;
		toSave.file_extension = resource.filename ? safeFileExtension(fileExtension(resource.filename)) : '';

		// ENEX resource filenames can contain slashes, which may confuse other
		// parts of the app, which expect this `filename` field to be safe.
		// Fixes https://github.com/laurent22/joplin/issues/8823
		toSave.filename = toSave.filename ? friendlySafeFilename(toSave.filename, 255, true) : '';

		// The same resource sometimes appear twice in the same enex (exact same ID and file).
		// In that case, just skip it - it means two different notes might be linked to the
		// same resource.
		const existingResource = await Resource.load(toSave.id);
		if (existingResource) continue;

		await shim.fsDriver().move(resource.dataFilePath, Resource.fullPath(toSave));
		await Resource.save(toSave, { isNew: true });
		resourcesCreated++;
	}
	return resourcesCreated;
}

async function saveNoteTags(note: ExtractedNote) {
	let notesTagged = 0;
	for (let i = 0; i < note.tags.length; i++) {
		const tagTitle = note.tags[i];

		let tag = await Tag.loadByTitle(tagTitle);
		if (!tag) tag = await Tag.save({ title: tagTitle });

		await Tag.addNote(tag.id, note.id);

		notesTagged++;
	}
	return notesTagged;
}

export interface ImportOptions {
	// eslint-disable-next-line @typescript-eslint/ban-types -- Old code before rule was applied
	onProgress?: Function;
	// eslint-disable-next-line @typescript-eslint/ban-types -- Old code before rule was applied
	onError?: Function;
	outputFormat?: string;
	batchSize?: number;
}

async function saveNoteToStorage(note: ExtractedNote) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	note = Note.filter(note as any);

	const result = {
		resourcesCreated: 0,
		notesTagged: 0,
	};

	const resourcesCreated = await saveNoteResources(note);
	result.resourcesCreated += resourcesCreated;

	const notesTagged = await saveNoteTags(note);
	result.notesTagged += notesTagged;

	await Note.save(note, {
		isNew: true,
		autoTimestamp: false,
	});

	return result;
}

interface Node {
	name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	attributes: Record<string, any>;
}

interface NoteResourceRecognition {
	objID?: string;
}

const preProcessFile = async (filePath: string): Promise<string> => {
	// Disabled pre-processing for now because it runs out of memory:
	// https://github.com/laurent22/joplin/issues/5543
	//
	// It could be fixed by not loading the whole file in memory, but there are
	// other issues because people import 1GB+ files so pre-processing
	// everything means creating a new copy of that file, and that has its own
	// problems.

	return filePath;

	// const content: string = await shim.fsDriver().readFile(filePath, 'utf8');

	// // The note content in an ENEX file is wrapped in a CDATA block so it means
	// // that any "]]>" inside the note must be somehow escaped, or else the CDATA
	// // block would be closed at the wrong point.
	// //
	// // The problem is that Evernote appears to encode "]]>" as "]]<![CDATA[>]]>"
	// // instead of the more sensible "]]&gt;", or perhaps they have nothing in
	// // place to properly escape data imported from their web clipper. In any
	// // case it results in invalid XML that Evernote cannot even import back.
	// //
	// // Handling that invalid XML with SAX would also be very tricky, so instead
	// // we add a pre-processing step that converts this tags to just "&gt;". It
	// // should be safe to do so because such content can only be within the body
	// // of a note - and ">" or "&gt;" is equivalent.
	// //
	// // Ref: https://discourse.joplinapp.org/t/20470/4
	// const newContent = content.replace(/<!\[CDATA\[>\]\]>/g, '&gt;');
	// if (content === newContent) return filePath;
	// const newFilePath = `${Setting.value('tempDir')}/${md5(Date.now() + Math.random())}.enex`;
	// await shim.fsDriver().writeFile(newFilePath, newContent, 'utf8');
	// return newFilePath;
};

const isEvernoteUrl = (url: string) => {
	return url.toLowerCase().startsWith('evernote://');
};

const restoreNoteLinks = async (notes: SavedNote[], noteTitlesToIds: Record<string, string[]>, importOptions: ImportOptions) => {
	// --------------------------------------------------------
	// Convert the Evernote note links to Joplin note links. If
	// we don't find a matching note, or if there are multiple
	// matching notes, we leave the Evernote links as is.
	// --------------------------------------------------------

	for (const note of notes) {
		const links = importOptions.outputFormat === 'html' ?
			extractUrlsFromHtml(note.body) :
			extractUrlsFromMarkdown(note.body);

		let noteChanged = false;

		for (const link of links) {
			if (!isEvernoteUrl(link.url)) continue;

			const matchingNoteIds = noteTitlesToIds[link.title];
			if (matchingNoteIds && matchingNoteIds.length === 1) {
				note.body = note.body.replace(link.url, `:/${matchingNoteIds[0]}`);
				noteChanged = true;
			}
		}

		if (noteChanged) {
			await Note.save({
				id: note.id,
				body: note.body,
				updated_time: Date.now(),
			}, {
				autoTimestamp: false,
			});
		}
	}
};

interface ParseNotesResult {
	savedNotes: SavedNote[];
	noteTitlesToIds: Record<string, string[]>;
}

const parseNotes = async (parentFolderId: string, filePath: string, importOptions: ImportOptions = null): Promise<ParseNotesResult> => {
	// eslint-disable-next-line @typescript-eslint/ban-types -- Old code before rule was applied
	function handleSaxStreamEvent(fn: Function) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		return function(...args: any[]) {
			// Pass the parser to the wrapped function for debugging purposes
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
			if (this._parser) (fn as any)._parser = this._parser;

			try {
				fn.call(this, ...args);
			} catch (error) {
				if (importOptions.onError) {
					importOptions.onError(error);
				} else {
					console.error(error);
				}
			}
		};
	}

	const fileToProcess = await preProcessFile(filePath);
	const needToDeleteFileToProcess = fileToProcess !== filePath;

	return new Promise((resolve, reject) => {
		const progressState = {
			loaded: 0,
			created: 0,
			updated: 0,
			skipped: 0,
			resourcesCreated: 0,
			notesTagged: 0,
		};

		const stream = fs().createReadStream(fileToProcess);

		const options = {};
		const strict = true;
		const saxStream = require('@joplin/fork-sax').createStream(strict, options);

		const nodes: Node[] = []; // LIFO list of nodes so that we know in which node we are in the onText event
		let note: ExtractedNote = null;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		let noteAttributes: Record<string, any> = null;
		let noteResource: ExtractedResource = null;
		let noteTask: ExtractedTask = null;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		let noteResourceAttributes: Record<string, any> = null;
		let noteResourceRecognition: NoteResourceRecognition = null;
		const notes: ExtractedNote[] = [];
		let processingNotes = false;
		const savedNotes: SavedNote[] = [];
		const createdNoteIds: string[] = [];
		const noteTitlesToIds: Record<string, string[]> = {};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		const createErrorWithNoteTitle = (fnThis: any, error: any) => {
			const line = [];

			const parser = fnThis ? fnThis._parser : null;
			if (parser) {
				line.push(`Line ${parser.line}:${parser.column}`);
			}

			if (note && note.title) {
				line.push(`"${note.title}"`);
			}

			line.push(error.message);

			error.message = line.join(': ');

			return error;
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		stream.on('error', function(error: any) {
			importOptions.onError(createErrorWithNoteTitle(this, error));
		});

		function currentNodeName() {
			if (!nodes.length) return null;
			return nodes[nodes.length - 1].name;
		}

		function currentNodeAttributes() {
			if (!nodes.length) return {};
			return nodes[nodes.length - 1].attributes;
		}

		async function processNotes() {
			if (processingNotes) return false;

			processingNotes = true;
			stream.pause();

			while (notes.length) {
				const note = notes.shift();

				try {
					for (let i = 0; i < note.resources.length; i++) {
						let resource = note.resources[i];

						try {
							resource = await processNoteResource(resource);
						} catch (error) {
							importOptions.onError(createErrorWithNoteTitle(null, error));
							continue;
						}

						note.resources[i] = resource;
					}

					// --------------------------------------------------------
					// Convert the ENEX body to either Markdown or HTML
					// --------------------------------------------------------

					const body: string = importOptions.outputFormat === 'html' ?
						await enexXmlToHtml(note.bodyXml, note.resources) :
						await enexXmlToMd(note.bodyXml, note.resources, note.tasks);
					delete note.bodyXml;

					// --------------------------------------------------------
					// Finish setting up the note
					// --------------------------------------------------------

					note.id = uuid.create();
					note.markup_language = importOptions.outputFormat === 'html' ?
						MarkupToHtml.MARKUP_LANGUAGE_HTML :
						MarkupToHtml.MARKUP_LANGUAGE_MARKDOWN;

					note.parent_id = parentFolderId;
					note.body = body;

					// If the created timestamp was invalid, it would be
					// set to zero, so set it to the current date here
					if (!note.created_time) note.created_time = Date.now();

					// Notes in enex files always have a created timestamp
					// but not always an updated timestamp (it the note has
					// never been modified). For sync we require an
					// updated_time property, so set it to create_time in
					// that case
					if (!note.updated_time) note.updated_time = note.created_time;

					const result = await saveNoteToStorage(note);

					createdNoteIds.push(note.id);
					if (!noteTitlesToIds[note.title]) noteTitlesToIds[note.title] = [];
					noteTitlesToIds[note.title].push(note.id);
					savedNotes.push({
						id: note.id,
						body: note.body,
					});

					progressState.created++;
					progressState.resourcesCreated += result.resourcesCreated;
					progressState.notesTagged += result.notesTagged;
					importOptions.onProgress(progressState);
				} catch (error) {
					const newError = wrapError(`Error on note "${note.title}"`, error);
					importOptions.onError(createErrorWithNoteTitle(null, newError));
				}
			}

			stream.resume();
			processingNotes = false;
			return true;
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		saxStream.on('error', function(error: any) {
			importOptions.onError(createErrorWithNoteTitle(this, error));

			// We need to reject the promise here, or parsing will get stuck
			// ("end" handler will never be called).
			// https://github.com/laurent22/joplin/issues/8699
			reject(error);
		});

		saxStream.on('text', handleSaxStreamEvent(function(text: string) {
			const n = currentNodeName();

			if (noteAttributes) {
				noteAttributes[n] = text;
			} else if (noteResourceAttributes) {
				noteResourceAttributes[n] = text;
			} else if (noteResource) {
				if (n === 'data') {
					if (!noteResource.dataEncoding) {
						const attr = currentNodeAttributes();
						noteResource.dataEncoding = attr.encoding;
					}

					if (!noteResource.dataFilePath) {
						noteResource.dataFilePath = `${Setting.value('tempDir')}/${md5(Date.now() + Math.random())}.base64`;
					}

					noteResource.hasData = true;

					fs().appendFileSync(noteResource.dataFilePath, text);
				} else {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
					if (!(n in noteResource)) (noteResource as any)[n] = '';
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
					(noteResource as any)[n] += text;
				}
			} else if (noteTask) {
				if (n === 'title') {
					noteTask.title = text;
				} else if (n === 'taskStatus') {
					noteTask.completed = text === 'completed';
				} else if (n === 'taskGroupNoteLevelID') {
					noteTask.groupId = text;
				}
			} else if (note) {
				if (n === 'title') {
					note.title = text;
				} else if (n === 'created') {
					note.created_time = dateToTimestamp(text, 0);
				} else if (n === 'updated') {
					note.updated_time = dateToTimestamp(text, 0);
				} else if (n === 'tag') {
					note.tags.push(text);
				} else if (n === 'note') {
					// Ignore - white space between the opening tag <note> and the first sub-tag
				} else if (n === 'content') {
					// Ignore - white space between the opening tag <content> and the <![CDATA[< block where the content actually is
				} else {
					console.warn(createErrorWithNoteTitle(this, new Error(`Unsupported note tag: ${n}`)));
				}
			}
		}));

		saxStream.on('opentag', handleSaxStreamEvent((node: Node) => {
			const n = node.name.toLowerCase();
			nodes.push(node);

			if (n === 'note') {
				note = {
					resources: [],
					tasks: [],
					tags: [],
					bodyXml: '',
				};
			} else if (n === 'resource-attributes') {
				noteResourceAttributes = {};
			} else if (n === 'recognition') {
				if (noteResource) noteResourceRecognition = {};
			} else if (n === 'note-attributes') {
				noteAttributes = {};
			} else if (n === 'resource') {
				noteResource = {
					hasData: false,
				};
			} else if (n === 'task') {
				noteTask = {
					title: '',
					completed: false,
					groupId: '',
				};
			}
		}));

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		saxStream.on('cdata', handleSaxStreamEvent((data: any) => {
			const n = currentNodeName();

			if (noteResourceRecognition) {
				noteResourceRecognition.objID = extractRecognitionObjId(data);
			} else if (note) {
				if (n === 'content') {
					note.bodyXml += data;
				}
			}
		}));

		saxStream.on('closetag', handleSaxStreamEvent(function(n: string) {
			nodes.pop();

			if (n === 'note') {
				note = removeUndefinedProperties(note);

				progressState.loaded++;
				importOptions.onProgress(progressState);

				notes.push(note);

				if (notes.length >= importOptions.batchSize) {
					// eslint-disable-next-line promise/prefer-await-to-then -- Old code before rule was applied
					processNotes().catch(error => {
						importOptions.onError(createErrorWithNoteTitle(this, error));
					});
				}
				note = null;
			} else if (n === 'recognition' && noteResource) {
				noteResource.id = noteResourceRecognition.objID;
				noteResourceRecognition = null;
			} else if (n === 'resource-attributes') {
				noteResource.filename = noteResourceAttributes['file-name'];
				if (noteResourceAttributes['source-url']) noteResource.sourceUrl = noteResourceAttributes['source-url'];
				noteResourceAttributes = null;
			} else if (n === 'note-attributes') {
				note.latitude = noteAttributes.latitude;
				note.longitude = noteAttributes.longitude;
				note.altitude = noteAttributes.altitude;
				note.author = noteAttributes.author ? noteAttributes.author.trim() : '';
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
				note.is_todo = noteAttributes['reminder-order'] !== '0' && !!noteAttributes['reminder-order'] as any;
				note.todo_due = dateToTimestamp(noteAttributes['reminder-time'], 0);
				note.todo_completed = dateToTimestamp(noteAttributes['reminder-done-time'], 0);
				note.order = dateToTimestamp(noteAttributes['reminder-order'], 0);
				note.source = noteAttributes.source ? `evernote.${noteAttributes.source.trim()}` : 'evernote';
				note.source_url = noteAttributes['source-url'] ? noteAttributes['source-url'].trim() : '';

				noteAttributes = null;
			} else if (n === 'task') {
				note.tasks.push(noteTask);
				noteTask = null;
			} else if (n === 'resource') {
				let mimeType = noteResource.mime ? noteResource.mime.trim() : '';

				// Evernote sometimes gives an invalid or generic
				// "application/octet-stream" mime type for files that could
				// have a valid mime type, based on the extension. So in
				// general, we trust the filename more than the provided mime
				// type.
				// https://discourse.joplinapp.org/t/importing-a-note-with-a-zip-file/12123
				if (noteResource.filename) {
					const mimeTypeFromFile = mime.fromFilename(noteResource.filename);
					if (mimeTypeFromFile && mimeTypeFromFile !== mimeType) {
						// Don't print statement by default because it would show up in test units
						// console.info(`Invalid mime type "${mimeType}" for resource "${noteResource.filename}". Using "${mimeTypeFromFile}" instead.`);
						mimeType = mimeTypeFromFile;
					}
				}

				note.resources.push({
					id: noteResource.id,
					dataFilePath: noteResource.dataFilePath,
					dataEncoding: noteResource.dataEncoding,
					mime: mimeType,
					title: noteResource.filename ? noteResource.filename.trim() : '',
					filename: noteResource.filename ? noteResource.filename.trim() : '',
					hasData: noteResource.hasData,
				});

				noteResource = null;
			}
		}));

		saxStream.on('end', handleSaxStreamEvent(() => {
			// Wait till there is no more notes to process.
			const iid = shim.setInterval(() => {
				// eslint-disable-next-line promise/prefer-await-to-then -- Old code before rule was applied
				void processNotes().then(allDone => {
					if (allDone) {
						shim.clearTimeout(iid);
						if (needToDeleteFileToProcess) void shim.fsDriver().remove(fileToProcess);
						resolve({
							savedNotes,
							noteTitlesToIds,
						});
					}
				});
			}, 1000);
		}));

		stream.pipe(saxStream);
	});
};

export default async function importEnex(parentFolderId: string, filePath: string, importOptions: ImportOptions = null) {
	if (!importOptions) importOptions = {};
	if (!('onProgress' in importOptions)) importOptions.onProgress = function() {};
	if (!('onError' in importOptions)) importOptions.onError = function() {};
	if (!('batchSize' in importOptions)) importOptions.batchSize = 10;

	const result = await parseNotes(parentFolderId, filePath, importOptions);
	await restoreNoteLinks(result.savedNotes, result.noteTitlesToIds, importOptions);
}
