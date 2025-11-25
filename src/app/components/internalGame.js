"use client";
import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

const InternalGame = ({
  onGameCreated,
  onCancel,
  setErrorMessage,
  backendAddress,
}) => {
  const [gameDetails, setGameDetails] = useState({
    name: "",
    owner: "",
    password: "",
  });

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessageLocal] = useState("");
  const [isFormLoaded, setIsFormLoaded] = useState(false); 

  useEffect(() => {
    const savedGame = sessionStorage.getItem("gameSessionForm");
    if (savedGame) {
      try {
        const { name, owner, password } = JSON.parse(savedGame);
        setGameDetails({
          name: name || "",
          owner: owner || "",
          password: password || "",
        });
      } catch (e) {
        console.warn("Failed to parse gameSessionForm", e);
      }
    }
    setIsFormLoaded(true);
  }, []);

  useEffect(() => {
    if (!isFormLoaded) return;
    sessionStorage.setItem("gameSessionForm", JSON.stringify(gameDetails));
  }, [isFormLoaded, gameDetails]);

  if (!isFormLoaded) return null;

  const validateInputs = (game) => {
    // Primero limpia los espacios en blanco
    const cleanName = game.name.trim();
    const cleanOwner = game.owner.trim();
    const cleanPassword = game.password ? game.password.trim() : "";

    if (cleanName.length < 3) {
      setErrorMessageLocal("Game name must be at least 3 characters long.");
      return false;
    }
    if (cleanOwner.length < 3) {
      setErrorMessageLocal("Owner name must be at least 3 characters long.");
      return false;
    }
    if (cleanOwner.length > 20) {
      setErrorMessageLocal("Owner name must be less than 20 characters.");
      return false;
    }
    if (cleanPassword && cleanPassword.length > 0 && cleanPassword.length < 3) {
      setErrorMessageLocal("Password must be at least 3 characters long.");
      return false;
    }
    if (cleanPassword && cleanPassword.length > 20) {
      setErrorMessageLocal("Password must be less than 20 characters.");
      return false;
    }

    return true;
  };

  const createGame = async (game) => {
    // Primero limpia todos los campos
    const cleanGame = {
      name: game.name.trim(),
      owner: game.owner.trim(),
      password: game.password ? game.password.trim() : ""
    };

    if (!validateInputs(cleanGame)) {
      setShowErrorModal(true);
      return;
    }

    console.log("Creating game with data:", cleanGame);

    if (!cleanGame.name || !cleanGame.owner) {
      setErrorMessageLocal("Missing game name or owner after reload. Try retyping them.");
      setShowErrorModal(true);
      return;
    }

    try {
      const gameData = {
        name: cleanGame.name,
        owner: cleanGame.owner,
      };

      if (cleanGame.password && cleanGame.password !== "") {
        gameData.password = cleanGame.password;
      }
      
      console.log("Sending payload:", JSON.stringify(gameData));

      const response = await fetch(`${backendAddress}/api/games`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameData),
      });

      console.log("Server response:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Game created successfully:", result);
        sessionStorage.removeItem("gameSessionForm");
        onGameCreated(result.data, cleanGame.password || "");
      } else if (response.status === 409) {
        setErrorMessageLocal("A game with that name already exists.");
        setShowErrorModal(true);
      } else {
        const errText = await response.text();
        console.error("Server error:", errText);
        setErrorMessageLocal("Error creating game: " + errText);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Request error:", error);
      setErrorMessageLocal("Request error: " + error.message);
      setShowErrorModal(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createGame(gameDetails);
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    // Permite espacios pero no al inicio
    if (value.startsWith(' ')) {
      return; // No permitir espacios al inicio
    }
    setGameDetails({
      ...gameDetails,
      password: value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="container-game" style={{ margin: '20px' }}>
      <h2>Create Game</h2>
      <div className="mb-3">
        <label className="form-label">Game Name</label>
        <input
          type="text"
          className="form-control"
          value={gameDetails.name}
          onChange={(e) =>
            setGameDetails({ ...gameDetails, name: e.target.value })
          }
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Owner</label>
        <input
          type="text"
          className="form-control"
          value={gameDetails.owner}
          onChange={(e) =>
            setGameDetails({ ...gameDetails, owner: e.target.value })
          }
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Password (optional)</label>
        <input
          type="password"
          className="form-control"
          value={gameDetails.password}
          onChange={handlePasswordChange}
          placeholder="Leave empty for no password"
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Create
      </button>
      <button
        type="button"
        className="btn btn-secondary ms-2"
        onClick={onCancel}
      >
        Cancel
      </button>

      <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>{errorMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowErrorModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </form>
  );
}

export default InternalGame;