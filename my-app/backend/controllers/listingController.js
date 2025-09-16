import Listing from '../models/Listing.js';
import User from '../models/User.js';
import { getOrSetCache, CacheKeys, CACHE_TTL, invalidateListingCaches, invalidateUserCaches } from '../utils/cache.js';

export const addListing = async (req, res) => {
    try {
        console.log("endpoint")
        console.log("req.body: ", req.body);
        const {id} = req.params
        const newListing = new Listing({
            ...req.body,
            seller: id,
        });
        const savedListing = await newListing.save();
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $push: {listings : savedListing._id} },
            { new: true }  // Option to return the updated document
          );
          console.log("userid at listing", id)
        
        // Invalidate relevant caches
        await invalidateListingCaches(savedListing._id);
        await invalidateUserCaches(id);
        
        res.status(201).json({message: "listing saved", newListing});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
}

export const getListingById = async (req, res) => {
    try {
        const {id} = req.params; 
        
        // Use cache with fallback to database
        const listing = await getOrSetCache(
            CacheKeys.listingById(id),
            async () => {
                const listingData = await Listing.findById(id);
                if (!listingData) {
                    return null;
                }
                return listingData;
            },
            CACHE_TTL.LISTING_DETAILS
        );

        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        res.status(200).json(listing);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getListingsBySeller = async (req, res) => {
    try {
        const {id} = req.params; 
        
        // Use cache with fallback to database
        const listings = await getOrSetCache(
            CacheKeys.listingsBySeller(id),
            async () => {
                const listingsData = await Listing.find({seller: id});
                return listingsData || [];
            },
            CACHE_TTL.USER_LISTINGS
        );

        if (!listings || listings.length === 0) {
            return res.status(404).json({ message: "No listings found for the specified seller" });
        }

        res.status(200).json(listings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


export const getListingsByCondition = async (req, res) => {
    try {
        const {condition} = req.params;
        
        // Use cache with fallback to database
        const listings = await getOrSetCache(
            CacheKeys.listingsByCondition(condition),
            async () => {
                const listingsData = await Listing.find({ condition }).select('title price');
                return listingsData || [];
            },
            CACHE_TTL.CATEGORY_RESULTS
        );
        
        res.status(200).json(listings);
    } catch (err) {
        res.status(500).json( {error: err.message} );
    }

}

export const getActiveListings = async (req, res) => {
    try {
        // Use cache with fallback to database - this is the most frequently accessed endpoint
        const listings = await getOrSetCache(
            CacheKeys.activeListings(),
            async () => {
                const listingsData = await Listing.find({ status : 'available'}).select('title image price category condition');
                return listingsData || [];
            },
            CACHE_TTL.LISTINGS
        );
        
        console.log(`Active listings: ${listings.length} items`);
        res.status(200).json({data: listings});
    } catch (err) {
        res.status(500).json( {error: err.message});
    }
}

export const getListingByCategory = async (req, res) => {
    try {
        const {category} = req.params;
        
        // Use cache with fallback to database
        const listings = await getOrSetCache(
            CacheKeys.listingsByCategory(category),
            async () => {
                const listingsData = await Listing.findByCategory(category);
                return listingsData || [];
            },
            CACHE_TTL.CATEGORY_RESULTS
        );

        // Case where listing is not found
        if (listings.length === 0) {
            return res.status(200).json({
                message: "No listings available in the category", 
                listings: []
            });
        }

        // Return the listing
        res.status(200).json(listings);
    } catch (err) {
        // Logging the error
        console.error(err);
        res.status(500).json({message: err.message});
    }
};

export const getListingByPrice = async (req, res) => {
    try {
        // Filtering based on min and max price ranges
        const {min, max} = req.query;
        // Converting min and max to numbers
        const minPrice = parseFloat(min);
        const maxPrice = parseFloat(max);

        // Use cache with fallback to database
        const listings = await getOrSetCache(
            CacheKeys.listingsByPrice(minPrice, maxPrice),
            async () => {
                const listingsData = await Listing.findByPriceRange(minPrice, maxPrice);
                return listingsData || [];
            },
            CACHE_TTL.PRICE_RESULTS
        );

        // Case where listing is not found
        if (listings.length === 0) {
            return res.status(200).json({
                message: "No listings available in the price range",
                listings: []
            });
        }

        // Return the listing
        res.status(200).json(listings);
    } catch (err) {
        // Logging the error
        console.error(err);
        res.status(500).json({message: err.message});
    }
};

export const updateListing = async (req, res) => {
    try {
        const listingId = req.params.id; 
        const updates = req.body;     // Fields to update are sent in req.body

        // Remove any fields that are undefined (not provided in the request)
        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value !== undefined)
        );

        // Use findByIdAndUpdate with $set to update only specified fields
        const updatedListing = await Listing.findByIdAndUpdate(
            listingId,
            { $set: filteredUpdates },
            { new: true }  // Option to return the updated document
        );

        if (!updatedListing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Invalidate relevant caches
        await invalidateListingCaches(listingId);
        await invalidateUserCaches(updatedListing.seller);

        res.status(200).json({ listing: updatedListing });
    } 
    catch (error) {
        res.status(500).json({ message: 'Failed to update listing', error });
    }
}

export const deleteListing = async (req, res) => {

    try {  
        const listingId = req.params.id;
        const deletedListing = await Listing.findByIdAndDelete(listingId);
        if (!deletedListing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        await User.findByIdAndUpdate(
            deletedListing.seller, // Assuming `seller` field stores user ID
            { $pull: { listings: listingId, inactiveListings: listingId } }, // Remove the listing ID from the array
            { new: true } // Return the updated user document
        );

        // Invalidate relevant caches
        await invalidateListingCaches(listingId);
        await invalidateUserCaches(deletedListing.seller);

        return res.status(200).json({ message: 'Listing deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete listing', error });
    }
};