const id = '__$$REACT_POPOUT_COMPONENT$$__';

export function set(key: string, value: any) {
    (window as any)[id] = (window as any)[id] || {};
    (window as any)[id][key] = value;
}

export function get(key: string) {
    return (window as any)[id] && (window as any)[id][key];
}

export { id };
