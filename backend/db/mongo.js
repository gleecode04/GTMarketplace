import mongoose from 'mongoose';

const mongoSetup = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGO_URI);
        // const connection = await mongoose.conne\ct('mongodb+srv://TRY:GT-MarketplaceDB@marketplacedb.gaqm6.mongodb.net/', {
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true,
        // });
        console.log("MongoDB connection success");
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

export default mongoSetup;