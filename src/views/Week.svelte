<g transform={`translate(${index * cellRect}, 0)`}>
    {#each days as day, index}
        <rect
            data-date={day.date}
            data-value={day.value}
            fill={day.color}
            height={cellSize}
            width={cellSize}
            y={index * cellRect}
        />
    {/each}
</g>

<script>
export let cellGap;
export let cellRect;
export let cellSize;
export let days;
export let index;
</script>