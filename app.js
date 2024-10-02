const express     = require('express');
const mongoose    = require('mongoose');
const dotenv      = require('dotenv');
const authRoutes  = require('./routes/authRoutes');
const urlRoutes   = require('./routes/urlRoutes');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));



  

app.use('/api', authRoutes);
app.use('/url', urlRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
