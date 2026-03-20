import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Components/Home";
import LoginForm from "./Components/LoginForm";
import SignupForm from "./Components/SignupForm";
import Services from "./Components/Services";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/services" element={<Services />} />
        {/* <Route path="/services" element={<Services />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;