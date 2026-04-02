import React from 'react';
import { useState} from 'react';
import { useNavigate } from 'react-router-dom';
import Transforms from './Transforms';

export default function Services() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);

    const token = localStorage.getItem("token");

    async function handleSubmit(e) {
        e.preventDefault();

        if (!file) return;

        console.log("Selected file:", file);

        const formData = new FormData();
        // FormData is a built-in JavaScript object that provides a way to easily construct a set of key/value pairs 
        // representing form fields and their values, which can then be sent using the fetch API or XMLHttpRequest. 
        // It is commonly used for handling file uploads and form submissions in web applications.

        formData.append("file", file);

        // You see this request looks exactly like a curl request with -F flag for file upload and -H flag for header, 
        // except here we are using fetch API in JavaScript to make the request instead of curl in terminal. 
        // The formData object is used to construct the body of the request, and the Authorization header is set with the JWT token.
        const response = await fetch('http://localhost:3000/file/images', {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            console.error("Upload failed:", response.statusText);
            return;
        }

        const data = await response.json();
        console.log("Upload successful:", data);
    }

    return (
        <div>
            <h1>Services Page</h1>
            <form onSubmit={handleSubmit}>
                <input type="file" id="fileInput" onChange={(e) => setFile(e.target.files[0])} />
                <button type="submit">Upload</button>
            </form>
            <div>{file ? <img src={URL.createObjectURL(file)} alt="Selected" width={"500px"} height={"auto"} /> : 'No file selected'}</div>
            {/*URL.createObjectURL(file) is a built-in JavaScript function that creates a temporary URL for a File or Blob object, allowing it to be displayed in an <img> tag. */}
        
        <button onClick={() => {
            navigate("/transforms");
        }}>
            Transform Page
        </button>
        </div>
    );
}