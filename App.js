import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import { Accelerometer } from "expo-sensors";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;
export default function App() {
  const [playerX, setPlayerX] = useState((screenWidth - PLAYER_WIDTH) / 2);
  const speed = 8;
  useEffect(() => {
    Accelerometer.setUpdateInterval(16); 
    const subscription = Accelerometer.addListener(({ x }) => {
      const tilt = -x;   
      setPlayerX((prevX) => {
        let newX = prevX + tilt * speed;
        if (newX < 0) newX = 0;
        if (newX > screenWidth - PLAYER_WIDTH)
          newX = screenWidth - PLAYER_WIDTH;
        return newX;
      });
    });

    return () => subscription && subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.player, { left: playerX }]} />
      <Text style={styles.instruction}>Tilt your phone to move</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 60,
  },
  player: {
    position: "absolute",
    bottom: 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#000",
  },
  instruction: {
    position: "absolute",
    top: 70,
    color: "#fff",
    fontFamily: "Courier",
    fontSize: 14,
  },
});
