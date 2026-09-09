/// <reference types="web-bluetooth" />
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import { sendCommand, sendTimer, connectBLE } from "./Helper/BLE";

import "./App.css";

function App() {
  const [status, setStatus] = useState<string>("Disconnected");
  const [time, setTime] = useState<string | undefined>(undefined);
  const [connected, setConnected] = useState<boolean>(false);

  return (
    <>
      <ToastContainer />
      <div className="flex justify-center items-center h-[100vh]">
        <div className="bg-gray-200 p-10 rounded-[3rem] flex flex-col shadow-xl w-[min(500px,90vw)]">
          <h2 className="text-[2rem] pb-[1rem]">ESP32 Curtain Controller</h2>
          {connected ? (
            <button className="rounded-[1rem] py-2 px-3 bg-[#5d8448] ">
              Connected
            </button>
          ) : (
            <button
              className="rounded-[1rem] py-2 px-3 bg-[#84b06d] cursor-pointer hover:shadow-sm"
              onClick={() => connectBLE(setStatus, setConnected)}
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
                  onClick={() => sendCommand(setStatus, setConnected, "1")}
                >
                  Test LED
                </button>
                <button
                  className="bg-white rounded-[0.8rem] cursor-pointer hover:shadow-sm p-1 m-1 w-full"
                  onClick={() => sendCommand(setStatus, setConnected, "s")}
                >
                  Check Status
                </button>
                <button
                  className="bg-white rounded-[0.8rem] cursor-pointer hover:shadow-sm p-1 m-1 w-full"
                  onClick={() => sendCommand(setStatus, setConnected, "r")}
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
                onClick={() => sendTimer(setStatus, setConnected, time)}
              >
                Set Timer
              </button>
            </div>
          </div>
          <p>{status}</p>
        </div>
      </div>
    </>
  );
}

export default App;
