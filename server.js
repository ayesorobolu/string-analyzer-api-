import express from "express";
import dotenv from "dotenv";
import stringsRouter from "./routes/stringsRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4050

app.use(express.json());

app.get("/", (req,res) => res.send("API Working") );

app.use("/api", stringsRouter);

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`)
})