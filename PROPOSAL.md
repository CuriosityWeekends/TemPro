# Tempro – Wireless Temperature Monitoring Unit

## 📌 Project Overview  
Tempro is a low-cost, wireless temperature and humidity monitoring system built around the NodeMCU ESP8266 and DHT22 sensor. Five compact IoT nodes (four active + one spare) relay real-time data through a common Wi-Fi router to a central dashboard or server.

---

## 🎯 Objectives  
- Accurately monitor ambient temperature and humidity  
- Transmit sensor data wirelessly over Wi-Fi (MQTT or HTTP)  
- Operate each node from a portable battery pack  
- House electronics in a durable enclosure  
- Connect all nodes on a single, router-based network  

---

## 📦 Bill of Materials

### 🔧 Per-Unit Component Costs  

| Component                 | Qty | Unit Price (INR) | Sub-Total (INR) |
|---------------------------|:---:|:----------------:|:----------------:|
| NodeMCU ESP8266           | 1   | ₹300             | ₹300             |
| DHT22 Sensor              | 1   | ₹250             | ₹250             |
| 1.5 V Batteries           | 3   | ₹20              | ₹60              |
| Battery Holder (3×1.5 V)  | 1   | ₹50              | ₹50              |
| Enclosure / Box           | 1   | ₹30              | ₹30              |
| Hook-up Wires             | —   | ₹50              | ₹50              |
| Misc. (HW, glue, etc.)    | —   | ₹50              | ₹50              |
| **Total per Node**        |     |                  | **₹790**         |

### 🌐 System-Level & Shared Costs  

| Item                               | Qty | Price (INR) | Sub-Total (INR) |
|------------------------------------|:---:|:-----------:|:----------------:|
| Five Nodes (4 active + 1 spare)    | 5   | ₹790        | ₹3,950           |
| Wi-Fi Router (shared)              | 1   | ₹1,200      | ₹1,200           |
| Other Miscellaneous Expenses       | —   | —           | ₹700             |
| **Grand Total**                    |     |             | **₹5,850**       |

---

## ⚙️ System Features  
- **DHT22** for high-accuracy temperature ± humidity sensing  
- **NodeMCU ESP8266** with USB for quick flashing and Wi-Fi connectivity  
- **Battery-powered** (3 × 1.5 V AAA → 4.5 V) for portable deployment  
- **Wireless data** via MQTT or HTTP protocols  
- **Modular design** – nodes are simple to swap, extend, or upgrade  

---

## 🚀 Planned Upgrades  
- Replace alkaline cells with rechargeable lithium + solar charging  
- Integrate a small OLED display for on-device read-outs  
- Develop a web/mobile dashboard for centralized visualisation  
- Add automatic alerts when conditions exceed safe thresholds  

---

## ✅ Conclusion  
At just **₹790 per node** and **₹5,850** for the complete five-node kit, **Tempro** delivers an affordable, scalable, and easily serviceable solution for continuous environmental monitoring—ideal for classrooms, labs, smart homes, and agricultural settings.
