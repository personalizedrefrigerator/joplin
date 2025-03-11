import { SpeechToTextProvider, SpeechToTextProviderMetadata } from './types';

export default class SpeechToTextService {
	private constructor(private providers_: SpeechToTextProvider[] = []) { }

	private static instance_: SpeechToTextService|null = null;
	public static instance() {
		if (!this.instance_) {
			this.initialize([]);
		}
		return this.instance_;
	}

	public static initialize(defaultProviders: SpeechToTextProvider[]) {
		this.instance_ = new SpeechToTextService(defaultProviders);
	}

	public addProvider(provider: SpeechToTextProvider) {
		if (this.providers_.some(other => other.metadata.id === provider.metadata.id)) {
			throw new Error(`A provider with id ${provider.metadata.id} already exists`);
		}
		this.providers_.push(provider);
	}

	public removeProvider(provider: SpeechToTextProvider) {
		this.providers_ = this.providers_.filter(other => other !== provider);
	}

	public get providerMetadata(): Readonly<SpeechToTextProviderMetadata[]> {
		return this.providers_.map(provider => provider.metadata);
	}

	public getProvidersSupportingLanguage(locale: string) {
		return this.providers_.filter(provider => {
			return provider.supportsLanguage(locale);
		}).map(provider => provider.metadata);
	}

	public getProvider(preferredProviderId: string) {
		if (this.providers_.length === 0) {
			throw new Error('No voice typing providers available.');
		}

		const preferredProvider = this.providers_.find(provider => provider.metadata.id === preferredProviderId);
		const provider = preferredProvider ?? this.providers_[0];
		return provider;
	}
}
