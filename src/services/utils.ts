import { AxiosError } from 'axios'

export function createErrorMessage(error: Error | AxiosError): string {
	if (error instanceof AxiosError && error.response) {
		const { response: { status, statusText, data, config: { url, method } } } = error
		return `${method.toUpperCase()} ${url}. Status: ${status} ${statusText}. Data: ${data ? JSON.stringify(data, null, 1): null}`
	}
	
	return error.toString()
}