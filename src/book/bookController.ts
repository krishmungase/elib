import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path, { format } from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs"

const createBook = async (req: Request, res: Response, next: NextFunction) =>{

  const {title,genre} = req.body;

  try {

    console.log('files', req.files);
    const files = req.files as {[fieldname: string]: Express.Multer.File[]}
    const coverImageMimeType = files.coverImage[0].mimetype.split('/').at(-1);
    const fileName = files.coverImage[0].filename;
    const filePath = path.resolve(__dirname, '../../public/data/uploads',fileName);
  
    const uploadResult = await cloudinary.uploader.upload(filePath,{
      filename_override : fileName,
      folder : 'book-covers',
      format : coverImageMimeType,
    })
  

    const bookFileName = files.file[0].filename;
    const bookFilePath = path.resolve(__dirname, '../../public/data/uploads', bookFileName);

    const bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath,{
      filename_override : bookFileName,
      folder: 'book-pdfs',
      format: "pdf"
    })
    console.log("Upload result: " + uploadResult);
    console.log("bookfileUploadResult: " + bookFileUploadResult)

    const newBook = await bookModel.create({
      title,
      genre,
      author : "66ae22fdb10fb1d647529ad6",
      coverImage: uploadResult.secure_url,
      file: bookFileUploadResult.secure_url,
    })

    // Delete temp files 
    try {
      await fs.promises.unlink(filePath);
      await fs.promises.unlink(bookFilePath);

      return res.status(201).json({id: newBook._id})
    } catch (error) {
      return next(createHttpError(400,"error deleting temporary files"))
    }

    res.json({})


  } catch (error) {
    console.log(error)
    return next(createHttpError(500,"Error whilte uploading book"))
  }


}

export {createBook};