import { Router } from "express";
import { logincontroller, signupController } from "../controllers/loginsignupcontroller.js";


const datarouter = Router();

// Login Route
datarouter.post('/login', logincontroller);

// Signup Route
datarouter.post('/signup', signupController);

export default datarouter;