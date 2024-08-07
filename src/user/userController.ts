import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  // Validation
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    const error = createHttpError(400, "All required fields");
    return next(error);
  }

  // Check if user already exists
  try {
    const user = await userModel.findOne({ email });
    if (user) {
      const error = createHttpError(409, "Email already in use");
      return next(error);
    }
  } catch (error) {
    return next(createHttpError(500, "Error while getting user"));
  }

  // password -> hasshing
  const hashedPassword = await bcrypt.hash(password, 10);
  let newUser: User;
  try {
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (error) {
    return next(createHttpError(500, "Error while creating new user"));
  }

  // Token Geneation
  try {
    const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });
    res.status(201).json({ accessToken: token });
  } catch (error) {
    return next(createHttpError(500, "Error while signing jwt token"));
  }
}


const loginUser = async (req:Request, res:Response,next:NextFunction) => {

  const {email, password} = req.body;

  if(!email || !password){
    const error = createHttpError(400, "All required fields");
    return next(error);
  }

  let user;
  try {
    user = await userModel.findOne({email});
    if(!user){
      return next(createHttpError(400, "User not found"));
    }
  } catch (error) {
    return next(createHttpError(500, "Error fetching user"));
  }


  const isMatch = await bcrypt.compare(password, user.password);

  if(!isMatch){
    return next(createHttpError(401, "Incorrect password"));
  }


  try {
    const token = sign({ sub: user._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });
    res.status(201).json({ 
      accessToken: token ,
      message: "User signed in successfully"
    });
  } catch (error) {
    return next(createHttpError(500, "Error while Logging"));
  }

  res.json({message: "All Ok!"});
}


export { createUser,loginUser };
