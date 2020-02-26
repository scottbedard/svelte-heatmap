<svg>
    {#if view === 'monthly'}
        {#each chunks as chunk}
            <Month days={chunk} />
        {/each}
    {:else}
        {#each chunks as chunk, index}
            <Week
                days={chunk}
                index={index}
            />
        {/each}
    {/if}
</svg>

<script>
import {
    chunkCalendar,
    getCalendar,
} from './utils/heatmap';

import Month from './views/Month.svelte';
import Week from './views/Week.svelte';

export let colors = ['#c6e48b', '#7bc96f', '#239a3b', '#196127'];
export let data = [];
export let emptyColor = '#ebedf0';
export let endDate = null;
export let startDate = null;
export let view = 'yearly';

$: chunks = chunkCalendar({
    days: getCalendar({ data, endDate, startDate, view }),
    view,
});

</script>