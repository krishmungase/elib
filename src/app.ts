import express from "express";

import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";
import cors from "cors"
import { config } from "./config/config";
const app = express();

app.use(cors(
  {
    origin : 'http://localhost:5173' || 'http://localhost:3000'
  }
));
app.use(express.json())


// Routes
app.get('/', (req, res, next) => {
  res.json({ message: "Welcome!" });
})

app.use('/api/users',userRouter);
app.use('/api/books',bookRouter)

// global error handler
app.use(globalErrorHandler)

export default app;