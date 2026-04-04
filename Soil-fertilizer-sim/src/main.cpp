#include <WiFi.h>
   #include <PubSubClient.h>
   #include <LiquidCrystal_I2C.h>

   // WiFi (Wokwi)
   const char* ssid = "Wokwi-GUEST";
   const char* password = "";

   // MQTT
   const char* mqtt_server = "broker.hivemq.com";
   const char* mqtt_topic = "smart-agriculture/sensors";  // Matches your .env!

   WiFiClient espClient;
   PubSubClient client(espClient);

   // LCD (I2C)
   LiquidCrystal_I2C lcd(0x27, 16, 2);

   // Sensor pins (matches your diagram.json)
   #define MOISTURE_PIN 34  // Potentiometer 1
   #define PH_PIN 35        // Potentiometer 2

   // WiFi Setup
   void setup_wifi() {
     Serial.print("Connecting to WiFi");
     WiFi.begin(ssid, password);

     while (WiFi.status() != WL_CONNECTED) {
       delay(500);
       Serial.print(".");
     }

     Serial.println("\nWiFi connected!");
   }

   // MQTT reconnect
   void reconnect() {
     while (!client.connected()) {
       Serial.print("Connecting to MQTT...");
       if (client.connect("ESP32Client")) {
         Serial.println("connected!");
       } else {
         Serial.print("failed, rc=");
         Serial.print(client.state());
         Serial.println(" retrying...");
         delay(2000);
       }
     }
   }

   void setup() {
     Serial.begin(115200);

     setup_wifi();
     client.setServer(mqtt_server, 1883);

     // LCD init
     lcd.init();
     lcd.backlight();
     lcd.setCursor(0, 0);
     lcd.print("Smart Agri");
   }

   void loop() {
     if (!client.connected()) {
       reconnect();
     }

     client.loop();

     // Read BOTH sensors
     int moistureValue = analogRead(MOISTURE_PIN);
     int phValue = analogRead(PH_PIN);

     // Convert to meaningful values
     float moisturePercent = 100 - ((moistureValue / 4095.0) * 100);  // 0-100%
     float voltage = phValue * (3.3 / 4095.0);
     float pH = 7 + ((2.5 - voltage) / 0.18);

     // Update LCD
     lcd.setCursor(0, 0);
     lcd.print("Moist:");
     lcd.print(moisturePercent, 1);
     lcd.print("%   ");

     lcd.setCursor(0, 1);
     lcd.print("pH:");
     lcd.print(pH, 2);
     lcd.print("      ");

     // Create JSON payload (matches backend expected format)
     String payload = "{";
     payload += "\"deviceId\":\"esp32-001\",";
     payload += "\"moisture\":" + String(moisturePercent, 2) + ",";
     payload += "\"pH\":" + String(pH, 2) + ",";
     payload += "\"timestamp\":" + String(millis());
     payload += "}";

     // Publish to MQTT
     Serial.println("Publishing: " + payload);
     client.publish(mqtt_topic, payload.c_str());

     delay(3000);
   }