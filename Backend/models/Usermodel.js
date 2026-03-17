import mongoose from 'mongoose';
const { Schema } = mongoose;

const UserSchema = new Schema({
    username: String,
    password: String,
    Name: String,
    email: String,
    phone: String       
});

const User = mongoose.model('UserInfo', UserSchema);

export default User;