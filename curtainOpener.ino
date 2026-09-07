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
double timeLeft = -1;               // This is the actual Time left
String timerVal = "";           // This is the planned time of opening curtain

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
//  - t = set time => remaining bytes: "hr:min" => return hr:min
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
            sendNotification("STATUS: Time set for " + timerVal);
          } else if (finished) {
            // send data: "FINISHED"
            sendNotification("STATUS: Finished");
          } else {
            // send data: "NOT SET"
            sendNotification("STATUS: Timer not set");
          }
          
        } else if (incomingChar == 't') {
          timerSet = true;
          // extract data: FIRST_HALF,SECOND_HALF => first half = __:__ am/pm, second half = time left in seconds
          // timeLeft = time left in seconds 
          // timerVal =  __:__ am/pm

          // send data:  "timer set for: hr:min"
          sendNotification("TIMER SET: " + timerVal);

        } else if (incomingChar == 'r') {
          timerSet = false;
          timeLeft = -1;
          finished = false;
          sendNotification("TIMER RESET");

        }
      }
    }
};

void setup() {
  Serial.begin(115200);

  // Set up servo
  servo.attach(27);  
  servo.write(95);   // stop

  // Set up built in LED
  pinMode(ledPin, OUTPUT);

  // 1. Initialize BLE Stack
  BLEDevice::init("ESP32_Curtain_Control");

  // 2. Create Server & Attach Callbacks for connection status
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  // 3. Create Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // 4. Create RX Characteristic (Phone -> ESP32)
  BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_UUID_RX,
      BLECharacteristic::PROPERTY_WRITE
  );
  pRxCharacteristic->setCallbacks(new CustomCallbacks());

  // 5. Create TX Characteristic (ESP32 -> Phone Notifications)
  pTxCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_UUID_TX,
      BLECharacteristic::PROPERTY_NOTIFY
  );
  // Add Descriptor to allow client notifications
  pTxCharacteristic->addDescriptor(new BLE2902());

  // 6. Start Service & Advertising
  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->start();

  Serial.println("BLE Ready and Advertising...");
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
  servo.write(125);
  delay(5000);
  servo.write(95);  // Stop motor
}

// Release the curtain rope to unwind
void release() {
  servo.write(70);
  delay(5000);
  servo.write(95);  // Stop motor
}

void loop() {
  if (timerSet && timeLeft > 0 && !finished) {
    pull();
    release();
    timerSet = false;
    finished = true;
    timeLeft = -1;
  }
}
