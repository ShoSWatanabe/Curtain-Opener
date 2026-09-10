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
        <div className="bg-gray-100 p-10 rounded-[3rem] flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] w-[min(500px,90vw)]">
          <h2 className="text-[2rem] pb-[1rem]">ESP32 Curtain Controller</h2>
          {connected ? (
            <button className="rounded-[1rem] py-2 px-3 bg-[#5d8448] shadow-sm">
              Connected
            </button>
          ) : (
            <button
              className="rounded-[1rem] py-2 px-3 bg-[#84b06d] cursor-pointer hover:shadow-md"
              onClick={() => connectBLE(setStatus, setConnected)}
            >
              Connect to ESP32
            </button>
          )}
          <br />

          <p>Status:</p>
          <div className="flex flex justify-between">
            <p className="text-center rounded-[0.8rem] p-1 m-1 bg-white w-full flex items-center justify-center shadow-sm">
              {status}
            </p>
            <button
              className="bg-[#93ccc8] rounded-[0.8rem] cursor-pointer shadow-sm hover:shadow-md p-1 m-1 w-[7rem]"
              onClick={() => sendCommand(setStatus, setConnected, "s")}
            >
              Check Status
            </button>
          </div>

          <br />

          <div className="flex justify-around">
            {/* Left */}
            <div className="flex flex-col justify-center items-center w-[50%]">
              <p>Commands:</p>
              <div className="flex flex-col items-center w-[90%]">
                <button
                  className="bg-[#fcf3ca] rounded-[0.8rem] cursor-pointer hover:shadow-md shadow-sm p-1 m-1 w-full"
                  onClick={() => sendCommand(setStatus, setConnected, "1")}
                >
                  Test LED
                </button>

                <button
                  className="bg-[#fcf3ca] rounded-[0.8rem] cursor-pointer hover:shadow-md shadow-sm p-1 m-1 w-full"
                  onClick={() => sendCommand(setStatus, setConnected, "i")}
                >
                  Pull
                </button>
                <button
                  className="bg-[#fcf3ca] rounded-[0.8rem] cursor-pointer hover:shadow-md shadow-sm p-1 m-1 w-full"
                  onClick={() => sendCommand(setStatus, setConnected, "o")}
                >
                  Release
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
                className="w-[90%] p-1 m-1 bg-white rounded-[0.8rem] hover:shadow-md shadow-sm"
              />
              <button
                className="bg-[#f7d0c3] rounded-[0.8rem] cursor-pointer hover:shadow-md shadow-sm p-1 m-1 w-[90%]"
                onClick={() => sendTimer(setStatus, setConnected, time)}
              >
                Set Timer
              </button>
              <button
                className="bg-[#cc9393] rounded-[0.8rem] cursor-pointer hover:shadow-md shadow-sm p-1 m-1 w-[90%]"
                onClick={() => sendCommand(setStatus, setConnected, "r")}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
