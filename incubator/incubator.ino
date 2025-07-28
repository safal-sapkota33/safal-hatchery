#define SERVER_ADDRESS "https://safal-hatchery.onrender.com"
// Then include libraries
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_ADXL345_U.h>
#include <Adafruit_Sensor.h>
#include <math.h>
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>
#include <SensirionI2cSht4x.h>
#include <ArduinoJson.h>

// WiFi Credentials
char ssid[] = "AdvancedCollege";
char pass[] = "acem@123";

// Hardware Settings
#define MUX_ADDRESS 0x70
const int TROLLEY_CHANNELS[6] = {0, 1, 2, 3, 4, 5};

Adafruit_MPU6050 mpu;
Adafruit_ADXL345_Unified adxl = Adafruit_ADXL345_Unified(123);
SensirionI2cSht4x sht45;

void selectMUXChannel(uint8_t channel) {
  Wire.beginTransmission(MUX_ADDRESS);
  Wire.write(1 << channel);
  Wire.endTransmission();
  delay(300);
}

float getTiltAngle(uint8_t channel) {
  selectMUXChannel(channel);
  delay(200);
  
  float x, y, z;
  if (channel == 4) {
    if (!adxl.begin()) return NAN;
    sensors_event_t event;
    adxl.getEvent(&event);
    x = event.acceleration.x;
    y = event.acceleration.y;
    z = event.acceleration.z;
  } else {
    if (!mpu.begin(0x68)) return NAN;
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    x = a.acceleration.x;
    y = a.acceleration.y;
    z = a.acceleration.z;
  }

  float tilt = atan2(sqrt(x*x + y*y), abs(z)) * 180.0/PI;
  return (abs(x) > abs(y)) ? (x>0 ? tilt : -tilt) : (y>0 ? tilt : -tilt);
}

void sendSensorData(float temperature, float humidity, float trolleyTilts[6]) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    HTTPClient http;
    
    // Configure client for secure connection
    client.setInsecure(); // Note: Use proper certificate validation in production
    http.begin(client, SERVER_ADDRESS "/api/hatchery");
    http.addHeader("Content-Type", "application/json");
    
    DynamicJsonDocument doc(512);
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    for (int i = 0; i < 6; i++) {
      doc["trolleys"][i] = trolleyTilts[i];
    }
    doc["timestamp"] = millis();
    
    String payload;
    serializeJson(doc, payload);
    
    Serial.print("Sending data: ");
    Serial.println(payload);
    
    int httpCode = http.POST(payload);
    if (httpCode > 0) {
      Serial.printf("[HTTPS] POST... code: %d\n", httpCode);
      if (httpCode == HTTP_CODE_OK) {
        String response = http.getString();
        Serial.println(response);
      }
    } else {
      Serial.printf("[HTTPS] POST... failed, error: %s\n", http.errorToString(httpCode).c_str());
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}

void readSensors() {
  float temperature, humidity;
  float trolleyTilts[6];
  
  // Read trolley tilts
  for (uint8_t ch = 0; ch < 6; ch++) {
    trolleyTilts[ch] = getTiltAngle(ch);
    if (!isnan(trolleyTilts[ch])) {
      Serial.printf("Trolley %d: %+.1f°\n", ch, trolleyTilts[ch]);
    } else {
      trolleyTilts[ch] = 0;
      Serial.printf("Trolley %d: Sensor Error\n", ch);
    }
  }
  
  // Read SHT45
  uint16_t error = sht45.measureHighPrecision(temperature, humidity);
  if (error == 0) {
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.print(" °C | Humidity: ");
    Serial.print(humidity);
    Serial.println(" %RH");
  } else {
    Serial.print("Error reading SHT45! Code: 0x");
    Serial.println(error, HEX);
    temperature = 0;
    humidity = 0;
  }
  
  // Send data to server
  sendSensorData(temperature, humidity, trolleyTilts);
  
  Serial.println("----------------");
}

void setup() {
  Serial.begin(9600);
  Wire.begin(D2, D1); // Initialize I2C
  
  // Initialize SHT45 sensor
  sht45.begin(Wire, 0x44);
  
  // Check if SHT45 is connected
  uint32_t serialNumber;
  uint16_t error = sht45.serialNumber(serialNumber);
  if (error) {
    Serial.println("SHT45 not detected! Check wiring.");
    Serial.print("Error code: 0x");
    Serial.println(error, HEX);
  } else {
    Serial.print("SHT45 initialized! Serial: 0x");
    Serial.println(serialNumber, HEX);
  }

  // Connect to WiFi
  WiFi.begin(ssid, pass);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.println("System initialized");
}

void loop() {
  readSensors();
  delay(2000); // Update every 2 seconds
}