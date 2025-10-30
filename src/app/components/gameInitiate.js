import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import ControlErrors from "./controlErrors";
import { FaCheck, FaChartBar, FaPlayCircle, FaTrophy, FaLeaf, FaSkull, FaSyncAlt, FaCrown, FaCircle, FaClock, FaUsers, FaUser, FaVoteYea, FaSkullCrossbones, FaUserSecret, FaTimes, FaCheckCircle, FaHandshake, FaPaperPlane } from "react-icons/fa";

const GameInitiate = ({
  selectedGame,
  playerName,
  gamePassword,
  view,
  setView,
  backEndAddress,
}) => {
  const [idRondaActual, setIdRondaActual] = useState("");
  const [leaderActual, setLeaderActual] = useState("");
  const [resultActual, setResultActual] = useState("none");
  const [statusActual, setStatusActual] = useState("waiting-on-leader");
  const [phaseActual, setPhaseActual] = useState("");
  const [groupActual, setGroupActual] = useState([]);
  const [votesActual, setVotesActual] = useState([]);
  const [votesState, setVotesState] = useState({});
  const [rounds, setRounds] = useState([]);
  const [error, setError] = useState("");

  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

  const [proposedGroup, setProposedGroup] = useState([]);
  const [citizensScore, setCitizensScore] = useState(0);
  const [enemiesScore, setEnemiesScore] = useState(0);
  const [roundAlreadyCounted, setRoundAlreadyCounted] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const handleCloseModal = () => setShowModal(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState("");
  const handleCloseWinnerModal = () => setShowWinnerModal(false);

  const groupSizesPerRound = {
    5: [2, 3, 2, 3, 3],
    6: [2, 3, 4, 3, 4],
    7: [2, 3, 3, 4, 4],
    8: [3, 4, 4, 5, 5],
    9: [3, 4, 4, 5, 5],
    10: [3, 4, 4, 5, 5],
  };

  const determineWinner = () => {
    if (citizensScore > enemiesScore) {
      return "Citizen win!";
    } else {
      return "Psychopaths win!";
    }
  };

  useEffect(() => {
    if (selectedGame.status === "ended") {
      const winnerMessage = determineWinner();
      setWinnerMessage(winnerMessage);
      setShowWinnerModal(true);
    }
  }, [selectedGame.status, citizensScore, enemiesScore]);

  useEffect(() => {
    if (selectedGame.status === "rounds") {
      getAllRounds(selectedGame.id, playerName, gamePassword);
    }
  }, [selectedGame.id, playerName, gamePassword]);

  useEffect(() => {
    const currentRound = rounds.find((round) => round.status !== "ended");
    const lastRound = rounds[rounds.length - 1];

    if (lastRound && lastRound.status === "ended") {
      handleRoundEnd(lastRound);
    } else if (currentRound) {
      setIdRondaActual(currentRound.id);
      const roundIndex = rounds.findIndex(
        (round) => round.id === currentRound.id
      );
      setCurrentRoundIndex(roundIndex);
      getRound(selectedGame.id, currentRound.id, playerName, gamePassword);
    }
  }, [rounds]);

  useEffect(() => {
    const handleModalClose = () => {
      setProposedGroup([]);
    };

    const modal = document.getElementById("leaderModal");
    modal?.addEventListener("hidden.bs.modal", handleModalClose);

    return () => {
      modal?.removeEventListener("hidden.bs.modal", handleModalClose);
    };
  }, []);

  const handleApiErrors = (response) => {
    let message = "";
    if (response.status === 400) {
      message = "Bad Request";
    } else if (response.status === 401) {
      message = "Credenciales Inválidas";
    } else if (response.status === 403) {
      message = "No forma parte del juego";
    } else if (response.status === 404) {
      message = "Not found";
    } else if (response.status === 408) {
      message = "Request Timeout";
    } else if (response.status === 409) {
      message = "Ya has votado en esta ronda";
    } else if (response.status === 428) {
      message = "This action is not permitted at this time";
    } else {
      message = "This action is not allowed at this point in the game";
    }
    setModalTitle("Game Error");
    setModalMessage(message);
    setShowModal(true);
  };

  const validateGroupSize = () => {
    const numPlayers = selectedGame.players?.length || 0;

    if (numPlayers < 5 || numPlayers > 10) {
      setModalTitle("Error");
      setModalMessage("The number of players must be between 5 and 10.");
      setShowModal(true);
      return false;
    }

    const requiredGroupSize =
      groupSizesPerRound[numPlayers][currentRoundIndex];

    if (proposedGroup.length !== requiredGroupSize) {
      setModalTitle("Warning");
      setModalMessage(
        `You must select ${requiredGroupSize} players for this round.`
      );
      setShowModal(true);
      return false;
    }

    return true;
  };

  const getAllRounds = async (
    gameId,
    playerName,
    password
  ) => {
    try {
      const headers = {
        accept: "application/json",
        player: playerName,
        ...(password && { password }),
      };

      const response = await fetch(
        `${backEndAddress}/api/games/${gameId}/rounds`,
        {
          method: "GET",
          headers: headers,
        }
      );
      if (response.ok) {
        const data = await response.json();
        setRounds(data.data);
        let enemiesCount = 0;
        let citizensCount = 0;
        data.data.forEach((round) => {
          if (round.result === "enemies") {
            enemiesCount++;
          } else if (round.result === "citizens") {
            citizensCount++;
          }
        });
        setCitizensScore(citizensCount);
        setEnemiesScore(enemiesCount);
      } else {
        handleApiErrors(response);
      }
    } catch (err) {
      setModalTitle("Error");
      setModalMessage(
        "An error occurred while retrieving the round information: " + err
      );
      setShowModal(true);
    }
  };

  const getRound = async (
    gameId,
    roundId,
    playerName,
    password
  ) => {
    try {
      const headers = {
        accept: "application/json",
        player: playerName,
        ...(password && { password }),
      };

      const response = await fetch(
        `${backEndAddress}/api/games/${gameId}/rounds/${roundId}`,
        {
          method: "GET",
          headers: headers,
        }
      );
      if (response.ok) {
        const data = await response.json();
        setLeaderActual(data.data.leader);
        setResultActual(data.data.result);
        setStatusActual(data.data.status);
        setPhaseActual(data.data.phase);
        setGroupActual(data.data.group);
        setVotesActual(data.data.votes);
        resetVotesState();
      } else {
        handleApiErrors(response);
      }
    } catch (err) {
      setModalTitle("Error");
      setModalMessage(
        "An error occurred while retrieving the round information:" + err
      );
      setShowModal(true);
    }
  };

  const resetVotesState = () => {
    const initialVotes = {};
    selectedGame.players?.forEach((player) => {
      initialVotes[player] = null;
    });
    setVotesState(initialVotes);
  };

  const handleRoundEnd = (lastRound) => {
    if (lastRound.id !== roundAlreadyCounted) {
      let enemiesCount = 0;
      let citizensCount = 0;
      rounds.forEach((round) => {
        if (round.result === "citizens") {
          citizensCount += 1;
        } else if (round.result === "enemies") {
          enemiesCount += 1;
        }
      });
      setCitizensScore(citizensCount);
      setEnemiesScore(enemiesCount);

      setRoundAlreadyCounted(lastRound.id);
    }

    const newRound = rounds.find(
      (round) => round.status === "waiting-on-leader"
    );
    if (newRound) {
      setIdRondaActual(newRound.id);
      setLeaderActual(newRound.leader);
      setStatusActual(newRound.status);
      setPhaseActual(newRound.phase);
      setGroupActual(newRound.group);
      setVotesActual(newRound.votes);
      resetVotesState();

      setModalTitle("New Round");
      setModalMessage("A new round has begun. Choose a new group!");
      setShowModal(true);
    }
  };

  const handleUpdateInfo = async () => {
    try {
      await getAllRounds(selectedGame.id, playerName, gamePassword);

      const currentRound = rounds.find((round) => round.status !== "ended");
      if (currentRound) {
        setIdRondaActual(currentRound.id);
        getRound(selectedGame.id, currentRound.id, playerName, gamePassword);
      }
    } catch (err) {
      setModalTitle("Error");
      setModalMessage("An error occurred while updating the information: " + err);
      setShowModal(true);
    }
  };

  const submitVote = async (voteValue) => {
    try {
      const currentRound = rounds.find((round) => round.status !== "ended");
      if (!currentRound) {
        setModalTitle("Error");
        setModalMessage("There is no round available for voting.");
        setShowModal(true);
        return;
      }

      const headers = {
        accept: "application/json",
        "Content-Type": "application/json",
        player: playerName,
        ...(gamePassword && { password: gamePassword }),
      };

      const response = await fetch(
        `${backEndAddress}/api/games/${selectedGame.id}/rounds/${currentRound.id}`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            vote: voteValue,
          }),
        }
      );

      if (response.ok) {
        setModalTitle("Vote sent");
        setModalMessage("Vote submitted successfully");
        setShowModal(true);
        setVotesState((prevState) => ({
          ...prevState,
          [playerName]: voteValue,
        }));
      } else {
        handleApiErrors(response);
      }
    } catch (err) {
      setModalTitle("Error");
      setModalMessage("An error occurred while submitting the vote: " + err);
      setShowModal(true);
    }
  };

  const submitGroupProposal = async () => {
    if (statusActual !== "waiting-on-leader") {
      setModalTitle("Error");
      setModalMessage("You cannot propose a group at this stage.");
      setShowModal(true);
      return;
    }

    if (!validateGroupSize()) {
      return;
    }

    const currentRound = rounds.find(
      (round) => round.status === "waiting-on-leader"
    );
    if (!currentRound) {
      setModalTitle("Error");
      setModalMessage(
        "There is no current round available to propose a group."
      );
      setShowModal(true);
      return;
    }

    try {
      const headers = {
        accept: "application/json",
        "Content-Type": "application/json",
        player: playerName,
        ...(gamePassword && { password: gamePassword }),
      };

      const body = {
        group: proposedGroup,
      };

      const response = await fetch(
        `${backEndAddress}/api/games/${selectedGame.id}/rounds/${currentRound.id}`,
        {
          method: "PATCH",
          headers: headers,
          body: JSON.stringify(body),
        }
      );
      if (response.ok) {
        setModalTitle("Good!");
        setModalMessage("Group proposal submitted successfully");
        setShowModal(true);
        resetVotesState();
      } else if (response.status === 428) {
        setModalTitle("Error");
        setModalMessage("This action is not permitted at this time.");
        setShowModal(true);
      } else {
        handleApiErrors(response);
      }
    } catch (err) {
      setModalTitle("Error");
      setModalMessage("Error proposing group: " + err);
      setShowModal(true);
    }
  };

  const submitAction = async (actionValue) => {
    try {
      const currentRound = rounds.find((round) => round.status !== "ended");
      if (!currentRound) {
        setModalTitle("Round not available");
        setModalMessage("There is no round available to perform the action.");
        setShowModal(true);
        return;
      }

      const headers = {
        accept: "application/json",
        "Content-Type": "application/json",
        player: playerName,
        ...(gamePassword && { password: gamePassword }),
      };

      const response = await fetch(
        `${backEndAddress}/api/games/${selectedGame.id}/rounds/${currentRound.id}`,
        {
          method: "PUT",
          headers: headers,
          body: JSON.stringify({
            action: actionValue,
          }),
        }
      );

      if (response.ok) {
        setModalTitle("Good!");
        setModalMessage("Action performed successfully.");
        setShowModal(true);
      } else {
        handleApiErrors(response);
      }
    } catch (err) {
      setModalTitle("Error");
      setModalMessage("An error occurred while performing the action: " + err);
      setShowModal(true);
    }
  };

  const handlePlayerSelection = (player) => {
    setProposedGroup((prevGroup) =>
      prevGroup.includes(player)
        ? prevGroup.filter((p) => p !== player)
        : [...prevGroup, player]
    );
  };
  const updateVotesOnly = async () => {
  try {
    const currentRound = rounds.find((round) => round.status !== "ended");
    if (currentRound) {
      const headers = {
        accept: "application/json",
        player: playerName,
        ...(gamePassword && { password: gamePassword }),
      };

      const response = await fetch(
        `${backEndAddress}/api/games/${selectedGame.id}/rounds/${currentRound.id}`,
        {
          method: "GET",
          headers: headers,
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log("🗳️ Votos actualizados:", data.data.votes);
        setVotesActual(data.data.votes); // ← Solo actualiza los votos
      }
    }
  } catch (err) {
    console.error("Error actualizando votos:", err);
  }
};
useEffect(() => {
  const intervalId = setInterval(() => {
    if (selectedGame && selectedGame.status === "rounds") {
      console.log("🔄 Actualizando votos automáticamente...");
      updateVotesOnly();
    }
  }, 3000); // Cada 3 segundos

  return () => clearInterval(intervalId);
}, [selectedGame, rounds, playerName, gamePassword]); // Dependencias importantes

  const isLeader = leaderActual === playerName;
  const isEnemy =
    selectedGame.enemies && selectedGame.enemies.includes(playerName);

return (
  <div className="game-list-container contaminaDOS-theme" style={{ margin: '20px' }}>
    <div className="games-container">
      {/* Improved Header */}
      <div className="list-header">
        <div></div> {/* Spacer to center title */}
        <h2 className="list-title text-center">
          <FaPlayCircle className="me-3 text-success" size={40} />
          The Game Has Started!
        </h2>
        <div></div> {/* Spacer to balance */}
      </div>

      <p className="welcome-text text-center mb-5">Good luck to all players in this battle for the planet</p>

      <div className="row">
        {/* Left column - Main information */}
        <div className="col-lg-8">
          {/* Improved Scoreboard */}
          <div className="eco-card mb-4">
            <div className="card-body">
              <h3 className="card-title text-center mb-4">
                <FaTrophy className="me-2 text-warning" />
                Match Scoreboard
              </h3>
              <div className="row text-center">
                <div className="col-6">
                  <div className="score-card score-citizen">
                    <FaLeaf className="score-icon mb-3" size={40} />
                    <h2 className="score-value">{citizensScore}</h2>
                    <p className="score-label">Exemplary Citizens</p>
                    <small className="score-description">Planet defenders</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="score-card score-enemy">
                    <FaSkull className="score-icon mb-3" size={40} />
                    <h2 className="score-value">{enemiesScore}</h2>
                    <p className="score-label">Environmental Psychopaths</p>
                    <small className="score-description">Ecological threat</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Round Information - Improved */}
          {view === "gameStarted" && selectedGame && (
            <div className="eco-card mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="card-title mb-0">
                    <FaSyncAlt className="me-2 text-primary" />
                    Current Round = {currentRoundIndex + 1}
                  </h3>
                  <span className="badge bg-primary fs-6">ID: {idRondaActual}</span>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="info-item">
                      <FaCrown className="me-2 text-warning" />
                      <strong>Leader:</strong> 
                      <span className="text-success ms-2">{leaderActual}</span>
                    </div>
                    <div className="info-item">
                      <FaChartBar className="me-2 text-info" />
                      <strong>Result:</strong> 
                      <span className="badge bg-info ms-2">{resultActual}</span>
                    </div>
                    <div className="info-item">
                      <FaCircle className="me-2 text-warning" />
                      <strong>Status:</strong> 
                      <span className="badge bg-warning ms-2">{statusActual}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="info-item">
                      <FaClock className="me-2 text-secondary" />
                      <strong>Phase:</strong> 
                      <span className="badge bg-secondary ms-2">{phaseActual}</span>
                    </div>
                  </div>
                </div>
                
                {/* Current Group */}
                <div className="info-section mt-4">
                  <h5 className="section-title">
                    <FaUsers className="me-2" />
                    Current Group
                  </h5>
                  <div className="group-members">
                    {groupActual && groupActual.length > 0 ? (
                      groupActual.map((member, idx) => (
                        <span key={idx} className="member-badge">
                          <FaUser className="me-1" />
                          {member}
                        </span>
                      ))
                    ) : (
                      <div className="empty-group">
                        <FaUsers className="me-2" />
                        No group assigned
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Votes - WITH COUNT ADDED */}
                <div className="info-section mt-3">
                  <h5 className="section-title">
                    <FaVoteYea className="me-2" />
                    Registered Votes
                  </h5>
                  <div className="votes-list">
                    {votesActual && votesActual.length > 0 ? (
                      <div>
                        <code style={{ 
                          background: '#f8f9fa', 
                          padding: '10px', 
                          borderRadius: '5px', 
                          display: 'block',
                          fontFamily: 'monospace'
                        }}>
                          {JSON.stringify(votesActual)}
                        </code>
                        
                        {/* VOTE COUNT ADDED */}
                        <div className="mt-2 text-center">
                          <small className="text-muted">
                            <strong>✅ In favor:</strong> {votesActual.filter(vote => vote === true).length} | 
                            <strong> ❌ Against:</strong> {votesActual.filter(vote => vote === false).length}
                          </small>
                        </div>
                        
                      </div>
                    ) : (
                      <div className="empty-votes">
                        <FaVoteYea className="me-2" />
                        No votes registered
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enemies List - Improved */}
          {selectedGame.enemies &&
            selectedGame.enemies.length > 0 &&
            selectedGame.enemies.includes(playerName) && (
              <div className="psy-card">
                <div className="card-body">
                  <h4 className="card-title">
                    <FaSkullCrossbones className="me-2" />
                    Enemy Companions
                    <span className="badge bg-danger ms-2">{selectedGame.enemies.length}</span>
                  </h4>
                  <p className="text-muted mb-3">Only visible to environmental psychopaths</p>
                  <div className="enemies-grid">
                    {selectedGame.enemies.map((enemy, index) => (
                      <div key={index} className="enemy-card">
                        <FaUserSecret className="enemy-icon" />
                        <span className="enemy-name">{enemy}</span>
                        {enemy === playerName && (
                          <FaUser className="text-warning ms-2" title="You" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Right column - Actions and players */}
        <div className="col-lg-4">
          {/* Players List - Improved */}
          <div className="eco-card mb-4">
            <div className="card-body">
              <h3 className="card-title">
                <FaUsers className="me-2" />
                Players
                <span className="badge bg-primary ms-2">{selectedGame.players?.length || 0}</span>
              </h3>
              <div className="players-grid">
                {selectedGame.players?.map((player, index) => {
                  const isEnemyPlayer = selectedGame.enemies?.includes(player);
                  const isCurrentPlayer = player === playerName;
                  
                  return (
                    <div key={index} className={`player-card ${isEnemyPlayer ? 'enemy' : 'citizen'} ${isCurrentPlayer ? 'current-player' : ''}`}>
                      <span className="player-name">
                        {player}
                        {isCurrentPlayer && <small className="text-muted ms-1">(you)</small>}
                      </span>
                      {isEnemyPlayer && <FaSkull className="enemy-indicator" title="Environmental Psychopath" />}
                      {player === leaderActual && <FaCrown className="text-warning ms-2" title="Current Leader" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Current Player Information */}
          <div className="eco-card mb-4">
            <div className="card-body">
              <h3 className="card-title">
                <FaUser className="me-2 text-info" />
                Your Information
              </h3>
              <div className="player-info-card">
                <div className="info-row">
                  <strong>Player:</strong>
                  <span className="player-name-badge">{playerName}</span>
                </div>
                <div className="info-row">
                  <strong>Role:</strong>
                  <span className={`role-badge ${selectedGame.enemies?.includes(playerName) ? 'enemy-role' : 'citizen-role'}`}>
                    {selectedGame.enemies?.includes(playerName) ? (
                      <>
                        <FaSkull className="me-1" />
                        Environmental Psychopath
                      </>
                    ) : (
                      <>
                        <FaLeaf className="me-1" />
                        Exemplary Citizen
                      </>
                    )}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Status:</strong>
                  <span className={`status-badge ${isLeader ? 'leader-status' : 'player-status'}`}>
                    {isLeader ? (
                      <>
                        <FaCrown className="me-1" />
                        Current Leader
                      </>
                    ) : (
                      <>
                        <FaUser className="me-1" />
                        Player
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Panel */}
          <div className="action-panel">
            {/* Update Action */}
            <div className="eco-card mb-3">
              <div className="card-body">
                <button
                  id="update-btn"
                  className="btn btn-primary w-100"
                  onClick={handleUpdateInfo}
                >
                  <FaSyncAlt className="me-2" /> Update Information
                </button>
              </div>
            </div>

            {/* Leader Action */}
            {isLeader && (
              <div className="eco-card mb-3">
                <div className="card-body">
                  <button
                    className="btn btn-success w-100"
                    data-bs-toggle="modal"
                    data-bs-target="#leaderModal"
                    onClick={submitGroupProposal}
                  >
                    <FaUsers className="me-2" /> Propose Group
                  </button>
                </div>
              </div>
            )}

            {/* Voting */}
            <div className="eco-card mb-3">
              <div className="card-body">
                <h5 className="card-title">
                  <FaVoteYea className="me-2" />
                  Current Voting
                </h5>
                {votesState[playerName] === null ? (
                  <div className="voting-buttons">
                    <button
                      className="btn btn-success w-100 mb-2"
                      onClick={() => submitVote(true)}
                    >
                      <FaCheck className="me-2" /> In Favor
                    </button>
                    <button
                      className="btn btn-danger w-100"
                      onClick={() => submitVote(false)}
                    >
                      <FaTimes className="me-2" /> Against
                    </button>
                  </div>
                ) : (
                  <div className="voted-info text-center">
                    <FaCheckCircle className="text-success mb-2" size={30} />
                    <p className="mb-1"><strong>Vote registered</strong></p>
                    <span className={`badge ${votesState[playerName] ? 'bg-success' : 'bg-danger'}`}>
                      {votesState[playerName] ? "In Favor" : "Against"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Group Action */}
            {groupActual.includes(playerName) && (
              <div className="psy-card">
                <div className="card-body">
                  <h5 className="card-title">
                    <FaHandshake className="me-2" />
                    Your Action in the Group
                  </h5>
                  <div className="action-buttons">
                    <button
                      className="btn btn-success w-100 mb-2"
                      onClick={() => submitAction(true)}
                    >
                      <FaHandshake className="me-2" /> Collaborate
                    </button>
                    {isEnemy && (
                      <button
                        className="btn btn-danger w-100"
                        onClick={() => submitAction(false)}
                      >
                        <FaSkullCrossbones className="me-2" /> Sabotage
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Modal to select group */}
    <div
      className="modal fade"
      id="leaderModal"
      tabIndex={-1}
      aria-labelledby="leaderModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content eco-modal">
          <div className="modal-header">
            <h5 className="modal-title" id="leaderModalLabel">
              <FaUsers className="me-2" />
              Select Group for the Mission
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <p className="text-muted mb-3">Select players for the next mission:</p>
            <form id="groupForm" className="group-form">
              {selectedGame.players?.map((player, index) => {
                return (
                  <div key={index} className="form-check player-select-item">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      value={player}
                      checked={proposedGroup.includes(player)}
                      onChange={() => handlePlayerSelection(player)}
                      id={`player${index}`}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`player${index}`}
                    >
                      {player}
                      {player === playerName && <span className="text-muted ms-1">(you)</span>}
                    </label>
                  </div>
                );
              })}
            </form>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={submitGroupProposal}
            >
              <FaPaperPlane className="me-2" />
              Send Proposal
            </button>
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
export default GameInitiate;