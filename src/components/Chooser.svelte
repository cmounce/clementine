<script lang="ts">
    const files = ["foo", "bar", "baz"];
    let { file = $bindable() } = $props();
</script>

<style>
    .file {
        border: none;
        background: none;
        text-align: left;
        width: 100%;
    }

    .file:hover {
        cursor: pointer;
        background-color: #ddd;
    }
</style>

{#each files as availableFile (availableFile)}
    <button class="file" onclick={() => file = availableFile}>
        {availableFile}
        {availableFile === file ? "(*)" : ""}
    </button>
{/each}
