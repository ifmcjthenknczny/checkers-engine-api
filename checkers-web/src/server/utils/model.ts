import * as ort from 'onnxruntime-node'
import path from 'node:path'
import type { ModelLevel } from '~/types'

let session: ort.InferenceSession | null = null

// TODO: minmax depth algorithm for better predictions

export async function loadModel(level: ModelLevel, modelsPath: string): Promise<void> {
  try {
    const modelPath = path.isAbsolute(modelsPath)
      ? path.join(modelsPath, `engine_${level}.onnx`)
      : path.join(process.cwd(), modelsPath, `engine_${level}.onnx`)
    session = await ort.InferenceSession.create(modelPath)
  } catch (e) {
    console.error('[ERROR] Loading model was unsuccessful:', e)
    throw e
  }
}

export async function evaluateBoardRaw(board: number[], move: number): Promise<number> {
  try {
    if (!session) {
      throw new Error('ONNX Session not initialized')
    }
    const combinedData = new Float32Array(33)
    combinedData.set(board)
    combinedData[32] = move
    const tensor = new ort.Tensor('float32', combinedData, [1, 33])
    const feeds = { [session.inputNames[0]]: tensor }
    const results = await session.run(feeds)
    return (results[session.outputNames[0]] as ort.Tensor).data[0] as number
  } catch (error) {
    console.error('Evaluation failed:', error)
    throw error
  }
}
