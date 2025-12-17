import shim from '../shim';

let cacheKey = '[]';
const setExtraRootCertificates = async (paths: string[]) => {
	if (JSON.stringify(paths) === cacheKey) return;
	cacheKey = JSON.stringify(paths);

	// setDefaultCACertificates requires NodeJS newer than v22.19.0. As of December 2025,
	// not all environments running the Joplin CLI app will have this feature. Require
	// it only if actually changing the CA certificates.
	const { getCACertificates, setDefaultCACertificates } = require('node:tls');

	const cas = [...getCACertificates()];
	for (const caPath of paths) {
		const path = caPath.trim();
		if (!path) continue;

		const certificateData = await shim.fsDriver().readFile(path, 'utf-8');
		cas.push(certificateData);
	}

	setDefaultCACertificates(cas);
};

export default setExtraRootCertificates;
