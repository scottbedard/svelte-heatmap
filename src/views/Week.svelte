<g transform={`translate(${translation}, ${monthLabelHeight})`}>
    {#each days as day, index}
        <Cell
            color={day.color}
            radius={cellRadius}
            size={cellSize}
            y={day.date.getDay() * cellRect}
        />
    {/each}
</g>

<script>
import Cell from './Cell.svelte';
import { stringifyDate } from '../utils/date';

$: translation = cellRect * index;

export let cellRadius;
export let cellRect;
export let cellSize;
export let days;
export let index;
export let monthLabelHeight;
</script>