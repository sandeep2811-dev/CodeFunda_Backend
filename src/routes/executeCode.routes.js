import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {  executeCodeController } from "../controllers/executeCode.controller.js";


const executionRoute = express.Router();


executionRoute.post("/" , authMiddleware , executeCodeController)



export default executionRoute;