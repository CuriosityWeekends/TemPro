require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sensor schema
const sensorSchema = new mongoose.Schema({
  sensorId: { type: String, required: true, unique: true },
  correctionFactor: { type: Number, required: true },
  medianTemperature: { type: Number },
  lastUpdated: { type: Date, default: Date.now },
});

const Sensor = mongoose.model('Sensor', sensorSchema);

// API to save correction factors
app.post('/api/save-correction', async (req, res) => {
  try {
    const { sensorId, correctionFactor, medianTemperature } = req.body;
    const sensor = await Sensor.findOneAndUpdate(
      { sensorId },
      { correctionFactor, medianTemperature, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    res.json({ message: 'Correction factor saved', sensor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API to get correction factor
app.get('/api/get-correction/:sensorId', async (req, res) => {
  try {
    const sensor = await Sensor.findOne({ sensorId: req.params.sensorId });
    if (!sensor) return res.status(404).json({ error: 'Sensor not found' });
    res.json({ correctionFactor: sensor.correctionFactor, medianTemperature: sensor.medianTemperature });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API to get all sensors
app.get('/api/get-all-corrections', async (req, res) => {
  try {
    const sensors = await Sensor.find();
    res.json(sensors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));