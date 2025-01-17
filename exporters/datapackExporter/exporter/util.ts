export function loadUtil() {
	const { NbtCompound, NbtList, NbtFloat } = AnimatedJava.API.deepslate

	async function fileExists(path: string) {
		return !!(await fs.promises.stat(path).catch(() => false))
	}

	function arrayToNbtFloatArray(array: number[]) {
		return new NbtList(array.map(v => new NbtFloat(v)))
	}

	function matrixToNbtFloatArray(matrix: THREE.Matrix4) {
		const matrixArray = new THREE.Matrix4().copy(matrix).transpose().toArray()
		return arrayToNbtFloatArray(matrixArray)
	}

	function transformationToNbt(pos: THREE.Vector3, rot: THREE.Quaternion, scale: THREE.Vector3) {
		return new NbtCompound(
			new Map()
				.set('translation', arrayToNbtFloatArray(pos.toArray()))
				.set('right_rotation', arrayToNbtFloatArray([0, 0, 0, 1]))
				.set('left_rotation', arrayToNbtFloatArray(rot.toArray()))
				.set('scale', arrayToNbtFloatArray(scale.toArray()))
		)
	}

	return { fileExists, arrayToNbtFloatArray, matrixToNbtFloatArray, transformationToNbt }
}

export function wrapNum(num: number, min: number, max: number) {
	return ((((num - min) % (max - min)) + (max - min)) % (max - min)) + min
}
