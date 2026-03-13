import * as ort from 'onnxruntime-node'
import { z } from 'zod'
import path from 'node:path'
import { type ModelLevel, MODEL_LEVELS, type Player, type BoardPosition } from '~/types'

let session: ort.InferenceSession | null = null

// TODO: minmax depth algorithm for better predictions

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

export async function evaluateBoardRaw(board: BoardPosition, move: Player): Promise<number> {
  try {
    if (!session) {
      throw new Error('ONNX Session not initialized')
    }
    const combinedData = new Float32Array(33)
    combinedData.set(board)
    combinedData[32] = move === 'white' ? 1 : -1
    const tensor = new ort.Tensor('float32', combinedData, [1, 33])
    const feeds = { [session.inputNames[0]]: tensor }
    const results = await session.run(feeds)
    return (results[session.outputNames[0]] as ort.Tensor).data[0] as number
  } catch (error) {
    console.error('Evaluation failed:', error)
    throw error
  }
}

export const DEFAULT_MODEL_LEVEL: ModelLevel = MODEL_LEVELS.at(-1)!

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
  return ModelLevelSchema.safeParse(param).data ? +param! as ModelLevel : DEFAULT_MODEL_LEVEL
}
