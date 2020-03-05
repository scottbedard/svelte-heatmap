<g transform={`translate(${translation}, 0)`}>
    {#each days as day, index}
        <rect
            data-date={day.date}
            data-value={day.value}
            fill={day.color}
            height={cellSize}
            rx={cellRadius}
            width={cellSize}
            x={day.date.getDay() * cellRect}
            y={(getWeekIndex(day.date) * cellRect )+ monthLabelHeight}
        />
    {/each}
    {#if monthLabelHeight > 0}
        <text
            alignment-baseline="hanging"
            fill={fontColor}
            font-family={fontFamily}
            font-size={fontSize}
            x="0"
            y="0">
            {monthLabels[index]}
        </text>
    {/if}
</g>

<script>
import { getWeekIndex, stringifyDate } from '../utils/date';

$: translation = (((7 * cellRect) - cellGap) + monthGap) * index;

export let cellGap;
export let cellRadius;
export let cellRect;
export let cellSize;
export let days;
export let fontColor;
export let fontFamily;
export let fontSize;
export let index;
export let monthGap;
export let monthLabelHeight;
export let monthLabels;
</script>