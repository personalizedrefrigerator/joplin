import { dirname, resolve } from 'path';

const createStartupArgs = (profileDirectory: string) => {
	// Input paths need to be absolute when running from VSCode
	const baseDirectory = dirname(dirname(__dirname));
	const mainPath = resolve(baseDirectory, 'main.js');

	// We need to run with --env dev to disable the single instance check.
	return [
		mainPath, '--env', 'dev', '--no-welcome', '--running-tests', '--profile', resolve(profileDirectory),
	];
};

export default createStartupArgs;
