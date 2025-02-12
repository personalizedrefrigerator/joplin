import { TurboModule, TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
    readonly test: ()=> string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeWhisperModule');
