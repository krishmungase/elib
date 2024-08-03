import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";

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


  // Check if user already exists
  const user = await userModel.findOne({ email});
  if(user) {
    const error = createHttpError(409, "Email already in use");
    return next(error);
  }


  // password -> hasshing
  const hashedPassword = await bcrypt.hash(password, 10);
  
  

  // process


  // Response


  res.json({ message: "User created" })
};


export { createUser };