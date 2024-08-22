const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { OAuth2Client } = require('google-auth-library');
const env = require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/contacts.readonly']
},
async function (accessToken, refreshToken, profile, done) {
    // Initialize OAuth2Client with the access token
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    try {
        // Fetch additional user details from Google People API
        const userInfo = await client.request({
            url: 'https://people.googleapis.com/v1/people/me?personFields=phoneNumbers',
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        // Add phoneNumbers to profile
        profile.phoneNumbers = userInfo.data.phoneNumbers || [];

        return done(null, profile);
    } catch (error) {
        console.error('Error fetching additional user info:', error);
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

module.exports = passport;
