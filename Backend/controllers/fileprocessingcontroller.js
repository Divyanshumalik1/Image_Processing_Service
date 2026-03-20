import express from "express";
import dotenv from "dotenv";
import { S3Client, PutObjectCommand, GetObjectCommand} from "@aws-sdk/client-s3";
import User from "../models/Usermodel.js";
import Image from "../models/Imagemodel.js";
import { v4 as uuidv4 } from "uuid";

dotenv.config();


// We got this from GPT and https://docs.aws.amazon.com/AmazonS3/latest/API/s3_example_s3_PutObject_section.html
// UPLOAD CONTROLLER

// ************************************************ TO BE ADDED MONGODB LOGIC TOO, right now only adding to s3, but we also need to add the file metadata to mongodb, so that we can retrieve it later. ************************************************

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


export const FileUploadController = async (req, res) => {
  try {
    const file = req.file; // This came from multer middleware. This is also conventionally called req.file. Not built-in to Express. This is added by multer (or similar file-upload middleware).
    const payload = req.user; // This is exactly the same as req.user in the Authenticationmiddleware.js file. { username, userId, exp, iat } - userId is the mongodb id object of the user.
    console.log("🔥 req.user payload:", req.user);

    if (!payload) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // ✅ Safe unique filename
    const fileName = `${uuidv4()}`; // This is a unique filename for the uploaded file. 

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    // ✅ Upload first
    await s3.send(command);

    const fileUrl = `https://1111amzn-s3-demo-bucket-759542245162-us-east-2-an.s3.us-east-2.amazonaws.com/${fileName}`;

    // ✅ Save metadata //Here we save the file metadata to MongoDB, including the userId of the uploader, the S3 key, the URL, content type, and size. This will allow us to retrieve the file later and also check ownership for authorization.
    // the req.user.userId is the userId from the JWT token payload, which is the MongoDB id of the user. This way we can associate the uploaded file with the user who uploaded it.
    const image = new Image({
      userId: req.user.userId,
      key: fileName,
      url: fileUrl,
      contentType: file.mimetype,
      size: file.size,
    });

    await image.save();
    console.log("Image saved to MongoDB", image);

    res.status(200).json({
      message: "File uploaded successfullyyyy",
      imageId: image._id,
      userId: image.userId,
      url: fileUrl,
      user: payload
    });

  } catch (error) {
    res.status(500).json({
      message: "Upload failed",
      error: error.message,
    });
  }
};


export const FileRetrievalController = async (req, res) => {
 
  try{
    const imageId = req.params.id; // This is the MongoDB id of the image document, not the S3 key. We will use this id to find the image metadata in MongoDB, and then use the S3 key from the metadata to retrieve the file from S3.
    const image = await Image.findById(imageId);
  
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

  // (IMPORTANT) Authorization check - here image.userId is mongodb id of the user who uploaded the image and req.user.userId is the jwt token payload userId.
  if(image.userId.toString() !== req.user.userId.toString()){
    return res.status(403).json({ message: "Unauthorized" });
  }
  /* 
    if(image.userId !== req.user.userId){
  return res.status(403).json({ message: "Unauthorized" });
}
image.userId is likely a MongoDB ObjectId (ObjectId("69bbb9a45e3045c7b6f0dbe7"))
req.user.userId is a string from the JWT ("69bbb9a45e3045c7b6f0dbe7")
In JavaScript, comparing an ObjectId to a string with !== always fails, even if they represent the same value.
  */

    // Get the filename or key in S3
    const filename_key_in_s3 = image.key;

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: filename_key_in_s3
    });

    const response = await s3.send(command);

    if (!response || !response.Body) {
      return res.status(404).json({ message: "File not found in S3" });
    }

    // Set headers so browser knows it's a file
    res.setHeader("Content-Type", response.ContentType);
    res.setHeader("Content-Disposition", `inline; filename="${filename_key_in_s3}"`);

    // Stream file to client
    response.Body.pipe(res);

  }catch(error){
    res.status(500).json({ message: "Retrieval failed", error: error.message });
  }

}

/*

curl -X GET http://localhost:3000/file/images/69bb9dd1db04de0fa28c06f8 -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImRtYWxpazEiLCJ1c2VySWQiOiI2OWJiOWRkMWRiMDRkZTBmYTI4YzA2ZjgiLCJleHAiOjE3NzM5MTA1NTEsImlhdCI6MTc3MzkwNjk1MX0.uHfpv9gpTKkpwA4qhvWKrhKn45jvmKydIfFgGAD9avk" --output downloaded1.png
 
 */


export const FileRetrievalAllController = async (req, res) => {
  // Use query params that match frontend request: ?page=1&limit=10
  const pageNumber = parseInt(req.query.page) || 1;
  const pageLimit = parseInt(req.query.limit) || 10;

  try {
    // Calculate how many documents to skip
    const skip = (pageNumber - 1) * pageLimit;

    // Fetch images metadata from MongoDB
    const imagesMetadata = await Image.find()
      .sort({ createdAt: -1 })   // newest first
      .skip(skip)
      .limit(pageLimit);

    // Get total count for pagination info
    const total = await Image.countDocuments();

    // Send response with metadata and pagination info
    res.json({
      images: imagesMetadata,
      page: pageNumber,
      limit: pageLimit,
      total,
      totalPages: Math.ceil(total / pageLimit)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error occurred while retrieving images" });
  }
};


export const FileTransformController = async (req, res) => {

}