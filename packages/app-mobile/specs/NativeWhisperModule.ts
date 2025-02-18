import { TurboModule, TurboModuleRegistry } from "react-native";

interface WhisperOptions {

}

export interface Spec extends TurboModule {
    readonly test: ()=> string;
    readonly transcribe: (path: string, options: WhisperOptions)=> string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeWhisperModule');
