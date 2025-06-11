// SweetAlert Error Alert
function showErrorAlert(message) {
  Swal.fire({
    background: '#1e293b',
    icon: 'error',
    title: 'Error',
    text: message,
    timer: 5000,
    showConfirmButton: false,
    timerProgressBar: true
  });
}

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeNFTMYiKVVtrnTQHZFb_-Uhh307CrEaU",
  authDomain: "temprocw.firebaseapp.com",
  projectId: "temprocw",
  storageBucket: "temprocw.appspot.com",
  messagingSenderId: "537290462610",
  appId: "1:537290462610:web:0b653f682f4a177e9f1d4b"
};

// Initialize Firebase
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
} catch (error) {
  console.error('Firebase init error:', error);
  showErrorAlert('Failed to initialize Firebase.');
}

const auth = firebase.auth();
const db = firebase.firestore();

// Admin Emails
const adminEmails = [
  'salmanfarishassan4519@gmail.com',
  'curiosityweekends@gmail.com'
  // Add your admin emails here
];

// DOM Elements
// DOM Elements
const mqttStatus = document.getElementById('mqttStatus');
const statusText = document.getElementById('statusText');
const signInBtn = document.getElementById('signInBtn');
const calibrateBtn = document.getElementById('calibrateBtn');
const logoutBtn = document.getElementById('logoutBtn');
const ctx = document.getElementById('tempChart').getContext('2d');

const client = mqtt.connect('ws://dev.streakon.net:9001', {
  username: 'tempro',
  password: 'firstfloor'
});

const sensorDataMap = new Map();
const sensorLastSeenMap = new Map();
const sensorOffsetMap = new Map();
let calibrationBaseline = null;

const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Temperature (°C)',
        data: [],
        hidden: false,
        borderColor: ({ raw }) => raw > 30 ? 'red' : raw > 25 ? 'orange' : 'hsl(189, 62.40%, 38.60%)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        point迪Radius: 6,
        pointHoverRadius: 8,
        pointBorderWidth: 2,
        pointBorderColor: '#ffffff',
        pointBackgroundColor: ({ raw }) => raw > 30 ? 'red' : raw > 25 ? 'orange' : '#4caf50',
      },
      {
        label: 'Calibration Baseline',
        data: [],
        borderColor: '#1d8cf8',
        borderDash: [5, 5],
        borderWidth: 2,
        fill: false,
        pointRadius: 0
      },
      {
        label: 'Calibrated Temperature (°C)',
        data: [],
        hidden: true,
        borderColor: ({ raw }) => raw > 30 ? 'red' : raw > 25 ? 'orange' : 'hsl(115, 62.40%, 38.60%)',
        backgroundColor: 'rgba(59, 246, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBorderWidth: 2,
        pointBorderColor: '#ffffff',
        pointBackgroundColor: ({ raw }) => raw > 30 ? 'red' : raw > 25 ? 'orange' : '#4caf50',
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        title: { display: true, text: 'Temperature (°C)', color: '#ffffff' },
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        title: { display: true, text: 'Sensor ID', color: '#ffffff' },
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    },
    plugins: {
      legend: { labels: { color: '#ffffff' } }
    }
  }
});

// Update UI based on auth state
// Update UI based on auth state
function updateUI(user) {
  if (user) {
    signInBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    if (adminEmails.includes(user.email)) {
      calibrateBtn.classList.remove('hidden');
    } else {
      calibrateBtn.classList.add('hidden');
    }
  } else {
    signInBtn.classList.remove('hidden');
    calibrateBtn.classList.add('hidden');
    logoutBtn.classList.add('hidden');
  }
}

// Google Sign-In
signInBtn.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      if (adminEmails.includes(user.email)) {
        Swal.fire({
          background: '#1e293b',
          icon: 'success',
          title: 'Authentication Successful',
          text: `Welcome, ${user.displayName}!`,
        });
      } else {
        Swal.fire({
          background: '#1e293b',
          icon: 'error',
          title: 'Access Denied',
          text: 'You are not authorized to access calibration features.',
        });
        firebase.auth().signOut();
      }
    })
    .catch((error) => {
      showErrorAlert(`Authentication Failed: ${error.message}`);
    });
});

// Logout
logoutBtn.addEventListener('click', () => {
  firebase.auth().signOut()
    .then(() => {
      Swal.fire({
        background: '#1e293b',
        icon: 'success',
        title: 'Logged Out',
        text: 'You have been successfully logged out.',
      });
    })
    .catch((error) => {
      showErrorAlert(`Logout Failed: ${error.message}`);
    });
});

// Monitor auth state
firebase.auth().onAuthStateChanged((user) => {
  updateUI(user);
});

// Last Seen Table Update
function updateLastSeenTable() {
  const tbody = document.getElementById('lastSeenTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  const entries = [...sensorDataMap.entries()].sort((a, b) =>
    parseInt(a[0].replace('sensor', '')) - parseInt(b[0].replace('sensor', ''))
  );

  for (const [sensor, temp] of entries) {
    const lastSeen = sensorLastSeenMap.get(sensor);
    const lastSeenTime = lastSeen ? new Date(lastSeen).toLocaleTimeString() : 'N/A';

    const row = `
      <tr class="border-t border-gray-600 text-sm">
        <td class="px-4 py-2">${sensor}</td>
        <td class="px-4 py-2">${temp.toFixed(2)}</td>
        <td class="px-4 py-2">${lastSeenTime}</td>
      </tr>
    `;
    tbody.insertAdjacentHTML('beforeend', row);
  }
}

function updateChart() {
  const now = Date.now();

  for (const [sensor, lastSeen] of sensorLastSeenMap.entries()) {
    if (now - lastSeen > 10000) {
      sensorDataMap.delete(sensor);
      sensorLastSeenMap.delete(sensor);
    }
  }

  const entries = [...sensorDataMap.entries()].sort((a, b) =>
    parseInt(a[0].replace('sensor', '')) - parseInt(b[0].replace('sensor', ''))
  );

  const labels = entries.map(([sensor]) => sensor);
  const values = entries.map(([_, temp]) => temp);
  const calibrated = entries.map(([sensor, temp]) => temp + (sensorOffsetMap.get(sensor) || 0));

  chart.data.labels = labels;
  chart.data.datasets[0].data = values;
  chart.data.datasets[2].data = calibrated;

  if (values.length) {
    const min = Math.min(...values, ...calibrated);
    const max = Math.max(...values, ...calibrated);
    chart.options.scales.y.min = Math.floor(min - 5);
    chart.options.scales.y.max = Math.ceil(max + 5);

    const maxCalibrated = Math.max(...calibrated);
    statusText.textContent = maxCalibrated > 30 ? 'High' : maxCalibrated > 25 ? 'Medium' : 'Normal';
    statusText.className = maxCalibrated > 30
      ? 'text-red-500 font-bold'
      : maxCalibrated > 25
        ? 'text-orange-500 font-bold'
        : 'text-green-500 font-bold';

    if (calibrationBaseline !== null) {
      chart.data.datasets[1].data = labels.map(() => calibrationBaseline);
    }
  }

  chart.update();
}

// Firestore Load/Save
function loadOffsetsFromFirestore() {
  db.collection('sensorOffsets').onSnapshot(snapshot => {
    sensorOffsetMap.clear();
    let hasOffsets = false;

    snapshot.forEach(doc => {
      if (doc.id === 'calibrationBaseline') {
        calibrationBaseline = doc.data().baseline;
      } else {
        sensorOffsetMap.set(doc.id, doc.data().offset);
        hasOffsets = true;
      }
    });

    chart.getDatasetMeta(0).hidden = hasOffsets;
    chart.getDatasetMeta(2).hidden = !hasOffsets;
    updateChart();
  }, error => {
    console.error('Firestore error:', error);
    showErrorAlert('Failed to load sensor offsets.');
  });
}

function saveOffsetsToFirestore() {
  const updates = [...sensorOffsetMap.entries()].map(([sensor, offset]) =>
    db.collection('sensorOffsets').doc(sensor).set({ offset, timestamp: new Date().toISOString() })
  );

  if (calibrationBaseline !== null) {
    updates.push(db.collection('sensorOffsets').doc('calibrationBaseline').set({
      baseline: calibrationBaseline,
      timestamp: new Date().toISOString()
    }));
  }

  Promise.all(updates)
    .then(() => console.log('Calibration data saved.'))
    .catch(error => {
      console.error('Save error:', error);
      showErrorAlert('Failed to save calibration data.');
    });
}

calibrateBtn.addEventListener('click', async () => {
  const { isConfirmed } = await Swal.fire({
    background: '#1e293b',
    title: 'Preparation',
    text: 'Please place all sensors together.',
    icon: 'info',
    confirmButtonText: 'Ready',
    allowOutsideClick: false,
    allowEscapeKey: false
  });

  if (!isConfirmed) return;

  Swal.fire({
    background: '#1e293b',
    title: 'Calibrating...',
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false,
    allowEscapeKey: false
  });

  const temps = [...sensorDataMap.values()];
  if (!temps.length) return showErrorAlert('No sensor data found.');

  const sorted = temps.sort((a, b) => a - b);
  const median = sorted.length % 2
    ? sorted[Math.floor(sorted.length / 2)]
    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;

  sensorOffsetMap.clear();
  for (const [sensor, temp] of sensorDataMap.entries()) {
    sensorOffsetMap.set(sensor, median - temp);
  }

  calibrationBaseline = median;
  chart.getDatasetMeta(0).hidden = true;
  chart.getDatasetMeta(2).hidden = false;
  saveOffsetsToFirestore();

  const allZero = [...sensorOffsetMap.values()].every(o => Math.abs(o) < 0.1);

  setTimeout(() => {
    Swal.fire({
      background: '#1e293b',
      icon: 'success',
      title: 'Calibration Complete!',
      html: `
        <p>Baseline set to ${median.toFixed(2)}°C</p>
        <p>Offsets saved to Firestore.</p>
        ${allZero ? `<p style="color:#4caf50;">Sensors were already aligned 🎯</p>` : ''}
      `,
      confirmButtonText: 'Done'
    });
  }, 1500);
});

// MQTT Client Events
client.on('connect', () => {
  mqttStatus.textContent = 'MQTT: Connected';
  mqttStatus.className = 'text-green-400';
  for (let i = 1; i <= 10; i++) client.subscribe(`tempro/sensor${i}`);
});

client.on('message', (topic, message) => {
  const sensor = topic.split('/')[1];
  const temp = parseFloat(message.toString());
  const timestamp = new Date();

  if (!isNaN(temp)) {
    sensorDataMap.set(sensor, temp);
    sensorLastSeenMap.set(sensor, timestamp.getTime());

    updateChart();
    updateLastSeenTable();

    db.collection('sensorLastSeen').doc(sensor).set({
      temperature: temp,
      lastSeen: timestamp.toISOString()
    }, { merge: true }).catch(error => {
      console.error(`Failed to update lastSeen for ${sensor}:`, error);
      showErrorAlert(`Firestore error: Could not save last seen for ${sensor}`);
    });
  }
});

client.on('error', () => {
  mqttStatus.textContent = 'MQTT: Error';
  mqttStatus.className = 'text-red-500';
});

// Start
loadOffsetsFromFirestore();
setInterval(updateChart, 5000);