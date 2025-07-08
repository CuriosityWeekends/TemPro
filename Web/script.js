const client = mqtt.connect('ws://dev.streakon.net:9001', {
  username: 'tempro',
  password: 'firstfloor'
});

const sensorDataMap = new Map();
const sensorLastSeenMap = new Map();
const sensorOffsetMap = new Map(); // Calibrated Offset Map
const calibrationHistory = [];

const temperatureChart = document.getElementById('temperatureChart');
const adminControls = document.getElementById('adminControls');
const calibrateButton = document.getElementById('calibrateButton');
const signInButton = document.getElementById('signInButton');
const userSection = document.getElementById('userSection');

const myChart = echarts.init(temperatureChart);

let chartOption = {
  animation: false,
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(31, 41, 55, 0.9)",
    borderColor: "#4b5563",
    textStyle: {
      color: "#f3f4f6",
    },
  },
  legend: {
    data: ["Live Temperature"],
    bottom: 0,
    textStyle: { color: "#f3f4f6" },
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "12%",
    top: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: [],
    axisLine: {
      lineStyle: {
        color: "#4b5563",
      },
    },
    axisLabel: {
      color: "#9ca3af",
      rotate: 0,
    },
    axisTick: {
      show: false,
    },
  },
  yAxis: {
    type: "value",
    name: "Temperature (°C)",
    min: 20,
    max: 30,
    axisLine: {
      lineStyle: {
        color: "#4b5563",
      },
    },
    axisLabel: {
      color: "#9ca3af",
    },
    splitLine: {
      lineStyle: {
        color: "#374151",
      },
    },
  },
  series: [
    {
      name: "Live Temperature",
      type: "line",
      data: [],
      smooth: false,
      showSymbol: true,
      symbolSize: 8,
      symbol: 'circle',
      color: "rgba(30, 136, 229, 1)",
      lineStyle: {
        width: 3,
      },
      itemStyle: {
        color: "rgba(30, 136, 229, 1)",
        borderColor: "#ffffff",
        borderWidth: 2,
      },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(30, 136, 229, 0.2)" },
            { offset: 1, color: "rgba(30, 136, 229, 0.01)" },
          ],
        },
      },
    },
  ],
};

myChart.setOption(chartOption);

function updateChart() {
  const now = Date.now();
  const sensorLabels = [];
  const sensorTemperatures = [];

  // Clean up old data
  for (const [sensor, lastSeen] of sensorLastSeenMap.entries()) {
    if (now - lastSeen > 10000) {
      sensorDataMap.delete(sensor);
      sensorLastSeenMap.delete(sensor);
    }
  }

  // Get all available sensors and their calibrated temperatures
  const sensorIds = ['sensor1', 'sensor2', 'sensor3', 'sensor4', 'sensor5', 'sensor6', 'sensor7', 'sensor8', 'sensor9', 'sensor10'];
  
  sensorIds.forEach(sensorId => {
    const rawTemperature = sensorDataMap.get(sensorId);
    if (rawTemperature !== undefined) {
      const sensorName = getSensorName(sensorId);
      const offset = sensorOffsetMap.get(sensorId) || 0;
      const calibratedTemperature = rawTemperature + offset;
      
      sensorLabels.push(sensorName);
      sensorTemperatures.push(parseFloat(calibratedTemperature.toFixed(1)));
    }
  });

  // Only show real sensor data - no dummy data
  if (sensorLabels.length === 0) {
    console.log('No real sensor data available');
    return; // Don't update chart if no real data
  }

  // Update chart data
  chartOption.xAxis.data = sensorLabels;
  chartOption.series[0].data = sensorTemperatures;

  // Update y-axis range based on sensor temperatures
  if (sensorTemperatures.length > 0) {
    const minTemp = Math.min(...sensorTemperatures);
    const maxTemp = Math.max(...sensorTemperatures);
    chartOption.yAxis.min = Math.floor(minTemp - 1);
    chartOption.yAxis.max = Math.ceil(maxTemp + 1);
  }

  myChart.setOption(chartOption);
}

// Update online sensors
function updateOnlineSensors() {
  const now = Date.now();
  const onlineSensorsContainer = document.getElementById('onlineSensors');
  
  if (!onlineSensorsContainer) return;
  
  // Clear existing content
  onlineSensorsContainer.innerHTML = '';
  
  // Get all online sensors
  const onlineSensors = [];
  for (const [sensorId, lastSeen] of sensorLastSeenMap.entries()) {
    if (now - lastSeen < 10000) { // Online if seen in last 10 seconds
      const sensorName = getSensorName(sensorId);
      const temperature = sensorDataMap.get(sensorId) || 0;
      onlineSensors.push({ id: sensorId, name: sensorName, temperature });
    }
  }
  
  // Sort sensors by ID
  onlineSensors.sort((a, b) => {
    const aNum = parseInt(a.id.replace('sensor', ''));
    const bNum = parseInt(b.id.replace('sensor', ''));
    return aNum - bNum;
  });
  
  // Create sensor elements
  onlineSensors.forEach(sensor => {
    const sensorElement = document.createElement('div');
    sensorElement.className = 'flex items-center justify-between p-3 bg-green-900 rounded-lg border border-green-600';
    sensorElement.setAttribute('data-sensor', sensor.id);
    
    const rawTemp = sensorDataMap.get(sensor.id) || 0;
    const offset = sensorOffsetMap.get(sensor.id) || 0;
    const calibratedTemp = rawTemp + offset;
    
    sensorElement.innerHTML = `
      <div class="flex items-center">
        <div class="w-2 h-2 bg-green-400 rounded-full"></div>
        <span class="ml-2 text-sm font-medium text-gray-200">${sensor.name}</span>
      </div>
      <div class="flex flex-col items-end">
        <span class="text-xs text-green-400 monospace">Online</span>
        <span class="text-xs text-gray-400 monospace">${calibratedTemp.toFixed(1)}°C</span>
        ${offset !== 0 ? `<span class="text-xs text-blue-400 monospace">+${offset.toFixed(1)}</span>` : ''}
      </div>
    `;
    
    onlineSensorsContainer.appendChild(sensorElement);
  });
  
  // Show message if no sensors are online
  if (onlineSensors.length === 0) {
    const noSensorsElement = document.createElement('div');
    noSensorsElement.className = 'text-center py-4 text-gray-400 text-sm';
    noSensorsElement.textContent = 'No sensors online';
    onlineSensorsContainer.appendChild(noSensorsElement);
  }
  
  // Apply dark theme to new elements
  onlineSensorsContainer.classList.add('dark');
  
  // Update last updated time
  const lastUpdatedElement = document.querySelector('.text-xs.text-gray-500.mt-4');
  if (lastUpdatedElement) {
    const now = new Date();
    lastUpdatedElement.textContent = `Last updated: ${now.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })} - ${now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })}`;
  }
}

// Helper function to get sensor name
function getSensorName(sensorId) {
  const sensorNames = {
    'sensor1': 'Sensor A',
    'sensor2': 'Sensor B', 
    'sensor3': 'Sensor C',
    'sensor4': 'Sensor D',
    'sensor5': 'Sensor E',
    'sensor6': 'Sensor F',
    'sensor7': 'Sensor G',
    'sensor8': 'Sensor H',
    'sensor9': 'Sensor I',
    'sensor10': 'Sensor J'
  };
  return sensorNames[sensorId] || sensorId;
}

// Sensor toggles are no longer needed since we show combined temperature

async function calibrateSensors() {
  console.log('Calibration started');
  console.log('Current sensor data:', sensorDataMap);
  console.log('MQTT connection status:', client.connected);
  
  const { isConfirmed } = await darkSwal({
    title: 'Preparation',
    text: 'Please place all sensors in the same position for calibration.',
    icon: 'info',
    confirmButtonText: 'Ready',
    allowOutsideClick: false,
    allowEscapeKey: false,
  });

  if (!isConfirmed) return;

  await darkSwal({
    title: 'Calibrating...',
    didOpen: () => {
      Swal.showLoading();
    },
    allowOutsideClick: false,
    allowEscapeKey: false
  });

  const values = Array.from(sensorDataMap.values());
  console.log('Sensor values for calibration:', values);

  if (values.length === 0) {
    console.log('No sensor data available');
    await darkSwal({
      icon: 'error',
      title: 'No Sensor Data',
      html: `
        <p>No sensor data available for calibration.</p>
        <p><strong>Possible issues:</strong></p>
        <ul style="text-align: left; margin: 10px 0;">
          <li>• MQTT connection not established</li>
          <li>• Sensors not sending data</li>
          <li>• Wrong MQTT topics</li>
        </ul>
        <p><strong>MQTT Status:</strong> ${client.connected ? 'Connected' : 'Disconnected'}</p>
      `,
      confirmButtonText: 'OK'
    });
    return;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;

  sensorOffsetMap.clear();
  for (const [sensor, temp] of sensorDataMap.entries()) {
    const offset = median - temp;
    sensorOffsetMap.set(sensor, offset);
    
    const calibrationRecord = {
      sensorId: sensor,
      rawTemp: temp.toFixed(2),
      offset: offset > 0 ? `+${offset.toFixed(2)}` : offset.toFixed(2),
      finalTemp: median.toFixed(2),
      time: new Date().toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    calibrationHistory.push(calibrationRecord);
    
    // Save to Firebase
    saveCalibrationToFirebase(calibrationRecord);
  }

  const allOffsetsAreZero = Array.from(sensorOffsetMap.values()).every(offset => Math.abs(offset) < 0.1);

  if (allOffsetsAreZero) {
    await darkSwal({
      html: `
        <p>Analyzing sensor data...</p>
        <p style="color:green;"><i>Fun Fact:</i> All your sensors are already in great sync! 🎯</p>
      `
    });
  }

  setTimeout(() => {
    darkSwal({
      icon: 'success',
      title: 'Calibration Complete!',
      html: `
        <p>Baseline set to ${median.toFixed(2)}°C</p>
        <p><b>Important:</b> Now place all sensors in their appropriate positions as usual.</p>
        ${allOffsetsAreZero ? `<p style="font-size: 0.85em; color: #4caf50; margin-top: 10px;"><i>Fun fact: All your sensors were already reporting nearly identical temperatures! 📟</i></p>` : ''}
      `,
      confirmButtonText: 'Got it!',
    });
    updateCurrentSensorTable();
  }, 1500);
}

// Function to save calibration data to Firebase
async function saveCalibrationToFirebase(calibrationRecord) {
  try {
    await firebaseDB.collection('calibrations').add(calibrationRecord);
    console.log('Calibration saved to Firebase:', calibrationRecord);
  } catch (error) {
    console.error('Error saving calibration to Firebase:', error);
  }
}

// Function to load calibration history from Firebase
async function loadCalibrationHistory() {
  try {
    const snapshot = await firebaseDB.collection('calibrations')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();
    
    calibrationHistory.length = 0; // Clear existing data
    
    snapshot.forEach(doc => {
      const data = doc.data();
      calibrationHistory.push({
        ...data,
        id: doc.id
      });
    });
    
    // updateCalibrationTable(); // This function is removed
    console.log('Calibration history loaded from Firebase');
  } catch (error) {
    console.error('Error loading calibration history:', error);
  }
}

// Function to update the calibration history table
function updateCalibrationTable() {
  const tableBody = document.getElementById('calibrationTableBody');
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  calibrationHistory.forEach(record => {
    const row = document.createElement('tr');
    row.className = 'border-b border-gray-700 hover:bg-gray-800';
    
    row.innerHTML = `
      <td class="px-4 py-2 text-sm text-gray-300">${record.sensorId}</td>
      <td class="px-4 py-2 text-sm text-gray-300">${record.rawTemp}°C</td>
      <td class="px-4 py-2 text-sm text-blue-400">${record.offset}</td>
      <td class="px-4 py-2 text-sm text-green-400">${record.finalTemp}°C</td>
      <td class="px-4 py-2 text-sm text-gray-400">${record.time}</td>
      <td class="px-4 py-2">
        <button 
          onclick="deleteCalibrationRecord('${record.id}')" 
          class="text-red-400 hover:text-red-300 text-xs"
          title="Delete record"
        >
          <i class="ri-delete-bin-line"></i>
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Function to delete a calibration record
async function deleteCalibrationRecord(recordId) {
  try {
    await firebaseDB.collection('calibrations').doc(recordId).delete();
    
    // Remove from local array
    const index = calibrationHistory.findIndex(record => record.id === recordId);
    if (index > -1) {
      calibrationHistory.splice(index, 1);
    }
    
    // updateCalibrationTable(); // This function is removed
    
    await darkSwal({
      icon: 'success',
      title: 'Record Deleted',
      text: 'Calibration record has been removed.',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    console.error('Error deleting calibration record:', error);
    await darkSwal({
      icon: 'error',
      title: 'Delete Failed',
      text: 'Failed to delete the calibration record.',
    });
  }
}

function initializeAuth() {
  // Check if user is already signed in
  firebaseAuth.onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in
      updateUserUI(user);
      adminControls.classList.remove("hidden");
      // No need to load calibration history
    } else {
      // User is signed out
      updateUserUI(null);
      adminControls.classList.add("hidden");
    }
  });

  // Handle initial sign in button click
  if (signInButton) {
    signInButton.addEventListener("click", handleSignIn);
  }
}

async function handleSignIn() {
  console.log('Sign in button clicked!');
  try {
    // Show loading state
    const button = document.getElementById('signInButton');
    button.disabled = true;
    button.innerHTML = `
      <div class="flex items-center">
        <div class="w-4 h-4 flex items-center justify-center mr-2 animate-spin">
          <i class="ri-loader-4-line"></i>
        </div>
        <span>Signing in...</span>
      </div>
    `;

    // Sign in with Google
    const result = await firebaseAuth.signInWithPopup(googleProvider);
    const user = result.user;
    
    // Check if email is whitelisted
    if (!WHITELISTED_EMAILS.includes(user.email)) {
      // Email not allowed - sign out and show error
      await firebaseAuth.signOut();
      throw new Error(`Access denied. Email ${user.email} is not authorized.`);
    }

    // Success - UI will be updated by onAuthStateChanged
    await darkSwal({
      icon: 'success',
      title: 'Welcome!',
      text: `Successfully signed in as ${user.displayName}`,
      timer: 2000,
      showConfirmButton: false
    });

  } catch (error) {
    console.error('Sign in error:', error);
    
    // Reset button state
    const button = document.getElementById('signInButton');
    if (button) {
      button.disabled = false;
      button.innerHTML = `
        <div class="w-5 h-5 flex items-center justify-center mr-2">
          <i class="ri-google-fill text-[#4285F4]"></i>
        </div>
        <span class="whitespace-nowrap">Sign in with Google</span>
      `;
    }

    // Show error message
    if (error.code === 'auth/popup-closed-by-user') {
      await darkSwal({
        icon: 'info',
        title: 'Sign in cancelled',
        text: 'You closed the sign in window.',
        timer: 3000,
        showConfirmButton: false
      });
    } else if (error.message.includes('Access denied')) {
      await darkSwal({
        icon: 'error',
        title: 'Access Denied',
        text: error.message,
        confirmButtonText: 'OK'
      });
    } else {
      await darkSwal({
        icon: 'error',
        title: 'Sign in failed',
        text: error.message,
        confirmButtonText: 'OK'
      });
    }
  }
}

function updateUserUI(user) {
  if (user) {
    // User is signed in
    const initials = user.displayName ? 
      user.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : 
      user.email[0].toUpperCase();
    
    userSection.innerHTML = `
      <div class="flex items-center">
        <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2">
          <span class="text-sm font-medium">${initials}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-gray-200">${user.displayName || user.email}</span>
          <span class="text-xs text-gray-400">${getUserRole(user.email)}</span>
        </div>
        <button 
          id="signOutButton" 
          class="ml-3 px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          title="Sign out"
        >
          <i class="ri-logout-box-r-line"></i>
        </button>
      </div>
    `;

    // Add sign out functionality
    document.getElementById('signOutButton').addEventListener('click', async () => {
      try {
        await firebaseAuth.signOut();
        await darkSwal({
          icon: 'success',
          title: 'Signed out',
          text: 'You have been successfully signed out.',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Sign out error:', error);
        await darkSwal({
          icon: 'error',
          title: 'Sign out failed',
          text: error.message
        });
      }
    });

  } else {
    // User is signed out
    userSection.innerHTML = `
      <button
        id="signInButton"
        class="flex items-center px-4 py-2 bg-gray-800 border border-gray-600 rounded-button text-gray-200 hover:bg-gray-700 transition-colors"
      >
        <div class="w-5 h-5 flex items-center justify-center mr-2">
          <i class="ri-google-fill text-[#4285F4]"></i>
        </div>
        <span class="whitespace-nowrap">Sign in with Google</span>
      </button>
    `;

    // Re-attach event listener to new button
    document.getElementById('signInButton').addEventListener('click', handleSignIn);
  }
}

function getUserRole(email) {
  // Define roles based on email
  if (email === 'curiosityweekends@gmail.com') {
    return 'Super Admin';
  } else if (email === 'salmanfarishassan4519@gmail.com') {
    return 'Admin';
  } else if (email === 'tech@curiosityweekends.com') {
    return 'Tech Admin';
  } else {
    return 'User';
  }
}

// Theme is now permanently dark - no toggle needed

client.on('connect', () => {
  console.log('MQTT Connected successfully');
  
  // Update MQTT status in UI
  const mqttStatus = document.getElementById('mqttStatus');
  if (mqttStatus) {
    mqttStatus.textContent = 'Connected';
    mqttStatus.className = 'text-green-400';
  }
  
  for (let i = 1; i <= 10; i++) {
    const topic = `tempro/sensor${i}`;
    client.subscribe(topic);
    console.log(`Subscribed to topic: ${topic}`);
  }
});

client.on('message', (topic, message) => {
  console.log(`MQTT message received: ${topic} = ${message.toString()}`);
  const sensor = topic.split('/')[1];
  const temp = parseFloat(message.toString());

  if (!isNaN(temp)) {
    sensorDataMap.set(sensor, temp);
    sensorLastSeenMap.set(sensor, Date.now());
    console.log(`Updated sensor ${sensor} with temperature: ${temp}°C`);
  } else {
    console.log(`Invalid temperature value for sensor ${sensor}: ${message.toString()}`);
  }
});

client.on('error', (error) => {
  console.error('MQTT Error:', error);
});

client.on('disconnect', () => {
  console.log('MQTT Disconnected');
  
  // Update MQTT status in UI
  const mqttStatus = document.getElementById('mqttStatus');
  if (mqttStatus) {
    mqttStatus.textContent = 'Disconnected';
    mqttStatus.className = 'text-red-400';
  }
});

client.on('reconnect', () => {
  console.log('MQTT Reconnecting...');
  
  // Update MQTT status in UI
  const mqttStatus = document.getElementById('mqttStatus');
  if (mqttStatus) {
    mqttStatus.textContent = 'Reconnecting...';
    mqttStatus.className = 'text-yellow-400';
  }
});

// Function to update the current sensor details table
function updateCurrentSensorTable() {
  const tableBody = document.getElementById('currentSensorTableBody');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  // Get all sensors with their latest data
  const now = Date.now();
  const sensorIds = ['sensor1', 'sensor2', 'sensor3', 'sensor4', 'sensor5', 'sensor6', 'sensor7', 'sensor8', 'sensor9', 'sensor10'];
  sensorIds.forEach(sensorId => {
    const rawTemp = sensorDataMap.get(sensorId);
    const offset = sensorOffsetMap.get(sensorId) || 0;
    const lastSeen = sensorLastSeenMap.get(sensorId);
    if (rawTemp !== undefined && lastSeen) {
      const finalTemp = rawTemp + offset;
      const sensorName = getSensorName(sensorId);
      const lastSeenStr = new Date(lastSeen).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      const row = document.createElement('tr');
      row.className = 'border-b border-gray-700 hover:bg-gray-800';
      row.innerHTML = `
        <td class="px-4 py-2 text-sm text-gray-300">${sensorName}</td>
        <td class="px-4 py-2 text-sm text-gray-300 monospace">${rawTemp.toFixed(2)}°C</td>
        <td class="px-4 py-2 text-sm text-blue-400 monospace">${offset >= 0 ? '+' : ''}${offset.toFixed(2)}</td>
        <td class="px-4 py-2 text-sm text-green-400 monospace">${finalTemp.toFixed(2)}°C</td>
        <td class="px-4 py-2 text-sm text-gray-400">${lastSeenStr}</td>
      `;
      tableBody.appendChild(row);
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  console.log('DOM loaded, initializing auth...');
  
  // Initialize auth system
  initializeAuth();
  
  // Add event listeners
  calibrateButton.addEventListener("click", calibrateSensors);
  
  window.addEventListener("resize", function () {
    myChart.resize();
  });
  
  // Load calibration history from Firebase
  // loadCalibrationHistory(); // This function is removed
  
  updateCurrentSensorTable();

});



setInterval(updateChart, 5000);
setInterval(updateOnlineSensors, 2000);
setInterval(updateCurrentSensorTable, 2000);

updateChart();
updateOnlineSensors();

// Helper for dark themed SweetAlert
function darkSwal(options) {
  return Swal.fire({
    background: '#18192a',
    color: '#e0e0ff',
    customClass: {
      popup: 'swal2-dark-popup',
      title: 'swal2-dark-title',
      content: 'swal2-dark-content',
      confirmButton: 'swal2-dark-confirm',
      cancelButton: 'swal2-dark-cancel'
    },
    ...options
  });
}
