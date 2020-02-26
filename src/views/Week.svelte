<g transform={`translate(${index * 11}, 0)`}>
    {#each days as day, index}
        <rect
            fill="#f00"
            height="10"
            width="10"
            y={index * 11}
        />
    {/each}
</g>

<script>
export let days;
export let index;
</script>