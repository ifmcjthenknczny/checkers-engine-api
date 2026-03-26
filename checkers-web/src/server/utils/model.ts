import * as ort from 'onnxruntime-node'
import { z } from 'zod'
import path from 'node:path'
import { type ModelLevel, MODEL_LEVELS } from '~/types'

export let session: ort.InferenceSession | null = null

export async function loadModel(level: ModelLevel, modelsPath: string): Promise<void> {
  try {
    const modelPath = path.isAbsolute(modelsPath)
      ? path.join(modelsPath, `engine_${level}.onnx`)
      : path.join(process.cwd(), modelsPath, `engine_${level}.onnx`)
    session = await ort.InferenceSession.create(modelPath)
  } catch (e) {
    console.error(`[ERROR] Loading model ${level} was unsuccessful:`, e)
    throw e
  }
}

export const ModelLevelSchema = z.enum(MODEL_LEVELS.map(level => level.toString()), {
  message: `Model level is invalid. Must be one of: ${MODEL_LEVELS.join(', ')}`,
})

let modelLevelLoaded: ModelLevel | null = null

export async function ensureModelLoaded(modelLevel: ModelLevel, modelsPath: string): Promise<void> {
  if (modelLevelLoaded !== modelLevel) {
    await loadModel(modelLevel, modelsPath)
    modelLevelLoaded = modelLevel
  }
}

export function parseModelLevel(param: string | undefined): ModelLevel {
  if (!ModelLevelSchema.safeParse(param).data) {
    throw new Error('Invalid model level value provided')
  }
  return +param! as ModelLevel
}
