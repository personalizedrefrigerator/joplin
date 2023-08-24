export interface MasterKeyEntity {
	id?: string | null;
	created_time?: number;
	updated_time?: number;
	source_application?: string;
	encryption_method?: number;
	checksum?: string;
	content?: string;
	type_?: number;
	enabled?: number;
	hasBeenUsed?: boolean;
}

export type RSAKeyPair = any; // Depends on implementation

// This is the interface that each platform must implement. Data is passed as
// Base64 encoded because that's what both NodeRSA and react-native-rsa support.

export interface RSA {
	generateKeyPair(keySize: number): Promise<RSAKeyPair>;
	loadKeys(publicKey: string, privateKey: string): Promise<RSAKeyPair>;
	encrypt(plaintextUtf8: string, rsaKeyPair: RSAKeyPair): Promise<string>; // Returns Base64 encoded data
	decrypt(ciphertextBase64: string, rsaKeyPair: RSAKeyPair): Promise<string>; // Returns UTF-8 encoded string
	publicKey(rsaKeyPair: RSAKeyPair): string;
	privateKey(rsaKeyPair: RSAKeyPair): string;
}

export interface InputStringStream {
	index(): number;
	read(size: number): Promise<string|null>;
	close(): Promise<void>;
}

export interface OutputStringStream {
	index(): number;
	append(data: string): Promise<void>;
	close(): Promise<void>;
}

export enum EncryptionMethod {
	SJCL = 1,
	SJCL2 = 2,
	SJCL3 = 3,
	SJCL4 = 4,
	SJCL1a = 5,
	Custom = 6,
	SJCL1b = 7,
	Sodium1 = 8,
}
