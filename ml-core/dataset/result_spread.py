import json
from collections import Counter

INPUT_FILE_PATH = "../data/games_2026-03-07T00-11-46-433Z.json"

with open(INPUT_FILE_PATH) as f:
    data = json.load(f)

results = [item["result"] for item in data]

counter = Counter(results)
total = len(results)

print("Total:", total)
print()

for value, count in sorted(counter.items()):
    print(f"{value}: {count} ({count/total:.4%})")
