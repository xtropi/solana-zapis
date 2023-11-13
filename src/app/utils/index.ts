export function round(number: number, precision: number) {
    if (precision < 0) {
        let factor = Math.pow(10, precision);
        return Math.round(number * factor) / factor;
    }
    else
        return +(Math.round(Number(number + "e+" + precision)) +
            "e-" + precision);
}

export function floor(number: number | undefined, precision: number) {
    if (!number) return
    if (precision < 0) {
        let factor = Math.pow(10, precision);
        return Math.round(number * factor) / factor;
    }
    else
        return +(Math.floor(Number(number + "e+" + precision)) +
            "e-" + precision);
}