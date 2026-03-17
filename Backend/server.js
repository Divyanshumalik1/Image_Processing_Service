import express from 'express';
import cors from 'cors';
import datarouter from './routes/dataroute.js';
import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';

configDotenv();

const app = express();
app.use(express.json());
app.use(cors());

app.use('/', datarouter);

const mongoClient = mongoose.connect(process.env.MONGO_URI, {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Listening to Port ${PORT}`);
})

