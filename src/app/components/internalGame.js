"use client";
import React, { useState } from "react";
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

  const validateInputs = (game) => {
    if (game.name.length < 3) {
      setErrorMessageLocal(
        "Game name must be at least 3 characters long."
      );
      return false;
    }
    if (game.owner.length < 3) {
      setErrorMessageLocal(
        "Owner name must be at least 3 characters long."
      );
      return false;
    }
    if (game.owner.length > 20) {
      setErrorMessageLocal(
        "Owner name must be less than 20 characters."
      );
      return false;
    }
    if (game.password && (game.password.length > 0 && game.password.length < 3)) {
      setErrorMessageLocal("Password must be at least 3 characters long.");
      return false;
    }
    if (game.password && game.password.length > 20) {
      setErrorMessageLocal("Password must be less than 20 characters.");
      return false;
    }

    return true;
  };

  const createGame = async (game) => {
    if (!validateInputs(game)) {
      setShowErrorModal(true);
      return;
    }

    try {
      const gameData = {
        name: game.name,
        owner: game.owner,
      };

      if (game.password?.trim()) {
        gameData.password = game.password.trim();
      }
      const response = await fetch(
        `${backendAddress}/api/games`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(gameData),
        }
      );

      if (response.ok) {
        const result = await response.json();
        onGameCreated(result.data, game.password || "");
      } else if (response.status === 409) {
        setErrorMessageLocal("A game with that name already exists.");
        setShowErrorModal(true);
      } else {
        setErrorMessage("Error creating game.");
        setShowErrorModal(true);
        throw new Error("Error creating game");
      }
    } catch (error) {
      setErrorMessage("Request error: " + error);
      throw new Error("Request error:" + error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createGame(gameDetails);
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
      <label className="form-label">Password</label>
      <input
        type="password"
        className="form-control"
        value={gameDetails.password}
        onChange={(e) =>
          setGameDetails({ ...gameDetails, password: e.target.value })
        }
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