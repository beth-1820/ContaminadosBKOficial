"use client";
import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaCog } from "react-icons/fa";
import InternalGame from "./components/internalGame";
import ExternalGame from "./components/externalGame";
import ConexionGame, { joinGame } from "./components/conexionGame";
import GameFeatures from "./components/gameFeatures";
import GameInitiate from "./components/gameInitiate";
import ControlErrors from "./components/controlErrors";

export default function Home() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      require("bootstrap/dist/js/bootstrap.bundle.min.js");
    }
  }, []);

  const [view, setView] = useState("home");
  const [selectedGame, setSelectedGame] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [gamePassword, setGamePassword] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [backendAddress, setBackendAddress] = useState("");
  const [showBackendErrorModal, setShowBackendErrorModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const playerNameRef = useRef(null);
  const [citizensScore, setCitizensScore] = useState(0);
  const [enemiesScore, setEnemiesScore] = useState(0);

  const handleGameCreated = (game, password) => {
    if (!validateBackendAddress()) return;
    setSelectedGame(game);
    setGamePassword(password);
    setPlayerName(game.owner);
    setIsOwner(true);
    setView("gameDetails");
  };

  const handleJoinGame = async (
    gameId,
    playerName,
    password
  ) => {
    if (!validateBackendAddress()) return;
    const result = await joinGame(
      gameId,
      playerName,
      password,
      backendAddress
    );
    if (result.success) {
      setSelectedGame(result.data || null);
      setGamePassword(password);
      setPlayerName(playerName);
      setIsOwner(false);
      setView("gameDetails");
    } else {
      setErrorMessage(result.error || "Error joining the game");
      setShowErrorModal(true);
    }
  };

  const validateBackendAddress = () => {
    if (backendAddress.trim() === "" ||
      backendAddress === null
    ) {
      setShowBackendErrorModal(true);
      return false;
    }
    return true;
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    if (playerNameRef.current) {
      playerNameRef.current.focus();
    }
  };

  const handleCloseBackendErrorModal = () => {
    setShowBackendErrorModal(false);
  };

  const handleSelectGame = (game) => {
    if (!validateBackendAddress()) return;
    setSelectedGame(game);
    setView("joinGame");
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleSaveBackendAddress = () => {
    setShowSettings(false);
  };
  
  return (
    <div className="container-game">
      {view === "home" && (
        <>
          <button
            type="button"
            className="btn btn-secondary float-end"
            onClick={() => setShowSettings(true)}
          >
            <FaCog /> Settings
          </button>
          <h1 className="mb-4">Welcome</h1>
          <div className="d-flex justify-content-around">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => {
                if (!validateBackendAddress()) return;
                setView("create");
              }}
            >
              Create Game
            </button>
            <button
              className="btn btn-success btn-lg"
              onClick={() => {
                if (!validateBackendAddress()) return;
                setView("list");
              }}
            >
              Join Game
            </button>
          </div>
        </>
      )}
      {view === "create" && (
        <InternalGame
          onGameCreated={handleGameCreated}
          onCancel={() => setView("home")}
          setErrorMessage={setErrorMessage}
          backendAddress={backendAddress}
        />
      )}
      {view === "list" && (
        <ExternalGame
          onSelectGame={handleSelectGame}
          onBack={() => setView("home")}
          backEndAddress={backendAddress}
        />
      )}
      <div
        className={`modal fade ${showSettings ? "show" : ""}`}
        style={{ display: showSettings ? "block" : "none" }}
        tabIndex={-1}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-dark">Settings</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowSettings(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="text-dark">Backend Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={backendAddress}
                  onChange={(e) => setBackendAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveBackendAddress}
              >
                Save
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowSettings(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      {view === "joinGame" && (
        <ConexionGame
          selectedGame={selectedGame}
          onJoinGame={handleJoinGame}
          onCancel={() => setView("list")}
          playerNameRef={playerNameRef}
          backEndAddress={backendAddress}
        />
      )}

      {view === "gameDetails" && selectedGame && (
        <GameFeatures
          selectedGame={selectedGame}
          playerName={playerName}
          gamePassword={gamePassword}
          isOwner={isOwner}
          view={view}
          setView={setView}
          setSelectedGame={setSelectedGame}
          backEndAddress={backendAddress}
        />
      )}

      {view === "gameStarted" && selectedGame && (
        <GameInitiate
          selectedGame={{ ...selectedGame, id: selectedGame.id || "" }}
          playerName={playerName}
          gamePassword={gamePassword}
          view={view}
          setView={setView}
          backEndAddress={backendAddress}
        />
      )}
      <div
        className={`modal fade ${showErrorModal ? "show" : ""}`}
        style={{ display: showErrorModal ? "block" : "none" }}
        tabIndex={-1}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="errorModalLabel">
                Error
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={handleCloseErrorModal}
              ></button>
            </div>
            <div className="modal-body">{errorMessage}</div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={handleCloseErrorModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`modal fade ${showBackendErrorModal ? "show" : ""}`}
        style={{ display: showBackendErrorModal ? "block" : "none" }}
        tabIndex={-1}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-dark" id="backendErrorModalLabel">
                Backend Address Required
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleCloseBackendErrorModal}
              ></button>
            </div>
            <div className="modal-body text-dark">
              You must configure a backend address before continuing.
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseBackendErrorModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}