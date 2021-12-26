import './lifecycle'
import './rotationSnap'
import { format } from './modelFormat'
import { DefaultSettings, settings } from './settings'
import { action as CustomAction, bus, translate, store, ERROR } from './util'
import './ui/panels/states'
import './ui/dialogs/settings'
import EVENTS from './constants/events'
import { renderAnimation } from './animationRenderer'

import {
	exportPredicate,
	exportRigModels,
	exportTransparentTexture,
} from './exporting'

import {
	computeElements,
	computeModels,
	computeVariantTextureOverrides,
	computeBones,
	computeVariantModels,
} from './modelComputation'

import lang from './lang.yaml'
import { intl } from './util/intl'
import { makeArmorStandModel } from './makeArmorStandModel'
for (const name in lang) {
	console.log('loading language ', name, lang[name])
	intl.register(name, lang[name])
}

let F_IS_BUILDING = false
export const BuildModel = (callback, options) => {
	if (!F_IS_BUILDING) {
		F_IS_BUILDING = true
		computeAnimationData(callback, options)
			.then(() => {
				F_IS_BUILDING = false
			})
			.catch((e) => {
				if (e.options && !e.options.silent) {
					new Dialog(
						e.options || {
							title: 'An Error Occurred',
							lines: [
								`<p>An error has occurred, see below for more info.</p>`,
								`<p>build:${process.env.BUILD_ID}</p>`,
								`<hr/>`,
								`<p>please send the error log below to the devs alongside the model file in its current state if possible.</p>`,
								`<textarea>` +
									`BUILD: ${process.env.BUILD_ID}\n` +
									`ERROR:\n` +
									e.stack +
									`</textarea>`,
							],
						}
					).show()
				}

				F_IS_BUILDING = false
				Blockbench.setProgress(0)
				throw e
			})
	} else {
		Blockbench.showQuickMessage(translate('error.build_in_progress'))
		ERROR.ANIMATED_JAVA_BUSY()
	}
}

async function computeAnimationData(callback, options) {
	console.groupCollapsed('Compute Animation Data')

	const animations = await renderAnimation(options)
	const cubeData = computeElements()
	const models = await computeModels(cubeData)
	const variantTextureOverrides = computeVariantTextureOverrides(models)
	const bones = computeBones(models, animations)
	// const [variantModels, variantTouchedModels] = await computeVariantModels(models, variantTextureOverrides)
	const variants = await computeVariantModels(models, variantTextureOverrides)

	// const flatVariantModels = {}
	// Object.values(variantModels).forEach(variant => Object.entries(variant).forEach(([k,v]) => flatVariantModels[k] = v))
	// console.log('Flat Variant Models:', flatVariantModels)

	await exportRigModels(models, variants.variantModels)
	await exportPredicate(models, variants.variantModels, settings.animatedJava)
	if (settings.animatedJava.transparentTexturePath) {
		await exportTransparentTexture()
	}

	const data = {
		settings: settings.toObject(),
		cubeData,
		bones,
		models,
		variantTextureOverrides,
		variantModels: variants.variantModels,
		variantTouchedModels: variants.variantTouchedModels,
		// flatVariantModels,
		animations,
	}
	console.groupEnd('Compute Animation Data')
	console.groupCollapsed('Exporter Output')
	await callback(data)
	console.groupEnd('Exporter Output')
}

import './pluginDefinitions'
import { show_settings } from './ui/dialogs/settings'

const menu = new BarMenu('animated_java', [], () => Format.id === format.id)
menu.label.style.display = 'none'
document.querySelector('#menu_bar').appendChild(menu.label)
Blockbench.on('select_project', () => {
	queueMicrotask(() => {
		console.log('selected', Format.id !== format.id)
		menu.label.style.display =
			Format.id !== format.id ? 'none' : 'inline-block'
	})
})
Blockbench.on('unselect_project', () => {
	menu.label.style.display = 'none'
})
menu.label.innerHTML = translate('animatedJava.menubar.dropdown.name')
MenuBar.addAction(
	CustomAction({
		icon: 'settings',
		category: 'animated_java',
		name: translate('animatedJava.menubar.settings.name'),
		id: 'animated_java_settings',
		condition: () => format.id === Format.id,
		click: function () {
			show_settings()
		},
	}),
	'animated_java'
)
MenuBar.addAction(
	{
		name: translate('animatedJava.menubar.export.name'),
		id: 'animatedJava_export',
		icon: 'insert_drive_file',
		condition: () => format.id === Format.id,
		click: () => {
			// Call the selected exporter.
			const exporter = settings.animatedJava.exporter
			if (exporter) {
				store.getStore('exporters').get(exporter)()
			} else {
				Blockbench.showQuickMessage(
					translate(
						'animatedJava.popup.quickMessage.noExporterSelected'
					)
				)
			}
		},
	},
	'animated_java'
)
MenuBar.update()
const cb = () => {
	store.set('states', { default: {} })
	settings.update(DefaultSettings, true)
	bus.dispatch(EVENTS.LIFECYCLE.LOAD_MODEL, {})
}
Blockbench.on('new_project', cb)
bus.on(EVENTS.LIFECYCLE.CLEANUP, () => {
	menu.label.remove()
	Blockbench.removeListener('new_project', cb)
})

window.makeArmorStandModel = makeArmorStandModel