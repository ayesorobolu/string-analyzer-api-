import express from "express";
import { string, getStringByValue, deleteString, getAllStrings } from "../controller/stringsController.js";

const stringsRouter = express.Router();

stringsRouter.post("/strings", string )
stringsRouter.get("/strings/:string_value", getStringByValue)
stringsRouter.delete("/strings/:string_value", deleteString)
stringsRouter.get("/strings", getAllStrings)

export default stringsRouter