
#include <ESP32Servo.h>

Servo myservo1;

void setup() {
  Serial.begin(115200);
  Serial.println("W = release, S = pull, X = stop");
  Serial.print("Input: ");
  myservo1.attach(27);  

  myservo1.write(95);   // stop
}

void loop() {
  char input = Serial.read();
  if (input == 'w' || input == 'W') myservo1.write(70);
  else if (input == 's' || input == 'S') myservo1.write(125);
  else if (input == 'x' || input == 'X') myservo1.write(95);


  // myservo1.write(0);     // Move to 0 degrees
  // myservo2.write(0);     // Move to 0 degrees
  // delay(1000);

  // myservo1.write(90);    // Move to 90 degrees
  // myservo2.write(90);    // Move to 90 degrees
  // delay(1000);

  // myservo1.write(180);   // Move to 180 degrees
  // myservo2.write(180);   // Move to 180 degrees
  // delay(1000);

  // myservo1.write(60);     // Move to 0 degrees
  // delay(1000);

  // myservo1.write(95);    // Move to 90 degrees
  // delay(1000);

  // myservo1.write(120);   // Move to 180 degrees
  // delay(1000);

  // myservo1.write(95);    // Move to 90 degrees
  // delay(1000);
}

// myservo.write(90);   // STOP
// myservo.write(0);    // Full speed clockwise
// myservo.write(180);  // Full speed counter-clockwise
// myservo.write(70);   // Slow clockwise
// myservo.write(110);  // Slow counter-clockwise