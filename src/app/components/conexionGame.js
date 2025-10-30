import React, { useState, useRef } from "react";

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
    <form onSubmit={handleSubmit} className="container-game">
      <h2>Join Game: {selectedGame.name}</h2>
      <div className="card">
        <div className="mb-3">
          <label className="form-label">Player Name</label>
          <input
            type="text"
            className="form-control"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
            ref={playerNameRef}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password (if required)</label>
          <input
            type="password"
            className="form-control"
            value={gamePassword}
            onChange={(e) => setGamePassword(e.target.value)}
          />
        </div>
        <div className="button-group">
          <button type="submit" className="btn btn-primary btn-lg">
            Join
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-lg ms-2"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

export default ConexionGame;