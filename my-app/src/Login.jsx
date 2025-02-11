import React, { useState } from "react";
import "./Auth.css";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import axios from 'axios';
import GoogleLogo from "./assets/Google logo.png";
import GTLogo from "./assets/GT Marketplace Logo.jpeg";
import ShoppingBag from "./assets/1f6cd.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const sendUserDataToMongoDB = async (user) => {
    try {
      // const cred = {
      //   uid: user.uid,
      //   email: user.email,
      // }
      // console.log('cred', cred)
      const response = await fetch(
        `http://localhost:3001/api/users/profile/${user.email}`
        // {
        //   method: "POST",
        //   headers: {
        //       "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify(cred)} 
        
      );
      console.log("User data sent to MongoDB:", response.data);
      return response;
    } catch (error) {
      console.error("Error sending user data to MongoDB:", error);
    }
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    console.log("could it be this endpoint")
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const res = await sendUserDataToMongoDB(userCredential.user);
      const data = await res.json()
      console.log(data)
      // const data = res.data.userId;
      console.log('RES DATA FROM MONGO', data);
      localStorage.setItem("userId", data[0]._id);
      console.log("Login successful:", userCredential.user);
      navigate("/"); // Navigate to home page after successful login
    } catch (error) {
      console.error("Error logging in:", error);
      setError(error.message);
    }
  };
  
  const handleGoogleSignIn = async () => {
    console.log('is it this endpoint..')
    setError(""); // Clear previous errors
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google Sign-In successful:", result.user);
      const res = await sendUserDataToMongoDB(result.user);
      const data = await res.json()
      console.log(data)
      // const data = res.data.userId;
      console.log('RES DATA FROM MONGO', data);
      localStorage.setItem("userId", data[0]._id);
      navigate("/"); // Navigate to home page after successful login
    } catch (error) {
      console.error("Error with Google sign-in:", error);
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-customBlue flex items-center justify-center">
      <div className="hidden md:flex flex-1 items-center justify-center">
        <img className="w-72 h-72" src={ShoppingBag} alt="" />
      </div>

      <div className="w-full max-w-lg bg-white p-16 mx-36 rounded-3xl shadow-lg">
        <div className="space-y-6 mb-8">
          <h1 className="text-2xl font-semibold text-customBlue">
            GT Marketplace
          </h1>
          <h2 className="text-2xl font-bold">Log In</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600"
              placeholder="johndoe@gmail.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-slate-600 focus:ring-slate-600"
              />
              <span className="text-sm">Remember me</span>
            </label>
            <Link
              className="text-sm text-blue-500 hover:underline"
              to="/register"
            >
              Forgot password?
            </Link>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-customBlue text-white py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Log In
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            <img className="w-5 h-5 mr-2" src={GoogleLogo} alt="" />
            Sign in with Google
          </button>

          <p className="text-sm text-center">
            {"Don't have an account? "}
            <Link className="text-blue-500 hover:underline" to="/register">
              Sign up now
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
