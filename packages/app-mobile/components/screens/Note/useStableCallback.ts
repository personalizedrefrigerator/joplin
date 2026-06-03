import { useRef } from 'react';

// Returns a stable function reference that always invokes the latest version of the given callback.
// This mirrors how class methods keep a single identity while reading the current this.state/this.props.
const useStableCallback = <Args extends unknown[], Result>(callback: (...args: Args)=> Result) => {
	const callbackRef = useRef(callback);
	callbackRef.current = callback;
	return useRef((...args: Args) => callbackRef.current(...args)).current;
};

export default useStableCallback;
