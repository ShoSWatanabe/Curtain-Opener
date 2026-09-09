import showError from "./toast";
import type { Dispatch, SetStateAction } from "react";

const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const RX_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const TX_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

let rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

async function connectBLE(
  setStatus: Dispatch<SetStateAction<string>>,
  setConnected: Dispatch<SetStateAction<boolean>>,
) {
  try {
    setStatus("Connecting...");

    // 1. Request the BLE Device
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        {
          name: "ESP32_Curtain_Control",
          services: [SERVICE_UUID], // <-- Explicitly tell iOS to scan for this service UUID!
        },
      ],
      optionalServices: [SERVICE_UUID], // Keep this for spec compliance
    });

    // 2. Connect to GATT Server
    const server = await device.gatt?.connect();
    if (!server) throw new Error("Could not connect to GATT server");

    const service = await server.getPrimaryService(SERVICE_UUID);

    // 3. Store RX Characteristic for sending commands
    rxCharacteristic = await service.getCharacteristic(RX_UUID);

    // 4. Set up TX Characteristic for notifications
    const txCharacteristic = await service.getCharacteristic(TX_UUID);
    await txCharacteristic.startNotifications();

    // Listener for incoming status messages from ESP32
    txCharacteristic.addEventListener(
      "characteristicvaluechanged",
      (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        if (target.value) {
          const decoder = new TextDecoder("utf-8");
          const message = decoder.decode(target.value);
          setStatus(message);
        }
      },
    );

    setStatus("Connected!");
    setConnected(true);
  } catch (error) {
    console.error(error);
    setStatus(`Error: ${(error as Error).message}`);
    setConnected(false);
    setStatus(`Disconnected`);
  }
}

const sendCommand = async (
  setStatus: Dispatch<SetStateAction<string>>,
  setConnected: Dispatch<SetStateAction<boolean>>,
  command: string,
) => {
  if (!rxCharacteristic) {
    showError("Please connect to the ESP32 first!");
    setConnected(false);
    setStatus(`Disconnected`);
    return;
  }

  try {
    const encoder = new TextEncoder();
    await rxCharacteristic.writeValue(encoder.encode(command));
  } catch (error) {
    console.error("Failed to send command:", error);
    setConnected(false);
    setStatus(`Disconnected`);
    showError("Please connect to the ESP32 first!");
  }
};

const sendTimer = (
  setStatus: Dispatch<SetStateAction<string>>,
  setConnected: Dispatch<SetStateAction<boolean>>,
  time: string | undefined,
) => {
  if (!time) {
    showError("Set a time!");
    return;
  }

  const now = new Date();
  const [targetHours, targetMinutes] = time.split(":").map(Number);

  // Create a Date instance for today at the selected target time
  const targetDate = new Date();
  targetDate.setHours(targetHours, targetMinutes, 0, 0);

  // If target time is earlier than right now, roll target to tomorrow
  if (targetDate.getTime() <= now.getTime()) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  // Get delay in seconds
  const totalSeconds = Math.floor(
    (targetDate.getTime() - now.getTime()) / 1000,
  );

  // Format target time to 12-hour AM/PM string for display on ESP32
  const formattedTime = targetDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Payload sent to ESP32: e.g., "t07:30 AM,300"
  showError(`${totalSeconds.toString()} Seconds left:`);
  sendCommand(setStatus, setConnected, `t${formattedTime},${totalSeconds}`);
};

export { connectBLE, sendCommand, sendTimer };
