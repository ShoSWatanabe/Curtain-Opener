#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#include <ESP32Servo.h>

#define SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

Servo servo;
bool deviceConnected = false;
const int ledPin = 2;           // Built-in LED
bool timerSet = false;
bool finished = false;
bool testConnectionBool = false;
bool stopAfterDelayBool = false;
double timeLeft = -1;           // This is the actual Time left
String timerVal = "";           // This is the planned time of opening curtain

// modify these values
const int PULL_SPEED = 140;
const int RELEASE_SPEED = 70;
const int PULL_TIME = 14500;
const int RELEASE_TIME = 11000;
const int STOP = 95;


BLECharacteristic *pTxCharacteristic;

// Helper function to send notification messages back to client
void sendNotification(String message) {
  if (deviceConnected) {
    pTxCharacteristic->setValue(message.c_str());
    pTxCharacteristic->notify();
  }
}

class ServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
    }
    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      // Restart advertising so new devices can connect
      pServer->startAdvertising(); 
    }
};

// First char: 
//  - s = state => return "NOT SET", "timer set for: hr:min", "FINISHED"
//  - t = set time => remaining bytes: FIRST_HALF,SECOND_HALF => first half = __:__ am/pm, second half = time left in seconds => return hr:min
//  - 1 = blink led for test
//  - r = reset => time = -1, timerSet = false, finished = false
class CustomCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      String rxValue = pCharacteristic->getValue();
      if (rxValue.length() > 0) {
        char incomingChar = rxValue[0];
        if (incomingChar == '1') {
          testConnectionBool = true;

        } else if (incomingChar == 's') {
          if (timerSet) {
            // send data: "timer set for: hr:min"
            sendNotification("Time set for " + timerVal);
          } else if (finished) {
            // send data: "FINISHED"
            sendNotification("Finished");
          } else {
            // send data: "NOT SET"
            sendNotification("Timer not set");
          }
          
        } else if (incomingChar == 't') {
          // extract data: FIRST_HALF,SECOND_HALF => first half = __:__ am/pm, second half = time left in seconds
          String payload = rxValue.substring(1);
          int commaIndex = payload.lastIndexOf(',');

          if (commaIndex != -1) {
            timerVal = payload.substring(0,commaIndex);
            String s = payload.substring(commaIndex + 1);
            s.trim();
            timeLeft = s.toDouble();

            if (timeLeft <= 0) {
              sendNotification("ERROR: Parsed 0 seconds");
              return;
            }

            timerSet = true;
            finished = false;
            previousMillis = millis(); // Reset timing baseline

            // send data:  "timer set for: hr:min"
            sendNotification("TIMER SET: " + timerVal);
          } else {
            sendNotification("ERROR: Invalid format. Use txx:xx AM/PM,SECONDS_LEFT");
          }

        } else if (incomingChar == 'r') {
          timerSet = false;
          timeLeft = -1;
          finished = false;
          sendNotification("TIMER RESET");
        } else if (incomingChar == 'i') {
          servo.write(PULL_SPEED);
          stopAfterDelayBool = true;
          sendNotification("Pulling");
        } else if (incomingChar == 'o') {
          servo.write(RELEASE_SPEED);
          stopAfterDelayBool = true;
          sendNotification("Releasing");
        }
      }
    }
};

void setup() {
  // Serial.begin(115200);

  // Set up servo
  servo.attach(27);  
  servo.write(STOP);   // stop

  // Set up built in LED
  pinMode(ledPin, OUTPUT);

  // Initialize BLE Stack
  BLEDevice::init("ESP32_Curtain_Control");

  // Create Server & Attach Callbacks for connection status
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  // Create Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create RX Characteristic (Phone -> ESP32)
  BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_UUID_RX,
      BLECharacteristic::PROPERTY_WRITE
  );
  pRxCharacteristic->setCallbacks(new CustomCallbacks());

  // Create TX Characteristic (ESP32 -> Phone Notifications)
  pTxCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_UUID_TX,
      BLECharacteristic::PROPERTY_NOTIFY
  );
  // Add Descriptor to allow client notifications
  pTxCharacteristic->addDescriptor(new BLE2902());

  // Start Service & Advertising
  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->start();

  // Serial.println("BLE Ready and Advertising...");
}

void testConnection() {
  digitalWrite(ledPin, HIGH);
  delay(1000);
  digitalWrite(ledPin, LOW);
  delay(1000);
  digitalWrite(ledPin, HIGH);
  delay(1000);
  digitalWrite(ledPin, LOW);
  testConnectionBool = false;
}

// Pull the curtain rope to open curtain
void pull() {
  servo.write((PULL_SPEED + STOP)/2); // Small initial speed so a big power spike dosn't occur and turn off esp
  delay(1000);
  servo.write(PULL_SPEED);
  delay(PULL_TIME);
  servo.write(STOP);  
}

// Release the curtain rope to unwind
void release() {
  servo.write(RELEASE_SPEED);
  delay(RELEASE_TIME);
  servo.write(STOP);  
}

void stopAfterDelay() {
  delay(1000);
  servo.write(STOP);  
  stopAfterDelayBool = false;
}

unsigned long previousMillis = 0;
const long interval = 1000; // 1 second tick interval

void loop() {
  // Non-blocking 1-second countdown timer
  unsigned long currentMillis = millis();
  if (timerSet && timeLeft > 0 && !finished) {
    if (currentMillis - previousMillis >= interval) {
      previousMillis += interval;
      timeLeft--; // Subtract 1 second
    }
  }

  // Check if pulling or releasing is recieved
  if (stopAfterDelayBool) stopAfterDelay();

  // Check if blink test is needed
  if (testConnectionBool) testConnection();

  // Check if time is up
  if (timerSet && timeLeft <= 0 && !finished) {
    pull();
    release();
    timerSet = false;
    finished = true;
    timeLeft = -1;
  }
  // Serial.println(timeLeft);
}
