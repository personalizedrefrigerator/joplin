
type OnGetClientSecret = (baseUrl: string)=> Promise<string|null>;
export interface AuthenticationProps {
	getClientSecret: null|OnGetClientSecret;
}

interface SsoScreenShared {
	openLoginPage(): Promise<void>;
	processLoginCode(code: string, props: AuthenticationProps): Promise<boolean>;
	isLoginCodeValid(code: string): boolean;
}

export default SsoScreenShared;
