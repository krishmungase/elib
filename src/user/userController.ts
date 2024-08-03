import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";

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

  const newUser = await userModel.create({
    name,
    email,
    password: hashedPassword,
  })

  console.log("New user created: ", newUser);

  // Token Geneation 
  const token = sign({sub:newUser._id},config.jwtSecret as string,{
    expiresIn: "7d",
  });

  


  res.json({accessToken : token})
};


export { createUser };