import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../api";


function Results() {

  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [error, setError] = useState("");


  useEffect(() => {

    const loadResults = async () => {

      try {

        const response =
          await API.get("/admin/results");

        setResults(response.data);

      } catch (error) {

        setError(
          "Results are available only to admin."
        );
      }
    };

    loadResults();

  }, []);


  return (

    <div className="dashboard">

      <header className="navbar">

        <h2>Election Results</h2>

        <button
          className="logout-btn"
          onClick={() =>
            navigate("/student")
          }
        >
          Back
        </button>

      </header>


      <main className="container">

        <h1>Results</h1>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <div className="results-table">

          <div className="result-row header">

            <span>Candidate</span>
            <span>Position</span>
            <span>Votes</span>

          </div>

          {results.map((item) => (

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

          ))}

        </div>

      </main>

    </div>
  );
}

export default Results;
