const { execCommand } = require('@joplin/utils');
const yargs = require('yargs');

const canBuild = async () => {
	if (process.env.SKIP_ONENOTE_CONVERTER_BUILD) return false;
	// Always build in CI, unless explicitly skipped
	if (process.env.IS_CONTINUOUS_INTEGRATION) return true;

	try {
		let toolchains;
		if (process.platform === 'win32') {
			toolchains = await execCommand('rustup.exe toolchain list', { quiet: true });
		} else {
			toolchains = await execCommand('rustup toolchain list', { quiet: true });
		}

		// At least on MacOS, a single "stable-x86_64-apple-darwin" toolchain is sufficient to
		// build the OneNote converter:
		return toolchains.split('\n').length >= 1;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.info(
			'----------------------------------------------------------------\n' +
			'Not building onenote-converter: Rust toolchain not found.\n' +
			'Use IS_CONTINUOUS_INTEGRATION=1 env var if build is necessary.\n' +
			'----------------------------------------------------------------',
		);
		return false;
	}
};

async function main() {
	if (!await canBuild()) {
		// eslint-disable-next-line no-console
		console.info('OneNote converter build skipped');
		return;
	}

	const argv = yargs.argv;
	if (!argv.profile) throw new Error('OneNote build: profile value is missing');
	if (!['release', 'dev'].includes(argv.profile)) throw new Error('OneNote build: profile value is invalid');

	const buildCommand = `wasm-pack build --target nodejs --${argv.profile} ./renderer`;

	await execCommand(buildCommand);

	if (argv.profile !== 'release') return;

	// If release build, remove intermediary folder to decrease size of release
	const removeIntermediaryFolder = 'cargo clean';

	await execCommand(removeIntermediaryFolder);
}

// eslint-disable-next-line promise/prefer-await-to-then
main().catch((error) => {
	console.error('Fatal error', error);
	if (error.stderr.includes('No such file or directory (os error 2)')) {
		console.error('----------------------------------------------------------------');
		console.error('Rust toolchain is missing, please install it: https://rustup.rs/');
		console.error('----------------------------------------------------------------');
	}
	process.exit(1);
});
