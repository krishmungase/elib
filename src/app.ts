import express, { NextFunction, Request, Response } from "express";
import createHttpError, { HttpError } from "http-errors";
import { config } from "./config/config";
import globalErrorHandler from "./middlewares/globalErrorHandler";
const app = express();


// Routes
app.get('/', (req, res, next) => {
  res.json({ message: "Welcome!" });
})

// global error handler
app.use(globalErrorHandler)

export default app;