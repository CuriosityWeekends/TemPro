
# TemPro: TemperatureProfiler

**TemPro** is an IoT-based temperature monitoring system using the ESP8266 microcontroller. It transmits temperature data wirelessly via MQTT and displays it in real-time through a responsive web dashboard. Ideal for home automation, agriculture, or industrial monitoring environments.

---

## 🔧 Features

- 📡 **ESP8266-Powered**: Wireless temperature sensing and transmission  
- 🧠 **MQTT Protocol**: Lightweight and efficient data communication  
- 🌐 **Web Dashboard**: Clean, real-time data visualization in any modern browser  
- 🧩 **Modular Structure**: Separated firmware, broker, and web interface components  

---

## 📁 Project Structure

```bash
TemPro/
├── Code For NodeMCU/       # ESP8266 firmware (Arduino-compatible)
├── ESP8266-broker/         # MQTT broker setup and config
├── Web/                    # Web UI for live temperature display
├── architecture.md         # System architecture and working principles
└── README.md               # Project documentation
````

---

## 🧩 Architecture

For a detailed overview of how TemPro works (including the role of Firebase Auth, MQTT Broker, and real-time dashboard updates), check out the [Architecture Documentation](./architecture.md).

---

## 🚀 Getting Started

### Prerequisites

* ESP8266 (e.g. NodeMCU board)
* Arduino IDE with ESP8266 support
* MQTT broker (e.g. Mosquitto)
* Local web server (optional for hosting dashboard)

### Setup Instructions

1. **Clone the Repo**

   ```bash
   git clone https://github.com/CuriosityWeekends/TemPro.git
   cd TemPro
   ```

2. **Flash the ESP8266**

   * Open `Code For NodeMCU/` in Arduino IDE
   * Install required libraries (e.g., `PubSubClient`, `DHT`)
   * Set Wi-Fi and MQTT details in the sketch
   * Upload to your ESP8266

3. **Start the MQTT Broker**

   * Navigate to `ESP8266-broker/` and follow setup instructions
   * Or use a public broker like `broker.hivemq.com` for testing

4. **Run the Web Dashboard**

   * Open `Web/index.html` in a browser
   * Or serve it with any HTTP server
   * Monitor real-time temperature from your ESP8266

---

## 📷 Screenshots

Include screenshots of your hardware setup and web dashboard here.

---

## 🤝 Contributing

Got improvements? Found a bug?

1. Fork the repo
2. Create your feature branch: `git checkout -b my-feature`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin my-feature`
5. Open a Pull Request!

---

## 📄 License

MIT License – see [LICENSE](./LICENSE) for details.
