import express from 'express';
import {createFirebaseUser, signIn, firebaseSignOut, checkAuth, setAuth} from '../controllers/authController.js';
import {getMe} from '../controllers/userController.js';
import {authenticate} from '../middleware/authenticateUser.js';

const router = express.Router()

router.get('/me', authenticate, getMe);

router.post('/createUser', createFirebaseUser);
router.post('/signIn', signIn);
router.post('/signOut', firebaseSignOut);
router.get('/checkAuth', checkAuth);
router.post('/setAuth', setAuth);

export default router;

