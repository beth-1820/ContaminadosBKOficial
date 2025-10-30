import React, { useState, useEffect } from "react";
import ControlErrors from "./controlErrors";

const GameFeatures = ({
  selectedGame,
  playerName,
  gamePassword,
  isOwner,
  view,
  setView,
  setSelectedGame,
  backEndAddress,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const handleCloseModal = () => setShowModal(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (selectedGame) {
        handleRefreshGame();
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Clean up on component unmount
  }, [selectedGame, view]);

  const handleRefreshGame = async () => {
    if (!playerName) {
      setModalTitle("Error");
      setModalMessage(
        "Player name is required to refresh game information."
      );
      setShowModal(true);
      return;
    }

    // Configure headers conditionally
    const headers = {
      accept: "application/json",
      player: playerName,
    };

    if (gamePassword && gamePassword.trim()) {
      headers.password = gamePassword.trim();
    }

    try {
      const response = await fetch(
        `${backEndAddress}/api/games/${selectedGame.id}`,
        {
          method: "GET",
          headers: headers,
        }
      );
      if (response.ok) {
        const result = await response.json();
        setSelectedGame(result.data);

        if (result.data.status === "rounds") {
          setView("gameStarted");
        }
      } else {
        setModalTitle("Error");
        setModalMessage("Error refreshing game");
        setShowModal(true);
      }
    } catch (error) {
      setModalTitle("Error");
      setModalMessage("Error refreshing game: " + error);
      setShowModal(true);
      throw new Error("Error refreshing game:" + error);
    }
  };

  const handleStartGameErrors = (response) => {
    if (response.status === 401) {
      setModalTitle("Error");
      setModalMessage("Not authorized to start the game.");
    } else if (response.status === 403) {
      setModalTitle("Error");
      setModalMessage("Access forbidden.");
    } else if (response.status === 404) {
      setModalTitle("Error");
      setModalMessage("Game not found.");
    } else if (response.status === 409) {
      setModalTitle("Error");
      setModalMessage("The game has already been started.");
    } else if (response.status === 428) {
      setModalTitle("Error");
      setModalMessage(
        "At least 5 players are needed to start the game."
      );
    } else {
      setModalTitle("Error");
      setModalMessage("Unknown error trying to start the game.");
    }
    setShowModal(true);
  };

  const handleStartGame = async () => {
    if (!selectedGame || !selectedGame.players) {
      setModalTitle("Error");
      setModalMessage("Not enough information about players.");
      setShowModal(true);
      return;
    }

    const playerCount = selectedGame.players.length;

    if (playerCount < 5) {
      setModalTitle("Error");
      setModalMessage(
        "At least 5 players are needed to start the game."
      );
      setShowModal(true);
      return;
    }

    if (playerCount > 10) {
      setModalTitle("Error");
      setModalMessage("There cannot be more than 10 players in the game.");
      setShowModal(true);
      return;
    }

    // Configure headers conditionally
    const headers = {
      accept: "application/json",
      player: playerName,
    };

    if (gamePassword && gamePassword.trim()) {
      headers.password = gamePassword.trim();
    }

    try {
      const response = await fetch(
        `${backEndAddress}/api/games/${selectedGame.id}/start`,
        {
          method: "HEAD",
          headers: headers,
        }
      );

      if (response.ok) {
        setModalTitle("Success");
        setModalMessage("Game started successfully");
        setShowModal(true);

        handleRefreshGame();
        setView("gameStarted");
      } else {
        handleStartGameErrors(response);
      }
    } catch (error) {
      setModalTitle("Error");
      setModalMessage("Error starting game: " + error);
      setShowModal(true);
      throw new Error("Request error:" + error);
    }
  };

  return (
    <div className="container-game">
      <h2>Game Details: {selectedGame.name}</h2>
      <p>Owner: {selectedGame.owner}</p>
      <p>Status: {selectedGame.status}</p>
      <p>Password: {selectedGame.password ? "Yes" : "No"}</p>
      <p>Current Round: {selectedGame.currentRound}</p>
      <h3>Players:</h3>
      {selectedGame.players && selectedGame.players.length > 0 ? (
        <ul>
          {selectedGame.players.map((player, index) => (
            <li key={index} className="player-card">{player}</li>
          ))}
        </ul>
      ) : (
        <p>No players in the game.</p>
      )}
      <div className="button-group">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setView("list")}
        >
          Back to List
        </button>
        <button
          type="button"
          className="btn btn-info"
          onClick={handleRefreshGame}
        >
          Refresh Information
        </button>
        {isOwner && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStartGame}
          >
            Start Game
          </button>
        )}
      </div>
      <ControlErrors
        show={showModal}
        handleClose={handleCloseModal}
        title={modalTitle}
        message={modalMessage}
      />
    </div>
  );
};

export default GameFeatures;