import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path, { format } from "node:path";
import createHttpError from "http-errors";

const createBook = async (req: Request, res: Response, next: NextFunction) =>{

  // const {} = req.body;




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
  
    console.log("Upload result: " + uploadResult);


    const bookFileName = files.file[0].filename;
    const bookFilePath = path.resolve(__dirname, '../../public/data/uploads', bookFileName);

    const bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath,{
      filename_override : bookFileName,
      folder: 'book-pdfs',
      format: "pdf"
    })
    console.log("bookfileUploadResult: " + bookFileUploadResult)
    res.json({})


  } catch (error) {
    console.log(error)
    return next(createHttpError(500,"Error whilte uploading book"))
  }


}

export {createBook};