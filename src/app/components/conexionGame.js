import React, { useState, useRef } from "react";
import { FaCog, FaLeaf, FaSkull, FaUsers, FaGlobeAmericas, FaRecycle, FaArrowLeft } from "react-icons/fa";


export const joinGame = async (
  gameId,
  playerName,
  password,
  backEndAddress
) => {
  try {
    const gameData = {
      "Content-Type": "application/json",
      accept: "application/json",
      player: playerName,
    };

    if (password?.trim()) {
      gameData.password = password.trim();
    }

    const bodyData = { player: playerName };
    const joinResponse = await fetch(
      `${backEndAddress}/api/games/${gameId}`,
      {
        method: "PUT",
        headers: gameData,
        body: JSON.stringify(bodyData),
      }
    );

    if (joinResponse.ok) {
      const result = await joinResponse.json();
      return { success: true, data: result.data };
    } else if (joinResponse.status === 409) {
      return {
        success: false,
        error: "There is already a player with that name in the game",
      };
    } else {
      const errorResult = await joinResponse.json();
      return {
        success: false,
        error: errorResult.msg || "Error joining the game",
      };
    }
  } catch (error) {
    return { success: false, error: "Request error: " + error };
  }
};

const ConexionGame = ({
  selectedGame,
  onJoinGame,
  onCancel,
  playerNameRef,
  backEndAddress
}) => {
  const [playerName, setPlayerName] = useState("");
  const [gamePassword, setGamePassword] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessageLocal] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedGame?.players && selectedGame.players.length >= 9) {
      setErrorMessageLocal("The game already has 10 players.");
      setShowErrorModal(true);
      return;
    }
    if (selectedGame && selectedGame.id) {
      onJoinGame(selectedGame.id, playerName, gamePassword);
    }
  };

  if (!selectedGame) {
    return <div>No game selected</div>;
  }

  return (
  <div className="game-list-container contaminaDOS-theme">
    <div className="games-container" style={{ margin: '20px' }}>
      <div className="list-header">
        <button className="back-btn" onClick={onCancel}>
          <FaArrowLeft className="me-2" />
          Back
        </button>
        <h2 className="list-title">Join Game</h2>
        <div></div>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          {/* Game Information */}
          <div className="eco-card mb-4">
            <div className="card-body">
              <h5 className="card-title">Game Information</h5>
              <div className="row">
                <div className="col-6">
                  <strong>Name:</strong>
                  <p className="game-name">{selectedGame?.name || selectedGame?.gameName}</p>
                </div>
                <div className="col-6">
                  <strong>Owner:</strong>
                  <p className="game-owner">{selectedGame?.owner}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="eco-card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="search-box mb-3">
                  <label htmlFor="playerName" className="form-label">
                    <FaUsers className="me-2" />
                    Player Name
                  </label>
                  <input
                    type="text"
                    id="playerName"
                    ref={playerNameRef}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="search-box mb-3">
                  <label htmlFor="password" className="form-label">
                    <FaCog className="me-2" />
                    Password (if required)
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={gamePassword}
                    onChange={(e) => setGamePassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button type="button" className="back-btn me-md-2" onClick={onCancel}>
                    <FaArrowLeft className="me-2" />
                    Cancel
                  </button>
                  <button type="submit" className="btn-select">
                    Join Game
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}

export default ConexionGame;