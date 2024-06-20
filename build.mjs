import { context } from 'esbuild';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import eslint from 'esbuild-plugin-eslint';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const { dependencies, peerDependencies } = packageJson;

const deps = dependencies || {};
const peerDeps = peerDependencies || {};


const checkTypesPlugin = {
    name: 'Typescript TypeCheck',
    setup(build) {
        build.onStart(() => {
            process.stdout.write('TSC started -> ');

            try {
                execSync('npx tsc --noEmit', { stdio: 'inherit' });
            } catch (error) {
                //console.error('TypeScript type-checking failed.');
                return {
                    errors: [{
                        text: 'TypeScript type-checking failed.'
                    }]
                }
            }
        });
    },
};


const customPlugin = {
    name: 'custom',

    setup(build) {
        build.onStart(() => {
            process.stdout.write('Build started -> ');
        });
        build.onEnd((result) => {
            if (result.errors.length === 0) {
                console.clear();

                console.log('\x1b[32m%s\x1b[0m', 'Build succeeded'); 
                console.log('\x1b[33m%s\x1b[0m', '-----------------------------------------');
                execSync('node ./dist/index.js', { stdio: 'inherit' });
            }
        });
    },
};

const runBuild = async () => {
    try {
        const ctx = await context({
            entryPoints: ['src/index.ts'],
            minify: false,
            bundle: true,
            external: [...Object.keys(deps), ...Object.keys(peerDeps)],
            platform: 'node',
            outfile: 'dist/index.js',
            plugins: [
                checkTypesPlugin,
                eslint({
                    fix: true,
                    extensions: ['.ts'],
                }),
                customPlugin,
            ],

        });

        await ctx.watch();

        process.on('SIGINT', async () => {
            await ctx.dispose();
            console.log('Goodbye');
            process.exit(0);
        });
    } catch (error) {
        console.error('Build failed:', error);
    }
};

runBuild();
