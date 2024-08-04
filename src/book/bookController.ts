import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs";
import { AuthRequest } from "../middlewares/authenticate";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  console.log("files", req.files);
  const { title, description, genre } = req.body;

  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
    const fileName = files.coverImage[0].filename;
    const filePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      fileName
    );
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-covers",
      format: coverImageMimeType,
    });
    const bookFileName = files.file[0].filename;
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookFileName
    );
    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        filename_override: bookFileName,
        folder: "book-pdfs",
        format: "pdf",
      }
    );
    const _req = req as AuthRequest;
    const newBook = await bookModel.create({
      title,
      genre,
      author: _req.userId,
      description,
      coverImage: uploadResult.secure_url,
      file: bookFileUploadResult.secure_url,
    });
    // Delete temp files
    try {
      await fs.promises.unlink(filePath);
      await fs.promises.unlink(bookFilePath);
      return res.status(201).json({ id: newBook._id });
    } catch (error) {
      return next(createHttpError(400, "error deleting temporary files"));
    }
    res.status(200).json({ id: newBook._id});
  } catch (error) {
    console.log(error);
    return next(createHttpError(500, "Error whilte uploading book"));
  }
};

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;
  const bookId = req.params.bookId;
  const book = await bookModel.findOne({ _id: bookId });
  if (!book) {
    return next(createHttpError(404, "Book not found"));
  }
  const _req = req as AuthRequest;
  if (book.author.toString() !== _req.userId) {
    return next(createHttpError(403, "Unauthorized to update this book"));
  }
  //  coverImage updatation
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  let completeCoverImage = "";
  let filePath = "";
  if (files?.coverImage) {
    try {
      const fileName = files?.coverImage[0].filename;
      const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);

      // send files to cloudinary
      filePath = path.resolve(__dirname, "../../public/data/uploads", fileName);
      completeCoverImage = fileName;
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        filename_override: completeCoverImage,
        folder: "book-covers",
        format: coverImageMimeType,
      });
      completeCoverImage = uploadResult.secure_url;
    } catch (error) {
      return next(createHttpError(401, "error_updatating cover image"));
    }
  }
  //  file updatation
  let completeFileName = "";
  let bookFilePath = "";
  try {
    if (files?.file) {
      const bookFileName = files?.file[0].filename;
      bookFilePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        bookFileName
      );

      completeFileName = bookFileName;
      const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
        filename_override: completeFileName,
        folder: "book-pdfs",
        format: "pdf",
      });

      completeFileName = uploadResultPdf.secure_url;
    }
  } catch (error) {
    return next(createHttpError(400, "Error updating book PDF"));
  }
  const updatedBook = await bookModel.findOneAndUpdate(
    { _id: bookId },
    {
      title,
      genre,
      coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
      file: completeFileName ? completeFileName : book.file,
    },
    {
      new: true,
    }
  );
  try {
    await fs.promises.unlink(bookFilePath);
    await fs.promises.unlink(filePath);
  } catch (error) {
    return next(createHttpError(400, "Error by deleting temporary file"));
  }
  res.json(updatedBook);
};

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const book = await bookModel.find().populate("author", "name");
    return res.json(book);
  } catch (error) {
    return next(createHttpError(400, "Error by listing books"));
  }
};

const getSingleBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookId = req.params.bookId;
    const getSingleBook = await bookModel.findOne({ _id: bookId });
    if (!getSingleBook) {
      return next(createHttpError(404, "Book not found"));
    }

    return res.json(getSingleBook);
  } catch (error) {
    return next(createHttpError(400, "Error by getting single book"));
  }
};

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookId = req.params.bookId;
    const book = await bookModel
      .findOne({ _id: bookId })
      .populate("author", "name");
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    // check access
    const _req = req as AuthRequest;

    if (book.author.toString() !== _req.userId) {
      return next(createHttpError(403, "Unauthorized to update this book"));
    }

    const coverImageSplits = book.coverImage.split("/");
    const coverImagePublicId =
      coverImageSplits.at(-2) + "/" + coverImageSplits.at(-1)?.split(".")[0];

    const bookFileSplits = book.file.split("/");
    const bookFileSplitsPublicId =
      bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);

    try {
      await cloudinary.uploader.destroy(coverImagePublicId);
      await cloudinary.uploader.destroy(bookFileSplitsPublicId, {
        resource_type: "raw",
      });
    } catch (error) {
      return next(
        createHttpError(401, "Error while deletinng from cloudinary")
      );
    }

    await bookModel.deleteOne({ _id: bookId });

    return res
      .status(204)
      .json({ id: bookId, message: "Book deleted successfully" });
  } catch (error) {
    return next(createHttpError(400, "Error by deleting"));
  }
};

export { createBook, updateBook, listBooks, getSingleBook, deleteBook };
