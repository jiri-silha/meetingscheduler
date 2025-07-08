import React, { useState } from "react";

const PASSWORD = "k"; // set your password here

export default function PasswordProtectedApp({ children }) {
  const [entered, setEntered] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    if (entered === PASSWORD) {
      setIsVerified(true);
    } else {
      alert("Incorrect password");
      setEntered("");
    }
  };

  if (isVerified) {
    return <>{children}</>; // show your app content
  }

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Please enter the password to continue</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={entered}
          onChange={e => setEntered(e.target.value)}
          placeholder="Password"
          style={{ padding: "0.5rem", fontSize: "1rem" }}
          autoFocus
        />
        <button type="submit" style={{ marginLeft: "1rem", padding: "0.5rem 1rem" }}>
          Enter
        </button>
      </form>
    </div>
  );
}
