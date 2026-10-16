import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState([]);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [manifesto, setManifesto] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingCandidate, setAddingCandidate] = useState(false);

  // =========================
  // LOAD ADMIN DATA
  // =========================

  const loadData = async () => {
    try {
      setError("");

      const dashboardResponse = await API.get("/admin/dashboard");

      console.log(
        "Dashboard data:",
        dashboardResponse.data
      );

      setDashboard(dashboardResponse.data);

      const candidateResponse =
        await API.get("/admin/candidates");

      console.log(
        "Candidates:",
        candidateResponse.data
      );

      setCandidates(candidateResponse.data);

      const resultsResponse =
        await API.get("/admin/results");

      console.log(
        "Results:",
        resultsResponse.data
      );

      setResults(resultsResponse.data);

    } catch (error) {
      console.error(
        "LOAD ADMIN DATA ERROR:",
        error
      );

      if (error.response) {
        setError(
          error.response.data?.message ||
          error.response.data?.error ||
          `Server error: ${error.response.status}`
        );
      } else {
        setError(
          "Unable to connect to backend server."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // ADD CANDIDATE
  // =========================

  const addCandidate = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    // Check dashboard
    if (!dashboard) {
      setError(
        "Dashboard data is not loaded. Please refresh the page."
      );
      return;
    }

    // Check election
    if (!dashboard.election) {
      setError(
        "No election found. Please create an election first."
      );
      return;
    }

    // Check election ID
    if (!dashboard.election.id) {
      setError(
        "Election ID is missing."
      );
      return;
    }

    // Check required fields
    if (!name.trim()) {
      setError("Please enter candidate name.");
      return;
    }

    if (!position.trim()) {
      setError("Please enter candidate position.");
      return;
    }

    try {
      setAddingCandidate(true);

      const candidateData = {
        name: name.trim(),
        department: department.trim(),
        position: position.trim(),
        manifesto: manifesto.trim(),
        election_id: dashboard.election.id
      };

      console.log(
        "Sending candidate data:",
        candidateData
      );

      const response = await API.post(
        "/admin/candidates",
        candidateData
      );

      console.log(
        "Add candidate response:",
        response.data
      );

      setMessage(
        "Candidate added successfully!"
      );

      // Clear form
      setName("");
      setDepartment("");
      setPosition("");
      setManifesto("");

      // Reload dashboard
      await loadData();

    } catch (error) {
      console.error(
        "ADD CANDIDATE ERROR:",
        error
      );

      if (error.response) {
        setError(
          error.response.data?.message ||
          error.response.data?.error ||
          `Unable to add candidate. Status: ${error.response.status}`
        );
      } else {
        setError(
          "Unable to connect to backend server."
        );
      }

    } finally {
      setAddingCandidate(false);
    }
  };

  // =========================
  // DELETE CANDIDATE
  // =========================

  const deleteCandidate = async (id) => {
    const confirmed = window.confirm(
      "Delete this candidate?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await API.delete(
        `/admin/candidates/${id}`
      );

      setMessage(
        "Candidate deleted successfully!"
      );

      await loadData();

    } catch (error) {
      console.error(
        "DELETE CANDIDATE ERROR:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Delete failed"
      );
    }
  };

  // =========================
  // TOGGLE ELECTION
  // =========================

  const toggleElection = async () => {
    if (!dashboard?.election?.id) {
      setError(
        "Election information is not available."
      );
      return;
    }

    try {
      setError("");
      setMessage("");

      await API.put(
        "/admin/election/toggle",
        {
          election_id:
            dashboard.election.id,

          is_active:
            !dashboard.election.is_active
        }
      );

      setMessage(
        dashboard.election.is_active
          ? "Election closed successfully!"
          : "Election opened successfully!"
      );

      await loadData();

    } catch (error) {
      console.error(
        "TOGGLE ELECTION ERROR:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to update election"
      );
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="dashboard">
        <header className="navbar">
          <h2>Admin Dashboard</h2>

          <button
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>
        </header>

        <main className="container">
          <h1>
            Loading Admin Dashboard...
          </h1>
        </main>
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="dashboard">

      <header className="navbar">

        <h2>
          Admin Dashboard
        </h2>

        <button
          className="logout-btn"
          onClick={logout}
        >
          Logout
        </button>

      </header>

      <main className="container">

        <h1>
          Election Administration
        </h1>

        {/* SUCCESS MESSAGE */}

        {message && (
          <div className="success-box">
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* =========================
            STATISTICS
        ========================= */}

        <div className="stats-grid">

          <div className="stat-card">

            <h3>
              Students
            </h3>

            <strong>
              {dashboard?.total_students || 0}
            </strong>

          </div>

          <div className="stat-card">

            <h3>
              Candidates
            </h3>

            <strong>
              {dashboard?.total_candidates || 0}
            </strong>

          </div>

          <div className="stat-card">

            <h3>
              Total Votes
            </h3>

            <strong>
              {dashboard?.total_votes || 0}
            </strong>

          </div>

        </div>

        {/* =========================
            ELECTION CONTROL
        ========================= */}

        <section className="admin-section">

          <h2>
            Election Control
          </h2>

          {dashboard?.election ? (
            <>
              <h3>
                {dashboard.election.title}
              </h3>

              <p>
                Current status:{" "}

                <span
                  className={
                    dashboard.election.is_active
                      ? "status active"
                      : "status closed"
                  }
                >
                  {dashboard.election.is_active
                    ? "OPEN"
                    : "CLOSED"}
                </span>
              </p>

              <button
                className="primary-btn"
                onClick={toggleElection}
              >
                {dashboard.election.is_active
                  ? "Close Election"
                  : "Open Election"}
              </button>
            </>
          ) : (
            <p>
              No election available.
            </p>
          )}

        </section>

        {/* =========================
            ADD CANDIDATE
        ========================= */}

        <section className="admin-section">

          <h2>
            Add Candidate
          </h2>

          <form
            className="candidate-form"
            onSubmit={addCandidate}
          >

            <input
              type="text"
              placeholder="Candidate name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
            />

            <input
              type="text"
              placeholder="Department"
              value={department}
              onChange={(e) =>
                setDepartment(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Position"
              value={position}
              onChange={(e) =>
                setPosition(e.target.value)
              }
              required
            />

            <textarea
              placeholder="Manifesto"
              value={manifesto}
              onChange={(e) =>
                setManifesto(e.target.value)
              }
            />

            <button
              type="submit"
              disabled={addingCandidate}
            >
              {addingCandidate
                ? "Adding..."
                : "Add Candidate"}
            </button>

          </form>

        </section>

        {/* =========================
            CANDIDATES
        ========================= */}

        <section className="admin-section">

          <h2>
            Candidates
          </h2>

          <div className="admin-list">

            {candidates.length === 0 ? (
              <p>
                No candidates added yet.
              </p>
            ) : (
              candidates.map((candidate) => (

                <div
                  className="admin-list-item"
                  key={candidate.id}
                >

                  <div>

                    <strong>
                      {candidate.name}
                    </strong>

                    <p>
                      {candidate.position}
                      {" - "}
                      {candidate.department ||
                        "Department not specified"}
                    </p>

                    {candidate.manifesto && (
                      <p>
                        {candidate.manifesto}
                      </p>
                    )}

                  </div>

                  <button
                    className="danger-btn"
                    onClick={() =>
                      deleteCandidate(
                        candidate.id
                      )
                    }
                  >
                    Delete
                  </button>

                </div>

              ))
            )}

          </div>

        </section>

        {/* =========================
            VOTE RESULTS
        ========================= */}

        <section className="admin-section">

          <h2>
            Vote Results
          </h2>

          <div className="results-table">

            <div className="result-row header">

              <span>
                Candidate
              </span>

              <span>
                Position
              </span>

              <span>
                Votes
              </span>

            </div>

            {results.length === 0 ? (
              <div className="result-row">

                <span>
                  No results available
                </span>

                <span>
                  -
                </span>

                <span>
                  0
                </span>

              </div>
            ) : (
              results.map((item) => (

                <div
                  className="result-row"
                  key={item.id}
                >

                  <span>
                    {item.name}
                  </span>

                  <span>
                    {item.position}
                  </span>

                  <span>
                    {item.vote_count}
                  </span>

                </div>

              ))
            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default AdminDashboard;