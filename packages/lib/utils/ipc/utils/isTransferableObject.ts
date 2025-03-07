import { TransferableObject } from '../types';

const isTransferableObject = (o: unknown): o is TransferableObject => {
	if (typeof o !== 'object') return false;
	if (typeof FileSystemHandle !== 'undefined' && o instanceof FileSystemHandle) return true;
	if (typeof Blob !== 'undefined' && o instanceof Blob) return true;
	if (typeof ArrayBuffer !== 'undefined' && o instanceof ArrayBuffer) return true;
	if (typeof Float32Array !== 'undefined' && o instanceof Float32Array) return true;
	if (typeof Uint8Array !== 'undefined' && o instanceof Uint8Array) return true;

	return false;
};

export default isTransferableObject;
