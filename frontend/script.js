// MQTT setup
const client = mqtt.connect('ws://dev.streakon.net:9001', {
  username: 'tempro',
  password: 'firstfloor'
});

// Firebase Auth
const auth = firebase.auth();

// Allowed Gmail addresses
const allowedEmails = [
  'salmanfarishassan4519@gmail.com',
  'admin2@gmail.com',
  // Add more allowed Gmail addresses here
];

const sensorTemperatures = new Map();
    const sensorLastSeen = new Map();
    const correctionFactors = new Map();
    const chartContext = document.getElementById('tempChart').getContext('2d');
    const mqttStatusText = document.getElementById('mqttStatus');
    const statusText = document.getElementById('statusText');
    const backendUrl = 'http://localhost:5000';
    const calibrateButton = document.getElementById('calibrateBtn');
    const signInButton = document.getElementById('signInBtn');
    const signOutButton = document.getElementById('signOutBtn');
    const userInfo = document.getElementById('userInfo');
    const userEmail = document.getElementById('userEmail');

    // Firebase Authentication state listener
    auth.onAuthStateChanged(user => {
      if (user) {
        userEmail.textContent = user.email;
        userInfo.classList.remove('hidden');
        signInButton.classList.add('hidden');
        // Check if user's email is in allowedEmails
        if (allowedEmails.includes(user.email.toLowerCase())) {
          calibrateButton.classList.remove('hidden');
        } else {
          calibrateButton.classList.add('hidden');
        }
      } else {
        userInfo.classList.add('hidden');
        signInButton.classList.remove('hidden');
        calibrateButton.classList.add('hidden');
      }
    });

    // Sign in with Google
    signInButton.addEventListener('click', () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider).catch(err => {
        console.error('Sign-in error:', err);
        Swal.fire({
          theme: 'dark',
          icon: 'error',
          title: 'Sign-in Failed',
          text: err.message,
        });
      });
    });

    // Sign out
    signOutButton.addEventListener('click', () => {
      auth.signOut().catch(err => {
        console.error('Sign-out error:', err);
      });
    });

    // Load correction factors from backend
    async function loadCorrectionFactors() {
      try {
        const response = await axios.get(`${backendUrl}/api/get-all-corrections`);
        correctionFactors.clear();
        response.data.forEach(sensor => {
          correctionFactors.set(sensor.sensorId, sensor.correctionFactor);
        });
        // If correction factors exist, show calibrated temperatures
        if (response.data.length > 0) {
          chart.getDatasetMeta(0).hidden = true; // Hide raw temperatures
          chart.getDatasetMeta(2).hidden = false; // Show calibrated temperatures
          localStorage.setItem('isCalibrated', 'true');
          baselineTemperature = response.data[0].medianTemperature || null;
        } else {
          chart.getDatasetMeta(0).hidden = false; // Show raw temperatures
          chart.getDatasetMeta(2).hidden = true; // Hide calibrated temperatures
          localStorage.setItem('isCalibrated', 'false');
        }
        updateChart();
      } catch (err) {
        console.error('Error loading correction factors:', err);
        chart.getDatasetMeta(0).hidden = false;
        chart.getDatasetMeta(2).hidden = true;
        localStorage.setItem('isCalibrated', 'false');
        updateChart();
      }
    }

    // Chart.js configuration
    const chart = new Chart(chartContext, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Raw Temperature (°C)',
            hidden: localStorage.getItem('isCalibrated') === 'true',
            data: [],
            borderColor: (context) => {
              const value = context.raw;
              if (value > 30) return 'red';
              if (value > 25) return 'orange';
              return 'hsl(189, 62.40%, 38.60%)';
            },
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBorderWidth: 2,
            pointBorderColor: '#ffffff',
            pointBackgroundColor: (context) => {
              const value = context.raw;
              if (value > 30) return 'red';
              if (value > 25) return 'orange';
              return '#4caf50';
            },
          },
          {
            label: 'Baseline Temperature',
            data: [],
            borderColor: '#1d8cf8',
            borderDash: [5, 5],
            borderWidth: 2,
            fill: false,
            pointRadius: 0
          },
          {
            label: 'Calibrated Temperature (°C)',
            hidden: localStorage.getItem('isCalibrated') !== 'true',
            data: [],
            borderColor: (context) => {
              const value = context.raw;
              if (value > 30) return 'red';
              if (value > 25) return 'orange';
              return 'hsl(115, 62.40%, 38.60%)';
            },
            backgroundColor: 'rgba(59, 246, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBorderWidth: 2,
            pointBorderColor: '#ffffff',
            pointBackgroundColor: (context) => {
              const value = context.raw;
              if (value > 30) return 'red';
              if (value > 25) return 'orange';
              return '#4caf50';
            },
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Temperature (°C)',
              color: '#ffffff'
            },
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          x: {
            title: {
              display: true,
              text: 'Sensor ID',
              color: '#ffffff'
            },
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          }
        },
        plugins: {
          legend: {
            labels: { color: '#ffffff' }
          }
        }
      }
    });

    // Update chart with sensor data
    function updateChart() {
      const now = Date.now();
      for (const [sensor, lastSeen] of sensorLastSeen.entries()) {
        if (now - lastSeen > 10000) {
          sensorTemperatures.delete(sensor);
          sensorLastSeen.delete(sensor);
        }
      }
      const entries = Array.from(sensorTemperatures.entries()).sort((a, b) => {
        const aNum = parseInt(a[0].replace('sensor', '')) || 0;
        const bNum = parseInt(b[0].replace('sensor', '')) || 0;
        return aNum - bNum;
      });
      const labels = entries.map(([sensor]) => sensor);
      const rawTemperatures = entries.map(([sensor, temp]) => temp);
      const calibratedTemperatures = entries.map(([sensor, temp]) => temp + (correctionFactors.get(sensor) || 0));
      chart.data.labels = labels;
      chart.data.datasets[0].data = rawTemperatures;
      chart.data.datasets[2].data = calibratedTemperatures;
      if (rawTemperatures.length > 0) {
        const minTemp = Math.min(...rawTemperatures, ...calibratedTemperatures);
        const maxTemp = Math.max(...rawTemperatures, ...calibratedTemperatures);
        chart.options.scales.y.min = Math.floor(minTemp - 5);
        chart.options.scales.y.max = Math.ceil(maxTemp + 5);
        const highestTemp = Math.max(...calibratedTemperatures);
        if (highestTemp > 30) {
          statusText.textContent = 'High';
          statusText.className = 'text-red-500 font-bold';
        } else if (highestTemp > 25) {
          statusText.textContent = 'Medium';
          statusText.className = 'text-orange-500 font-bold';
        } else {
          statusText.textContent = 'Normal';
          statusText.className = 'text-green-500 font-bold';
        }
        if (baselineTemperature !== null) {
          chart.data.datasets[1].data = chart.data.labels.map(() => baselineTemperature);
        }
      }
      chart.update();
    }

    let baselineTemperature = null;

    // Calibration logic
    calibrateButton.addEventListener('click', async () => {
      const user = auth.currentUser;
      if (!user || !allowedEmails.includes(user.email.toLowerCase())) {
        Swal.fire({
          theme: 'dark',
          icon: 'error',
          title: 'Unauthorized',
          text: 'You are not authorized to calibrate.',
        });
        return;
      }
      const { isConfirmed } = await Swal.fire({
        theme: 'dark',
        title: 'Preparation',
        text: 'Please place all sensors in the same position for calibration.',
        icon: 'info',
        confirmButtonText: 'Ready',
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
      if (!isConfirmed) return;
      Swal.fire({
        theme: 'dark',
        title: 'Calibrating...',
        didOpen: () => {
          Swal.showLoading();
        },
        allowOutsideClick: false,
        allowEscapeKey: false
      });
      const temperatures = Array.from(sensorTemperatures.values());
      if (temperatures.length === 0) {
        Swal.fire({
          theme: 'dark',
          icon: 'error',
          title: 'Oops...',
          text: 'No sensor data available for calibration.',
          timer: 3000,
          showConfirmButton: false,
          timerProgressBar: true
        });
        return;
      }
      const sortedTemps = [...temperatures].sort((a, b) => a - b);
      const middle = Math.floor(sortedTemps.length / 2);
      const medianTemperature = sortedTemps.length % 2 === 0
        ? (sortedTemps[middle - 1] + sortedTemps[middle]) / 2
        : sortedTemps[middle];
      correctionFactors.clear();
      for (const [sensorId, temp] of sensorTemperatures.entries()) {
        const correctionFactor = medianTemperature - temp;
        correctionFactors.set(sensorId, correctionFactor);
        try {
          await axios.post(`${backendUrl}/api/save-correction`, {
            sensorId,
            correctionFactor,
            medianTemperature
          });
        } catch (err) {
          console.error(`Error saving correction for ${sensorId}:`, err);
        }
      }
      baselineTemperature = medianTemperature;
      chart.getDatasetMeta(0).hidden = true;
      chart.getDatasetMeta(2).hidden = false;
      localStorage.setItem('isCalibrated', 'true');
      const allFactorsAreZero = Array.from(correctionFactors.values()).every(factor => Math.abs(factor) < 0.1);
      if (allFactorsAreZero) {
        Swal.update({
          html: `
            <p>Analyzing sensor data...</p>
            <p style="color:green;"><i>Fun Fact:</i> All your sensors are already in great sync! 🎯</p>
          `
        });
      }
      setTimeout(() => {
        Swal.fire({
          theme: 'dark',
          icon: 'success',
          title: 'Calibration Complete!',
          html: `
            <p>Baseline set to ${baselineTemperature.toFixed(2)}°C</p>
            <p><b>Important:</b> Now place all sensors in their appropriate positions as usual.</p>
            ${allFactorsAreZero ? `<p style="font-size: 0.85em; color: #4caf50; margin-top: 10px;"><i>Fun fact: All your sensors were already reporting nearly identical temperatures! 📟</i></p>` : ''}
          `,
          confirmButtonText: 'Got it!',
        });
      }, 1500);
    });

    // MQTT connection handlers
    client.on('connect', () => {
      mqttStatusText.textContent = 'MQTT: Connected';
      mqttStatusText.classList.remove('text-red-500');
      mqttStatusText.classList.add('text-green-400');
      for (let i = 1; i <= 10; i++) {
        client.subscribe(`tempro/sensor${i}`);
      }
      loadCorrectionFactors();
    });

    client.on('message', (topic, message) => {
      const sensor = topic.split('/')[1];
      const temp = parseFloat(message.toString());
      if (!isNaN(temp)) {
        sensorTemperatures.set(sensor, temp);
        sensorLastSeen.set(sensor, Date.now());
        updateChart();
      }
    });

    client.on('error', () => {
      mqttStatusText.textContent = 'MQTT: Error';
      mqttStatusText.classList.remove('text-green-400');
      mqttStatusText.classList.add('text-red-500');
    });

    setInterval(updateChart, 5000);