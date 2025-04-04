import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/App.css";
import { Heart } from "lucide-react";
import Icons from "../images/icons";

const getAllListings = async () => {
  //example placeholders
  const response = await fetch("http://localhost:3001/listing/active");
  const data = await response.json();
  return data.data;
};

const categories = ["All", "Furniture", "Electronics", "Clothing", "Vehicles", "Property Rentals",
  "Entertainment", "Free Stuff", "Garden & Outdoor", "Hobbies", "Home Goods", "Home Improvement", 
  "Musical Instruments", "Office Supplies", "Pet Supplies", "Sporting Goods", "Toys & Games", "Other"]

function Home() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredListings, setFilteredListings] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("1000");
  const [favorites, setFavorites] = useState(() => {
    return JSON.parse(localStorage.getItem("favorites")) || {};
  });

  useEffect(() => {
    getAllListings().then((data) => {
      setListings(data || []);
      setFilteredListings(data || []);
    });
  }, []);

  useEffect(() => {
    console.log("hello0")
    const filtered = listings.filter(
      (listing) =>
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === "All" || listing.category === selectedCategory)
    );
    setFilteredListings(filtered);
    console.log(filteredListings);
  }, [searchTerm, selectedCategory, listings]);

  const navigateToListingDetails = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/listing/${id}`);
      const data = await response.json();

      if (data) {
        navigate(`/listing/${id}`, { state: { listing: data } });
      } else {
        console.error("Listing not found");
      }
    } catch (error) {
      console.error("Error fetching listing:", error);
    }
  };

  const handleFavorite = async (listing) => {
    if (!listing._id) return;

    const userId = localStorage.getItem("userId"); //Assuming userId is stored in localStorage
  if (!userId) {
    console.error("User not logged in");
    return;
  }

  const isFavorited = favorites[listing._id];

  //Update local state first for instant UI response
  setFavorites((prev) => {
    const newFavorites = { ...prev };

    if (isFavorited) {
      delete newFavorites[listing._id]; //Unfavorite
    } else {
      newFavorites[listing._id] = listing; //Favorite
    }

    localStorage.setItem("favorites", JSON.stringify(newFavorites));
    return newFavorites;
    });
    try {
      //Update the listing's `interestedUsers` array
      await fetch(`http://localhost:3001/listing/${listing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isFavorited ? "remove" : "add", //Remove if already favorited, otherwise add
          userId,
        }),
      });
  
      //Update the user's `interestedListings` array
      await fetch(`http://localhost:3001/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isFavorited ? "remove" : "add",
          listingId: listing._id,
        }),
      });
  
      console.log(
        `Successfully ${isFavorited ? "removed" : "added"} listing ${listing._id}`
      );
    } catch (error) {
      console.error("Error updating favorite:", error);
    }
  
    //Dispatch event to notify `UserProfile` of updates
    window.dispatchEvent(new Event("favoritesUpdated"));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleFilter = (minPrice, maxPrice) => {
    setFilteredListings(
      listings.filter(
        (listing) => listing.price >= minPrice && listing.price <= maxPrice
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex">
        <aside className="w-64 mr-8 flex flex-col">
          <label className="font-semibold mb-2">Filters</label>
          <input
            placeholder="Search listings..."
            className="border border-gray-300 rounded-md p-2 mb-4"
            value={searchTerm}
            onChange={handleSearch}
          />
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Categories</h3>
            <ul className="space-y-2">
              {categories.map(
                (category) => (
                  <li key={category}>
                    <button
                      className={`
                        w-full flex items-center text-left py-1 px-2 rounded
                        ${
                          selectedCategory === category 
                            ? 'bg-gray-200'  // Highlight if selected
                            : 'hover:bg-gray-200' // Otherwise, highlight on hover
                        }
                      `}
                      onClick={() => handleCategorySelect(category)}
                    >
                    {Icons[category] && (
                      <img
                        src={Icons[category]}
                        alt={`${category} icon`}
                        className="w-6 h-6 mr-4"
                      />
                    )}
                      {category}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Price Range</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="1000"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="w-1/2 border border-gray-300 rounded-md p-2 text-sm"
              />
              <span className="text-gray-600">-</span>
              <input
                type="number"
                min="0"
                max="1000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className="w-1/2 border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
            <button
              className="mt-4 bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-700 transition"
              onClick={() => {
                handleFilter(minPrice, maxPrice);
              }}
            >
              Apply
            </button>
          </div>
        </aside>
        <main className="flex-1">
          <div className="flex justify-between items-center mt-4 mb-4">
            <h1 className="text-2xl font-bold">Active Listings</h1>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded"
              onClick={() => navigate("/createlisting")}
            >
              Create Listing
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="w-full flex">
                    <div className="w-[80%]">
                      <h2 className="text-lg font-semibold">{listing.title}</h2>
                      <p className="text-gray-600 mb-4">${listing.price}</p>
                    </div>
                    <div className="w-[20%]">
                      <button onClick={() => handleFavorite(listing)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                        <Heart
                          size={24}
                          className={`transition-colors ${
                            favorites[listing._id]
                              ? "text-red-500"
                              : "text-gray-400"
                          }`}
                          fill={favorites[listing._id] ? "red" : "none"}
                        />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => navigateToListingDetails(listing._id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Home;
