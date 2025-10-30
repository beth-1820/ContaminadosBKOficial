import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import ControlErrors from "./controlErrors";

const GameInitiate = ({
  selectedGame,
  playerName,
  gamePassword,
  view,
  setView,
  backEndAddress,
}) => {
  const [currentRoundId, setCurrentRoundId] = useState("");
  const [currentLeader, setCurrentLeader] = useState("");
  const [currentResult, setCurrentResult] = useState("none");
  const [currentStatus, setCurrentStatus] = useState("waiting-on-leader");
  const [currentPhase, setCurrentPhase] = useState("");
  const [currentGroup, setCurrentGroup] = useState([]);
  const [currentVotes, setCurrentVotes] = useState([]);
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
      return "Citizens Win!";
    } else {
      return "Enemies Win!";
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
      setCurrentRoundId(currentRound.id);
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
      message = "Invalid Credentials";
    } else if (response.status === 403) {
      message = "Not part of the game";
    } else if (response.status === 404) {
      message = "Not found";
    } else if (response.status === 408) {
      message = "Request Timeout";
    } else if (response.status === 409) {
      message = "You have already voted in this round";
    } else if (response.status === 428) {
      message = "This action is not allowed at this time";
    } else {
      message = "This action is not allowed at this stage of the game";
    }
    setModalTitle("Game Error");
    setModalMessage(message);
    setShowModal(true);
  };

  const validateGroupSize = () => {
    const numPlayers = selectedGame.players?.length || 0;

    if (numPlayers < 5 || numPlayers > 10) {
      setModalTitle("Error");
      setModalMessage("Number of players must be between 5 and 10.");
      setShowModal(true);
      return false;
    }

    const requiredGroupSize =
      groupSizesPerRound[numPlayers][currentRoundIndex];

    if (proposedGroup.length !== requiredGroupSize) {
      setModalTitle("Notice");
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
        "An error occurred while fetching round information: " + err
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
        setCurrentLeader(data.data.leader);
        setCurrentResult(data.data.result);
        setCurrentStatus(data.data.status);
        setCurrentPhase(data.data.phase);
        setCurrentGroup(data.data.group);
        setCurrentVotes(data.data.votes);
        resetVotesState();
      } else {
        handleApiErrors(response);
      }
    } catch (err) {
      setModalTitle("Error");
      setModalMessage(
        "An error occurred while fetching round information: " + err
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
      setCurrentRoundId(newRound.id);
      setCurrentLeader(newRound.leader);
      setCurrentStatus(newRound.status);
      setCurrentPhase(newRound.phase);
      setCurrentGroup(newRound.group);
      setCurrentVotes(newRound.votes);
      resetVotesState();

      setModalTitle("New Round");
      setModalMessage("A new round has started. Choose a new group!");
      setShowModal(true);
    }
  };

  const handleUpdateInfo = async () => {
    try {
      await getAllRounds(selectedGame.id, playerName, gamePassword);

      const currentRound = rounds.find((round) => round.status !== "ended");
      if (currentRound) {
        setCurrentRoundId(currentRound.id);
        getRound(selectedGame.id, currentRound.id, playerName, gamePassword);
      }
    } catch (err) {
      setModalTitle("Error");
      setModalMessage("An error occurred while updating information: " + err);
      setShowModal(true);
    }
  };

  const submitVote = async (voteValue) => {
    try {
      const currentRound = rounds.find((round) => round.status !== "ended");
      if (!currentRound) {
        setModalTitle("Error");
        setModalMessage("No round available for voting.");
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
        setModalTitle("Vote Sent");
        setModalMessage("Vote sent successfully");
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
      setModalMessage("An error occurred while sending the vote: " + err);
      setShowModal(true);
    }
  };

  const submitGroupProposal = async () => {
    if (currentStatus !== "waiting-on-leader") {
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
        "No current round available to propose a group."
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
        setModalTitle("Success");
        setModalMessage("Group proposal sent successfully");
        setShowModal(true);
        resetVotesState();
      } else if (response.status === 428) {
        setModalTitle("Error");
        setModalMessage("This action is not allowed at this time.");
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
        setModalTitle("Round Not Available");
        setModalMessage("No round available to perform the action.");
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
        setModalTitle("Success");
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

  const isLeader = currentLeader === playerName;
  const isEnemy =
    selectedGame.enemies && selectedGame.enemies.includes(playerName);

  return (
    <div className="container-game">
      <h2>The Game Has Started</h2>
      <p>Good luck to all players!</p>

      <div className="card">
        <h3>Scoreboard</h3>
        <p>Citizens: {citizensScore}</p>
        <p>Enemies: {enemiesScore}</p>
      </div>

      {/* Este es el div que agregue a ultimo momento */}
      <div className="card mb-3">
        <h3>Your Role</h3>
        <p><strong>Player:</strong> {playerName}</p>
        <p><strong>Role:</strong> <span className={`badge ${isEnemy ? 'bg-danger' : 'bg-success'}`}>
          {isEnemy ? "Enemy" : "Citizen"}
        </span></p>
      </div>

      {view === "gameStarted" && selectedGame && (
        <div className="card">
          <h3>Current Round</h3>
          <ul className="list-group">
            <li className="list-group-item">
              <strong>ID:</strong> {currentRoundId}
            </li>
            <li className="list-group-item">
              <strong>Leader:</strong> {currentLeader}
            </li>
            <li className="list-group-item">
              <strong>Result:</strong> {currentResult}
            </li>
            <li className="list-group-item">
              <strong>Status:</strong> {currentStatus}
            </li>
            <li className="list-group-item">
              <strong>Phase:</strong> {currentPhase}
            </li>
            <li className="list-group-item">
              <strong>Group:</strong>{" "}
              {currentGroup && currentGroup.length > 0
                ? currentGroup.join(", ")
                : "No group"}
            </li>
            <li className="list-group-item">
              <strong>Votes:</strong>{" "}
              {currentVotes && currentVotes.length > 0
                ? currentVotes.join(", ")
                : "No votes"}
            </li>
          </ul>

          {selectedGame.enemies &&
            selectedGame.enemies.length > 0 &&
            selectedGame.enemies.includes(playerName) && (
              <div className="card mt-4">
                <h4 className="card-header">Enemies:</h4>
                <ul className="list-group list-group-flush">
                  {selectedGame.enemies.map((enemy, index) => (
                    <li key={index} className="list-group-item">
                      {enemy}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          <div className="button-group">
            <button
              id="update-btn"
              className="btn btn-lg btn-primary"
              onClick={handleUpdateInfo}
            >
              Update
            </button>

            {isLeader && (
              <button
                className="btn btn-lg btn-success"
                data-bs-toggle="modal"
                data-bs-target="#leaderModal"
                onClick={submitGroupProposal}
              >
                Propose Group
              </button>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <h3>Players in the Game</h3>
        <div className="player-list-container">
          {selectedGame.players?.map((player, index) => (
            <div key={index} className="player-card">
              <span className="player-name">{player}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h3>Voting</h3>
        {votesState[playerName] === null ? (
          <div className="button-group-vertical">
            <button
              className="btn btn-success me-2"
              onClick={() => submitVote(true)}
            >
              Agree
            </button>
            <button
              className="btn btn-danger"
              onClick={() => submitVote(false)}
            >
              Disagree
            </button>
          </div>
        ) : (
          <p>
            You have already voted:{" "}
            {votesState[playerName] ? "Agree" : "Disagree"}
          </p>
        )}
      </div>

      {currentGroup.includes(playerName) && (
        <div className="mt-4">
          <h3>Group Action</h3>
          <div className="button-group-vertical">
            <button
              className="btn btn-success me-2"
              onClick={() => submitAction(true)}
            >
              Collaborate
            </button>
            {isEnemy && (
              <button
                className="btn btn-danger"
                onClick={() => submitAction(false)}
              >
                Sabotage
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className="modal fade"
        id="leaderModal"
        tabIndex={-1}
        aria-labelledby="leaderModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5
                className="modal-title"
                id="leaderModalLabel"
                style={{ color: "black", fontWeight: "bold" }}
              >
                Select Group
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form id="groupForm" className="group-form">
                {selectedGame.players?.map((player, index) => (
                  <div key={index} className="form-check player-list">
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
                    </label>
                  </div>
                ))}
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={submitGroupProposal}
              >
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
};

export default GameInitiate;