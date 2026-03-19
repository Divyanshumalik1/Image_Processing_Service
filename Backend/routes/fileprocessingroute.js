import express from "express";
import AuthenticationMiddleware from "../middlewares/Authenticationmiddleware.js";
import { FileUploadController, FileRetrievalController, FileRetrievalAllController} from "../controllers/fileprocessingcontroller.js";
import { uploadMiddleware } from "../middlewares/Multermiddleware.js";

const FileProcessingRouter = express.Router();


// Upload
FileProcessingRouter.post('/images', AuthenticationMiddleware, uploadMiddleware.single("file"), FileUploadController);
// uploadMiddleware.single("file") is a Multer middleware that processes multipart/form-data, extracts the uploaded file, and attaches it to req.file.

// Get one
FileProcessingRouter.get('/images/:id', AuthenticationMiddleware, FileRetrievalController);

// Get all
FileProcessingRouter.get('/images', AuthenticationMiddleware, FileRetrievalAllController);

// Transform
FileProcessingRouter.post('/images/:id/transform', AuthenticationMiddleware, FileTransformController);

export default FileProcessingRouter;