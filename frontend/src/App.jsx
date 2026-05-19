import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [user, setUser] = useState(null);
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [loginData, setLoginData] = useState({ email: "", haslo: "" });
  const [reservation, setReservation] = useState({ dataOd: "", dataDo: "" });
  const [message, setMessage] = useState("");
  const [newSpot, setNewSpot] = useState({
    numer: "",
    poziom: 0,
    typ: "STANDARD",
  });

  const fetchSpots = async () => {
    try {
      const res = await fetch(`${API_URL}/api/spots`);
      const data = await res.json();
      setSpots(data);
    } catch {
      setMessage("Błąd pobierania miejsc parkingowych");
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setMessage("");

    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message || "Błąd logowania");
      return;
    }

    setUser(data.user);
    setSelectedSpot(null);
    setMessage("");
  };

  const logout = () => {
    setUser(null);
    setSelectedSpot(null);
    setMessage("");
  };

  const reserveSpot = async () => {
    if (!selectedSpot || !reservation.dataOd || !reservation.dataDo) {
      setMessage("Uzupełnij datę rozpoczęcia i zakończenia rezerwacji");
      return;
    }

    const res = await fetch(`${API_URL}/api/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        parkingSpotId: selectedSpot.id,
        dataOd: reservation.dataOd,
        dataDo: reservation.dataDo,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message || "Nie udało się utworzyć rezerwacji");
      return;
    }

    setMessage("Rezerwacja została utworzona");
    setSelectedSpot(null);
    setReservation({ dataOd: "", dataDo: "" });
    fetchSpots();
  };

  const addSpot = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_URL}/api/spots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSpot),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message || "Nie udało się dodać miejsca");
      return;
    }

    setNewSpot({ numer: "", poziom: 0, typ: "STANDARD" });
    setMessage("Dodano nowe miejsce parkingowe");
    fetchSpots();
  };

  const updateSpot = async (spot, changes) => {
    const res = await fetch(`${API_URL}/api/spots/${spot.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: changes.status ?? spot.status,
        typ: changes.typ ?? spot.typ,
      }),
    });

    if (!res.ok) {
      setMessage("Nie udało się zaktualizować miejsca");
      return;
    }

    setMessage("Zaktualizowano miejsce parkingowe");
    fetchSpots();
  };

  const deleteSpot = async (id) => {
    const res = await fetch(`${API_URL}/api/spots/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setMessage("Nie udało się usunąć miejsca");
      return;
    }

    setMessage("Usunięto miejsce parkingowe");
    fetchSpots();
  };

  const getStatusClass = (status) => {
    if (status === "WOLNY") return "free";
    if (status === "ZAJETY") return "occupied";
    if (status === "ZAREZERWOWANY") return "reserved";
    return "free";
  };

  const getStatusLabel = (status) => {
    if (status === "WOLNY") return "Wolne";
    if (status === "ZAJETY") return "Zajęte";
    if (status === "ZAREZERWOWANY") return "Zarezerwowane";
    return status;
  };

  const getTypLabel = (typ) => {
    if (typ === "STANDARD") return "Standardowe";
    if (typ === "DLA_PROWADZACEGO") return "Dla prowadzącego";
    if (typ === "NIEPELNOSPRAWNY") return "Dla osób z niepełnosprawnością";
    return typ;
  };

  const canReserve = (spot) => {
    if (!user || !spot) return false;
    if (spot.status !== "WOLNY") return false;
    if (spot.typ === "DLA_PROWADZACEGO" && user.rola === "STUDENT") return false;
    return true;
  };

  const visibleSpots = spots.filter((spot) => {
    if (!user) return false;
    if (user.rola === "STUDENT") return spot.typ !== "DLA_PROWADZACEGO";
    return true;
  });

  const wolne = visibleSpots.filter((s) => s.status === "WOLNY").length;
  const zajete = visibleSpots.filter((s) => s.status === "ZAJETY").length;
  const zarezerwowane = visibleSpots.filter(
    (s) => s.status === "ZAREZERWOWANY"
  ).length;

  if (!user) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={login}>
          <h1>Parking WSPA</h1>
          <p>System rezerwacji parkingu uczelnianego</p>

          <input
            type="email"
            placeholder="Email"
            value={loginData.email}
            onChange={(e) =>
              setLoginData({ ...loginData, email: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Hasło"
            value={loginData.haslo}
            onChange={(e) =>
              setLoginData({ ...loginData, haslo: e.target.value })
            }
          />

          <button type="submit">Zaloguj się</button>

          <div className="test-users">
            <strong>Dane testowe:</strong>
            <span>Admin: admin@wspa.pl / admin123</span>
            <span>Student: student@wspa.pl / student123</span>
            <span>Prowadzący: teacher@wspa.pl / teacher123</span>
          </div>

          {message && <p className="message">{message}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Parking WSPA</h1>
          <p>System zarządzania parkingiem uczelnianym</p>
        </div>

        <div className="user-box">
          <strong>{user.imie}</strong>
          <span>{user.rola}</span>
          <button onClick={logout}>Wyloguj</button>
        </div>
      </header>

      <section className="stats">
        <div>
          <span>Widoczne miejsca</span>
          <strong>{visibleSpots.length}</strong>
        </div>
        <div>
          <span>Wolne</span>
          <strong>{wolne}</strong>
        </div>
        <div>
          <span>Zajęte</span>
          <strong>{zajete}</strong>
        </div>
        <div>
          <span>Zarezerwowane</span>
          <strong>{zarezerwowane}</strong>
        </div>
      </section>

      <main className="layout">
        <section className="map-panel">
          <h2>Mapa parkingu WSPA</h2>

          <div className="parking-map">
            <div className="road top">WJAZD</div>
            <div className="building">WSPA</div>
            <div className="road bottom">WYJAZD</div>

            <div className="spots-row row-top">
              {visibleSpots.slice(0, 10).map((spot) => (
                <button
                  key={spot.id}
                  className={`spot ${getStatusClass(spot.status)} ${
                    spot.typ === "DLA_PROWADZACEGO" ? "teacher" : ""
                  }`}
                  onClick={() => setSelectedSpot(spot)}
                >
                  <strong>{spot.numer}</strong>
                  <span>{getStatusLabel(spot.status)}</span>
                </button>
              ))}
            </div>

            <div className="spots-row row-bottom">
              {visibleSpots.slice(10, 20).map((spot) => (
                <button
                  key={spot.id}
                  className={`spot ${getStatusClass(spot.status)} ${
                    spot.typ === "DLA_PROWADZACEGO" ? "teacher" : ""
                  }`}
                  onClick={() => setSelectedSpot(spot)}
                >
                  <strong>{spot.numer}</strong>
                  <span>{getStatusLabel(spot.status)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="legend">
            <span><b className="dot free"></b> Wolne</span>
            <span><b className="dot occupied"></b> Zajęte</span>
            <span><b className="dot reserved"></b> Zarezerwowane</span>
            <span><b className="dot teacher"></b> Dla prowadzących</span>
          </div>
        </section>

        <aside className="details-panel">
          <h2>Szczegóły miejsca</h2>

          {selectedSpot ? (
            <div className="details-card">
              <h3>{selectedSpot.numer}</h3>
              <p><strong>Status:</strong> {getStatusLabel(selectedSpot.status)}</p>
              <p><strong>Typ:</strong> {getTypLabel(selectedSpot.typ)}</p>
              <p><strong>Poziom:</strong> {selectedSpot.poziom}</p>

              {canReserve(selectedSpot) ? (
                <>
                  <label>Data od:</label>
                  <input
                    type="datetime-local"
                    value={reservation.dataOd}
                    onChange={(e) =>
                      setReservation({ ...reservation, dataOd: e.target.value })
                    }
                  />

                  <label>Data do:</label>
                  <input
                    type="datetime-local"
                    value={reservation.dataDo}
                    onChange={(e) =>
                      setReservation({ ...reservation, dataDo: e.target.value })
                    }
                  />

                  <button className="reserve-btn" onClick={reserveSpot}>
                    Zarezerwuj miejsce
                  </button>
                </>
              ) : (
                <p className="blocked">
                  Nie możesz zarezerwować tego miejsca.
                </p>
              )}
            </div>
          ) : (
            <p className="empty">Kliknij miejsce na mapie parkingu.</p>
          )}

          {message && <p className="message">{message}</p>}
        </aside>
      </main>

      {user.rola === "ADMIN" && (
        <section className="admin-panel">
          <h2>Panel administratora — zarządzanie miejscami</h2>

          <form className="admin-form" onSubmit={addSpot}>
            <input
              placeholder="Numer miejsca, np. A-21"
              value={newSpot.numer}
              onChange={(e) =>
                setNewSpot({ ...newSpot, numer: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Poziom"
              value={newSpot.poziom}
              onChange={(e) =>
                setNewSpot({ ...newSpot, poziom: e.target.value })
              }
            />

            <select
              value={newSpot.typ}
              onChange={(e) => setNewSpot({ ...newSpot, typ: e.target.value })}
            >
              <option value="STANDARD">Standardowe</option>
              <option value="DLA_PROWADZACEGO">Dla prowadzącego</option>
              <option value="NIEPELNOSPRAWNY">Dla osób z niepełnosprawnością</option>
            </select>

            <button type="submit">Dodaj miejsce</button>
          </form>

          <div className="admin-list">
            {spots.map((spot) => (
              <div className="admin-row" key={spot.id}>
                <strong>{spot.numer}</strong>

                <select
                  value={spot.status}
                  onChange={(e) =>
                    updateSpot(spot, { status: e.target.value })
                  }
                >
                  <option value="WOLNY">Wolne</option>
                  <option value="ZAJETY">Zajęte</option>
                  <option value="ZAREZERWOWANY">Zarezerwowane</option>
                </select>

                <select
                  value={spot.typ}
                  onChange={(e) => updateSpot(spot, { typ: e.target.value })}
                >
                  <option value="STANDARD">Standardowe</option>
                  <option value="DLA_PROWADZACEGO">Dla prowadzącego</option>
                  <option value="NIEPELNOSPRAWNY">Dla osób z niepełnosprawnością</option>
                </select>

                <button className="delete-btn" onClick={() => deleteSpot(spot.id)}>
                  Usuń
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;