import { getEnumKeysAndValues } from './enum.util'

describe('enum.util', () => {
	describe('getEnumKeysAndValues', () => {
		it('should process enum with string keys, numeric values', async () => {
			enum TestEnum {
				a = 0,
				b = 1,
				c = 2,
			}

			const result = getEnumKeysAndValues(TestEnum)
			expect(result?.keys).toEqual(['a', 'b', 'c'])
			expect(result?.values).toEqual([0, 1, 2])
		})
		
		it('should process enum with string keys, numeric and string values', async () => {
			enum TestEnum {
				a = 0,
				b = 1,
				c = 2,
				d = 'D_VAL',
				e = 'E_VAL'
			}

			const result = getEnumKeysAndValues(TestEnum)
			expect(result?.keys).toEqual(['a', 'b', 'c', 'd', 'e'])
			expect(result?.values).toEqual([0, 1, 2, 'D_VAL', 'E_VAL'])
		})
		
		it('should process enum with string keys, numeric values with floating point', async () => {
			enum TestEnum {
				a = .5,
				b = 0.5,
				c = 5.,
			}

			const result = getEnumKeysAndValues(TestEnum)
			expect(result?.keys).toEqual(['a', 'b', 'c'])
			expect(result?.values).toEqual([.5, 5.])
		})
		
		it('should process enum with keys: Infinity, -Infinity, +Infinity', async () => {
			enum TestEnum {
				Infinity,
				'-Infinity',
				'+Infinity',
			}

			const result = getEnumKeysAndValues(TestEnum)
			expect(result?.keys).toEqual(['Infinity', '-Infinity', '+Infinity'])
			expect(result?.values).toEqual([0, 1, 2])
		})
		
		it('should process enum with keys: -0, +0', async () => {
			enum TestEnum {
				'-0',
				'+0',
			}

			const result = getEnumKeysAndValues(TestEnum)
			expect(result?.keys).toEqual(['-0', '+0'])
			expect(result?.values).toEqual([0, 1])
		})
		
		it('should process enum with NaN key', async () => {
			enum TestEnum {
				NaN,
			}

			const result = getEnumKeysAndValues(TestEnum)
			expect(result?.keys).toEqual(['NaN'])
			expect(result?.values).toEqual([0])
		})
	})
})