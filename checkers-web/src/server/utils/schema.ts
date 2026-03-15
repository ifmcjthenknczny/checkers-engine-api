import { z } from 'zod'
import type { H3Event } from 'h3'
import { COLORS, ALLOWED_SQUARE_CONTENT } from '~/types'


export const BodyRequestSchema = z.object({
  board: z
    .array(z.number().int())
    .length(32, 'Array must have exactly 32 elements')
    .refine((arr) => arr.every((val) => ALLOWED_SQUARE_CONTENT.includes(val as typeof ALLOWED_SQUARE_CONTENT[number])), {
      message: 'Allowed values are: 0 (empty), 1/-1 (pawns), 3/-3 (queens)',
    }),
  move: z.enum(COLORS),
  depth: z.coerce.number().int().min(0).max(MAX_DEPTH).default(DEFAULT_DEPTH),
})

export async function parseBodyOrThrow<T>(event: H3Event, schema: z.ZodSchema<T>): Promise<T> {
  const result = schema.safeParse(await readBody(event))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }
  return result.data
}
