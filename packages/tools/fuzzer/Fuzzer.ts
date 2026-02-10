import { exists, pathExists, readdir, writeFile } from "fs-extra";
import { ActionSpec } from "./ActionRunner";
import ClientPool from "./ipc/ClientPool";
import Server from "./ipc/Server";
import ActionTracker from "./model/ActionTracker";
import { FuzzContext } from "./types";
import SeededRandom from "./utils/SeededRandom";
import { join } from "path";

interface FuzzerState {
	model: ActionTracker;
	generalRandom: SeededRandom;
	stringRandom: SeededRandom;
	idRandom: SeededRandom;
	currentStep: number;
}

interface RandomSeeds {
	actions: number;
	ids: number;
	strings: number;
}

interface StepConfig {
	snapshotAfter: number;
	stopAfter: number;
	actionsPerStep: number;
}

interface FuzzerConfig {
	seeds: RandomSeeds;

	stopAfterSteps
	maximumSteps: number;
	maximumStepsBetweenSyncs: number;
	enableE2ee: boolean;
	randomStrings: boolean;
	clientCount: number;
	keepAccountsOnClose: boolean;
	setupActions: ActionSpec[];

	serverPath: string;
	isJoplinCloud: boolean;
}

export default class Fuzzer {
	private model_: ActionTracker;
	private clients_: ClientPool;
	private server_: Server;
	private context_: FuzzContext;

	public static fromConfig(config: FuzzerConfig) {

	}

	public static fromSnapshot(snapshotPath: string) {

	}

	private constructor(
		private state_: FuzzerState
	) {}

	public async snapshot(outputDirectory: string) {
		if (!await pathExists(outputDirectory)) {
			throw new Error('Output directory does not exist');
		}
		const stats = await readdir(outputDirectory);
		if (stats.length > 0) {
			throw new Error('Output directory must be empty');
		}

		await writeFile(
			join(outputDirectory, 'state.json'),
			JSON.stringify({
				currentStep: this.state_.currentStep,

				generalRandom: this.state_.generalRandom.current,
				stringRandom: this.state_.stringRandom.current,
				idRandom: this.state_.idRandom.current,

				accountEmails
			}),
		);
	}
}