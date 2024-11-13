import dotenv from 'dotenv';
dotenv.config({ override: true });

import express from 'express';
import mongoSetup from './db/mongo.js';
import cors from 'cors'; // Import cors
import http from 'http';
import testRoutes from './routes/testroutes.js';
import listingRoutes from './routes/listing.js';
import userRoutes from './routes/user.js'; // Correct import statement
import initializeSocket  from './socket-backend.js';
import messageRoutes from './routes/message.js';
import fileUploadRoutes from './routes/fileUpload.js'

const app = express();

const corsOptions = {
    origin: 'http://localhost:3000', // Allow your frontend origin
    credentials: true, // Allow cookies to be sent with the request
  };

app.use(cors(corsOptions)); // Use cors middleware
app.use(express.json()); //parse req body
app.use(express.urlencoded({extended: true})); //parse form data

const port = process.env.PORT || 3001;

app.get('/', (req, res) => {
    res.send('hello world');
})

app.use('/testAPI', testRoutes);
app.use('/listing', listingRoutes);
app.use('/api/users', userRoutes); // Use the new user routes
app.use('/api/message', messageRoutes); // Use the new message routes
app.use('/api/fileUpload', fileUploadRoutes)


// Creating the server (http) const
const server = http.createServer(app);
initializeSocket(server);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    mongoSetup();
    console.log(process.env.AWS_SECRET_ACCESS_KEY)
});