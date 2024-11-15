// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, validatePassword } from 'firebase/auth';
import User from "../models/User.js";
//import {auth} from "../../src/firebase.js";
import {createUser} from "./userController.js";
import bcrypt from 'bcrypt';

export const firebaseConfig = {
    apiKey: process.env.APIKEY,
    authDomain: process.env.AUTHDOMAIN,
    projectId: process.env.PROJECTID,
    storageBucket: process.env.STORAGEBUCKET,
    messagingSenderId: process.env.SENDERID,
    appId: process.env.APPID,
    measurementId: process.env.MEASUREMENTID
  };
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  // const analytics = getAnalytics(app);
  export const auth = getAuth(app);


export const createFirebaseUser = async (req, res) => {
    const {email, password, fullName, username} = req.body;
    try {
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log(email, password, fullName, username);

        if (!validatePassword(auth, password)) {
            return res.status(400).json({error: "Password invalid"});
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        //add uesr to mongoDB
        const newUser = new User({
            username,
            password: hashedPassword,
            fullName,
            email
        });

        const mongoUser = await newUser.save();

        console.log(req.session, 'session from createUer');
        console.log(req.session.id);

        res.status(201).json({firebaseUser: user, mongo: mongoUser});

    } catch (err) {
        res.status(500).json({error: err.message});
    }
    
}



export const signIn = async (req, res) => {
  const {email, password, fullName, username} = req.body;
  try {
    if (req.session.authenticated) {
        console.log("already signed in");
        return res.status(401).json({error: "already signed in"});
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password)
  
    // Signed in 
    const user = userCredential.user;
    // ...
    //query mongodb for user
    const mongoUser = await User.findOne({email: email}).select('-password');
    //console.log('mongo user and user saved.')
    if (!mongoUser) {
        return res.status(404).json({error: "User not found"});
    }
    req.session.authenticated = true;
    //req.session.user = mongoUser;
    req.session.userId = mongoUser._id;

    console.log(mongoUser);

    return res.status(201).json({mongouser: mongoUser, session: req.session});
  } catch(error)  {
    res.status(401).json({error: error.message});
  }
}


export const firebaseSignOut = async (req, res) => {
    //await signOut(auth);
    console.log(req.session || 'no session');
    console.log(req.session.id || 'no session id');
    if (!req.session || !req.session.authenticated) {
        return res.status(401).json({message: "not signed in"});
    }

    signOut(auth).then(() => {
    // Sign-out successful.
    req.session.authenticated = false;
    //req.session.user = null;
    req.session.userId = null;
    res.clearCookie('connect.sid', { path: '/' });
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({message: 'Error destroying session'});
        } else {
            return res.status(200).json({ message: 'Session destroyed and cookie cleared' });
        //res.redirect('/'); // Redirect to home page
        }
    });
    console.log(req.session)

    //res.status(200).json({message: "signed out"});
    }).catch((error) => {
        res.status(500).json({error: error.message});
    });
}

export const checkAuth = async (req, res) => {
    if (req.session.authenticated) {
        const user = req.session.user;
        return res.json({user});
    } 
    console.log(req.session, 'session from checkAuth');
    console.log(req.session.id);
    res.json(null);
}

export const setAuth = async (req, res) => {
    try {
        const {email} = req.body
        // console.log(user ||'user undefined');
        // if (!user) {
        //     res.status(500).json({error: "no user provided"});
        // }
        console.log(email || 'email undefined');
        const mongoUser = await User.findOne({email: email}).select('-password');
        req.session.authenticated = true;
        req.session.userId = mongoUser._id;

        console.log(req.session)

        res.status(200).json({message: "session set", sesh: req.session});
    } catch(err) {
        res.status(500).json({error: err.message});
    }
    
}



