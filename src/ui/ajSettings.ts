import { ajModelFormat } from '../modelFormat'
import { translate } from '../util/translation'
// @ts-ignore
import logo from '../assets/AnimatedJava-2022.svg'
import { animatedJavaSettings } from '../settings'
import { default as SettingsComponent } from './components/animatedJavaSettings.svelte'
import { SvelteDialog } from './svelteDialog'
import { createBarMenu } from '../util/moddingTools'
import * as events from '../util/events'

interface IAnimatedJavaMenu extends BarMenu {
	label: HTMLDivElement
}

const MENU = createBarMenu(
	'animated_java:menu',
	[],
	() => Format === ajModelFormat
) as IAnimatedJavaMenu
MENU.label.style.display = 'none'

const MENU_BAR = document.querySelector('#menu_bar')
if (MENU_BAR) MENU_BAR.appendChild(MENU.label)
else throw new Error('Animated Java failed to load: Could not find Blockbench menu bar element!')

const IMG = document.createElement('img')
MENU.label.innerHTML = translate('animated_java.menubar.settings')
IMG.src = logo
IMG.width = 16
IMG.height = 16
IMG.style.position = 'relative'
IMG.style.top = '2px'
IMG.style.borderRadius = '8px'
IMG.style.marginRight = '5px'
MENU.label.prepend(IMG)

events.SELECT_PROJECT.subscribe(() => {
	queueMicrotask(() => {
		MENU.label.style.display = Format === ajModelFormat ? 'inline-block' : 'none'
	})
})

events.UNSELECT_PROJECT.subscribe(() => {
	MENU.label.style.display = 'none'
})

export function openAjSettingsDialog() {
	const dialog = new SvelteDialog({
		title: translate('animated_java.dialog.settings.title'),
		id: 'animated_java:settings',
		width: 700,
		buttons: [translate('animated_java.dialog.close_button')],
		svelteComponent: SettingsComponent,
		svelteComponentProps: { settings: animatedJavaSettings },
	})
	dialog.show()
}
