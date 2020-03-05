<g transform={`translate(${translation}, 0)`}>
    {#each days as day, index}
        <rect
            data-date={stringifyDate(day.date)}
            data-value={day.value}
            fill={day.color}
            height={cellSize}
            rx={cellRadius}
            width={cellSize}
            y={index * cellRect}
        />
    {/each}
</g>

<script>
import { stringifyDate } from '../utils/date';

$: translation = cellRect * index;

export let cellRadius;
export let cellRect;
export let cellSize;
export let days;
export let index;
</script>