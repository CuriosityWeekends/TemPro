const client = mqtt.connect('ws://serverip:9001', {
    username: 'user',
    password: 'password'
    });

const sensorDataMap = new Map();
const sensorLastSeenMap = new Map();
const sensorOffsetMap = new Map(); // Calibrated Offset Map
const ctx = document.getElementById('tempChart').getContext('2d');
const mqttStatus = document.getElementById('mqttStatus');

const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Temperature (°C)',
          hidden: false,
          data: [],
          borderColor: (context) => {
            const value = context.raw;
            if (value > 30) return 'red';         // High danger
            if (value > 25) return 'orange';      // Warm
            return 'hsl(189, 62.40%, 38.60%)';                     // Safe (green)
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
          label: 'Calibration Baseline',
          data: [], // Will be filled dynamically
          borderColor: '#1d8cf8',
          borderDash: [5, 5],
          borderWidth: 2,
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Calibrated Temperature (°C)',
          hidden: true,
          data: [],
          borderColor: (context) => {
            const value = context.raw;
            if (value > 30) return 'red';         // High danger
            if (value > 25) return 'orange';      // Warm
            return 'hsl(115, 62.40%, 38.60%)';                     // Safe (green)
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
  
  
function updateChart() {
	const now = Date.now();
  
	for (const [sensor, lastSeen] of sensorLastSeenMap.entries()) {
	  if (now - lastSeen > 10000) {
		sensorDataMap.delete(sensor);
		sensorLastSeenMap.delete(sensor);
	  }
	}
  
	const entries = Array.from(sensorDataMap.entries()).sort((a, b) => {
	  const aNum = parseInt(a[0].replace('sensor', ''));
	  const bNum = parseInt(b[0].replace('sensor', ''));
	  return aNum - bNum;
	});
  
	const labels = entries.map(([sensor]) => sensor);
	const values = entries.map(([sensor, temp]) => temp);
  const calibratedValues = entries.map(([sensor, temp]) => temp + (sensorOffsetMap.get(sensor) || 0));

	chart.data.labels = labels;
	chart.data.datasets[0].data = values;
  chart.data.datasets[2].data = calibratedValues;
	if (values.length > 0) {
        const minTemp = Math.min(...values, ...calibratedValues);
        const maxTemp = Math.max(...values, ...calibratedValues);
        chart.options.scales.y.min = Math.floor(minTemp - 5);
        chart.options.scales.y.max = Math.ceil(maxTemp + 5);
      
        const highestTemp = Math.max(...calibratedValues);
      
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
      
        if (calibrationBaseline !== null) {
          chart.data.datasets[1].data = chart.data.labels.map(() => calibrationBaseline);
        }
      }
      
      chart.update();
      
  
	chart.update();
  }
  let calibrationBaseline = null;
  document.getElementById('calibrateBtn').addEventListener('click', async () => {
    const { isConfirmed } = await Swal.fire({
      theme: 'dark',
      title: 'Preparation',
      text: 'Please place all sensors in the same position for calibration.',
      icon: 'info',
      confirmButtonText: 'Ready',
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    if (!isConfirmed) return; // If user cancels, do nothing
    Swal.fire({
      theme: 'dark',
      title: 'Calibrating...',
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false,
      allowEscapeKey: false
    });
    const values = Array.from(sensorDataMap.values());
    
    if (values.length === 0) {
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
    
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const Median = sorted.length % 2 !== 0
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
    
    sensorOffsetMap.clear();
    for (const [sensor, temp] of sensorDataMap.entries()) {
      sensorOffsetMap.set(sensor, Median - temp); // To Save The Offset for every Sensor!
    }
    calibrationBaseline = Median;
    chart.getDatasetMeta(0).hidden = true;
    chart.getDatasetMeta(2).hidden = false;
    const allOffsetsAreZero = Array.from(sensorOffsetMap.values()).every(offset => Math.abs(offset) < 0.1);

    if (allOffsetsAreZero) {
      Swal.update({
        html: `
          <p>Analyzing sensor data...</p>
          <p style="color:green;"><i>Fun Fact:</i> All your sensors are already in great sync! 🎯</p>
        `
      });
    }
    setTimeout(() => { // simulate a bit of delay
      Swal.fire({
        theme: 'dark',
        icon: 'success',
        title: 'Calibration Complete!',
        html: `
          <p>Baseline set to ${calibrationBaseline.toFixed(2)}°C</p>
          <p><b>Important:</b> Now place all sensors in their appropriate positions as usual.</p>
        ${allOffsetsAreZero ? `<p style="font-size: 0.85em; color: #4caf50; margin-top: 10px;"><i>Fun fact: All your sensors were already reporting nearly identical temperatures! 📟</i></p>` : ''}
        `,
        confirmButtonText: 'Got it!',
      });
    }, 1500);
  });
  


client.on('connect', () => {
  mqttStatus.textContent = 'MQTT: Connected';
  mqttStatus.classList.remove('text-red-500');
  mqttStatus.classList.add('text-green-400');

  for (let i = 1; i <= 10; i++) {
    client.subscribe(`tempro/sensor${i}`);
  }
});

client.on('message', (topic, message) => {
  const sensor = topic.split('/')[1];
  const temp = parseFloat(message.toString());

  if (!isNaN(temp)) {
    sensorDataMap.set(sensor, temp);
    sensorLastSeenMap.set(sensor, Date.now());
    updateChart();
  }
});

client.on('error', () => {
  mqttStatus.textContent = 'MQTT: Error';
  mqttStatus.classList.remove('text-green-400');
  mqttStatus.classList.add('text-red-500');
});

setInterval(updateChart, 5000);
