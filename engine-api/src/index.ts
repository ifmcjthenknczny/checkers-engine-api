import express, { Request, Response } from 'express';
import { z } from 'zod';
import { loadModel, evaluateBoardRaw } from './model';

const PORT = process.env.PORT || 3002;

const app = express();
app.use(express.json());

// TODO: Map them to human form
const ALLOWED_PIECES = [0, 1, -1, 3, -3]
const ALLOWED_MOVES = [-1, 1]

const EvalSchema = z.object({
    board: z.array(z.number().int())
        .length(32, "Array must have exactly 32 elements")
        .refine(arr => arr.every(val => ALLOWED_PIECES.includes(val)), {
            message: "Allowed values are: 0 (empty), 1/-1 (pawns), 3/-3 (queens)"
        }),
    move: z
    .number()
    .int()
    .refine((val) => ALLOWED_MOVES.includes(val), {
      message: "Move must be 1 (White) or -1 (Black)",
    }),
  })

// TODO: get model level and depth (default is 1) from body
app.post('/evaluate', async (req: Request, res: Response) => {
    const result = EvalSchema.safeParse(req.body);
    
    if (!result.success) {
        return res.status(400).json({ 
            error: "Invalid input", 
            details: result.error.format() 
        });
    }

    // const evaluation = await evaluateBoard(result.data.board);
    const evaluation = await evaluateBoardRaw(result.data.board, result.data.move);

    res.json({
        evaluation,
        status: "success"
    });
});

// TODO: load all models
loadModel().then(() => {
    app.listen(PORT, () => {
        console.log(`API works on port ${PORT}`);
    });
});