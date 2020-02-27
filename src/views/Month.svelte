<g transform={`translate(${translation}, 0)`}>
    {#each days as day, index}
        <rect
            data-date={day.date}
            data-value={day.value}
            fill={day.color}
            height={cellSize}
            width={cellSize}
            x={day.date.getDay() * cellRect}
            y={getWeekIndex(day.date) * cellRect}
        />
    {/each}
</g>

<script>
import { getWeekIndex, stringifyDate } from '../utils/date';

$: translation = (((7 * cellRect) - cellGap) + chunkGap) * index;

export let cellGap;
export let cellRect;
export let cellSize;
export let chunkGap;
export let days;
export let index;
</script>