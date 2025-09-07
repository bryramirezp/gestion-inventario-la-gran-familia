import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import routes from "./routes/index.routes.js";

dotenv.config();

const app = express();

// Middleware global
app.use(cors());
app.use(bodyParser.json());

// Rutas principales
app.use("/api", routes);

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
