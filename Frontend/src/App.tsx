/// <reference types="web-bluetooth" />
import { useState, useRef } from "react";
import "./App.css";

const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const RX_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const TX_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

function App() {
  const [status, setStatus] = useState<string>("Disconnected");
  const [time, setTime] = useState<string | undefined>(undefined);
  const [connected, setConnected] = useState<boolean>(false);

  // Use useRef so the BLE characteristic persists across component re-renders
  const rxCharacteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(
    null,
  );

  async function connectBLE() {
    try {
      setStatus("Connecting...");

      // 1. Request the BLE Device
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: "ESP32_Curtain_Control" }],
        optionalServices: [SERVICE_UUID],
      });

      // 2. Connect to GATT Server
      const server = await device.gatt?.connect();
      if (!server) throw new Error("Could not connect to GATT server");

      const service = await server.getPrimaryService(SERVICE_UUID);

      // 3. Store RX Characteristic for sending commands
      rxCharacteristicRef.current = await service.getCharacteristic(RX_UUID);

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
            setStatus(`Notification: ${message}`);
          }
        },
      );

      setStatus("Status: Connected!");
      setConnected(true);
    } catch (error) {
      console.error(error);
      setStatus(`Error: ${(error as Error).message}`);
      setConnected(false);
      setStatus(`Notification: Disconnected`);
      alert("Please connect to the ESP32 first!");
    }
  }

  const sendCommand = async (command: string) => {
    if (!rxCharacteristicRef.current) {
      alert("Please connect to the ESP32 first!");
      setConnected(false);
      setStatus(`Notification: Disconnected`);
      return;
    }

    try {
      const encoder = new TextEncoder();
      await rxCharacteristicRef.current.writeValue(encoder.encode(command));
    } catch (error) {
      console.error("Failed to send command:", error);
      setConnected(false);
      setStatus(`Notification: Disconnected`);
      alert("Please connect to the ESP32 first!");
    }
  };

  const sendTimer = () => {
    if (!time) return;

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
    sendCommand(`t${formattedTime},${totalSeconds}`);
  };

  return (
    <div className="flex justify-center items-center h-[100vh]">
      <div className="bg-gray-200 p-10 rounded-[3rem] flex flex-col shadow-xl w-[min(500px,90vw)]">
        <h2 className="text-[2rem] pb-[2rem]">ESP32 Curtain Controller</h2>
        {connected ? (
          <button className="rounded-[1rem] py-2 px-3 bg-[#5d8448] ">
            Connected
          </button>
        ) : (
          <button
            className="rounded-[1rem] py-2 px-3 bg-[#84b06d] cursor-pointer hover:shadow-sm"
            onClick={connectBLE}
          >
            Connect to ESP32
          </button>
        )}
        <br />
        <div className="flex justify-around">
          {/* Left */}
          <div className="flex flex-col justify-center items-center w-[50%]">
            <p>Runnable Commands:</p>
            <div className="flex flex-col items-center w-[90%]">
              <button
                className="bg-white rounded-[0.8rem] cursor-pointer hover:shadow-sm p-1 m-1 w-full"
                onClick={() => sendCommand("1")}
              >
                Test LED
              </button>
              <button
                className="bg-white rounded-[0.8rem] cursor-pointer hover:shadow-sm p-1 m-1 w-full"
                onClick={() => sendCommand("s")}
              >
                Check Status
              </button>
              <button
                className="bg-white rounded-[0.8rem] cursor-pointer hover:shadow-sm p-1 m-1 w-full"
                onClick={() => sendCommand("r")}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col w-[50%] justify-between items-center">
            <label>Timer: </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              step="60" // Optional: Use "1" for seconds, "60" for minutes
              className="w-[90%] p-2 bg-white rounded-[0.8rem]"
            />
            <button
              className="bg-[#f7d0c3] rounded-[0.8rem] cursor-pointer hover:shadow-sm p-1 m-1 w-[90%]"
              onClick={sendTimer}
            >
              Set Timer
            </button>
          </div>
        </div>
        <p>{status}</p>
      </div>
    </div>
  );
}

export default App;
