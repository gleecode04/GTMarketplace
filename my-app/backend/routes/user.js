import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt'
import {updateUser, getUserById, getUserByEmail, addInterestedListing, removeInterestedListing, getUserListings, getUserInterestedListings, addContact, getUserInactiveListings, addInactiveListing, removeInactiveListing, removeActiveListing, addActiveListing, loginWithJWT, registerWithJWT, refreshJWTToken, logoutJWT } from '../controllers/userController.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { uid, email } = req.body;
  
  try {
    const pw = await bcrypt.hash(uid, 10)
    const newUser = new User({
      username: uid,
      password: pw,
      email: email, // Assuming you want to store the uid as password, otherwise hash the password
      fullName: '', // Add fullName if available
    });

    const user = await newUser.save();
    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (error) {
    console.error('Error saving user to MongoDB:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// update user related details
router.patch('/:id', updateUser)
router.get('/profile/:email', getUserByEmail)
// get all user info (except password) by id
router.get('/:id', getUserById)

// GET route to retrieve all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error retrieving users from MongoDB:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET route to retrieve all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error retrieving users from MongoDB:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add an interested listing to a user's interestedListings. Pass in "userId" and "listingId" in post body.
router.post('/interestedListings', addInterestedListing)

// Remove an interested listing from a user's interestedListings. Pass in "userId" and "listingId" in post body.
router.delete('/interestedListings', removeInterestedListing)

// Add an inactive listing to a user's inactiveListings. Pass in "userId" and "listingId" in post body.
router.post('/inactiveListings', addInactiveListing)

// Remove an inactive listing from a user's inactiveListings. Pass in "userId" and "listingId" in post body.
router.delete('/inactiveListings', removeInactiveListing)

// Add an active listing to a user's listings. Pass in "userId" and "listingId" in post body.
router.post('/activeListings', addActiveListing)

// Remove an active listing from a user's listings. Pass in "userId" and "listingId" in post body.
router.delete('/activeListings', removeActiveListing);

// Get all active listings of a user
router.get('/:id/listings', getUserListings);

// Get all interested listings of a user
router.get('/:id/interestedListings', getUserInterestedListings);

// Get all inactive listings of a user
router.get('/:id/inactiveListings', getUserInactiveListings);

// add new contact
router.post('/addContact', addContact)

// JWT Authentication Routes (Available but not integrated into main login flow yet)
// These routes are ready to use when you want to switch to JWT authentication

// JWT Login route
router.post('/auth/login', loginWithJWT);

// JWT Register route  
router.post('/auth/register', registerWithJWT);

// JWT Token refresh route
router.post('/auth/refresh', refreshJWTToken);

// JWT Logout route
router.post('/auth/logout', logoutJWT);

export default router;