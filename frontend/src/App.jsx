import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [user, setUser] = useState(null);
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  const [loginData, setLoginData] = useState({ email: "", haslo: "" });
  const [reservation, setReservation] = useState({ dataOd: "", dataDo: "" });
  const [message, setMessage] = useState("");
  const [newSpot, setNewSpot] = useState({
    numer: "",
    poziom: 0,
    typ: "STANDARD",
  });

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 4500);
  };

  const fetchSpots = async () => {
    try {
      const res = await fetch(`${API_URL}/api/spots`);
      const data = await res.json();
      setSpots(Array.isArray(data) ? data : []);
    } catch {
      showMessage("Błąd pobierania miejsc parkingowych");
    }
  };

  const fetchUserReservations = async (userId) => {
    if (!userId) return;

    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/reservations`);
      const data = await res.json();
      setReservations(Array.isArray(data) ? data : []);
    } catch {
      showMessage("Błąd pobierania Twoich rezerwacji");
    }
  };

  const fetchAllReservations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reservations`);
      const data = await res.json();
      setAllReservations(Array.isArray(data) ? data : []);
    } catch {
      showMessage("Błąd pobierania rezerwacji administratora");
    }
  };

  const refreshData = async (currentUser = user) => {
    await fetchSpots();

    if (currentUser) {
      await fetchUserReservations(currentUser.id);

      if (currentUser.rola === "ADMIN") {
        await fetchAllReservations();
      }
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  useEffect(() => {
    if (user) {
      refreshData(user);
    }
  }, [user]);

  const login = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || "Błąd logowania");
        return;
      }

      setUser(data.user);
      setSelectedSpot(null);
      setReservation({ dataOd: "", dataDo: "" });
    } catch {
      showMessage("Nie można połączyć się z backendem");
    }
  };

  const logout = () => {
    setUser(null);
    setSelectedSpot(null);
    setReservations([]);
    setAllReservations([]);
    setMessage("");
  };

  const addSpot = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/api/spots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSpot),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || "Nie udało się dodać miejsca");
        return;
      }

      setNewSpot({ numer: "", poziom: 0, typ: "STANDARD" });
      showMessage("Dodano nowe miejsce parkingowe");
      refreshData();
    } catch {
      showMessage("Błąd dodawania miejsca");
    }
  };

  const updateSpot = async (spot, changes) => {
    try {
      const res = await fetch(`${API_URL}/api/spots/${spot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: changes.status ?? spot.status,
          typ: changes.typ ?? spot.typ,
          numer: changes.numer ?? spot.numer,
          poziom: changes.poziom ?? spot.poziom,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || "Nie udało się zaktualizować miejsca");
        return;
      }

      showMessage("Zaktualizowano miejsce parkingowe");
      refreshData();
    } catch {
      showMessage("Błąd aktualizacji miejsca");
    }
  };

  const deleteSpot = async (id) => {
    const confirmed = window.confirm(
      "Czy na pewno chcesz usunąć miejsce parkingowe? Usunięte zostaną też jego rezerwacje."
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/api/spots/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || "Nie udało się usunąć miejsca");
        return;
      }

      if (selectedSpot?.id === id) {
        setSelectedSpot(null);
      }

      showMessage("Usunięto miejsce parkingowe");
      refreshData();
    } catch {
      showMessage("Błąd usuwania miejsca");
    }
  };

  const reserveSpot = async () => {
    if (!selectedSpot || !reservation.dataOd || !reservation.dataDo) {
      showMessage("Uzupełnij datę rozpoczęcia i zakończenia rezerwacji");
      return;
    }

    try {
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
        showMessage(data.message || "Nie udało się utworzyć rezerwacji");
        return;
      }

      showMessage("Rezerwacja została utworzona");
      setSelectedSpot(null);
      setReservation({ dataOd: "", dataDo: "" });
      refreshData();
    } catch {
      showMessage("Błąd tworzenia rezerwacji");
    }
  };

  const cancelReservation = async (reservationId) => {
    const confirmed = window.confirm("Czy na pewno anulować tę rezerwację?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/api/reservations/${reservationId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || "Nie udało się anulować rezerwacji");
        return;
      }

      showMessage("Rezerwacja została anulowana");
      refreshData();
    } catch {
      showMessage("Błąd anulowania rezerwacji");
    }
  };

  const getTypLabel = (typ) => {
    if (typ === "STANDARD") return "Standardowe";
    if (typ === "DLA_PROWADZACEGO") return "Dla prowadzącego";
    if (typ === "NIEPELNOSPRAWNY") return "Dla osób z niepełnosprawnością";
    return typ;
  };

  const getBaseStatusLabel = (status) => {
    if (status === "WOLNY") return "Wolne";
    if (status === "ZAJETY") return "Zajęte";
    if (status === "ZAREZERWOWANY") return "Zarezerwowane";
    return status;
  };

  const now = new Date();

  const hasActiveReservation = (spot) => {
    return Array.isArray(spot.reservations)
      ? spot.reservations.some((r) => new Date(r.dataDo) > now)
      : false;
  };

  const getDisplayStatus = (spot) => {
    if (spot.status === "ZAJETY") return "ZAJETY";
    if (hasActiveReservation(spot)) return "ZAREZERWOWANY";
    return "WOLNY";
  };

  const getStatusClass = (spot) => {
    const status = typeof spot === "string" ? spot : getDisplayStatus(spot);

    if (status === "WOLNY") return "free";
    if (status === "ZAJETY") return "occupied";
    if (status === "ZAREZERWOWANY") return "reserved";
    return "free";
  };

  const getStatusLabel = (spot) => {
    const status = typeof spot === "string" ? spot : getDisplayStatus(spot);
    return getBaseStatusLabel(status);
  };

  const canReserve = (spot) => {
    if (!user || !spot) return false;
    if (user.rola === "ADMIN") return false;
    if (spot.status === "ZAJETY") return false;
    if (spot.typ === "DLA_PROWADZACEGO" && user.rola === "STUDENT") return false;
    return true;
  };

  const visibleSpots = useMemo(() => {
    if (!user) return [];

    if (user.rola === "STUDENT") {
      return spots.filter((spot) => spot.typ !== "DLA_PROWADZACEGO");
    }

    return spots;
  }, [spots, user]);

  const wolne = visibleSpots.filter((s) => getDisplayStatus(s) === "WOLNY").length;
  const zajete = visibleSpots.filter((s) => getDisplayStatus(s) === "ZAJETY").length;
  const zarezerwowane = visibleSpots.filter(
    (s) => getDisplayStatus(s) === "ZAREZERWOWANY"
  ).length;

  const formatDate = (value) => {
    return new Date(value).toLocaleString("pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const firstHalf = visibleSpots.slice(0, Math.ceil(visibleSpots.length / 2));
  const secondHalf = visibleSpots.slice(Math.ceil(visibleSpots.length / 2));

  if (!user) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={login}>
          <h1>Parking WSPA</h1>
          <p>System rezerwacji parkingu uczelnianego WSPA</p>

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
            <span>Administrator: admin@wspa.pl / admin123</span>
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
          <p>System zarządzania parkingiem uczelnianym WSPA</p>
        </div>

        <div className="user-box">
          <strong>{user.imie}</strong>
          <span>{user.rola}</span>
          <button onClick={logout}>Wyloguj</button>
        </div>
      </header>

      {message && <div className="toast">{message}</div>}

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

            <div className="spots-row row-top">
              {firstHalf.map((spot) => (
                <button
                  key={spot.id}
                  className={`spot ${getStatusClass(spot)} ${
                    spot.typ === "DLA_PROWADZACEGO" ? "teacher" : ""
                  }`}
                  onClick={() => setSelectedSpot(spot)}
                >
                  <strong>{spot.numer}</strong>
                  <span>{getStatusLabel(spot)}</span>
                </button>
              ))}
            </div>

            <div className="building">WSPA</div>

            <div className="spots-row row-bottom">
              {secondHalf.map((spot) => (
                <button
                  key={spot.id}
                  className={`spot ${getStatusClass(spot)} ${
                    spot.typ === "DLA_PROWADZACEGO" ? "teacher" : ""
                  }`}
                  onClick={() => setSelectedSpot(spot)}
                >
                  <strong>{spot.numer}</strong>
                  <span>{getStatusLabel(spot)}</span>
                </button>
              ))}
            </div>

            <div className="road bottom">WYJAZD</div>
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
              <p><strong>Status:</strong> {getStatusLabel(selectedSpot)}</p>
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
                  Rezerwacja tego miejsca nie jest dostępna dla Twojej roli lub statusu miejsca.
                </p>
              )}
            </div>
          ) : (
            <p className="empty">Kliknij miejsce na mapie parkingu.</p>
          )}
        </aside>
      </main>

      <section className="reservations-panel">
        <h2>Moje rezerwacje</h2>

        {reservations.length === 0 ? (
          <p className="empty">Brak rezerwacji.</p>
        ) : (
          <div className="reservation-list">
            {reservations.map((item) => (
              <div className="reservation-card" key={item.id}>
                <div>
                  <strong>{item.parkingSpot?.numer}</strong>
                  <span>{getTypLabel(item.parkingSpot?.typ)}</span>
                </div>

                <p><b>Od:</b> {formatDate(item.dataOd)}</p>
                <p><b>Do:</b> {formatDate(item.dataDo)}</p>

                <button
                  className="delete-btn"
                  onClick={() => cancelReservation(item.id)}
                >
                  Anuluj
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {user.rola === "ADMIN" && (
        <>
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

                  <button
                    className="delete-btn"
                    onClick={() => deleteSpot(spot.id)}
                  >
                    Usuń miejsce
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <h2>Panel administratora — wszystkie rezerwacje</h2>

            {allReservations.length === 0 ? (
              <p className="empty">Brak rezerwacji w systemie.</p>
            ) : (
              <div className="reservation-list">
                {allReservations.map((item) => (
                  <div className="reservation-card admin-reservation" key={item.id}>
                    <div>
                      <strong>{item.parkingSpot?.numer}</strong>
                      <span>{item.user?.imie} — {item.user?.email}</span>
                    </div>

                    <p><b>Od:</b> {formatDate(item.dataOd)}</p>
                    <p><b>Do:</b> {formatDate(item.dataDo)}</p>

                    <button
                      className="delete-btn"
                      onClick={() => cancelReservation(item.id)}
                    >
                      Anuluj rezerwację
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default App;
