import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type:String,
        // required:true,
        unique:true,
    },
    password: {
        type:String,
        required:true,
    }, email: {
        type:String,
        unique:true
    },
    fullName: {
        type:String,
        // required:true,
    }, bio: {
        type:String,
        maxLength: 150,
    },
    profilePicture: {
        type:String,
        default:'https://GTMarketplace.s3.us-east-005.backblazeb2.com/defaultPFP.jpg',
    },
    listings: [{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Listing',
        default:[]
    }], 
    interestedListings:  [{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Listing',
        default:[]
    }],
    inactiveListings:  [{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Listing',
        default:[]
    }],
    contacts: [{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        default:[]
    }],
    // JWT Authentication fields
    refreshToken: {
        type: String,
        default: null
    },
    authProvider: {
        type: String,
        enum: ['firebase', 'jwt', 'google'],
        default: 'firebase'
    },
    lastLogin: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
    /*
    pastTransactions: {
        //define a trasaction schema?
    }
    */
})

const User = mongoose.model('User', userSchema);

export default User;