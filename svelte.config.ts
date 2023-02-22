import { resolve } from 'path'
import prep from 'svelte-preprocess'
import { typescript } from 'svelte-preprocess-esbuild'

export const compilerOptions = {
	dev: process.env.NODE_ENV === 'development',
	css: true,
}

export const preprocess = [
	typescript({
		target: 'es2022',
		define: {
			'process.browser': 'true',
		},
	}),
	prep({ typescript: false }),
]

const importPath = resolve(__dirname, '../src', 'events.ts')

export const transformCssToJs = (css: string) => {
	return `import {events} from ${JSON.stringify(importPath)};
	const $deletable = Blockbench.addCSS(${JSON.stringify(css)});
	events.unload.addListener(() => $deletable());
	events.uninstall.addListener(() => $deletable());`
}
export default { preprocess, transformCssToJs }
