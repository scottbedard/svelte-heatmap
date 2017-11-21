// determine what color a day is
export function attachDayColor({ colors, emptyColor, normalizedHistory }) {
    const values = normalizedHistory.map(day => day.value);
    const max = Math.max(...values);
    const min = Math.min(...values) || 1;

    const colorValues = colors.map((color, i) => {
        return { color, value: i / colors.length };
    });

    return normalizedHistory.map(day => {
        let color = emptyColor;
        let dayValue = day.value / max;

        if (day.value) {
            for (let i = 0, end = colorValues.length; i < end; i++) {
                if (dayValue <= colorValues[i].value) {
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
