import json
from pathlib import Path


def merge_data(directory: str) -> str:
    directory = Path(directory).resolve()
    output_path = directory.parent / (directory.name + ".json")

    merged = []
    for file in sorted(directory.glob("*.json")):
        with open(file) as f:
            merged.extend(json.load(f))

    with open(output_path, "w") as f:
        json.dump(merged, f)

    print(f"Merged {len(merged)} records from {directory.name}/ -> {output_path}")
    return str(output_path)


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print("Usage: python merge_data.py <directory>")
        sys.exit(1)

    merge_data(sys.argv[1])
