# ts-checkers-engine-api

A checkers app (8×8, 32 playable squares) with a neural-network-based position evaluation engine. It consists of a Vue frontend, an evaluation API and a model training pipeline (PyTorch → ONNX).

The **frontend** (`checkers-web`) is an upgrade and a complete rewrite of the original 2022 pure vanilla JS project — [here](https://github.com/ifmcjthenknczny/jsCheckers), which were my humble no-framework beginnings.

## Project structure

- **checkers-web** — Nuxt frontend: board, gameplay, position analysis using the ONNX model with API
- **ml-core** — Model training (PyTorch): loading data, training, export to ONNX
- **models** — Exported ONNX models used by the app

## Running the project

- **Frontend:** In `checkers-web`: `yarn install`, `yarn dev`. Should be available at `localhost:3000`.
- **Training:** In `ml-core`: `uv sync`, then `uv run train.py` (data from `../data/`, model written to `../models/`)

## API reference

The backend exposes a small HTTP API (Nuxt server routes). All engine endpoints require a model level in the URL path (`1`, `2`, or `3`, corresponding to `engine_1.onnx` … `engine_3.onnx`).

---

### `GET /api/health`

Returns a minimal liveness check.

**Response**

```json
{ "ok": true }
```

---

### `POST /api/engine/eval/:modelLevel`

Evaluates a board position to an arbitrary search depth using minimax (with optional alpha-beta / variant pruning depending on `PRUNE_CONFIG`).

**URL parameters**

| Parameter    | Type    | Description                              |
|--------------|---------|------------------------------------------|
| `modelLevel` | integer | Model to use for leaf evaluation (1–3). |

**Request body** (JSON)

| Field              | Type              | Required | Default                    | Description |
|--------------------|-------------------|----------|----------------------------|-------------|
| `board`            | `number[32]`      | yes      | —                          | Board state as a flat array of 32 playable squares in standard checkers order. Allowed values: `0` (empty), `1` (white pawn), `-1` (black pawn), `3` (white queen), `-3` (black queen). |
| `move`             | `"white"│"black"` | yes      | —                          | The player whose turn it is. |
| `depth`            | integer (0–20)    | no       | `6`                        | Minimax search depth. `0` returns the raw neural-network score for the given position. |
| `useNonDeterministic` | boolean        | no       | `false`                    | Ignored by this endpoint (used by the continuation endpoint only). |

**Response**

```json
{
  "evaluation": 0.312,
  "status": "success"
}
```

`evaluation` is a float in `[-1, 1]`: values near `1` favour white, near `-1` favour black.

---

### `POST /api/engine/continuation/:modelLevel`

Returns the best sequence of moves (continuation) for the player to move, evaluated to a given search depth. Supports an optional non-deterministic mode that adds controlled randomness to move selection.

**URL parameters**

| Parameter    | Type    | Description                              |
|--------------|---------|------------------------------------------|
| `modelLevel` | integer | Model to use for leaf evaluation (1–3). |

**Request body** (JSON)

| Field                 | Type              | Required | Default | Description |
|-----------------------|-------------------|----------|---------|-------------|
| `board`               | `number[32]`      | yes      | —       | Board state (same encoding as `/eval`). |
| `move`                | `"white"│"black"` | yes      | —       | The player whose turn it is. |
| `depth`               | integer (0–20)    | no       | `6`     | Search depth. |
| `useNonDeterministic` | boolean           | no       | `false` | When `true`, the engine does **not** always pick the single best move. Instead it collects all candidates whose deep score falls within `NON_DETERMINISTIC_CONFIG.scoreDelta` (default `0.02`) of the best score and samples one of them with probability **proportional to the score advantage** over the worst eligible candidate. This means the top move is still most likely to be chosen, but near-equal alternatives are occasionally played, producing less predictable opponents and more varied self-play data. Alpha-beta early cutoffs are disabled for the candidate loop when this flag is set, so that all shortlisted moves are fully evaluated before sampling. |

**Response**

```json
{
  "continuation": [
    { "fromIndex": 21, "toIndex": 17, "isCapture": false, "isPotentialPromotion": false },
    { "fromIndex": 17, "toIndex": 13, "isCapture": true, "captureIndex": 15, "followingChainedCaptureForbiddenDirection": [-1, 1], "isPotentialPromotion": false }
  ]
}
```

`continuation` is an ordered array of `Move` objects representing the full legal move sequence (multi-jump captures are returned as a chain). An empty array means the current player has no legal moves (game over).

**`Move` object fields**

| Field                                    | Type      | Description |
|------------------------------------------|-----------|-------------|
| `fromIndex`                              | integer   | Source square index (0–31, standard checkers numbering). |
| `toIndex`                                | integer   | Destination square index. |
| `isCapture`                              | boolean   | Whether this step captures an opponent piece. |
| `captureIndex`                           | integer   | *(only when `isCapture: true`)* Index of the captured square. |
| `followingChainedCaptureForbiddenDirection` | `[number, number]` | *(only when `isCapture: true`)* Direction vector `[rowDir, colDir]` that the piece may not continue in, used to prevent reversing back along the same diagonal in chain captures. |
| `isPotentialPromotion`                   | boolean   | Whether this step may result in a king promotion. |

---

### `GET /api/scrape` *(development only)*

Triggers a background self-play data generation task. Returns immediately with a `started` status while the task runs asynchronously on the server. **Only available when `NODE_ENV=development`.**

**Query parameters**

| Parameter    | Type    | Required | Default | Description |
|--------------|---------|----------|---------|-------------|
| `games`      | integer | yes      | `1000`  | Number of self-play games to generate (max `100 000`). |
| `modelLevel` | integer | yes      | —       | Engine model to use during self-play (0 = random moves, 1–3 = engine). |
| `random`     | float   | yes      | —       | Base probability (`0`–`1`) that each move is chosen randomly instead of by the engine. Early game turns have a higher effective random probability that decreases linearly until the base value is reached. |
| `depth`      | integer | no       | `0`     | Minimax depth used by the engine during self-play (0 = shallow eval only). |

**Response**

```json
{
  "status": "started",
  "games": 1000,
  "modelLevel": 3,
  "random": 0.2,
  "depth": 3
}
```

Generated data is written as JSON files to `../data/games_<timestamp>/` relative to the server working directory.

---

## Model training — iterations

### Iteration 1

- **Dataset:** 100,000 games played with **random moves** against itself — at each position a random legal move is chosen according to standard checkers rules (diagonal moves and jumps, mandatory captures, queens). **Result distribution** (4 937 021 samples): −1 (black wins) 51.09%, 0 (draw) 0.07%, 1 (white wins) 48.84%.
- **Model:** MLP (33 inputs: 32 squares + side to move; single output in [-1, 1]). Layers: 512→256→128→64→1, BatchNorm, LeakyReLU, Dropout, Tanh at the end. Exported as `engine_1.onnx`.
- **Training:** MSE, Adam (lr 0.002), 90% train / 10% validation split, early stopping (patience 20), ReduceLROnPlateau, batch size 8192, up to 200 epochs. Run finished after **103 epochs** (early stopping); final Train Loss **0.7030**→**0.6155**, Val Loss **0.6948**→**0.6629**, which is not impressive.

### Iteration 2

- **Dataset:** Games are generated by **self-play** in the app: the Nuxt backend runs `playGame()` from `checkers-web/src/server/utils/scrape.ts`, where the previous model (engine_1) plays against itself 100,000 times. At each turn, with constant probability **random coefficient 0.3** a random legal move is chosen so that the previous model is not deterministic; otherwise the model picks the best continuation. Each recorded position includes board, side to move, **evaluation** (engine_1 score at that position, rounded to 6 decimals) and **result** (game outcome: −1 or 1). **Result distribution** (4 953 589 samples): −1 (black wins) 47.89%, 1 (white wins) 52.11%.
- **Model:** MLP with **33 inputs**: 32 board squares + side to move. Layout: 256→128→64→1, BatchNorm, LeakyReLU(0.1), Dropout(0.1) after first layer, Tanh. Exported as `engine_2.onnx`.
- **Training:** MSE, Adam lr **0.002**, weight decay 1e−4, 90/10 split, early stopping patience 20, ReduceLROnPlateau (patience 5, factor 0.5), batch **4096**, **200** epochs max, gradient clipping 1.0. **Target:** blend of engine evaluation and game result — learnable softmax weights `w` combine `eval` and `result` into the regression target; the network finds optimal weighting (which turned out to be `0.946`/`0.054`). Run finished after **200 epochs**; final Train Loss **0.0633**→**0.0386**, Val Loss **0.0536**→**0.0360**.

### Iteration 3 (current model)

- **Dataset:** Generated like iteration 2 (self-play in Nuxt, `playGame()` in `checkers-web/src/server/utils/scrape.ts`), with parameters **100,000 games**, **modelLevel 2** (engine_2), **random 0.2**, **depth 3**. **Random move probability** varies: early in the game the probability of a random move is higher (starts at 1) and decreases linearly to the `random` value and from turn 6 onwards a constant `randomCoefficient` is used. **Minimax depth** move choice uses `pickBestEngineContinuation(..., depth)`, with introduced minimax algorithm, that basically checks what's the move to do now that leads to the best position after 3 next moves. Position and evaluation recording as in iteration 2 (including turn filtering via `shouldSaveMove` - the higher the turn, the higher probability to save position to the dataset). **Result distribution** (4 019 772 samples): −1 (black wins) 46.16%, 0 (draw) 6.60%, 1 (white wins) 47.24%.
- **Model:** MLP with **33 inputs**: 32 board squares + side to move. Layout: 512→256→128→64→1, BatchNorm and LeakyReLU(0.1) after every layer, Dropout(0.1) after the first layer, Tanh at the end. Larger capacity than iteration 2 (added 512-unit layer at the front). Exported as `engine_3.onnx`.
- **Training:** MSE, Adam lr **0.002**, weight decay 1e−4, 90% training/10% validation split, early stopping patience **15** (min delta 1e−4), ReduceLROnPlateau (patience 5, factor 0.5), batch **4096**, **200** epochs max, gradient clipping 1.0. **Target:** fixed-weight blend of engine evaluation and game result — **0.3 × eval + 0.7 × result** (unlike iteration 2's learnable softmax weights). Run finished after **116 epochs**; final Train Loss **0.2791**→**0.2577**, Val Loss **0.2768**→**0.2578**.

## TODO
* Frontend view improvements (shorter board on desktop, better mobile experience with drag&drop).
* Add input to choose `modelLevel` in `learn`.

* Captured pieces in `learn` module.
* Move animation overlay into separate component.
* Simplified components to reduce reliance on global state.

* Train model level 4 using previous model with huge depth and alpha/beta algorithm that is getting rid of pointless paths.

* Switch from API calls to websocket communication.

* Deployment to a service that will gladly handle this 375 MB serverless app (ONNX package weighs this much) or change approach.

## License

This work is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/).

## Contact

For questions or feedback, please reach out via GitHub.
[ifmcjthenknczny](https://github.com/ifmcjthenknczny)  

Project Link: [https://github.com/ifmcjthenknczny/ts-checkers-engine-api](https://github.com/ifmcjthenknczny/ts-checkers-engine-api)
