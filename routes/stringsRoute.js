import express from "express";
import { string } from "../controller/stringsController.js";

const stringsRouter = express.Router();

stringsRouter.post("/string", string )

export default stringsRouter