import express from "express";
import { string, getString } from "../controller/stringsController.js";

const stringsRouter = express.Router();

stringsRouter.post("/strings", string )
stringsRouter.get("/strings/:string_value", getString)

export default stringsRouter