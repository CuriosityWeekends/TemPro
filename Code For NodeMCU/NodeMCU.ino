#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

#include "secrets.h"

#define DHTPIN D4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

WiFiClient espClient;
PubSubClient client(espClient);

const char* backendUrl = "http://localhost:5000";
const char* sensorId = "sensor1";

float correctionFactor = 0;

unsigned long lastMsg = 0;
const long interval = 5000;

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

void fetchCorrectionFactor() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    WiFiClient client;
    String url = String(backendUrl) + "/api/get-correction/" + sensorId;
    http.begin(client, url);
    int httpCode = http.GET();
    if (httpCode == 200) {
      String response = http.getString();
      StaticJsonDocument<200> doc;
      deserializeJson(doc, response);
      correctionFactor = doc["correctionFactor"] | 0.0;
      Serial.printf("Fetched correction factor: %.2f\n", correctionFactor);
    } else {
      Serial.printf("HTTP GET failed, code: %d\n", httpCode);
    }
    http.end();
  } else {
    Serial.println("WiFi not connected, cannot fetch correction factor");
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("TemProSensor1", mqtt_username, mqtt_password)) {
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
  client.setServer(mqtt_server, 1883);
  fetchCorrectionFactor();
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > interval) {
    lastMsg = now;

    float rawTemperature = dht.readTemperature();
    if (isnan(rawTemperature)) {
      Serial.println("Failed to read from DHT sensor!");
      return;
    }

    float calibratedTemperature = rawTemperature + correctionFactor;

    char tempString[8];
    dtostrf(calibratedTemperature, 1, 2, tempString);
    Serial.print("Publishing calibrated temperature: ");
    Serial.println(tempString);

    client.publish("tempro/sensor1", tempString);
  }
}