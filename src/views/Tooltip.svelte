<script>
    import { onMount } from "svelte";
    import { formatDate } from "../utils/date.js";

    export let date;
    export let value;
    export let x;
    export let y;
    export let unit = {single: 'contribution', pural: 'contributions'};

    onMount(()=> {
        console.log($$props);
    });
</script>

<div class="tooltip" style="left:{x}px; top: {y}px">
    <span><strong>{value ? `${value} ${unit.pural}` : `No ${unit.single}`}</strong> on {formatDate(date)}</span>
</div>

<style>
    .tooltip {
        position: absolute;
        z-index: 9999;
        padding: 5px 9px;
        color: #ffffff;
        font-size: 12px;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 3px;
        text-align: center;
    }
</style>
