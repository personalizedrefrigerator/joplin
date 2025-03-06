
const fetchFileBlob = (url: string) => {
	return new Promise<Blob>((resolve, reject) => {
		// fetch may be unable to request file:// URLs.
		// https://github.com/react-native-webview/react-native-webview/issues/1560#issuecomment-1783611805
		const request = new XMLHttpRequest();
		request.responseType = 'blob';

		const onError = () => {
			reject(new Error(`Request to ${url} failed: ${request.status}, ${request.statusText}, ${request.responseText}`));
		};

		request.addEventListener('load', _ => {
			resolve(request.response);
		});
		request.addEventListener('error', onError);
		request.addEventListener('abort', onError);

		request.open('GET', url, true);
		request.send();
	});
};

export default fetchFileBlob;
