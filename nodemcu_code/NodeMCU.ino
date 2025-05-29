#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// All credentials
#include "secrets.h"

#define DHTPIN D4      // GPIO2 (change if wired differently)
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// MQTT client
WiFiClient espClient;
PubSubClient client(espClient);

// Timer
unsigned long lastMsg = 0;
const long interval = 5000; // every 5 seconds

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("TemProSensor1", mqtt_username, mqtt_password) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" trying again in 5 secs");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  setup_wifi();
  client.setServer(mqtt_server, 1883); // Non-WebSocket port for ESP
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > interval) {
    lastMsg = now;

    float temp = dht.readTemperature();
    if (isnan(temp)) {
      Serial.println("Failed to read from DHT sensor!");
      return;
    }

    char tempString[8];
    dtostrf(temp, 1, 2, tempString);
    Serial.print("Publishing temperature: ");
    Serial.println(tempString);

    client.publish("tempro/sensor1", tempString);
  }
}
