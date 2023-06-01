type Enum<E> = Record<keyof E, number | string> & { [k: number]: keyof E }

export function getEnumKeysAndValues(data: Enum<any>): { keys: string[], values: (string | number)[] } {
	if (!data) {
		return { keys: [], values: [] }
	}
	
	const keySet = new Set(Object.keys(data))
	const realKeySet = new Set<string>()
	const realValueSet = new Set<string | number>()
	
	for (const [key, value] of Object.entries(data)) {
		// { "a": 1 }
		if (typeof value === 'number') {
			realKeySet.add(key)
			realValueSet.add(value)
			continue
		}
		
		// { "a": "STRING_A"  }
		if (!keySet.has(value)) {
			realKeySet.add(key)
			realValueSet.add(value)
			continue
		}
		
		// { "a": "666"  }
		if (isNumericString(value)) {
			realKeySet.add(key)
			realValueSet.add(value)
			continue
		}

		// { "666": "a"  }, reverse mapping
		if (isNumericString(key)) {
			continue
		}
		
		realKeySet.add(value)
		realValueSet.add(value)
	}
	
	return { keys: [...realKeySet], values: [...realValueSet] }
}

function isNumericString(value): boolean {
	if (typeof value !== 'string') {
		return false
	}
	
	const valueAsNumber = Number(value)
	
	return !isNaN(valueAsNumber) && isFinite(valueAsNumber) && String(valueAsNumber) === value
}