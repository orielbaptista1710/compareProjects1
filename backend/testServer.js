const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

const customerRouter = require('./routes/customerRoutes');
app.use('/api/customers', customerRouter);

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
