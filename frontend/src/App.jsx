import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const {
    loginWithRedirect,
    logout,
    isAuthenticated,
    getAccessTokenSilently,
    user,
    isLoading,
  } = useAuth0();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(false);

  const loadComfortData = async () => {
    try {
      setError("");
      setLoadingData(true);

      const token = await getAccessTokenSilently();

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/weather/comfort`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }

      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadComfortData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (isLoading) {
    return <div className="page">Loading...</div>;
  }

  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <div>
            <h2 style={{ margin: 0 }}>Weather Comfort Dashboard</h2>
            <p style={{ margin: "6px 0 0", color: "#555" }}>
              Ranked cities based on backend-computed Comfort Index.
            </p>
          </div>

          <div className="actions">
            {!isAuthenticated ? (
              <button className="btnPrimary" onClick={() => loginWithRedirect()}>
                Log In
              </button>
            ) : (
              <>
                <div className="userBox">
                  <div style={{ fontSize: 12, color: "#666" }}>Logged in</div>
                  <div style={{ fontWeight: 600 }}>
                    {user?.email || user?.name}
                  </div>
                </div>

                <button className="btn" onClick={loadComfortData} disabled={loadingData}>
                  {loadingData ? "Loading..." : "Refresh"}
                </button>

                <button
                  className="btnDanger"
                  onClick={() =>
                    logout({ logoutParams: { returnTo: window.location.origin } })
                  }
                >
                  Log Out
                </button>
              </>
            )}
          </div>
        </header>

        {error && <pre className="error">{error}</pre>}

        {isAuthenticated && data && (
          <>
            <div className="meta">
              <div><b>Total Cities:</b> {data.totalCities}</div>
              <div>
                <b>Generated:</b>{" "}
                {new Date(data.generatedAt).toLocaleString()}
              </div>
            </div>

            {/* Desktop table */}
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">Rank</th>
                    <th className="th">City</th>
                    <th className="th">Weather</th>
                    <th className="thRight">Temp (°C)</th>
                    <th className="thRight">Humidity (%)</th>
                    <th className="thRight">Wind (m/s)</th>
                    <th className="thRight">Comfort</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cities.map((c) => (
                    <tr key={c.cityId}>
                      <td className="td">{c.rank}</td>
                      <td className="tdStrong">{c.cityName}</td>
                      <td className="td">{c.description}</td>
                      <td className="tdRight">{c.tempC}</td>
                      <td className="tdRight">{c.humidity}</td>
                      <td className="tdRight">{c.windSpeed}</td>
                      <td className="tdRight">
                        <span style={badgeStyle(c.comfortScore)}>
                          {c.comfortScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="cards">
              {data.cities.map((c) => (
                <div key={c.cityId} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div className="label">Rank</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>#{c.rank}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="label">Comfort</div>
                      <span style={badgeStyle(c.comfortScore)}>
                        {c.comfortScore}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, fontWeight: 700, fontSize: 16 }}>
                    {c.cityName}
                  </div>
                  <div style={{ color: "#555", marginTop: 4 }}>
                    {c.description}
                  </div>

                  <div className="cardGrid">
                    <div>
                      <div className="label">Temp</div>
                      <div className="value">{c.tempC} °C</div>
                    </div>
                    <div>
                      <div className="label">Humidity</div>
                      <div className="value">{c.humidity}%</div>
                    </div>
                    <div>
                      <div className="label">Wind</div>
                      <div className="value">{c.windSpeed} m/s</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!isAuthenticated && (
          <div className="note">
            Please log in to view the Comfort Index dashboard.
          </div>
        )}
      </div>
    </div>
  );
}

function badgeStyle(score) {
  let bg = "#fff1f1";
  if (score >= 75) bg = "#e8fff1";
  else if (score >= 60) bg = "#fff7e6";

  return {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 700,
    background: bg,
    border: "1px solid #eee",
    minWidth: 44,
    textAlign: "center",
  };
}
