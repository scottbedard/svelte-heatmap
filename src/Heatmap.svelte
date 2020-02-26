<h1>Hello</h1>
<pre>{JSON.stringify(calendar, null, 4)}</pre>

<script>
import { getCalendar } from './utils/heatmap';

export let colors = ['#c6e48b', '#7bc96f', '#239a3b', '#196127'];
export let data = [];
export let emptyColor = '#ebedf0';
export let endDate = null;
export let startDate = null;
export let view = 'yearly';

$: calendar = getCalendar({ data, endDate, startDate, view });

</script>