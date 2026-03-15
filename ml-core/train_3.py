# !pip install onnx onnxruntime onnxscript
import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset, random_split
import pandas as pd

KAGGLE_NICKNAME = os.environ.get("KAGGLE_NICKNAME", "KAGGLE_NICKNAME")
DATA_DIR = f"/kaggle/input/datasets/{KAGGLE_NICKNAME}/games-1"
MODELS_DIR = "/kaggle/working"

INPUT_FILE_PATH = f"{DATA_DIR}/games_2026-03-14T21-36-45-156Z.json"
OUTPUT_FILE_PATH = f"{MODELS_DIR}/engine_3.onnx"

MAX_EPOCHS = 200
BATCH_SIZE = 4096
LEARNING_RATE = 0.002
EARLY_STOPPING_PATIENCE = 15
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def load_data(file_path):
    print(f"Loading data from {file_path}...")

    df = pd.read_json(file_path)

    X = df[["board", "move"]].apply(
        lambda row: list(row["board"]) + [row["move"]], axis=1
    )
    X = torch.tensor(X.to_list(), dtype=torch.float32)

    eval_t = torch.tensor(df["eval"].to_numpy(), dtype=torch.float32).reshape(-1, 1)
    result_t = torch.tensor(df["result"].to_numpy(), dtype=torch.float32).reshape(-1, 1)

    return TensorDataset(X, eval_t, result_t)


class CheckersNet(nn.Module):
    def __init__(self):
        super(CheckersNet, self).__init__()
        self.network = nn.Sequential(
            nn.Linear(33, 512),
            nn.BatchNorm1d(512),
            nn.LeakyReLU(0.1),
            nn.Dropout(0.1),
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.LeakyReLU(0.1),
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.LeakyReLU(0.1),
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.LeakyReLU(0.1),
            nn.Linear(64, 1),
            nn.Tanh(),
        )

        self.w = nn.Parameter(torch.randn(2))

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

    print(f"Training on {train_size} examples, validation on {val_size}.")

    for epoch in range(MAX_EPOCHS):
        # Training
        model.train()
        train_loss = 0
        for batch_x, batch_eval, batch_result in train_loader:
            batch_x = batch_x.to(DEVICE)
            batch_eval = batch_eval.to(DEVICE)
            batch_result = batch_result.to(DEVICE)
            weights = torch.softmax(model.w, dim=0)
            batch_y = weights[0] * batch_eval + weights[1] * batch_result

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
            for v_x, v_eval, v_result in val_loader:
                v_x = v_x.to(DEVICE)
                v_eval = v_eval.to(DEVICE)
                v_result = v_result.to(DEVICE)
                v_weights = torch.softmax(model.w, dim=0)
                v_y = v_weights[0] * v_eval + v_weights[1] * v_result

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
            if patience_counter >= EARLY_STOPPING_PATIENCE:
                print("Early stopping triggered.")
                break

    model.load_state_dict(torch.load("best_model.pth", map_location=DEVICE))
    model.eval()
    weights = torch.softmax(model.w, dim=0)
    print(f"Eval/result weights: {weights[0].item():.3f} : {weights[1].item():.3f}")
    print("Exporting to ONNX...")
    dummy_input = torch.randn(1, 33).to(DEVICE)
    torch.onnx.export(model, dummy_input, OUTPUT_FILE_PATH)
    print(f"File {OUTPUT_FILE_PATH} exported successfully.")


if __name__ == "__main__":
    train()
