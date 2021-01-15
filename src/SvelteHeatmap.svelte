<svg viewBox={`0 0 ${width} ${height}`}>
    {#if view === 'monthly'}
        {#each chunks as chunk, index}
            <Month
                cellGap={cellGap}
                cellRadius={cellRadius}
                cellRect={cellRect}
                cellSize={cellSize}
                days={chunk}
                fontColor={fontColor}
                fontFamily={fontFamily}
                fontSize={fontSize}
                index={index}
                monthGap={monthGap}
                monthLabelHeight={monthLabelHeight}
                monthLabels={monthLabels}
                monthCols={monthCols}
            />
        {/each}
    {:else}
        {#if dayLabelWidth > 0}
            {#each dayLabels as label, index}
                <text
                    alignment-baseline="middle"
                    fill={fontColor}
                    font-family={fontFamily}
                    font-size={fontSize}
                    x="0"
                    y={dayLabelPosition(index)}>
                    {label}
                </text>
            {/each}
        {/if}
        <g transform={`translate(${dayLabelWidth})`}>
            {#each chunks as chunk, index}
                <Week
                    cellRadius={cellRadius}
                    cellRect={cellRect}
                    cellSize={cellSize}
                    days={chunk}
                    index={index}
                    monthLabelHeight={monthLabelHeight}
                />
                {#if monthLabelHeight > 0 && isNewMonth(chunks, index)}
                    <text
                        alignment-baseline="hanging"
                        fill={fontColor}
                        font-family={fontFamily}
                        font-size={fontSize}
                        x={cellRect * index}>
                        {monthLabels[chunk[0].date.getMonth()]}
                    </text>
                {/if}
            {/each}
        </g>
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

export let allowOverflow = false;
export let cellGap = 2;
export let cellRadius = 0;
export let cellSize = 10;
export let colors = ['#c6e48b', '#7bc96f', '#239a3b', '#196127'];
export let data = [];
export let dayLabelWidth = 20;
export let dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
export let emptyColor = '#ebedf0';
export let endDate = null;
export let fontColor = '#333';
export let fontFamily = 'sans-serif';
export let fontSize = 8;
export let monthGap = 2;
export let monthLabelHeight = 12;
export let monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export let monthLayout = '1x12';
export let startDate = null;
export let view = 'weekly';

let monthCols, monthRows

const layout = (l) => {
    const knownLayouts = ['1x12', '2x6', '3x4', '4x3', '6x2', '12x1']
    if (!knownLayouts.includes(l)) return { rows: 1, cols: 12};
    [monthRows, monthCols] = l.split('x')
    return { rows: monthRows, cols: monthCols }
}
const isNewMonth = (chunks, index) => {
    const chunk = chunks[index];
    const prev = chunks[index - 1];

    if (!prev) {
        return true;
    }

    if (!prev.length || !chunk.length) {
        return false;
    }

    const currentIndex = chunk[0].date.getMonth();
    const prevIndex = prev[0].date.getMonth();

    return index < chunks.length && index < chunks.length - 1 && (
        currentIndex > prevIndex || currentIndex === 0 && prevIndex === 11
    );
}

$: cellRect = cellSize + cellGap;

$: calendar = getCalendar({ allowOverflow, colors, data, emptyColor, endDate, startDate, view });

$: chunks = view === 'monthly'
    ? chunkMonths({ allowOverflow, calendar, endDate, startDate })
    : chunkWeeks({ allowOverflow, calendar, endDate, startDate });

$: weekRect = (7 * cellRect) - cellGap;

$: height = view === 'monthly'
    ? Math.ceil(chunks.length / layout(monthLayout).cols) * ((6 * cellRect) + monthGap + monthLabelHeight)
    : weekRect + monthLabelHeight;

$: width = view === 'monthly'
    ? ((weekRect + monthGap) * (
        // for cases where the number of months is less than what is
        // possible in the layout. think: 5 months in a 1x12 layout,
        // for example.
        chunks.length < layout(monthLayout).cols
            ? chunks.length
            : layout(monthLayout).cols
    ))
    : (cellRect * chunks.length) - cellGap + dayLabelWidth;

$: dayLabelPosition = index => {
    return (cellRect * index) + (cellRect / 2) + monthLabelHeight;
}
</script>