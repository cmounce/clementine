import { defineConfig, Plugin } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  plugins: [solidPlugin(), versionPlugin()],
});

function versionPlugin(): Plugin {
  return {
    name: 'generate-version',
    apply: 'build',
    async generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.txt',
        source: await getVersionInfo(),
      });
    },
  };
}

async function getVersionInfo(): Promise<string> {
  const info: Record<string, string> = {
    build: new Date().toISOString(),
  };

  const execAsync = promisify(exec);

  const fromJujutsu = async () => {
    const template = [
      'change_id.short()',
      'commit_id.short()',
      'committer.timestamp().format("%Y-%m-%d")',
      'description.first_line()',
    ].join(' ++ "\\t" ++ ');
    const { stdout } = await execAsync(
      `jj log -r '::@ & ~description("")' -n1 --no-graph -T '${template}'`
    );
    const [change, hash, date, msg] = stdout.trim().split('\t');
    info.change = change;
    info.hash = hash;
    info.commit = `${msg} (${date})`;
  };

  const fromGit = async () => {
    const { stdout } = await execAsync(
      'git log --format="%h%x09%cs%x09%s" -n 1'
    );
    const [hash, date, msg] = stdout.trim().split('\t');
    info.hash = hash;
    info.commit = `${msg} (${date})`;
  };

  try {
    await fromJujutsu();
  } catch {
    try {
      await fromGit();
    } catch {
      // No VCS available
    }
  }

  return (
    Object.entries(info)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n') + '\n'
  );
}
