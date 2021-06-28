<g transform="translate({translateX}, {translateY})">
    {#each colors as color, index}
        <rect
            fill={color}
            height={cellSize}
            width={cellSize}
            x={20 + cellSize * index}
            {y}
            alignment-baseline="middle"
        />
    {/each}
    <text
        x="0"
        y={cellSize}
        font-family={fontFamily}
        font-size={fontSize}
        alignment-baseline="middle"
    >
        Less
    </text>
    <text
        x={15 + cellSize * (colors.length + 1)}
        y={cellSize}
        font-family={fontFamily}
        font-size={fontSize}
        alignment-baseline="middle"
    >
        More
    </text>
</g>

<script>
    export let translateX;
    export let translateY;
    export let height;
    export let colors;
    export let cellSize;
    export let fontSize;
    export let fontFamily;

    $: y = (height - cellSize) / 4;
</script>