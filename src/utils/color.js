// for now these are just hard coded. in the future, this
// component should accept props to calculate these.
export const colors = [
    '#c6e48b',
    '#7bc96f',
    '#239a3b',
    '#196127',
];

// determine what color a day is
export function attachDayColor(normalizedHistory, emptyColor) {
    const max = Math.max(...normalizedHistory.map(day => day.value));

    const colorValues = colors.map((color, i) => {
        return { color, value: i / colors.length };
    });

    return normalizedHistory.map(day => {
        let color = emptyColor;
        let dayValue = day.value / max;

        if (day.value) {
            for (let i = 0, end = colorValues.length; i < end; i++) {
                if (dayValue < colorValues[i].value) {
                    break;
                }

                color = colorValues[i].color;
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
