const express = require('express');
const jwt = require('jsonwebtoken'); // For JWT authentication
const session = require('express-session'); // For session management

// Import route modules from the 'router' directory
// Ensure the export names in general.js and auth_users.js match
const customer_routes = require('./router/auth_users.js').authenticated; // Routes for authenticated users
const genl_routes = require('./router/general.js').general; // Routes for general (public) users

const app = express();

// --- Middleware Setup ---

// 1. Body parsing middleware for JSON requests
// This allows Express to read JSON data sent in the request body (e.g., for POST/PUT requests).
app.use(express.json());

// 2. Express Session middleware
// Sets up session management. The 'secret' is used to sign the session ID cookie.
// IMPORTANT: In a production environment, this secret MUST be a long, random,
// and securely stored string.
app.use("/customer", session({secret:"fingerprint_customer", resave: true, saveUninitialized: true}));

// --- JWT Secret Key ---
// This secret key is used to sign (create) and verify JSON Web Tokens (JWTs).
// It MUST be the exact same string as used in auth_users.js for signing tokens.
// CRITICAL: In a real application, this should be a very strong, randomly generated key,
// and stored securely (e.g., in environment variables), NEVER hardcoded like this.
const JWT_SECRET = 'your_super_secret_key_for_jwt_auth_replace_me_with_a_long_random_string';

// --- Authentication Middleware ---
// This middleware protects routes that start with "/customer/auth/*".
// Any request matching this path will first pass through this function for authentication.
app.use("/customer/auth/*", function auth(req, res, next) {
    // Check if the session has an 'authorization' object (where we store the accessToken)
    if (req.session.authorization) {
        let token = req.session.authorization['accessToken']; // Get token from session

        // If no token in session, also check the 'Authorization' header (standard for Bearer tokens)
        if (!token) {
            const authHeader = req.headers['authorization'];
            token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"
        }

        // If still no token after checking both session and headers, the user is unauthorized
        if (!token) {
            return res.status(401).json({ message: "No authentication token provided. Unauthorized." });
        }

        // Verify the token using the secret key
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                // If token is invalid or expired, deny access. Optionally clear the session authorization.
                req.session.authorization = null; // Clear bad token from session
                return res.status(403).json({ message: "Authentication token is invalid or expired. Forbidden." });
            } else {
                // If token is valid, attach the decoded user payload (from the JWT) to the request object.
                // This 'req.user' object can then be accessed by subsequent route handlers.
                req.user = user;
                // For session consistency, set other session properties
                req.session.authenticated = true;
                req.session.username = user.username; // Assuming JWT payload includes 'username'

                next(); // Proceed to the next middleware or the intended route handler
            }
        });
    } else {
        // If there's no session authorization object at all, the user is not logged in.
        return res.status(401).json({ message: "User not logged in. Authentication required." });
    }
});

// --- Route Handling ---
// Routes under "/customer" will use the customer_routes. Some of these are protected.
app.use("/customer", customer_routes);

// General (publicly accessible) routes. These don't go through the authentication middleware directly.
app.use("/", genl_routes);

// --- Start the Express Server ---
const PORT = 5000; // Define the port your server will listen on

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Access general routes at http://localhost:${PORT}/`);
    console.log(`Access customer/auth routes (after login) at http://localhost:${PORT}/customer/`);
});