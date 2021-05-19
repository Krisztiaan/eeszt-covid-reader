import React from 'react';

export default function useToggle(
  initialState = false,
): [state: boolean, toggle: (newValue?: boolean) => void] {
  const [value, setValue] = React.useState(initialState);
  return [
    value,
    React.useCallback(
      (newValue?: boolean) => setValue((v) => (typeof newValue === 'boolean' ? newValue : !v)),
      [],
    ),
  ];
}
