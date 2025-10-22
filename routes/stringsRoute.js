import express from "express";
import { string } from "../controller/stringsController.js";

const stringsRouter = express.Router();

stringsRouter.post("/strings", string )

export default stringsRouter