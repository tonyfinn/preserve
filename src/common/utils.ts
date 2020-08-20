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
