export function debounced(f, timeout=50) {
    var pending;
    var active = false;

    const doF = function(...args) {
        active = true;
        f.apply(this, args);
        active = false;
    }

    return function(...args) {
        if(!active) {
            doF.apply(this, args);
        } else {
            if(pending) {
                clearTimeout(pending);
            }
            pending = setTimeout(() => {
                doF.apply(this, args);
            }, timeout)
        };
    }
}