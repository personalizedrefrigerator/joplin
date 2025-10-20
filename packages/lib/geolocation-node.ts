import Logger from '@joplin/utils/Logger';
import shim from './shim';
import { execCommand } from '@joplin/utils';

const logger = Logger.create('geolocation-node');

interface CurrentPositionResponseCoordinates {
	longitude: number;
	latitude: number;
	altitude: number;
}

interface CurrentPositionResponse {
	timestamp: number;
	coords: CurrentPositionResponseCoordinates;
}

interface CurrentPositionOptions {}

type GeoipService = ()=> Promise<CurrentPositionResponse>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
const fetchJson = async (url: string): Promise<any> => {
	let r = await shim.fetch(url);
	if (!r.ok) throw new Error(`Could not get geolocation: ${await r.text()}`);
	r = await r.json();
	return r;
};

const geoipServices: Record<string, GeoipService> = {
	os: async (): Promise<CurrentPositionResponse> => {
		if (process.platform === 'win32') {
			const response = await execCommand([
				'PowerShell.exe',
				'-Command',
				// Referenced:
				// - https://stackoverflow.com/a/46287884
				// - https://learn.microsoft.com/en-us/dotnet/api/system.device.location.geocoordinatewatcher?view=netframework-4.8.1
				`
					# Required for access to System.
					Add-Type -AssemblyName System.Device

					$geo = [System.Device.Location.GeoCoordinateWatcher]::new()
					$suppressPermissionPrompt = $false
					$geo.TryStart(
						$suppressPermissionPrompt,
						[System.TimeSpan]::FromMilliseconds(1000)
					)

					while ($geo.Permission -ne "Denied" -and $geo.Position.Location.IsUnknown) {
						Start-Sleep -Milliseconds 50
					}

					if ($geo.Permission -eq "Denied") {
						Write-Error "Not permitted to access location."
					} else {
						$location = $geo.Position.Location
						$latitude = $location.Latitude
						$longitude = $location.Longitude
						$altitude = $location.Altitude

						# NaN can't be parsed by JS
						if ($altitude -eq [Double].NaN) {
							$altitude = $false
						}

						@{
							Latitude = $latitude
							Longitude = $longitude
							Altitude = $altitude
						} | ConvertTo-Json | Write-Output
					}
				`,
			], { quiet: true });
			const responseData = JSON.parse(response.replace(/^True/, ''));

			const getResponseProperty = (propertyName: string) => {
				if (!(propertyName in responseData) || typeof responseData[propertyName] !== 'number') {
					throw new Error(`Missing or invalid property: ${propertyName} in response (response keys: ${JSON.stringify(Object.keys(responseData))})`);
				}
				return responseData[propertyName];
			};

			return {
				timestamp: Date.now(),
				coords: {
					latitude: getResponseProperty('Latitude'),
					longitude: getResponseProperty('Longitude'),
					altitude: getResponseProperty('Altitude'),
				},
			};
		} else {
			throw new Error('OS geolocation is not supported on this platform');
		}
	},

	ipwhois: async (): Promise<CurrentPositionResponse> => {
		const r = await fetchJson('https://ipwho.is/');
		if (!('latitude' in r) || !('longitude' in r)) throw new Error(`Invalid geolocation response: ${r ? JSON.stringify(r) : '<null>'}`);

		return {
			timestamp: Date.now(),
			coords: {
				longitude: r.longitude,
				altitude: 0,
				latitude: r.latitude,
			},
		};
	},

	// October 2025: geoplugin.net no longer offers a free IP resolution service and has been
	// removed.

};

export default class {
	public static async currentPosition(options: CurrentPositionOptions = null) {
		if (!options) options = {};

		for (const [serviceName, handler] of Object.entries(geoipServices)) {
			try {
				const response = await handler();
				return response;
			} catch (error) {
				logger.warn(`Could not get geolocation from service "${serviceName}"`);
				logger.warn(error);
			}
		}

		throw new Error('Could not get geolocation from any of the services');
	}
}
