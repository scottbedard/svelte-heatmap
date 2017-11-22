// determine what color a day is
export function attachDayColor({ emptyColor, normalizedColors, normalizedHistory }) {
    const values = normalizedHistory.map(day => day.value);
    const max = Math.max(...values);
    const min = Math.min(...values) || 1;

    return normalizedHistory.map(day => {
        let color = emptyColor;
        let dayValue = day.value / max;

        if (day.value) {
            for (let i = 0, end = normalizedColors.length; i < end; i++) {
                if (dayValue <= normalizedColors[i].value) {
                    break;
                }

                color = normalizedColors[i].color;
            }
        }

        return {
            color,
            date: day.date,
            day: day.day,
            value: day.value,
        }
    });
}

// convert color props into a gradient if neccessary
export function normalizeColors({ colors, highColor, lowColor }) {
    if (Array.isArray(colors)) {
        return colors.map((color, i) => ({ color, value: i / colors.length }));
    }
    
    if (isValidColorsNumber(colors)) {
        try {
            return gradient(lowColor, highColor, colors).map((color, i) => ({
                color, 
                value: i / colors,
            }));
        } catch (e) {}
    }

    return [];
}

// validate the colors props
export function validateColors({ colors, emptyColor, lowColor, highColor }) {
    if (typeof colors === 'number') {

        // make sure the colors is a positive whole number
        if (!isValidColorsNumber(colors)) {
            throw `Invalid color value. Expected a whole number greater than 2, got ${colors}.`;
        }

        // if colors are a number, lowColor and highColor must be valid
        const hexRegex = /#[0-9A-Fa-f]{6}/;

        if (typeof lowColor !== 'string' || !hexRegex.test(lowColor)) {
            throw `Invalid lowColor. Expected 6 digit hex color, got ${lowColor}.`;
        }

        if (typeof highColor !== 'string' || !hexRegex.test(highColor)) {
            throw `Invalid highColor. Expected 6 digit hex color, got ${highColor}.`;
        }
    }
}

// make sure a colors number is valid
function isValidColorsNumber(colors) {
    return colors > 2
        && colors < Infinity
        && !isNaN(colors) 
        && colors % 1 === 0;
}

// calculate a gradient between two colors
function gradient(lowColor, highColor, colors) {
    // parse the low and high
    const fromColors = toRgb(lowColor);
    const toColors = toRgb(highColor);

    // calculate the step variance for each color
    const stepR = (toColors.r - fromColors.r) / (colors - 1);
    const stepG = (toColors.g - fromColors.g) / (colors - 1);
    const stepB = (toColors.b - fromColors.b) / (colors - 1);

    // calculate each color in the gradient and return the result
    return [...new Array(colors)].map((step, i) => toHex(
        Math.round(fromColors.r + (stepR * i)),
        Math.round(fromColors.g + (stepG * i)),
        Math.round(fromColors.b + (stepB * i)),
    ));
}

// convert hex colors to rgb values
function toRgb(color) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);

    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    };
}

// convert rgb values to a hex color
export function toHex(r, g, b) {
    const red = r < 16 ? `0${r.toString(16)}` : r.toString(16);
    const green = g < 16 ? `0${g.toString(16)}` : g.toString(16);
    const blue = b < 16 ? `0${b.toString(16)}` : b.toString(16);

    return `#${red}${green}${blue}`;
}