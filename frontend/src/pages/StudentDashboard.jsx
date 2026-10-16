import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../api";


function StudentDashboard() {

  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);

  const [message, setMessage] = useState("");


  const loadData = async () => {

    try {

      const electionResponse =
        await API.get("/student/election");

      setElection(
        electionResponse.data.election
      );

      setCandidates(
        electionResponse.data.candidates
      );


      const voteResponse =
        await API.get("/student/my-vote");

      setHasVoted(
        voteResponse.data.has_voted
      );

    } catch (error) {

      setMessage(
        error.response?.data?.message ||
        "Unable to load data"
      );
    }
  };


  useEffect(() => {
    loadData();
  }, []);


  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };


  return (

    <div className="dashboard">

      <header className="navbar">

        <div>
          <h2>College Voting</h2>
        </div>

        <div className="nav-right">

          <span>
            Welcome, {user?.name}
          </span>

          <button
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </header>


      <main className="container">

        <section className="hero">

          <h1>
            {election?.title}
          </h1>

          <p>
            {election?.description}
          </p>

          <div>

            Status:{" "}

            {election?.is_active ? (
              <span className="status active">
                OPEN
              </span>
            ) : (
              <span className="status closed">
                CLOSED
              </span>
            )}

          </div>

        </section>


        {message && (
          <p className="error">
            {message}
          </p>
        )}


        {hasVoted ? (

          <div className="voted-box">

            <h2>Vote Submitted</h2>

            <p>
              You have already submitted your vote
              for this election.
            </p>

            <button
              onClick={() =>
                navigate("/results")
              }
            >
              View Results
            </button>

          </div>

        ) : election?.is_active ? (

          <>

            <h2>Available Candidates</h2>

            <div className="candidate-grid">

              {candidates.map((candidate) => (

                <div
                  className="candidate-card"
                  key={candidate.id}
                >

                  <div className="candidate-icon">
                    👤
                  </div>

                  <h3>
                    {candidate.name}
                  </h3>

                  <p>
                    <strong>
                      Position:
                    </strong>{" "}
                    {candidate.position}
                  </p>

                  <p>
                    <strong>
                      Department:
                    </strong>{" "}
                    {candidate.department}
                  </p>

                  <p>
                    {candidate.manifesto}
                  </p>

                </div>

              ))}

            </div>

            <button
              className="primary-btn"
              onClick={() =>
                navigate("/vote")
              }
            >
              Proceed to Vote
            </button>

          </>

        ) : (

          <div className="voted-box">

            <h2>Election Closed</h2>

            <p>
              Voting is currently unavailable.
            </p>

          </div>

        )}

      </main>

    </div>
  );
}

export default StudentDashboard;
