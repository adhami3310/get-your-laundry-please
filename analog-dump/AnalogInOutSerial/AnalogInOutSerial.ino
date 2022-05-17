/*
 Analog Input, Digital output.
*/

#include <Arduino.h>
#include "EmonLib.h"

EnergyMonitor emon1, emon2, emon3, emon4;

void setup() {
  // initialize serial communications at 9600 bps:
  Serial.begin(9600); 
  emon1.current(0,60.6);
  emon2.current(1,60.6);
  emon3.current(2,60.6);
//    emon4.current(3,60.6);
}

void loop() {
  // read the analog in value:
  Serial.print(emon1.calcIrms(1484*4));
  Serial.print(" ");
  Serial.print(emon2.calcIrms(1484*4));
  Serial.print(" ");
//  Serial.print(emon3.calcIrms(1484*4));
//  Serial.print(" ");
  Serial.println(emon3.calcIrms(1484*4));
  delay(2);
}