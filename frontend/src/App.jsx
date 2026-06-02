import React, { useState } from "react";
import { isAuth } from "./api.js";
import { styles } from "./styles.js";
import Auth from "./Auth.jsx";
import Dashboard from "./Dashboard.jsx";

export default function App() {
  const [logged, setLogged] = useState(isAuth());
  return (
    <>
      <style>{styles}</style>
      {logged
        ? <Dashboard onLogout={() => setLogged(false)} />
        : <Auth onAuth={() => setLogged(true)} />}
    </>
  );
}
