"use client";
import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import InternalGame from "./components/internalGame";
import ExternalGame from "./components/externalGame";
import ConexionGame, { joinGame } from "./components/conexionGame";
import GameFeatures from "./components/gameFeatures";
import GameInitiate from "./components/gameInitiate";
import ControlErrors from "./components/controlErrors";
import { FaCog, FaLeaf, FaSkull, FaUsers, FaGlobeAmericas, FaRecycle, FaBook } from "react-icons/fa";

export default function Home() {
  const [view, setView] = useState("home");
  const [selectedGame, setSelectedGame] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [gamePassword, setGamePassword] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [backendAddress, setBackendAddress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showBackendErrorModal, setShowBackendErrorModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const playerNameRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const activeGameState = JSON.parse(sessionStorage.getItem("activeGameState") || "{}");
      
      console.log("🔄 Intentando restaurar desde activeGameState:", activeGameState.view);
      
      if (activeGameState.view === "gameFeatures" && activeGameState.selectedGame) {
        console.log("🔄 Restaurando GameFeatures desde activeGameState", activeGameState);
        setSelectedGame(activeGameState.selectedGame);
        setView("gameDetails");
        setPlayerName(activeGameState.playerName || "");
        setGamePassword(activeGameState.gamePassword || "");
        setIsOwner(activeGameState.isOwner || false);
        setBackendAddress(activeGameState.backendAddress || "");
        setIsSessionLoaded(true);
        return;
      }
      
      if (activeGameState.view === "gameStarted" && activeGameState.selectedGame) {
        console.log("🔄 Restaurando GameInitiate desde activeGameState", activeGameState);
        setSelectedGame(activeGameState.selectedGame);
        setView("gameStarted");
        setPlayerName(activeGameState.playerName || "");
        setGamePassword(activeGameState.gamePassword || "");
        setBackendAddress(activeGameState.backendAddress || "");
        setIsSessionLoaded(true);
        return;
      }

      if (activeGameState.view === "joinGame" && activeGameState.selectedGame) {
        console.log("🔄 Restaurando ConexionGame desde activeGameState", activeGameState);
        setSelectedGame(activeGameState.selectedGame);
        setView("joinGame");
        setPlayerName(activeGameState.playerName || "");
        setGamePassword(activeGameState.gamePassword || "");
        setBackendAddress(activeGameState.backendAddress || "");
        setIsSessionLoaded(true);
        return;
      }

      const savedSession = JSON.parse(sessionStorage.getItem("gameSession") || "{}");
      
      if (savedSession.view) {
        console.log("🔄 Restaurando sesión normal", savedSession);
        setView(savedSession.view);
        setSelectedGame(savedSession.selectedGame || null);
        setPlayerName(savedSession.playerName || "");
        setGamePassword(savedSession.gamePassword || "");
        setIsOwner(savedSession.isOwner || false);
        setBackendAddress(savedSession.backendAddress || "");
      }
    } catch (e) {
      console.warn("Error loading saved session:", e);
      sessionStorage.removeItem("activeGameState");
      sessionStorage.removeItem("gameSession");
    } finally {
      setIsSessionLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isSessionLoaded) return;
    const sessionData = {
      view,
      selectedGame,
      playerName,
      gamePassword,
      isOwner,
      backendAddress,
    };
    sessionStorage.setItem("gameSession", JSON.stringify(sessionData));
  }, [isSessionLoaded, view, selectedGame, playerName, gamePassword, isOwner, backendAddress]);

  if (!isSessionLoaded) return null;

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
  <div className="container-game contaminaDOS-theme">
    {/* Header con tema ambiental */}
    <header className="game-header" style={{ margin: '10px 10px 0 10px' }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <FaLeaf className="header-icon eco-icon" />
            <h1 className="game-title">
              contamina<span className="dos-text">DOS</span>
            </h1>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-light me-2" style={{ fontSize: '0.9rem' }}>
              Don't forget to read the instructions before playing
            </span>
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={() => setShowRules(true)}
            >
              <FaBook className="me-1" /> Game Rules
            </button>
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={() => setShowSettings(true)}
            >
              <FaCog className="me-1" /> Server
            </button>
          </div>
        </div>
        <p className="game-subtitle"></p>
      </div>
    </header>

    {view === "home" && (
      <div className="main-menu">
        <div className="container">
          <div className="welcome-section text-center mb-5">
            <FaGlobeAmericas className="globe-icon" />
            <h2 className="welcome-title">Save the Planet</h2>
            <p className="welcome-text">
              In a world on the verge of environmental collapse, your decision makes the difference.<br />
              Are you an exemplary citizen or an environmental psychopath?
            </p>
          </div>

          <div className="action-buttons">
            <div className="row justify-content-center">
              <div className="col-md-5 mb-3">
                <div className="card eco-card">
                  <div className="card-body text-center">
                    <FaLeaf className="action-icon" />
                    <h3 className="card-title">Create Game</h3>
                    <p className="card-text">Start a new fight for the planet</p>
                    <button
                      className="btn btn-success btn-lg w-100"
                      onClick={() => {
                        if (!validateBackendAddress()) return;
                        setView("create");
                      }}
                    >
                      Create Game
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-md-5 mb-3">
                <div className="card psy-card">
                  <div className="card-body text-center">
                    <FaUsers className="action-icon" />
                    <h3 className="card-title">Join Game</h3>
                    <p className="card-text">Join an existing community</p>
                    <button
                      className="btn btn-warning btn-lg w-100"
                      onClick={() => {
                        if (!validateBackendAddress()) return;
                        setView("list");
                      }}
                    >
                      Join Game
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="game-info mt-5">
            <div className="row">
              <div className="col-md-4 mb-3">
                <div className="info-card">
                  <FaLeaf className="info-icon" />
                  <h4>Exemplary Citizens</h4>
                  <p>They fight to protect and improve the environment</p>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="info-card">
                  <FaSkull className="info-icon" />
                  <h4>Psychopaths</h4>
                  <p>They put their own interests above the planet</p>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="info-card">
                  <FaRecycle className="info-icon" />
                  <h4>5 Decades</h4>
                  <p>The planet's future is decided in 5 decades</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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

        {/* Modal de Reglas del Juego */}
    <div
      className={`modal fade ${showRules ? "show" : ""}`}
      style={{ display: showRules ? "block" : "none" }}
      tabIndex={-1}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content eco-modal">
          <div className="modal-header">
            <h5 className="modal-title">
              <FaBook className="me-2" />
              Reglas del Juego - contaminaDOS
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowRules(false)}
            ></button>
          </div>
          <div className="modal-body">
            <div className="rules-list">
              <ol className="list-group list-group-numbered">
                <li className="list-group-item">
                  <strong>Fundamental Step:</strong> Before starting the game, you must configure the server address using the server button (for this delivery the following is recommended: <strong>https://contaminados.akamai.meseguercr.com</strong>)
                </li>
                <li className="list-group-item">
                  <strong>Objective:</strong> The team that first achieves <strong>3 victorious decades</strong> wins
                </li>
                <li className="list-group-item">
                  <strong>Roles:</strong> You can be a <span className="text-success">Exemplary Citizen</span> (save the planet) or <span className="text-danger">Environmental Psychopath</span> (sabotage in secret)
                </li>
                <li className="list-group-item">
                  <strong>Start:</strong> <strong>5-10 players</strong> are needed to start the game
                </li>
                <li className="list-group-item">
                  <strong>Decades:</strong> The game lasts maximum <strong>5 rounds</strong>, each one is a decade
                </li>
                <li className="list-group-item">
                  <strong>Leader:</strong> Each decade the system randomly selects a new leader
                </li>
                <li className="list-group-item">
                  <strong>Groups:</strong> The leader proposes a group of specific size according to players and decade
                </li>
                <li className="list-group-item">
                  <strong>Voting:</strong> Everyone votes <strong>for or against</strong> the proposed group
                </li>
                <li className="list-group-item">
                  <strong>3 Attempts:</strong> If the proposal is rejected 3 times, <strong>the psychopaths win</strong> that decade
                </li>
                <li className="list-group-item">
                  <strong>Actions:</strong> Group members choose to <strong>collaborate</strong> or <strong>sabotage</strong> (only psychopaths)
                </li>
                <li className="list-group-item">
                  <strong>Citizen Victory:</strong> If everyone collaborates, <strong>the citizens win</strong> the decade
                </li>
                <li className="list-group-item">
                  <strong>Psychopaths Victory:</strong> If there is at least one sabotage, <strong>the psychopaths win</strong>
                </li>
                <li className="list-group-item">
                  <strong>Strategy:</strong> Psychopaths know each other, citizens <strong>DO NOT</strong>
                </li>
                <li className="list-group-item">
                  <strong>Discussion:</strong> You can talk, deceive and deduce roles freely
                </li>
                <li className="list-group-item">
                  <strong>Score:</strong> Follow the on-screen scoreboard - Citizens vs Psychopaths
                </li>
                <li className="list-group-item">
                  <strong>End:</strong> When a team reaches <strong>3 points</strong>, the game ends immediately
                </li>
              </ol>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-success"
              onClick={() => setShowRules(false)}
            >
              Entendido, ¡a jugar!
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Settings Modal */}
    <div
      className={`modal fade ${showSettings ? "show" : ""}`}
      style={{ display: showSettings ? "block" : "none" }}
      tabIndex={-1}
    >
      <div className="modal-dialog">
        <div className="modal-content eco-modal">
          <div className="modal-header">
            <h5 className="modal-title">System Settings</h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowSettings(false)}
            ></button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Backend Address</label>
              <input
                type="text"
                className="form-control"
                value={backendAddress}
                onChange={(e) => setBackendAddress(e.target.value)}
              />
              <small className="form-text">
                Configure your backend server address
              </small>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-success"
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

    {(view === "gameDetails" || view === "gameFeatures") && selectedGame && (
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

    {/* Error Modal */}
    <div
      className={`modal fade ${showErrorModal ? "show" : ""}`}
      style={{ display: showErrorModal ? "block" : "none" }}
      tabIndex={-1}
    >
      <div className="modal-dialog">
        <div className="modal-content psy-modal">
          <div className="modal-header">
            <h5 className="modal-title">System Error</h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleCloseErrorModal}
            ></button>
          </div>
          <div className="modal-body">{errorMessage}</div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCloseErrorModal}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Backend Error Modal */}
    <div
      className={`modal fade ${showBackendErrorModal ? "show" : ""}`}
      style={{ display: showBackendErrorModal ? "block" : "none" }}
      tabIndex={-1}
    >
      <div className="modal-dialog">
        <div className="modal-content eco-modal">
          <div className="modal-header">
            <h5 className="modal-title">Backend Address Required</h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleCloseBackendErrorModal}
            ></button>
          </div>
          <div className="modal-body">
            You must configure a backend address before continuing.
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-success"
              onClick={handleCloseBackendErrorModal}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Footer */}
    <footer className="game-footer" style={{ margin: '0 10px 10px 10px' }}>
      <div className="container text-center">
        <p>The planet's future is in your hands. Make the right choice!</p>
        <small>contaminaDOS </small>
      </div>
    </footer>
  </div>
);
}