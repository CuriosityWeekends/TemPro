# Architecture Diagram of Working Principles

```mermaid
flowchart TD
 subgraph s1["MQTT System"]
        Broker["MQTT Broker"]
        IoT["NodeMCU"]
  end
 subgraph s2["Front-end"]
        WebApp["Frontend App"]
        MQTTClient["MQTT.js"]
        Firestore["Firestore"]
        AdminPanel["Admin Panel"]
  end
 subgraph s3["Oauth"]
        AdminUser["Admin"]
        FirebaseAuth["Firebase Auth"]
        RegularUser["User"]
        n1["Admin User List"]
  end
    AdminUser -- "claims.isAdmin = true" --> FirebaseAuth
    RegularUser -- "<span style=padding-left:>claims.isAdmin = false</span>" --> FirebaseAuth
    FirebaseAuth -- Custom claims(Role) --> WebApp
    WebApp -- "dev.streakon.net" --> MQTTClient
    WebApp -- Auth Request --> FirebaseAuth
    WebApp -- DB To Store Public Offset Data --> Firestore
    WebApp -- If admin --> AdminPanel
    n1 -- If email is in adminList --> AdminUser
    MQTTClient --> Broker
    Broker --> IoT

```
