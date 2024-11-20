import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai'
import { ollama } from '../ollama'

export const customModel = (apiIdentifier: string) => {
  return wrapLanguageModel({
    model: {
      invoke: async (input) => {
        const response = await ollama(input.messages, apiIdentifier)
        return response
      }
    }
  }) 