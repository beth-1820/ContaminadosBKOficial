import React, { useState, useEffect } from 'react';

const ExternalGame = ({
  onSelectGame,
  onBack,
  backEndAddress,
}) => {
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const limitPerPage = 15;

  useEffect(() => {
    // Function to get all games, going through all pages
    const fetchAllGames = async () => {
      setLoading(true);
      let allGames = [];
      let page = 0;
      let fetchedData = [];

      do {
        try {
          // Make request to backend for each page with `fetch`
          const response = await fetch(
            `${backEndAddress}/api/games?page=${page}&limit=50`
          );
          const result = await response.json();

          fetchedData = result.data; // We assume the response follows the structure { data: Game[] }
          allGames = [...allGames, ...fetchedData];
          page += 1; // Move to next page
        } catch (error) {
          console.error('Error loading games', error);
          setLoading(false);
          return;
        }
      } while (fetchedData.length > 0); // Stop if there are no more results

      setGames(allGames);
      setLoading(false);
    };

    fetchAllGames();
  }, [backEndAddress]);

  // Filter games by name whenever search changes
  useEffect(() => {
    let filtered = games;

    // Filtro por nombre (si hay)
    if (searchQuery.length >= 3) {
      filtered = filtered.filter(game =>
        game.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== '') {
      filtered = filtered.filter(game =>
        game.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredGames(filtered);
  }, [searchQuery, statusFilter, games]);

  // Get games to show on current page
  const paginatedGames = filteredGames.slice(
    (currentPage - 1) * limitPerPage,
    currentPage * limitPerPage
  );

  const totalPages = Math.ceil(filteredGames.length / limitPerPage);

  return (
  <div className="game-list-container contaminaDOS-theme" style={{ margin: '20px' }}>
    <div className="games-container" style={{ marginLeft: '20px', marginRight: '20px' }}>

      {/* Header */}
      <div className="list-header" style={{ marginLeft: '20px', marginRight: '20px' }}>
        <button className="back-button" onClick={onBack}>← Back</button>
        <h2 className="list-title">Game List</h2>
        <div></div>
      </div>

      {/* Search Row */}
      <div 
        className="search-box" 
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        {/* Search by name */}
        <input
          type="text"
          className="search-input"
          placeholder="Search game..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 2 }}
        />

        {/* Status filter */}
        <select
          className="search-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="">All Status</option>
          <option value="lobby">Lobby</option>
          <option value="rounds">In Rounds</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="icon">⏳</div>
          <p>Loading games...</p>
        </div>
      ) : (
        <div>
          {paginatedGames.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🎮</div>
              <p>No games found</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="games-table">
                <table className="game-table">
                  <thead>
                    <tr className="table-header">
                      <th>Game Name</th>
                      <th>Owner</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedGames.map((game) => (
                      <tr key={game.id}>
                        <td className="game-name">{game.name}</td>
                        <td className="game-owner">{game.owner}</td>
                        <td>
                          <button
                            className="select-button"
                            onClick={() => onSelectGame(game)}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination-container">
                <div className="pagination-controls">
                  <button
                    className="pagination-button"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>

                  <span className="page-info">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    className="pagination-button"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  </div>
);

}

export default ExternalGame;