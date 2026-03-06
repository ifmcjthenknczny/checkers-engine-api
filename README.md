# ts-checkers-engine-api

A checkers app (8×8, 32 playable squares) with a neural-network-based position evaluation engine. It consists of a Vue frontend, an evaluation API and a model training pipeline (PyTorch → ONNX).

The **frontend** (`checkers-ui-vue`) is an upgrade and a complete rewrite of the original 2022 pure vanilla JS project — [here](https://github.com/ifmcjthenknczny/jsCheckers), which were my humble no-framework beginnings.

## Project structure

- **checkers-ui-vue** — Nuxt (Vue) frontend: board, gameplay, position analysis using the ONNX model
- **ml-core** — Model training (PyTorch): loading data, training, export to ONNX
- **models/** — Exported ONNX models used by the app

## Running the project

- **Frontend:** In `checkers-ui-vue`: `yarn install`, `yarn dev`. Should be available at `localhost:3000`.
- **Training:** In `ml-core`: `uv sync`, then `uv run python train.py` (data from `../data/`, model written to `../models/`)

## Model training — iterations

### Iteration 1 (current model)

- **Dataset:** 10,000 games played with **random moves** against itself — at each position a random legal move is chosen according to standard checkers rules (diagonal moves and jumps, mandatory captures, kings).
- **Data source:** Games replayed in the old UI (`checkers-ui`), with board states and game results saved via `data-server` to a JSON file (e.g. `game_history_2.json`). Each entry: board (32 squares: 0, ±1, ±3), side to move (1 white / -1 black), game result (1 / 0 / -1).
- **Model:** MLP (33 inputs: 32 squares + side to move; single output in [-1, 1]). Layers: 1024→512→256→128→64→1, BatchNorm, LeakyReLU, Dropout, Tanh at the end.
- **Training:** MSE, Adam (lr 0.005), 90% train / 10% validation split, early stopping (patience 20), ReduceLROnPlateau, batch size 1024, up to 200 epochs. Export to ONNX in `models/`.

## License

This work is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/).

## Contact

For questions or feedback, please reach out via GitHub.
[ifmcjthenknczny](https://github.com/ifmcjthenknczny)  

Project Link: [https://github.com/ifmcjthenknczny/ts-checkers-engine-api](https://github.com/ifmcjthenknczny/ts-checkers-engine-api)