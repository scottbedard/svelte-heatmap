<rect
    data-date={stringifyDate(date)}
    data-value={value}
    fill={color}
    height={size}
    rx={radius}
    width={size}
    x={x}
    y={y}
    on:mouseover="{onMouseOver}"
    on:mouseout="{onMouseOut}"
/>

<script>
import { createEventDispatcher } from 'svelte';
import { stringifyDate } from '../utils/date';

export let color;
export let date;
export let radius;
export let size;
export let value;
export let x;
export let y;

const dispatch = createEventDispatcher();

const onMouseOver = () => {
    dispatch('hover-cell', {x, y, value, date});
};
const onMouseOut = () => {
    dispatch('leave-cell');
};
</script>
