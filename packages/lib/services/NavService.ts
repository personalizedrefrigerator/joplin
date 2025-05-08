import { _ } from '../locale';
import shim from '../shim';

export type OnNavigateCallback = ()=> Promise<boolean>;
export interface RouteToLabel {
	[routeName: string]: {
		label(): string;
	};
}

export default class NavService {

	// eslint-disable-next-line @typescript-eslint/ban-types -- Old code before rule was applied
	public static dispatch: Function = () => {};
	private static handlers_: OnNavigateCallback[] = [];
	private static routeToLabel_: RouteToLabel = {};

	public static setRouteLabels(routeToLabel: RouteToLabel) {
		this.routeToLabel_ = { ...routeToLabel };
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public static async go(routeName: string, additionalProps: Record<string, any>|null = null) {
		if (this.handlers_.length) {
			const r = await this.handlers_[this.handlers_.length - 1]();
			if (r) return r;
		}

		if (routeName in this.routeToLabel_) {
			shim.announceForAccessibility(_('Opening %s', this.routeToLabel_[routeName].label()));
		}

		this.dispatch({
			type: 'NAV_GO',
			routeName: routeName,
			...additionalProps,
		});
		return false;
	}

	public static addHandler(handler: OnNavigateCallback) {
		for (let i = this.handlers_.length - 1; i >= 0; i--) {
			const h = this.handlers_[i];
			if (h === handler) return;
		}

		this.handlers_.push(handler);
	}

	public static removeHandler(handler: OnNavigateCallback) {
		for (let i = this.handlers_.length - 1; i >= 0; i--) {
			const h = this.handlers_[i];
			if (h === handler) this.handlers_.splice(i, 1);
		}
	}
}
