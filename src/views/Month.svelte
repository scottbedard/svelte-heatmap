<g transform={`translate(${translationX}, ${translationY})`}>
    {#each days as day}
        <Cell
            color={day.color}
            date={day.date}
            radius={cellRadius}
            size={cellSize}
            value={day.value}
            x={day.date.getDay() * cellRect}
            y={(getWeekIndex(day.date) * cellRect) + monthLabelHeight}
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
            {monthLabels[days[0].date.getMonth()]}
        </text>
    {/if}
</g>

<script>
import Cell from './Cell.svelte';
import { getWeekIndex } from '../utils/date';

$: monthHeight = (6 * cellRect) + monthGap + monthLabelHeight
$: monthWidth = (7 * cellRect) + monthGap

$: translationX = monthWidth * (index % monthCols);
$: translationY = monthHeight * (Math.floor(index / monthCols));

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
export let monthCols;
</script>