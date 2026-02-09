import * as ort from 'onnxruntime-node';
import path from 'path';

let session: ort.InferenceSession | null = null;

export async function loadModel(level = 1) {
    try {
        const modelPath = path.join(__dirname, `../../models/engine_${level}.onnx`);
        session = await ort.InferenceSession.create(modelPath);
        console.log(`AI position evaluation model of level ${level} loaded successfully!`);
    } catch (e) {
        console.error("[ERROR] Loading model was unsuccessful:", e);
        process.exit(1);
    }
}

// TODO: max depth ~5
// TODO: minmax depth algorithm for better predictions
// TODO: who is to move and who do we maximize?
// export async function evaluatePositionWithDepth(
//     board: number[], 
//     depth: number, 
//     isMaximizingPlayer: boolean
// ): Promise<number> {
//     if (depth === 0) {
//         return await evaluateBoardRaw(board);
//     }

    // TODO: board state after moves
//     const moves = getPossibleMoves(board, isMaximizingPlayer ? 1 : -1);

//     if (moves.length === 0) {
//         return isMaximizingPlayer ? -1 : 1;
//     }

//     if (isMaximizingPlayer) {
//         let maxEval = -Infinity;
//         for (const move of moves) {
//             const evalResult = await evaluatePositionWithDepth(move, depth - 1, false);
//             maxEval = Math.max(maxEval, evalResult);
//         }
//         return maxEval;
//     } else {
//         let minEval = Infinity;
//         for (const move of moves) {
//             const evalResult = await evaluatePositionWithDepth(move, depth - 1, true);
//             minEval = Math.min(minEval, evalResult);
//         }
//         return minEval;
//     }
// }

export async function evaluateBoardRaw(board: number[], move: number): Promise<number> {
    try {
        if (!session) {
            throw new Error("ONNX Session not initialized");
        }
        const combinedData = new Float32Array(33);
        combinedData.set(board);
        combinedData[32] = move;
        const tensor = new ort.Tensor('float32', combinedData, [1, 33]);
        const feeds = { [session!.inputNames[0]]: tensor };
        const results = await session!.run(feeds);
        return results[session!.outputNames[0]].data[0] as number;
    } catch (error) {
        console.error("Evaluation failed:", error);
        throw error;
    }
}