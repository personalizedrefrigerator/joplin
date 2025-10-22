
export interface AuthenticationProps {
	clientSecret: string;
}

interface SsoScreenShared {
	openLoginPage(): Promise<void>;
	processLoginCode(code: string, props: AuthenticationProps): Promise<boolean>;
	isLoginCodeValid(code: string): boolean;
}

export default SsoScreenShared;
