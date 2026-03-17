import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();

    return (
        <div>
            <h1>Home</h1>
            <div>
                <button onClick={() => navigate("/login")}>Go to Login</button>
            </div>
            <button onClick={() => navigate("/signup")}>Go to Signup</button>
        </div>
    );
}