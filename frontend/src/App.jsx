// frontend/src/App.jsx
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import TempChart from "./components/TempChart";

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

  // Bonus: sorting / filtering
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("rank"); // rank | comfort | temp
  const [sortDir, setSortDir] = useState("asc"); // asc | desc

  // Dark mode (persisted)
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  // Bonus: graph
  const [selectedCity, setSelectedCity] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const loadComfortData = async () => {
    try {
      setError("");
      setLoadingData(true);

      const token = await getAccessTokenSilently();

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/weather/comfort`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error(await res.text());

      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingData(false);
    }
  };

  const loadForecast = async (city) => {
    try {
      setError("");
      setSelectedCity(city);
      setForecast(null);
      setLoadingForecast(true);

      const token = await getAccessTokenSilently();

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/weather/forecast/${city.cityId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error(await res.text());

      const json = await res.json();
      setForecast(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingForecast(false);
    }
  };

  const filteredSortedCities = useMemo(() => {
    if (!data?.cities) return [];
    let list = [...data.cities];

    // Filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => c.cityName.toLowerCase().includes(q));
    }

    // Sort
    const factor = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortBy === "rank") return (a.rank - b.rank) * factor;
      if (sortBy === "comfort") return (a.comfortScore - b.comfortScore) * factor;
      if (sortBy === "temp") return (a.tempC - b.tempC) * factor;
      return 0;
    });

    return list;
  }, [data, search, sortBy, sortDir]);

  useEffect(() => {
    if (isAuthenticated) loadComfortData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (isLoading) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <div className="headerTitle">
            <h2 style={{ margin: 0 }}>Weather Comfort Dashboard</h2>
            <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
              Ranked cities based on backend-computed Comfort Index.
            </p>
          </div>

          <div className="actions">
            {!isAuthenticated ? (
              <>
                <button className="btnPrimary" onClick={() => loginWithRedirect()}>
                  Log In
                </button>
                <ThemeToggle theme={theme} setTheme={setTheme} />
              </>
            ) : (
              <>
                <div className="userBox">
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Logged in</div>
                  <div style={{ fontWeight: 600 }}>{user?.email || user?.name}</div>
                </div>

                <button className="btn" onClick={loadComfortData} disabled={loadingData}>
                  {loadingData ? "Loading..." : "🔄 Refresh"}
                </button>

                <button
                  className="btnDanger"
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                >
                  🚪 Log Out
                </button>

                <ThemeToggle theme={theme} setTheme={setTheme} />
              </>
            )}
          </div>
        </header>

        {error && <pre className="error">{error}</pre>}

        {!isAuthenticated && (
          <div className="note">Please log in to view the Comfort Index dashboard.</div>
        )}

        {isAuthenticated && data && (
          <>
            <div className="meta">
              <div>
                <b>Total Cities:</b> {data.totalCities}
              </div>
              <div>
                <b>Generated:</b> {new Date(data.generatedAt).toLocaleString()}
              </div>
            </div>

            {/* Sorting / Filtering */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city..."
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  minWidth: 220,
                  background: "var(--card)",
                  color: "var(--text)",
                }}
              />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--text)",
                }}
              >
                <option value="rank">Sort by Rank</option>
                <option value="comfort">Sort by Comfort</option>
                <option value="temp">Sort by Temperature</option>
              </select>

              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--text)",
                }}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
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
                  {filteredSortedCities.map((c) => (
                    <tr key={c.cityId}>
                      <td className="td">{c.rank}</td>

                      <td className="tdStrong">
                        {c.cityName}
                        <div style={{ marginTop: 6 }}>
                          <button className="btn" onClick={() => loadForecast(c)}>
                            {loadingForecast && selectedCity?.cityId === c.cityId
                              ? "Loading..."
                              : "📈 View Trend"}
                          </button>
                        </div>
                      </td>

                      <td className="td">{c.description}</td>
                      <td className="tdRight">{c.tempC}</td>
                      <td className="tdRight">{c.humidity}</td>
                      <td className="tdRight">{c.windSpeed}</td>
                      <td className="tdRight">
                        <span style={badgeStyle(c.comfortScore)}>{c.comfortScore}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="cards">
              {filteredSortedCities.map((c) => (
                <div key={c.cityId} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div className="label">Rank</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>#{c.rank}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="label">Comfort</div>
                      <span style={badgeStyle(c.comfortScore)}>{c.comfortScore}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, fontWeight: 700, fontSize: 16 }}>
                    {c.cityName}
                  </div>
                  <div style={{ color: "var(--muted)", marginTop: 4 }}>{c.description}</div>

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

                  <div style={{ marginTop: 12 }}>
                    <button className="btn" onClick={() => loadForecast(c)}>
                      {loadingForecast && selectedCity?.cityId === c.cityId
                        ? "Loading..."
                        : "📈 View Trend"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart section */}
            {selectedCity && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ marginBottom: 10 }}>
                  Temperature Trend – {selectedCity.cityName}
                </h3>

                {loadingForecast && <div>Loading forecast...</div>}

                {forecast?.points && (
                  <div className="tableWrap" style={{ padding: 12 }}>
                    <TempChart cityName={selectedCity.cityName} points={forecast.points} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ThemeToggle({ theme, setTheme }) {
  const isDark = theme === "dark";

  return (
    <button
      className="themeToggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title="Toggle theme"
      aria-label="Toggle theme"
      type="button"
    >
      <span className="themeToggleText">{isDark ? "NIGHT MODE" : "DAY MODE"}</span>

      <span className="themeToggleTrack">
        <span className="themeToggleKnob">
          <span className="themeToggleIcon">{isDark ? "🌙" : "☀️"}</span>
        </span>
      </span>
    </button>
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
    border: "1px solid var(--border)",
    minWidth: 44,
    textAlign: "center",
    color: "var(--badgeText)",
  };
}
