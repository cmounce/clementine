<script lang="ts">
  import Chooser from "./Chooser.svelte";
  import Editor from "./Editor.svelte";

  let currentFile: string | null = $state(null);
</script>

{#if currentFile === null}
    <Chooser bind:file={currentFile}/>
{:else}
    <button onclick={() => currentFile = null}>Back</button>
    <Editor file={currentFile}/>
{/if}
