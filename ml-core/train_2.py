import json
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from torch.utils.data import DataLoader, TensorDataset, random_split
import pandas as pd

DATA_DIR = "/kaggle/input/datasets/KAGGLE_NICKNAME/checkers-0random"
MODELS_DIR = "/kaggle/working"

INPUT_FILE_PATH = f"{DATA_DIR}/games_2026-03-06T15-35-29-494Z.json"
OUTPUT_FILE_PATH = f"{MODELS_DIR}/engine_2.onnx"

MAX_EPOCHS = 300
BATCH_SIZE = 8192
LEARNING_RATE = 0.001
EVAL_DROPOUT_PROB = 0.3
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def load_data(file_path):
    print(f"Loading data from {file_path}...")

    df = pd.read_json(file_path)

    X = df[["board", "move", "eval"]].apply(
        lambda row: list(row["board"]) + [row["move"] + row["eval"]], axis=1
    )
    X = torch.tensor(X.to_list(), dtype=torch.float32)

    y = torch.tensor(df["result"].to_list(), dtype=torch.float32).reshape(-1, 1)

    return TensorDataset(X, y)


class CheckersNet(nn.Module):
    def __init__(self):
        super(CheckersNet, self).__init__()
        self.network = nn.Sequential(
            nn.Linear(34, 256),
            nn.BatchNorm1d(256),
            nn.LeakyReLU(0.1),
            nn.Dropout(0.1),
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.LeakyReLU(0.1),
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.LeakyReLU(0.1),
            nn.Linear(64, 1),
            nn.Tanh(),
        )

    def forward(self, x):
        return self.network(x)


def train():
    print(f"Using device: {DEVICE}")
    full_dataset = load_data(INPUT_FILE_PATH)
    train_size = int(0.9 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_subset, val_subset = random_split(full_dataset, [train_size, val_size])

    train_loader = DataLoader(
        train_subset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=4,
        pin_memory=True,
    )
    val_loader = DataLoader(
        val_subset, batch_size=BATCH_SIZE, shuffle=False, num_workers=4, pin_memory=True
    )

    model = CheckersNet().to(DEVICE)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, "min", patience=5, factor=0.5
    )

    # early stopping params
    best_val_loss = float("inf")
    patience_counter = 0
    max_patience = 20

    print(f"Training on {train_size} examples, validation on {val_size}.")

    for epoch in range(MAX_EPOCHS):
        # Training
        model.train()
        train_loss = 0
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(DEVICE), batch_y.to(DEVICE)
            if EVAL_DROPOUT_PROB > 0:
                mask = torch.rand(batch_x.size(0), 1, device=DEVICE) > EVAL_DROPOUT_PROB
                batch_x = batch_x.clone()
                batch_x[:, -1] = batch_x[:, -1] * mask.squeeze(-1)

            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            train_loss += loss.item()

        # Validation
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for v_x, v_y in val_loader:
                v_x, v_y = v_x.to(DEVICE), v_y.to(DEVICE)

                if EVAL_DROPOUT_PROB > 0:
                    v_x = v_x.clone()
                    mask = torch.rand(v_x.size(0), 1, device=DEVICE) > EVAL_DROPOUT_PROB
                    v_x[:, -1] = v_x[:, -1] * mask.squeeze(-1)

                v_out = model(v_x)
                v_loss = criterion(v_out, v_y)
                val_loss += v_loss.item()

        avg_train_loss = train_loss / len(train_loader)
        avg_val_loss = val_loss / len(val_loader)

        scheduler.step(avg_val_loss)

        print(
            f"Epoch [{epoch+1}/{MAX_EPOCHS}] Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f}"
        )

        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            patience_counter = 0
            torch.save(model.state_dict(), "best_model.pth")
        else:
            patience_counter += 1
            if patience_counter >= max_patience:
                print("Early stopping triggered.")
                break

    model.load_state_dict(torch.load("best_model.pth"))
    model.eval()
    print("Exporting to ONNX...")
    dummy_input = torch.randn(1, 34).to(DEVICE)
    torch.onnx.export(model, dummy_input, OUTPUT_FILE_PATH)
    print(f"File {OUTPUT_FILE_PATH} exported successfully.")


if __name__ == "__main__":
    train()
