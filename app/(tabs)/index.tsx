import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const getNeighbors = (
  r: number,
  c: number,
  size: number,
): [number, number][] => {
  const neighbors: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        neighbors.push([nr, nc]);
      }
    }
  }
  return neighbors;
};

const countBombs = (
  grid: number[][],
  r: number,
  c: number,
  size: number,
): number => {
  let count = 0;
  const neighbors = getNeighbors(r, c, size);
  for (const [nr, nc] of neighbors) {
    if (grid[nr][nc] === -1) count++;
  }
  return count;
};

const generateGrid = (size: number, bombCount: number): number[][] => {
  const grid: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(0),
  );
  const bombs = new Set<number>();
  const totalCells = size * size;
  const actualBombs = Math.min(bombCount, totalCells - 1);

  while (bombs.size < actualBombs) {
    const pos = Math.floor(Math.random() * totalCells);
    bombs.add(pos);
  }

  for (const pos of bombs) {
    const r = Math.floor(pos / size);
    const c = pos % size;
    grid[r][c] = -1;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== -1) {
        grid[r][c] = countBombs(grid, r, c, size);
      }
    }
  }

  return grid;
};

const checkWin = (grid: number[][], revealed: boolean[][]): boolean => {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid.length; c++) {
      if (grid[r][c] !== -1 && !revealed[r][c]) {
        return false;
      }
    }
  }
  return true;
};

export default function App() {
  const [size, setSize] = useState(8);
  const [inputSize, setInputSize] = useState("8");
  const [inputBombs, setInputBombs] = useState("10");
  const [grid, setGrid] = useState<number[][]>([]);
  const [revealed, setRevealed] = useState<boolean[][]>([]);
  const [flagged, setFlagged] = useState<boolean[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [flagMode, setFlagMode] = useState(false);

  useEffect(() => {
    handleRegenerate();
  }, []);

  const handleRegenerate = () => {
    const newSize = parseInt(inputSize) || 8;
    const newBombs = parseInt(inputBombs) || 10;
    const validSize = Math.max(2, Math.min(newSize, 20));
    const validBombs = Math.max(
      1,
      Math.min(newBombs, validSize * validSize - 1),
    );

    setSize(validSize);
    setInputSize(String(validSize));
    setInputBombs(String(validBombs));
    setGameOver(false);
    setWin(false);
    setFlagMode(false);

    const newGrid = generateGrid(validSize, validBombs);
    setGrid(newGrid);
    setRevealed(
      Array.from({ length: validSize }, () => Array(validSize).fill(false)),
    );
    setFlagged(
      Array.from({ length: validSize }, () => Array(validSize).fill(false)),
    );
  };

  const revealCell = (r: number, c: number) => {
    if (gameOver || win || revealed[r][c] || flagged[r][c]) return;

    const newRevealed = revealed.map((row) => [...row]);
    const queue: [number, number][] = [[r, c]];
    let hitBomb = false;

    while (queue.length > 0) {
      const [cr, cc] = queue.shift()!;
      if (newRevealed[cr][cc]) continue;
      newRevealed[cr][cc] = true;

      if (grid[cr][cc] === -1) {
        hitBomb = true;
        continue;
      }

      if (grid[cr][cc] === 0) {
        const neighbors = getNeighbors(cr, cc, size);
        for (const [nr, nc] of neighbors) {
          if (!newRevealed[nr][nc] && !flagged[nr][nc]) {
            queue.push([nr, nc]);
          }
        }
      }
    }

    if (hitBomb) {
      setGameOver(true);
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (grid[i][j] === -1) {
            newRevealed[i][j] = true;
          }
        }
      }
      Alert.alert("Game Over", "You clicked on a bomb!");
    } else if (checkWin(grid, newRevealed)) {
      setWin(true);
      Alert.alert("You Win!", "All safe cells revealed!");
    }

    setRevealed(newRevealed);
  };

  const toggleFlag = (r: number, c: number) => {
    if (gameOver || win || revealed[r][c]) return;
    const newFlagged = flagged.map((row) => [...row]);
    newFlagged[r][c] = !newFlagged[r][c];
    setFlagged(newFlagged);
  };

  const handleCellPress = (r: number, c: number) => {
    if (flagMode) {
      toggleFlag(r, c);
    } else {
      revealCell(r, c);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Minesweeper</Text>

      {win && (
        <View style={styles.winBanner}>
          <Text style={styles.winText}>🎉 YOU WIN! 🎉</Text>
        </View>
      )}

      {gameOver && (
        <View style={styles.loseBanner}>
          <Text style={styles.loseText}>💥 GAME OVER 💥</Text>
        </View>
      )}

      <View style={styles.grid}>
        {grid.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((_, c) => {
              const isRevealed = revealed[r]?.[c];
              const isFlagged = flagged[r]?.[c];
              const value = grid[r]?.[c];

              return (
                <TouchableOpacity
                  key={`${r}-${c}`}
                  style={[styles.cell, isRevealed && styles.cellRevealed]}
                  onPress={() => handleCellPress(r, c)}
                >
                  <Text style={styles.cellText}>
                    {isRevealed
                      ? value === -1
                        ? "💣"
                        : value === 0
                          ? ""
                          : String(value)
                      : isFlagged
                        ? "🚩"
                        : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.modeButton, flagMode && styles.modeButtonActive]}
        onPress={() => setFlagMode(!flagMode)}
      >
        <Text style={styles.modeButtonText}>
          {flagMode ? "🚩 Flag Mode ON" : "⛏️ Reveal Mode"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Enter Rows/Columns:</Text>
      <TextInput
        style={styles.input}
        value={inputSize}
        onChangeText={setInputSize}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Number of Bombs:</Text>
      <TextInput
        style={styles.input}
        value={inputBombs}
        onChangeText={setInputBombs}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.button} onPress={handleRegenerate}>
        <Text style={styles.buttonText}>REGENERATE</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    marginBottom: 10,
    fontWeight: "bold",
  },
  grid: {
    marginVertical: 10,
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
  },
  cellRevealed: {
    backgroundColor: "#fff",
  },
  cellText: {
    fontSize: 12,
  },
  modeButton: {
    marginTop: 10,
    backgroundColor: "#757575",
    padding: 10,
    width: "100%",
    alignItems: "center",
    borderRadius: 5,
  },
  modeButtonActive: {
    backgroundColor: "#ff9800",
  },
  modeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  label: {
    marginTop: 10,
    fontWeight: "600",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    textAlign: "center",
    backgroundColor: "#fff",
    marginTop: 5,
  },
  button: {
    marginTop: 15,
    backgroundColor: "#2196f3",
    padding: 12,
    width: "100%",
    alignItems: "center",
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  winBanner: {
    backgroundColor: "#4caf50",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: "100%",
    alignItems: "center",
  },
  winText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loseBanner: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: "100%",
    alignItems: "center",
  },
  loseText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
