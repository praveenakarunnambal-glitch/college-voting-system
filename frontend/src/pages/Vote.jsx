
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

const POSITIONS = [
  "President",
  "Vice President",
  "Secretary",
];

function Vote() {
  const navigate = useNavigate();

  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadElection() {
      try {
        const response = await API.get("/student/election");
        setElection(response.data.election);
        setCandidates(response.data.candidates || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Unable to load candidates. Please log in again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadElection();
  }, []);

  const selectCandidate = (position, candidateId) => {
    setSelected((previous) => ({
      ...previous,
      [position]: candidateId,
    }));
    setError("");
  };

  const submitVote = async () => {
    for (const position of POSITIONS) {
      if (!selected[position]) {
        setError(`Please select one ${position} candidate.`);
        return;
      }
    }

    const confirmed = window.confirm(
      "Submit your votes for all three positions?"
    );

    if (!confirmed) return;

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await API.post("/student/vote", {
        election_id: election.id,
        votes: {
          President: Number(selected["President"]),
          "Vice President": Number(selected["Vice President"]),
          Secretary: Number(selected["Secretary"]),
        },
      });

      setMessage(
        response.data.message || "Votes submitted successfully!"
      );

      window.setTimeout(() => {
        navigate("/student");
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Vote submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="container"><p>Loading candidates...</p></main>;
  }

  return (
    <div className="dashboard">
      <header className="navbar">
        <h2>Cast Your Vote</h2>
        <button
          type="button"
          className="logout-btn"
          onClick={() => navigate("/student")}
        >
          Back
        </button>
      </header>

      <main className="container">
        <div className="vote-header">
          <h1>{election?.title || "College Election"}</h1>
          <p>Select one candidate for each position.</p>
        </div>

        {error && <div className="error-box">{error}</div>}
        {message && <div className="success-box">{message}</div>}

        {!election && !error && (
          <p>No active election is available.</p>
        )}

        {election && POSITIONS.map((position) => {
          const positionCandidates = candidates.filter(
            (candidate) =>
              (candidate.position || "").trim().toLowerCase() ===
              position.toLowerCase()
          );

          return (
            <section className="vote-section" key={position}>
              <h2>{position}</h2>
              <p>Select one candidate.</p>

              {positionCandidates.length === 0 ? (
                <p>No candidates available for {position}.</p>
              ) : (
                <div className="candidate-grid">
                  {positionCandidates.map((candidate) => (
                    <label
                      className={
                        String(selected[position]) === String(candidate.id)
                          ? "candidate-card selected"
                          : "candidate-card"
                      }
                      key={candidate.id}
                    >
                      <input
                        type="radio"
                        name={position}
                        value={candidate.id}
                        checked={
                          String(selected[position] || "") ===
                          String(candidate.id)
                        }
                        onChange={() =>
                          selectCandidate(position, candidate.id)
                        }
                      />

                      <div className="candidate-icon">👤</div>
                      <h3>{candidate.name}</h3>
                      <p>{candidate.department}</p>
                      {candidate.manifesto && <p>{candidate.manifesto}</p>}
                    </label>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        <button
          type="button"
          className="primary-btn"
          onClick={submitVote}
          disabled={submitting || loading || !election}
        >
          {submitting ? "Submitting..." : "Submit All Votes"}
        </button>
      </main>
    </div>
  );
}

export default Vote;
