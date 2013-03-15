// EmonLibrary examples openenergymonitor.org, Licence GNU GPL V3

#include "EmonLib.h"                   // Include Emon Library
EnergyMonitor emon0;                   // Create an instance
EnergyMonitor emon1;                   // Create an instance
EnergyMonitor emon2;                   // Create an instance
//EnergyMonitor emon3;                   // Create an instance

float startTime;

void setup()
{
	Serial.begin(9600);

	emon0.current(0, 111.1);             // Current: input pin, calibration.
	emon1.current(1, 111.1);             // Current: input pin, calibration.
	emon2.current(2, 111.1);             // Current: input pin, calibration.
	//emon3.current(3, 111.1);             // Current: input pin, calibration.

	startTime = millis();
}

void loop()
{

	double Irms0 = emon0.calcIrms(1480);  // Calculate Irms only
	double Irms1 = emon1.calcIrms(1480);  // Calculate Irms only
	double Irms2 = emon2.calcIrms(1480);  // Calculate Irms only
	//double Irms3 = emon3.calcIrms(1480);  // Calculate Irms only
  Serial.print(Irms0);
  Serial.print(' ');
  Serial.print(Irms1);
  Serial.print(' ');
  Serial.print(Irms2);
  //Serial.print(' ');
  //Serial.print(Irms3);
  Serial.println();

  delay(100);

}
