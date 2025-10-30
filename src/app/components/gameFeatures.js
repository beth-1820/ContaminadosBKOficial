import React, { useState, useEffect } from "react";
import ControlErrors from "./controlErrors";
import { FaCog, FaCrown, FaSyncAlt, FaUsers, FaUser, FaArrowLeft, FaInfoCircle, FaPlay, FaLock } from "react-icons/fa";


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
  <div className="game-list-container contaminaDOS-theme" style={{ margin: '20px' }}>
    <div className="games-container">
      {/* Header */}
      <div className="list-header">
        <button className="back-btn" onClick={() => setView("list")}>
          <FaArrowLeft className="me-2" />
          Back to List
        </button>
        <h2 className="list-title">Game Details</h2>
        <div></div>
      </div>

      <div className="row">
        {/* Main game information */}
        <div className="col-lg-8">
          <div className="eco-card mb-4">
            <div className="card-body">
              <h3 className="card-title">
                <FaInfoCircle className="me-2 text-primary" />
                General Information
              </h3>
              <div className="row">
                <div className="col-md-6">
                  <div className="info-item">
                    <strong>Name:</strong>
                    <span className="game-name">{selectedGame.name}</span>
                  </div>
                  <div className="info-item">
                    <strong>Owner:</strong>
                    <span className="game-owner">{selectedGame.owner}</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="info-item">
                    <strong>Status:</strong>
                    <span className={`badge ${selectedGame.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
                      {selectedGame.status}
                    </span>
                  </div>
                  <div className="info-item">
                    <strong>Current Round:</strong>
                    <span className="badge bg-info">{selectedGame.currentRound}</span>
                  </div>
                </div>
              </div>
              <div className="info-item">
                <strong>Password:</strong>
                <span className={`badge ${selectedGame.password ? 'bg-danger' : 'bg-success'}`}>
                  {selectedGame.password ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          {/* Player list */}
          <div className="eco-card">
            <div className="card-body">
              <h3 className="card-title">
                <FaUsers className="me-2 text-success" />
                Players in the Game
                <span className="badge bg-primary ms-2">
                  {selectedGame.players ? selectedGame.players.length : 0}
                </span>
              </h3>
              {selectedGame.players && selectedGame.players.length > 0 ? (
                <div className="players-grid">
                  {selectedGame.players.map((player, index) => (
                    <div key={index} className="player-card">
                      <FaUser className="player-icon text-primary" />
                      <span className="player-name">{player}</span>
                      {player === selectedGame.owner && (
                        <FaCrown className="text-warning ms-2" title="Owner" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FaUsers className="icon" size={50} />
                  <p>No players in the game.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions panel */}
        <div className="col-lg-4">
          <div className="psy-card">
            <div className="card-body">
              <h3 className="card-title">
                <FaCog className="me-2 text-warning" />
                Actions
              </h3>

              <div className="action-buttons">
                <button
                  type="button"
                  className="btn btn-info w-100 mb-3"
                  onClick={handleRefreshGame}
                >
                  <FaSyncAlt className="me-2" />
                  Refresh Information
                </button>

                {isOwner && (
                  <button
                    type="button"
                    className="btn btn-success w-100"
                    onClick={handleStartGame}
                  >
                    <FaPlay className="me-2" />
                    Start Game
                  </button>
                )}
              </div>

              {/* Quick stats */}
              <div className="mt-4 pt-3 border-top">
                <h5 className="text-muted mb-3">Summary</h5>
                <div className="stats-grid">
                  <div className="stat-item">
                    <FaUsers className="stat-icon" />
                    <div className="stat-content">
                      <span className="stat-value">{selectedGame.players ? selectedGame.players.length : 0}</span>
                      <span className="stat-label">Players</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <FaSyncAlt className="stat-icon" />
                    <div className="stat-content">
                      <span className="stat-value">{selectedGame.currentRound}</span>
                      <span className="stat-label">Round</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <FaLock className="stat-icon" />
                    <div className="stat-content">
                      <span className="stat-value">
                        {selectedGame.password ? "Yes" : "No"}
                      </span>
                      <span className="stat-label">Protected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ControlErrors
      show={showModal}
      handleClose={handleCloseModal}
      title={modalTitle}
      message={modalMessage}
    />
  </div>
);

}
export default GameFeatures;