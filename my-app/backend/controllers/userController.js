import User from "../models/User.js";
import bcrypt from 'bcrypt';
import { generateTokenPair, verifyRefreshToken } from '../utils/auth.js';
import { getOrSetCache, CacheKeys, CACHE_TTL, invalidateUserCaches } from '../utils/cache.js';

export const updateUser = async (req, res) => {
    try {
      const userId = req.params.id; 
      const updates = req.body; 
      
      // Remove any fields that are undefined (not provided in the request)
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      console.log('filteredUpdates', filteredUpdates)
  
      // Use findByIdAndUpdate with $set to update only specified fields
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: filteredUpdates },
        { new: true }  // Option to return the updated document
      );
  
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Invalidate user caches
      await invalidateUserCaches(userId);
  
      res.status(200).json({ user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user profile', error });
    }
  };
  
export const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        // Use cache with fallback to database
        const user = await getOrSetCache(
            CacheKeys.userById(id),
            async () => {
                const userData = await User.findById(id)
                    .populate('listings interestedListings contacts') // Populate references
                    .select('-password'); // Exclude the password field for security
                return userData;
            },
            CACHE_TTL.USER_DATA
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving user', error: error.message });
    }
};

export const getUserByEmail = async (req, res) => {
  const email  = req.params.email;

  try {
      // Use cache with fallback to database
      const user = await getOrSetCache(
          CacheKeys.userByEmail(email),
          async () => {
              const userData = await User.find({ email: email })
                  .populate('listings interestedListings') // Populate references
                  .select('-password'); // Exclude the password field for security
              return userData;
          },
          CACHE_TTL.USER_DATA
      );

      console.log("is this being hit?")
      console.log(user)
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({user: user});
  } catch (error) {
      res.status(500).json({ message: 'Error retrieving user', error: error.message });
  }
};

export const addInterestedListing = async (req, res) => {
  try {
      const { userId, listingId } = req.body; // Expect userId and listingId in request body

      if (!userId || !listingId) {
          return res.status(400).json({ message: "User ID and Listing ID are required." });
      }

      // Update the user's interestedListings array
      const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $addToSet: { interestedListings: listingId } }, // $addToSet prevents duplicates
          { new: true } // Return updated document
      );

      if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
      }

      // Invalidate user caches
      await invalidateUserCaches(userId);

      res.status(200).json({ message: "Listing added to interestedListings" });
  } catch (error) {
      res.status(500).json({ message: "Failed to add interested listing", error });
  }
};

export const removeInterestedListing = async (req, res) => {
  try {
      const { userId, listingId } = req.body;

      if (!userId || !listingId) {
          return res.status(400).json({ message: "User ID and Listing ID are required." });
      }

      const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $pull: { interestedListings: listingId } }, // $pull removes matching value
          { new: true }
      );

      if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
      }

      // Invalidate user caches
      await invalidateUserCaches(userId);

      res.status(200).json({ message: "Listing removed from interestedListings" });
  } catch (error) {
      res.status(500).json({ message: "Failed to remove interested listing", error });
  }
};

export const getUserListings = async (req, res) => {
  try {
      const { id } = req.params;

      // Use cache with fallback to database
      const listings = await getOrSetCache(
          CacheKeys.userListings(id),
          async () => {
              const user = await User.findById(id).populate('listings', '-__v'); // Exclude __v (version) field
              if (!user) {
                  return null;
              }
              return user.listings;
          },
          CACHE_TTL.USER_LISTINGS
      );

      if (!listings) {
          return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ listings: listings });
  } catch (error) {
      res.status(500).json({ message: "Failed to retrieve user listings", error });
  }
};

export const getUserInterestedListings = async (req, res) => {
  try {
      const { id } = req.params;

      // Use cache with fallback to database
      const interestedListings = await getOrSetCache(
          CacheKeys.userInterestedListings(id),
          async () => {
              const user = await User.findById(id).populate('interestedListings', '-__v');
              if (!user) {
                  return null;
              }
              return user.interestedListings;
          },
          CACHE_TTL.INTERESTED_LISTINGS
      );

      if (!interestedListings) {
          return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ interestedListings: interestedListings });
  } catch (error) {
      res.status(500).json({ message: "Failed to retrieve user's interested listings", error });
  }
};

export const getUserInactiveListings = async (req, res) => {
    try {
        const { id } = req.params;
  
        // Use cache with fallback to database
        const inactiveListings = await getOrSetCache(
            CacheKeys.userInactiveListings(id),
            async () => {
                const user = await User.findById(id).populate('inactiveListings', '-__v');
                if (!user) {
                    return null;
                }
                return user.inactiveListings;
            },
            CACHE_TTL.USER_LISTINGS
        );
  
        if (!inactiveListings) {
            return res.status(404).json({ message: "User not found" });
        }
  
        res.status(200).json({ inactiveListings: inactiveListings });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve user's inactive listings", error });
    }
};

export const addInactiveListing = async (req, res) => {
    try {
        const { sellerId, listingId } = req.body; // Expect userId and listingId in request body
  
        if (!sellerId || !listingId) {
            return res.status(400).json({ message: "User ID and Listing ID are required." });
        }
  
        // Update the user's inactiveListings array
        const updatedUser = await User.findByIdAndUpdate(
            sellerId,
            { $addToSet: { inactiveListings: listingId } }, // $addToSet prevents duplicates
            { new: true } // Return updated document
        );
  
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Invalidate user caches
        await invalidateUserCaches(sellerId);
  
        res.status(200).json({ message: "Listing added to inactiveListings" });
    } catch (error) {
        res.status(500).json({ message: "Failed to add inactive listing", error });
    }
};

export const removeInactiveListing = async (req, res) => {
    try {
        const { sellerId, listingId } = req.body;
  
        if (!sellerId || !listingId) {
            return res.status(400).json({ message: "User ID and Listing ID are required." });
        }
  
        const updatedUser = await User.findByIdAndUpdate(
            sellerId,
            { $pull: { inactiveListings: listingId } }, // $pull removes matching value
            { new: true }
        );
  
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Invalidate user caches
        await invalidateUserCaches(sellerId);

        res.status(200).json({ message: "Listing removed from inactiveListings" });
    } catch (error) {
        res.status(500).json({ message: "Failed to remove inactive listing", error });
    }
};

export const addActiveListing = async (req, res) => {
    try {
        const { sellerId, listingId } = req.body; // Expect userId and listingId in request body
  
        if (!sellerId || !listingId) {
            return res.status(400).json({ message: "User ID and Listing ID are required." });
        }
  
        // Update the user's inactiveListings array
        const updatedUser = await User.findByIdAndUpdate(
            sellerId,
            { $addToSet: { listings: listingId } }, // $addToSet prevents duplicates
            { new: true } // Return updated document
        );
  
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Invalidate user caches
        await invalidateUserCaches(sellerId);

        res.status(200).json({ message: "Listing added to listings" });
    } catch (error) {
        res.status(500).json({ message: "Failed to add listing", error });
    }
};

export const removeActiveListing = async (req, res) => {
    try {
        const { sellerId, listingId } = req.body;
  
        if (!sellerId || !listingId) {
            return res.status(400).json({ message: "User ID and Listing ID are required." });
        }
  
        const updatedUser = await User.findByIdAndUpdate(
            sellerId,
            { $pull: { listings: listingId } }, // $pull removes matching value
            { new: true }
        );
  
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Invalidate user caches
        await invalidateUserCaches(sellerId);

        res.status(200).json({ message: "Listing removed from listings" });
    } catch (error) {
        res.status(500).json({ message: "Failed to remove listing", error });
    }
};

export const addContact = async (req, res) => {
    const { user1Id, user2Id } = req.body;

    if (user1Id === user2Id) {
        return res.status(400).json({ message: "You cannot message yourself" });
    }

    try {
        await Promise.all([
            User.findByIdAndUpdate(user1Id, { $addToSet: { contacts: user2Id } }),
            User.findByIdAndUpdate(user2Id, { $addToSet: { contacts: user1Id } })
        ]);
        
        const user1 = await User.findById(user1Id);
        const user2 = await User.findById(user2Id);
        console.log('user1: ' + user1.fullName);
        console.log('user2: ' + user2.fullName);
        console.log('contacts: ' + user1.contacts);
        
        // Invalidate user caches for both users
        await invalidateUserCaches(user1Id);
        await invalidateUserCaches(user2Id);
        
        return res.status(200).json({ message: "Contact added successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to add contact", error });
    }
};

// JWT Authentication Controllers (Available but not integrated into login flow yet)

/**
 * JWT Login - Authenticate user with email and password
 * This function is available but not connected to the login route yet
 */
export const loginWithJWT = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Email and password are required' 
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ 
                message: 'Account is deactivated' 
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // Generate JWT tokens
        const tokens = generateTokenPair(user);

        // Update user's refresh token and last login
        await User.findByIdAndUpdate(user._id, {
            refreshToken: tokens.refreshToken,
            lastLogin: new Date(),
            authProvider: 'jwt'
        });

        // Return user data and tokens
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                fullName: user.fullName,
                profilePicture: user.profilePicture
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });

    } catch (error) {
        console.error('JWT Login Error:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

/**
 * JWT Register - Register new user with email and password
 * This function is available but not connected to the register route yet
 */
export const registerWithJWT = async (req, res) => {
    try {
        const { email, password, username, fullName } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ 
                message: 'Email, password, and username are required' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(409).json({ 
                message: 'User with this email or username already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            email,
            password: hashedPassword,
            username,
            fullName: fullName || '',
            authProvider: 'jwt',
            lastLogin: new Date()
        });

        const savedUser = await newUser.save();

        // Generate JWT tokens
        const tokens = generateTokenPair(savedUser);

        // Update user's refresh token
        await User.findByIdAndUpdate(savedUser._id, {
            refreshToken: tokens.refreshToken
        });

        // Return user data and tokens
        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: savedUser._id,
                email: savedUser.email,
                username: savedUser.username,
                fullName: savedUser.fullName,
                profilePicture: savedUser.profilePicture
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });

    } catch (error) {
        console.error('JWT Register Error:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

/**
 * Refresh JWT Token - Generate new access token using refresh token
 * This function is available but not connected to any route yet
 */
export const refreshJWTToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ 
                message: 'Refresh token is required' 
            });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Find user and verify refresh token matches
        const user = await User.findById(decoded.userId);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ 
                message: 'Invalid refresh token' 
            });
        }

        // Check if user is still active
        if (!user.isActive) {
            return res.status(401).json({ 
                message: 'Account is deactivated' 
            });
        }

        // Generate new tokens
        const tokens = generateTokenPair(user);

        // Update refresh token in database
        await User.findByIdAndUpdate(user._id, {
            refreshToken: tokens.refreshToken
        });

        res.status(200).json({
            message: 'Token refreshed successfully',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });

    } catch (error) {
        console.error('JWT Refresh Error:', error);
        res.status(401).json({ 
            message: 'Invalid refresh token',
            error: error.message 
        });
    }
};

/**
 * JWT Logout - Invalidate refresh token
 * This function is available but not connected to any route yet
 */
export const logoutJWT = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ 
                message: 'Refresh token is required' 
            });
        }

        // Find user and clear refresh token
        const user = await User.findOne({ refreshToken });
        if (user) {
            await User.findByIdAndUpdate(user._id, {
                refreshToken: null
            });
        }

        res.status(200).json({
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('JWT Logout Error:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message 
        });
    }
};