// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VoidFunction = (...args: any[]) => void;

export function debounced<F extends VoidFunction>(
    f: F,
    timeout = 50
): (this: ThisParameterType<F>, ...args: Parameters<F>) => void {
    let pending: number;
    let active = false;

    const doF = function (this: ThisParameterType<F>, ...args: Parameters<F>) {
        active = true;
        f.apply(this, args);
        active = false;
    };

    return function (this: ThisParameterType<F>, ...args: Parameters<F>) {
        if (!active) {
            doF.apply(this, args);
        } else {
            if (pending) {
                window.clearTimeout(pending);
            }
            pending = window.setTimeout(() => {
                doF.apply(this, args);
            }, timeout);
        }
    };
}

export function sorted<T>(
    a: Array<T>,
    sortFunction?: (a: T, b: T) => number
): Array<T> {
    const output = [...a];
    output.sort(sortFunction);
    return output;
}

export function formatTime(timeSeconds: number): string {
    const seconds = Math.floor(timeSeconds % 60);
    const secondString = seconds.toFixed().padStart(2, '0');
    const minutes = Math.floor((timeSeconds % 3600) / 60);
    const minuteString = minutes.toFixed().padStart(2, '0');
    const hours = Math.floor(timeSeconds / 3600);

    if (hours >= 1) {
        const hourString = hours.toFixed().padStart(2, '0');
        return `${hourString}:${minuteString}:${secondString}`;
    } else {
        return `${minuteString}:${secondString}`;
    }
}

export function titleCase(input: string): string {
    return input.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

export function isMock(): boolean {
    const queryOptions = window.location.search;

    const params = new URLSearchParams(queryOptions);

    return params && params.get('mock') === 'true';
}
