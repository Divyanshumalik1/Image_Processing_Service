import React, { useState } from "react";

export default function Transforms() {

  const [imageId, setImageId] = useState("");
  const [imageUrl, setImageUrl] = useState(null);

  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [rotate, setRotate] = useState("");
  const [grayscale, setGrayscale] = useState(false);
  const [format, setFormat] = useState("jpeg");

  const token = localStorage.getItem("token");

  async function handleTransform() {
    try {
      const res = await fetch(`http://localhost:3000/file/images/${imageId}/transform`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          transformations: {
            resize: width ? { width: Number(width), height: Number(height) } : undefined,
            rotate: rotate ? Number(rotate) : undefined,
            format,
            filters: {
              grayscale
            }
          }
        })
      });

      const data = await res.json();

      if (data.url) {
        // ✅ This is the key line
        setImageUrl(data.url);
      } else {
        console.log("Error:", data);
      }

    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div>
      <h1>Transform Image</h1>

      <input
        placeholder="Enter Image ID"
        onChange={(e) => setImageId(e.target.value)}
      />

      <h3>Resize</h3>
      <input placeholder="width" onChange={(e) => setWidth(e.target.value)} />
      <input placeholder="height" onChange={(e) => setHeight(e.target.value)} />

      <h3>Rotate</h3>
      <input type="number" onChange={(e) => setRotate(e.target.value)} />

      <h3>Format</h3>
      <select onChange={(e) => setFormat(e.target.value)}>
        <option value="jpeg">JPEG</option>
        <option value="png">PNG</option>
      </select>

      <label>
        Grayscale
        <input type="checkbox" onChange={(e) => setGrayscale(e.target.checked)} />
      </label>

      <br /><br />

      <button onClick={handleTransform}>Transform</button>

      <br /><br />

      {/* ✅ SHOW IMAGE */}
      {imageUrl && (
        <div>
          <h3>Transformed Image:</h3>
          <img src={imageUrl} alt="transformed" width="400" />
        </div>
      )}
    </div>
  );
}