import mongoose from "mongoose";
const { Schema } = mongoose;

const ImageSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "UserInfo",
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true, // S3 object key
    },
    url: {
      type: String,
      required: true, // full S3 URL
    },
    contentType: String,
    size: Number,
  },
  { timestamps: true }
);

// const ImageSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   key: String,
//   url: String,
//   contentType: String,
//   size: Number,

//   versions: [
//     {
//       key: String,
//       url: String,
//       transformations: Object,
//       createdAt: Date
//     }
//   ]
// }, { timestamps: true });


const Image = mongoose.model("Image", ImageSchema);
export default Image;