import * as React from 'react';

// The password input forwards this handler straight to its native <input>, so it
// receives a real change event (consumers read event.target.value).
export type ChangeEventHandler = React.ChangeEventHandler<HTMLInputElement>;
