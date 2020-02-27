<svg viewBox={`0 0 ${width} ${height}`}>
    {#if view === 'monthly'}
        {#each chunks as chunk, index}
            <Month
                cellGap={cellGap}
                cellRect={cellRect}
                cellSize={cellSize}
                monthGap={monthGap}
                days={chunk}
                index={index}
            />
        {/each}
    {:else}
        {#each chunks as chunk, index}
            <Week
                cellRect={cellRect}
                cellSize={cellSize}
                days={chunk}
                index={index}
            />
        {/each}
    {/if}
</svg>

<script>
import {
    chunkMonths,
    chunkWeeks,
    getCalendar,
} from './utils/heatmap';

import Month from './views/Month.svelte';
import Week from './views/Week.svelte';

export let cellGap = 2;
export let cellSize = 10;
export let colors = ['#c6e48b', '#7bc96f', '#239a3b', '#196127'];
export let data = [];
export let emptyColor = '#ebedf0';
export let endDate = null;
export let monthGap = 2;
export let startDate = null;
export let view = 'weekly';

$: cellRect = cellSize + cellGap;

$: calendar = getCalendar({ colors, data, emptyColor, endDate, startDate, view });

$: chunks = view === 'monthly'
    ? chunkMonths(calendar)
    : chunkWeeks(calendar);

$: height = view === 'monthly'
    ? (6 * cellRect) - cellGap
    : (7 * cellRect) - cellGap

$: width = view === 'monthly'
    ? ((((7 * cellRect) - cellGap) + monthGap) * chunks.length) - monthGap
    : (cellRect * chunks.length) - cellGap;
</script>