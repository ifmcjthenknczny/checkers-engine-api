# Multi-stage build: Nuxt (Nitro aws-lambda) + AWS Lambda Node.js container image.
# Native deps (onnxruntime-node) must match the Lambda runtime Node version — keep builder and final image on the same major.

FROM node:24-bookworm-slim AS builder

WORKDIR /app

RUN corepack enable

COPY models/ ./models/

COPY checkers-web/package.json checkers-web/yarn.lock checkers-web/.yarnrc.yml ./checkers-web/

WORKDIR /app/checkers-web

RUN yarn install --immutable

COPY checkers-web/ ./

ENV NODE_ENV=production
ENV NITRO_PRESET=aws-lambda

RUN yarn build

FROM public.ecr.aws/lambda/nodejs:24

# Nitro .output layout: server/ and sibling public/ (resolved as ../public from /var/task)
COPY --from=builder /app/checkers-web/.output/server ${LAMBDA_TASK_ROOT}/
COPY --from=builder /app/checkers-web/.output/public /var/public/

COPY --from=builder /app/models ${LAMBDA_TASK_ROOT}/models

ENV NUXT_MODELS_PATH=models

CMD ["index.handler"]
