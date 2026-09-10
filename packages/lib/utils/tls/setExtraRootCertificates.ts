import shim from '../../shim';
import { getCACertificates, setDefaultCACertificates } from 'node:tls';

let defaultCaCerts_: string[]|null = null;
const defaultCaCerts = () => {
	defaultCaCerts_ ??= getCACertificates();
	return defaultCaCerts_;
};

type Cert = {
	path: string; pem?: undefined;
} | {
	pem: string; path?: undefined;
};

let cacheKey = '[]';
const setExtraRootCertificates = async (certs: Cert[]) => {
	const newCacheKey = JSON.stringify(certs);
	if (newCacheKey === cacheKey) return;

	const cas = [...defaultCaCerts()];
	for (const cert of certs) {
		let data;
		if (cert.pem) {
			data = cert.pem;
		} else {
			data = await shim.fsDriver().readFile(cert.path, 'utf-8');
		}

		cas.push(data);
	}

	setDefaultCACertificates(cas);
	cacheKey = newCacheKey;
};

export default setExtraRootCertificates;
