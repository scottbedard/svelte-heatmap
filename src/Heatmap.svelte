<Week />
<Month />

<pre>calendar: { JSON.stringify(calendar, null, 2) }</pre>

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

$: calendar = chunkCalendar({
    days: getCalendar({ data, endDate, startDate, view }),
    view,
});

</script>