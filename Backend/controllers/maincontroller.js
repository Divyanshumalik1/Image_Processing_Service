/*  
    ****** JWT AUTHENTICATION AND AUTHORIZATION LOGIC FOR LOGIN AND SIGNUP ROUTES ******
    
    Here we need to add JWT authentication and authorization logic for login and signup routes.

    We need a JWT string -> Header. Payload. Signature.

    Header will contain the type of token and the algorithm used for signing the token. 
    Payload will contain the user information and the expiration time of the token. 
    Signature will be generated using the header, payload and a secret key.

    - First Frontend/CLinet will send the username and password to the backend.
    - Backend will search for the user in the database and if found, it will generate a JWT token and send it back to the client.
    - Client will store the token in local storage and send it in the header of every request to the backend for authentication and authorization.

    For signup, we will first check if the user already exists in the database and if not, we will create a new user and then generate a JWT token and send it back to the client.

    For login, we will check if the user exists in the database and if the password is correct, then we will generate a JWT token and send it back to the client.

    For implementing all of this we will write a middleware function that will verify the JWT token and allow access to the protected routes only if the token is valid.

    HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret)

    NEVER GET YOUR PAYLOAD DATA FROM THE CLIENT. ALWAYS GET IT FROM THE DATABASE. 
    OTHERWISE, ANYONE CAN CHANGE THE PAYLOAD DATA AND GENERATE A NEW TOKEN WITH THE CHANGED PAYLOAD DATA WHICH CAN CAUSE SECURITY ISSUES. 
    ALWAYS GET THE PAYLOAD DATA FROM THE DATABASE AND THEN GENERATE THE TOKEN.

    For eg, done use req.body.username to get the username for generating the token. 
    Instead, get the username from the database using the user id or email or any unique identifier and then generate the token using that username.

*/


import User from "../models/Usermodel.js";
import crypto from "crypto";


const AuthenticationMiddleware = (req, res, next) => {
    
}


function tokengenerator(userdata){

    // Helper: Base64URL encode
    const base64Url = (str) =>
        str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const header = { alg: "HS256", typ: "JWT" };
    const secretKey = "your_secret_key";

    const payload = {
        username: userdata.username,
        userId: userdata._id,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 ,// 1 hour expiry
        iat: Math.floor(Date.now() / 1000) // Issued at time
    };

    // Encode header and payload to Base64URL
    const base64UrlEncodeHeader = base64Url(Buffer.from(JSON.stringify(header)).toString("base64"));
    const base64UrlEncodePayload = base64Url(Buffer.from(JSON.stringify(payload)).toString("base64"));

    // Create signature using built-in crypto HMAC-SHA256
    const text = `${base64UrlEncodeHeader}.${base64UrlEncodePayload}`;
    const signature = crypto
        .createHmac("sha256", secretKey)
        .update(text)
        .digest("base64url"); // Node 18+ supports base64url directly

    // Complete JWT
    const token = `${base64UrlEncodeHeader}.${base64UrlEncodePayload}.${signature}`;

    // // Send token back to client
    // res.json({ token });

    return token;
};



export const logincontroller = async (req, res) => {

    try {
        const { username, password } = req.body;
        const hashedpassword = crypto.createHash('sha256').update(password).digest('hex');

        const DatainDB = await User.findOne({ username: username, password: hashedpassword });

        if (!DatainDB) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = tokengenerator(DatainDB);
        
        console.log('Received data from client:', { username, password });

        res.status(200).json({ message: 'Login successful', token: token });
    } catch {
        res.status(500).json({ message: 'Internal server error' });
    }

}


export const signupController = async (req, res) => {

    try {
        const Userdata = req.body;
        console.log('Received data from client:', Userdata);

        if (Userdata.password !== Userdata.confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        } else if (!Userdata) {
            return res.status(400).json({ message: 'Invalid user data' });
        } else if (await User.findOne({ username: Userdata.username, email: Userdata.email, phone: Userdata.phone })) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const newUser = new User(Userdata);
        newUser.password = crypto.createHash('sha256').update(newUser.password).digest('hex');
        await newUser.save();

        const token = tokengenerator(Userdata);
        res.status(201).json({ message: 'Signup successful', token: token });
    } catch {
        res.status(500).json({ message: 'Internal server error' });
    }

}