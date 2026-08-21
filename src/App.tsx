import { useState } from "react";
import "./styles/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./components/Home";
import { Lab1 } from "./components/Lab1";
function App() {
  //const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/lab1" element={<Lab1 />} />
          {/* <Route path="/lab2" element={<Lab2 />} />
          <Route path="/lab3" element={<Lab3 />} />
          <Route path="/lab4" element={<Lab4 />} />
          <Route path="/lab5" element={<Lab5 />} />
          <Route path="/lab6" element={<Lab6 />} />
          <Route path="/lab7" element={<Lab7 />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
