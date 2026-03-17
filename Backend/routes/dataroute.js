import { Router } from "express";
import { logincontroller, signupController } from "../controllers/maincontroller.js";


const datarouter = Router();

datarouter.post('/login', logincontroller);

datarouter.post('/signup', signupController);

export default datarouter;