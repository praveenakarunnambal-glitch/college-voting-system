
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api";

const POSITIONS = ["President", "Vice President", "Secretary"];

export default function CampusStudentVote() {
  const location = useLocation();
  const navigate = useNavigate();
  const campusToken = location.state?.campusToken;

  const [candidates, setCandidates] = useState([]);
  const [electionTitle, setElectionTitle] = useState(
    "College Student Council Election 2026"
  );
  const [selections, setSelections] = useState({
    President: "",
    "Vice President": "",
    Secretary: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCandidates() {
      if (!campusToken) {
        setError(
          "Campus authorization missing. Please return to the staff page and verify your register number again."
        );
        setLoading(false);
        return;
      }

      try {
        const response = await API.get("/campus/candidates", {
          headers: { "X-Campus-Token": campusToken },
        });

        if (cancelled) return;

        const data = response.data;
        setCandidates(Array.isArray(data.candidates) ? data.candidates : []);

        if (data.election_title) {
          setElectionTitle(data.election_title);
        } else if (data.election?.title) {
          setElectionTitle(data.election.title);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load candidates. Please verify authorization again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCandidates();

    return () => {
      cancelled = true;
    };
  }, [campusToken]);

  const chooseCandidate = (position, candidateId) => {
    setSelections((previous) => ({
      ...previous,
      [position]: String(candidateId),
    }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const missing = POSITIONS.filter((position) => !selections[position]);

    if (missing.length > 0) {
      setError(`Please select a candidate for: ${missing.join(", ")}.`);
      return;
    }

    const chosenIds = POSITIONS.map((position) =>
      Number(selections[position])
    );

    if (new Set(chosenIds).size !== POSITIONS.length) {
      setError("Please select a valid candidate for each position.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to submit your votes? You cannot change them after submission."
    );

    if (!confirmed) return;

    setSubmitting(true);

    try {
      await API.post(
        "/campus/vote",
        {
          votes: {
            President: Number(selections.President),
            "Vice President": Number(selections["Vice President"]),
            Secretary: Number(selections.Secretary),
          },
        },
        {
          headers: { "X-Campus-Token": campusToken },
        }
      );

      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Vote submission failed. Please contact the election staff."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const styles = {
    page: {
      minHeight: "100vh",
      padding: "32px 18px 50px",
      boxSizing: "border-box",
      background:
        "linear-gradient(135deg, #eef2ff 0%, #f8fafc 48%, #ecfeff 100%)",
      color: "#172033",
      fontFamily: "Inter, Arial, sans-serif",
    },
    container: {
      maxWidth: "1000px",
      margin: "0 auto",
    },
    hero: {
      padding: "32px",
      borderRadius: "22px",
      background: "linear-gradient(120deg, #172554, #4338ca)",
      color: "white",
      boxShadow: "0 12px 32px rgba(49,46,129,0.18)",
      marginBottom: "28px",
    },
    section: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "18px",
      padding: "24px",
      marginBottom: "24px",
      boxShadow: "0 5px 18px rgba(15,23,42,0.04)",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "16px",
      marginTop: "18px",
    },
    candidate: {
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      padding: "18px",
      border: "2px solid #e2e8f0",
      borderRadius: "14px",
      cursor: "pointer",
      background: "#ffffff",
      minWidth: 0,
      boxSizing: "border-box",
      transition: "border-color 0.15s ease",
    },
    selected: {
      border: "2px solid #4f46e5",
      background: "#eef2ff",
    },
    button: {
      width: "100%",
      padding: "15px 20px",
      border: "none",
      borderRadius: "12px",
      background: "#4338ca",
      color: "#ffffff",
      fontSize: "16px",
      fontWeight: 700,
      cursor: "pointer",
    },
    message: {
      padding: "14px 16px",
      marginBottom: "20px",
      borderRadius: "12px",
      background: "#fef2f2",
      color: "#991b1b",
      border: "1px solid #fecaca",
      lineHeight: 1.6,
    },
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.section}>
            <h2>Loading election candidates...</h2>
            <p>Please wait.</p>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main style={styles.page}>
        <div style={{ ...styles.container, maxWidth: "600px" }}>
          <section
            style={{
              ...styles.section,
              textAlign: "center",
              padding: "42px 26px",
            }}
          >
            <div style={{ fontSize: "58px" }}>✓</div>
            <h1 style={{ color: "#166534" }}>Vote Submitted!</h1>
            <p style={{ color: "#475569", lineHeight: 1.8 }}>
              Your selections have been submitted successfully. Thank you for
              participating in the campus election.
            </p>
            <button
              style={styles.button}
              onClick={() => navigate("/campus")}
            >
              Finish
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.hero}>
          <div style={{ fontSize: "13px", letterSpacing: "2px", opacity: 0.8 }}>
            CAMPUS ELECTION PORTAL
          </div>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 38px)", margin: "14px 0" }}>
            Student Campus Voting
          </h1>
          <h2 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 12px" }}>
            {electionTitle}
          </h2>
          <p style={{ margin: 0, lineHeight: 1.7, color: "#e0e7ff" }}>
            Choose one candidate for each position. Review your selections
            carefully before submitting.
          </p>
        </header>

        {error && (
          <div role="alert" style={styles.message}>
            <strong>Unable to continue</strong>
            <div>{error}</div>
          </div>
        )}

        {candidates.length === 0 ? (
          <section style={styles.section}>
            <h2>No candidates available</h2>
            <p>
              No candidates were returned for this election. Please contact the
              election administrator.
            </p>
          </section>
        ) : (
          <form onSubmit={handleSubmit}>
            {POSITIONS.map((position, index) => {
              const positionCandidates = candidates.filter(
                (candidate) =>
                  String(candidate.position || "")
                    .trim()
                    .toLowerCase() === position.toLowerCase()
              );

              return (
                <section key={position} style={styles.section}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        flexShrink: 0,
                        borderRadius: "12px",
                        display: "grid",
                        placeItems: "center",
                        background: "#eef2ff",
                        color: "#4338ca",
                        fontWeight: 800,
                        fontSize: "18px",
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "22px" }}>
                        {position}
                      </h2>
                      <p
                        style={{
                          margin: "5px 0 0",
                          color: "#64748b",
                          fontSize: "14px",
                        }}
                      >
                        Select one candidate
                      </p>
                    </div>
                  </div>

                  {positionCandidates.length === 0 ? (
                    <p style={{ color: "#b91c1c", marginTop: "20px" }}>
                      No candidates found for {position}. Please contact the
                      election administrator.
                    </p>
                  ) : (
                    <div style={styles.grid}>
                      {positionCandidates.map((candidate) => {
                        const id = String(candidate.id);
                        const selected = selections[position] === id;

                        return (
                          <label
                            key={candidate.id}
                            style={{
                              ...styles.candidate,
                              ...(selected ? styles.selected : {}),
                            }}
                          >
                            <input
                              type="radio"
                              name={`position-${position}`}
                              value={id}
                              checked={selected}
                              onChange={() =>
                                chooseCandidate(position, candidate.id)
                              }
                              style={{
                                width: "18px",
                                height: "18px",
                                marginTop: "3px",
                                flexShrink: 0,
                                accentColor: "#4f46e5",
                              }}
                            />

                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 750,
                                  fontSize: "17px",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {candidate.name}
                              </div>

                              <div
                                style={{
                                  color: "#4f46e5",
                                  fontSize: "13px",
                                  fontWeight: 650,
                                  marginTop: "5px",
                                }}
                              >
                                {candidate.position}
                              </div>

                              <div
                                style={{
                                  color: "#64748b",
                                  fontSize: "13px",
                                  marginTop: "8px",
                                }}
                              >
                                {candidate.department || "Department not specified"}
                              </div>

                              {candidate.manifesto && (
                                <p
                                  style={{
                                    color: "#475569",
                                    fontSize: "13px",
                                    lineHeight: 1.6,
                                    margin: "12px 0 0",
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  {candidate.manifesto}
                                </p>
                              )}

                              {selected && (
                                <div
                                  style={{
                                    color: "#4338ca",
                                    fontWeight: 700,
                                    fontSize: "12px",
                                    marginTop: "12px",
                                  }}
                                >
                                  ✓ SELECTED
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}

            <section style={styles.section}>
              <h2 style={{ marginTop: 0 }}>Review your vote</h2>
              {POSITIONS.map((position) => {
                const candidate = candidates.find(
                  (item) => String(item.id) === selections[position]
                );

                return (
                  <div
                    key={position}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "16px",
                      padding: "12px 0",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>{position}</span>
                    <strong style={{ textAlign: "right" }}>
                      {candidate?.name || "Not selected"}
                    </strong>
                  </div>
                );
              })}

              <p
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  lineHeight: 1.6,
                  margin: "18px 0",
                }}
              >
                Once submitted, your vote cannot be changed. Make sure each
                position has one selection.
              </p>

              <button
                type="submit"
                style={{
                  ...styles.button,
                  opacity: submitting ? 0.65 : 1,
                  cursor: submitting ? "wait" : "pointer",
                }}
                disabled={
                  submitting ||
                  POSITIONS.some((position) => !selections[position]) ||
                  POSITIONS.some(
                    (position) =>
                      !candidates.some(
                        (candidate) =>
                          String(candidate.id) === selections[position] &&
                          String(candidate.position || "")
                            .trim()
                            .toLowerCase() === position.toLowerCase()
                      )
                  )
                }
              >
                {submitting ? "Submitting votes..." : "Submit My Votes →"}
              </button>
            </section>
          </form>
        )}

        <footer
          style={{
            textAlign: "center",
            color: "#64748b",
            fontSize: "12px",
            padding: "12px",
          }}
        >
          Secure Campus Voting Portal
        </footer>
      </div>
    </main>
  );
}
