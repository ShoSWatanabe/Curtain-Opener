# Curtain Opener

A Bluetooth-controlled ESP32 project that automatically opens the curtain (half of it) with a scheduled timer + web frontend.

This repository contains:

- `curtainOpener.ino` — the ESP32 code that controls the curtain mechanism 
- `Frontend/` — a Vite + React + TypeScript app that connects to the ESP32 over BLE
- `servoTest/servoTest.ino` — sketch used to calibrate servo behavior

## Overview

The device listens for BLE commands from a phone or browser and can:

- test the connection
- report the current state
- set a timer for the curtain to open
- pull or release the curtain by a bit
- reset the timer

## Features

- BLE communication between ESP32 and a browser-based controller
- scheduled automatic curtain trigger based on a user-selected time
- manual pull and release actions
- connection status feedback status reporting
- web interface for local control
- servo calibration test sketch for tuning movement timing and speed

## Hardware Requirements

- ESP32 development board
- Servo motor connected to GPIO 27 (in my case)
- 5V power source appropriate for the servo (I just have my esp32 constantly plugged in)
- Curtain mechanism attached to the servo/rope assembly
- Optional built-in LED (GPIO 2) used for basic connection testing

## System Architecture

### ESP32 firmware

The Arduino sketch in `curtainOpener.ino` configures a BLE service with a write characteristic for commands and a notify characteristic for responses.

Supported commands:

- `1` — blink the built-in LED to verify connectivity
- `s` — request current timer/state status
- `t` — set a timer using the format `HH:MM AM/PM,SECONDS_LEFT`
- `r` — reset the timer
- `i` — pull the curtain
- `o` — release the curtain

The firmware uses a non-blocking timer loop and performs the curtain movement sequence when the countdown reaches zero.

### Frontend app

The `Frontend/` app is a Vite React project that uses the Web Bluetooth API to:

- discover the ESP32 device named `ESP32_Curtain_Control`
- connect to the BLE GATT service
- send commands to the ESP32
- display status updates and timer messages from the device

## Repository Structure

```text
Curtain-Opener/
├── Frontend/
│   ├── public/
│   ├── src/
│   ├── .gitignore
│   ├── .oxlintrc.json
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── README.md
├── servoTest/
│   └── servoTest.ino
├── curtainOpener.ino
└── README.md
