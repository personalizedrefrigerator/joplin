import { VirtualOpaqueType } from '@joplin/utils/types';
import uuid from '../../../uuid';
import EncryptionService, { EncryptionCustomHandler, EncryptionMethod } from '../EncryptionService';
import { MasterKeyEntity, PublicKeyAlgorithm, PublicKeyCryptoProvider } from '../types';

interface PrivateKey {
	encryptionMethod: EncryptionMethod;
	ciphertext: string;
}

export type PublicKey = string;

export interface PublicPrivateKeyPair {
	id: string;
	keySize: number;
	// The raw public key + identifier
	publicKey: PublicKey;
	privateKey: PrivateKey;
	createdTime: number;
}

// To indicate that clients should migrate to a new PublicKeyAlgorithm, add it to the end of
// "ppkMigrations".
let ppkMigrations = [
	PublicKeyAlgorithm.RsaLegacy,
	// Uncomment to migrate to RSA v2
	// PublicKeyAlgorithm.RsaV2,
];
const getDefaultPpkAlgorithm = () => ppkMigrations[ppkMigrations.length - 1];

// Exported for testing purposes
export const testing__setPpkMigrations_ = (migrations: PublicKeyAlgorithm[]) => {
	const original = ppkMigrations;
	ppkMigrations = migrations;

	return {
		reset: () => {
			ppkMigrations = original;
		},
	};
};

let rsa_: PublicKeyCryptoProvider = null;

export const setRSA = (rsa: PublicKeyCryptoProvider) => {
	rsa_ = rsa;
};

// Exported for testing purposes
export const rsa = (): PublicKeyCryptoProvider => {
	if (!rsa_) throw new Error('RSA handler has not been set!!');
	return rsa_;
};

// Non-legacy encryption methods prefix the public key with the algorithm.
// For example "[rsa-v2]...some-public-key-here..."
// This function extracts the algorithm prefix from the given raw public key.
const splitPpkPublicKey = (publicKey: PublicKey) => {
	const algorithmMatch = publicKey.match(/^([^;]+;)/);

	let algorithm = PublicKeyAlgorithm.RsaLegacy;
	if (algorithmMatch) {
		const algorithmNameAndSeparator = algorithmMatch[0];
		const algorithmName = algorithmNameAndSeparator.replace(/[;]$/, '');

		if (Object.values<string>(PublicKeyAlgorithm).includes(algorithmName)) {
			algorithm = algorithmName as PublicKeyAlgorithm;
		} else {
			algorithm = PublicKeyAlgorithm.Unknown;
		}

		publicKey = publicKey.substring(algorithmNameAndSeparator.length);
	}

	return { algorithm, publicKey };
};

const attachPpkAlgorithm = (publicKey: PublicKey, algorithm: PublicKeyAlgorithm): PublicKey => {
	// Legacy PPK format didn't include the algorithm in the public key:
	if (algorithm === PublicKeyAlgorithm.RsaLegacy) {
		return publicKey;
	}

	return `${algorithm};${publicKey}`;
};

type KeyPairPublicKeySlice = { publicKey: PublicKey };
export const getPpkAlgorithm = (ppk: KeyPairPublicKeySlice) => {
	return splitPpkPublicKey(ppk.publicKey).algorithm;
};

export const supportsPpkAlgorithm = (ppk: KeyPairPublicKeySlice) => {
	return rsa().supportsAlgorithm(getPpkAlgorithm(ppk));
};

async function encryptPrivateKey(encryptionService: EncryptionService, password: string, plainText: string): Promise<PrivateKey> {
	return {
		encryptionMethod: EncryptionMethod.SJCL4,
		ciphertext: await encryptionService.encrypt(EncryptionMethod.SJCL4, password, plainText),
	};
}

export async function decryptPrivateKey(encryptionService: EncryptionService, encryptedKey: PrivateKey, password: string): Promise<string> {
	return encryptionService.decrypt(encryptedKey.encryptionMethod, password, encryptedKey.ciphertext);
}

export const generateKeyPairWithAlgorithm = async (algorithm: PublicKeyAlgorithm, encryptionService: EncryptionService, password: string): Promise<PublicPrivateKeyPair> => {
	const { keyPair, keySize } = await rsa().from(algorithm).generateKeyPair();

	return {
		id: uuid.createNano(),
		keySize,
		privateKey: await encryptPrivateKey(
			encryptionService, password, await rsa().from(algorithm).privateKey(keyPair),
		),
		publicKey: attachPpkAlgorithm(await rsa().from(algorithm).publicKey(keyPair), algorithm),
		createdTime: Date.now(),
	};
};

export async function generateKeyPair(encryptionService: EncryptionService, password: string): Promise<PublicPrivateKeyPair> {
	return generateKeyPairWithAlgorithm(getDefaultPpkAlgorithm(), encryptionService, password);
}

export async function pkReencryptPrivateKey(encryptionService: EncryptionService, ppk: PublicPrivateKeyPair, decryptionPassword: string, encryptionPassword: string): Promise<PublicPrivateKeyPair> {
	const decryptedPrivate = await decryptPrivateKey(encryptionService, ppk.privateKey, decryptionPassword);

	return {
		...ppk,
		privateKey: await encryptPrivateKey(encryptionService, encryptionPassword, decryptedPrivate),
	};
}

export async function ppkPasswordIsValid(service: EncryptionService, ppk: PublicPrivateKeyPair, password: string): Promise<boolean> {
	if (!ppk) throw new Error('PPK is undefined');

	try {
		await loadPpk(service, ppk, password);
	} catch (error) {
		return false;
	}

	return true;
}

export const shouldUpdatePpk = (oldPpk: PublicPrivateKeyPair) => {
	const algorithm = getPpkAlgorithm(oldPpk);
	const migrationIndex = ppkMigrations.indexOf(algorithm);
	const isUpToDate = algorithm === getDefaultPpkAlgorithm();

	return migrationIndex > -1 && !isUpToDate && rsa().supportsAlgorithm(getDefaultPpkAlgorithm());
};

type KeyPair = VirtualOpaqueType<'ppk.keyPair'>;

async function loadKeys(publicKey: PublicKey, privateKeyPlainText: string, keySize: number): Promise<KeyPair> {
	const split = splitPpkPublicKey(publicKey);
	return rsa().from(split.algorithm).loadKeys(split.publicKey, privateKeyPlainText, keySize);
}

async function loadPpk(service: EncryptionService, ppk: PublicPrivateKeyPair, password: string): Promise<KeyPair> {
	const privateKeyPlainText = await decryptPrivateKey(service, ppk.privateKey, password);
	return loadKeys(ppk.publicKey, privateKeyPlainText, ppk.keySize);
}

async function loadPublicKey(publicKey: PublicKey, keySize: number): Promise<KeyPair> {
	return loadKeys(publicKey, '', keySize);
}

function ppkEncryptionHandler(ppk: PublicPrivateKeyPair, rsaKeyPair: KeyPair): EncryptionCustomHandler {
	interface Context {
		rsaKeyPair: KeyPair;
		ppkId: string;
		algorithm: PublicKeyAlgorithm;
	}

	return {
		context: {
			rsaKeyPair,
			ppkId: ppk.id,
			algorithm: getPpkAlgorithm(ppk),
		},
		encrypt: async (context: Context, hexaBytes: string, _password: string): Promise<string> => {
			return JSON.stringify({
				ppkId: context.ppkId,
				ciphertext: await rsa().from(context.algorithm).encrypt(hexaBytes, context.rsaKeyPair),
			});
		},
		decrypt: async (context: Context, ciphertext: string, _password: string): Promise<string> => {
			const parsed = JSON.parse(ciphertext);
			if (parsed.ppkId !== context.ppkId) throw new Error(`Needs private key ${parsed.ppkId} to decrypt, but using ${context.ppkId}`);
			return rsa().from(context.algorithm).decrypt(parsed.ciphertext, context.rsaKeyPair);
		},
	};
}

// Generates a master key and encrypts it using the provided PPK
export async function ppkGenerateMasterKey(service: EncryptionService, ppk: PublicPrivateKeyPair, password: string): Promise<MasterKeyEntity> {
	const nodeRSA = await loadPpk(service, ppk, password);
	const handler = ppkEncryptionHandler(ppk, nodeRSA);

	return service.generateMasterKey('', {
		encryptionMethod: EncryptionMethod.Custom,
		encryptionHandler: handler,
	});
}

// Decrypt the content of a master key that was encrypted using ppkGenerateMasterKey()
export async function ppkDecryptMasterKeyContent(service: EncryptionService, masterKey: MasterKeyEntity, ppk: PublicPrivateKeyPair, password: string): Promise<string> {
	const nodeRSA = await loadPpk(service, ppk, password);
	const handler = ppkEncryptionHandler(ppk, nodeRSA);

	return service.decryptMasterKeyContent(masterKey, '', {
		encryptionHandler: handler,
	});
}

export async function mkReencryptFromPasswordToPublicKey(service: EncryptionService, masterKey: MasterKeyEntity, decryptionPassword: string, encryptionPublicKey: PublicPrivateKeyPair): Promise<MasterKeyEntity> {
	const loadedPublicKey = await loadPublicKey(encryptionPublicKey.publicKey, encryptionPublicKey.keySize);
	const encryptionHandler = ppkEncryptionHandler(encryptionPublicKey, loadedPublicKey);

	const plainText = await service.decryptMasterKeyContent(masterKey, decryptionPassword);
	const newContent = await service.encryptMasterKeyContent(EncryptionMethod.Custom, plainText, '', { encryptionHandler });

	return { ...masterKey, ...newContent };
}

export async function mkReencryptFromPublicKeyToPassword(service: EncryptionService, masterKey: MasterKeyEntity, decryptionPpk: PublicPrivateKeyPair, decryptionPassword: string, encryptionPassword: string): Promise<MasterKeyEntity> {
	const decryptionHandler = ppkEncryptionHandler(
		decryptionPpk, await loadPpk(service, decryptionPpk, decryptionPassword),
	);

	const plainText = await service.decryptMasterKeyContent(masterKey, '', { encryptionHandler: decryptionHandler });
	const newContent = await service.encryptMasterKeyContent(null, plainText, encryptionPassword);

	return { ...masterKey, ...newContent };
}
