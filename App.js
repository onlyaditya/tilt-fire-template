import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions, Text, Pressable, TouchableWithoutFeedback } from "react-native";
import { Accelerometer } from "expo-sensors";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;

const BLOCK_WIDTH = 40;
const BLOCK_HEIGHT = 40;

const BULLET_WIDTH = 10;
const BULLET_HEIGHT = 20;

export default function App() {
  const [playerX, setPlayerX] = useState((screenWidth - PLAYER_WIDTH) / 2);
  const [blocks, setBlocks] = useState([]);
  const [bullets, setBullets] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  // Restart game
  const restartGame = () => {
    setBlocks([]);
    setBullets([]);
    setPlayerX((screenWidth - PLAYER_WIDTH) / 2);
    setScore(0);
    setGameOver(false);
  };

  // Player movement
  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    const subscription = Accelerometer.addListener(({ x }) => {
      if (gameOver) return;
      const moveBy = x * -30;
      setPlayerX((prev) => {
        const newX = prev + moveBy;
        return Math.max(0, Math.min(screenWidth - PLAYER_WIDTH, newX));
      });
    });
    return () => subscription.remove();
  }, [gameOver]);

  // Spawn blocks
  useEffect(() => {
    if (gameOver) return;
    const spawnInterval = setInterval(() => {
      const randomX = Math.random() * (screenWidth - BLOCK_WIDTH);
      setBlocks((prev) => [...prev, { id: Date.now(), x: randomX, y: -BLOCK_HEIGHT }]);
    }, 800);
    return () => clearInterval(spawnInterval);
  }, [gameOver]);

  // Move blocks & check collisions with player and bottom
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setBlocks((prevBlocks) => {
        const updatedBlocks = [];

        prevBlocks.forEach((block) => {
          const newY = block.y + 5;

          // collision with player
          const playerTop = screenHeight - PLAYER_HEIGHT - 20;
          const playerLeft = playerX;
          const playerRight = playerX + PLAYER_WIDTH;
          const blockBottom = newY + BLOCK_HEIGHT;

          const collisionWithPlayer =
            blockBottom >= playerTop &&
            newY <= playerTop + PLAYER_HEIGHT &&
            block.x < playerRight &&
            block.x + BLOCK_WIDTH > playerLeft;

          if (collisionWithPlayer || newY + BLOCK_HEIGHT >= screenHeight) {
            setGameOver(true); // Game over if block hits player or bottom
          }

          // Keep block if not off-screen
          if (newY + BLOCK_HEIGHT < screenHeight) updatedBlocks.push({ ...block, y: newY });
        });

        return updatedBlocks;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [playerX, gameOver]);

  // Move bullets and handle collisions
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setBullets((prevBullets) =>
        prevBullets
          .map((b) => ({ ...b, y: b.y - 10 }))
          .filter((b) => b.y + BULLET_HEIGHT > 0)
      );

      setBlocks((prevBlocks) => {
        const newBlocks = [];
        const bulletsToRemove = new Set();

        prevBlocks.forEach((block) => {
          let hit = false;
          bullets.forEach((bullet) => {
            const collision =
              bullet.x < block.x + BLOCK_WIDTH &&
              bullet.x + BULLET_WIDTH > block.x &&
              bullet.y < block.y + BLOCK_HEIGHT &&
              bullet.y + BULLET_HEIGHT > block.y;

            if (collision) {
              hit = true;
              bulletsToRemove.add(bullet.id);
            }
          });

          if (!hit) newBlocks.push(block);
          else setScore((prev) => prev + 1);
        });

        // Remove bullets that hit blocks
        setBullets((prevBullets) => prevBullets.filter((b) => !bulletsToRemove.has(b.id)));

        return newBlocks;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [bullets, gameOver]);

  // Fire bullet on screen tap
  const fireBullet = () => {
    if (gameOver) return;

    setBullets((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: playerX + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
        y: screenHeight - PLAYER_HEIGHT - 20 - BULLET_HEIGHT,
      },
    ]);
  };

  return (
    <TouchableWithoutFeedback onPress={fireBullet}>
      <View style={styles.container}>
        <Pressable style={styles.restartButton} onPress={restartGame}>
          <Text style={styles.restartButtonText}>Restart</Text>
        </Pressable>

        <Text style={styles.scoreText}>Score: {score}</Text>

        <View style={[styles.player, { left: playerX }]} />

        {blocks.map((block) => (
          <View key={block.id} style={[styles.fallingBlock, { left: block.x, top: block.y }]} />
        ))}

        {bullets.map((bullet) => (
          <View key={bullet.id} style={[styles.bullet, { left: bullet.x, top: bullet.y }]} />
        ))}

        {gameOver && <Text style={styles.gameOverText}>GAME OVER</Text>}

        <Text style={styles.instruction}>Tilt to move, tap anywhere to shoot</Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "flex-end", alignItems: "center", paddingBottom: 60 },
  restartButton: { position: "absolute", top: 20, right: 20, backgroundColor: "#FFF", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6, borderWidth: 2, borderColor: "#000" },
  restartButtonText: { fontWeight: "bold" },
  scoreText: { position: "absolute", top: 20, left: 20, color: "#FFF", fontSize: 20, fontWeight: "bold" },
  player: { position: "absolute", bottom: 20, width: PLAYER_WIDTH, height: PLAYER_HEIGHT, backgroundColor: "#FFF", borderWidth: 2, borderColor: "#000" },
  fallingBlock: { position: "absolute", width: BLOCK_WIDTH, height: BLOCK_HEIGHT, backgroundColor: "white", borderWidth: 1, borderColor: "black" },
  bullet: { position: "absolute", width: BULLET_WIDTH, height: BULLET_HEIGHT, backgroundColor: "red" },
  instruction: { position: "absolute", top: 70, color: "#fff", fontFamily: "Courier", fontSize: 14 },
  gameOverText: { position: "absolute", top: screenHeight / 2 - 40, color: "#FFF", fontSize: 26, fontWeight: "bold" },
});
