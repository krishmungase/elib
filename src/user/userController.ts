import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";

const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {


  // Validation
  const { name, email, password } = req.body;

  if(!name || !email || !password){
    const error = createHttpError(400, "All required fields");
    return next(error);
  }

  // process


  // Response


  res.json({ message: "User created" })
};


export { createUser };