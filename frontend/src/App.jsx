import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";
const EMPTY_RESERVATION = {
  dataOd: "",
  dataDo: "",
  numerRejestracyjny: "",
};

function App() {
  const [user, setUser] = useState(null);
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [loginData, setLoginData] = useState({ email: "", haslo: "" });
  const [reservation, setReservation] = useState(EMPTY_RESERVATION);
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

  const fetchAdminStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`);
      const data = await res.json();
      setAdminStats(data);
    } catch {
      showMessage("Błąd pobierania statystyk administratora");
    }
  };

  const refreshData = async (currentUser = user) => {
    await fetchSpots();

    if (currentUser) {
      await fetchUserReservations(currentUser.id);

      if (currentUser.rola === "ADMIN") {
        await fetchAllReservations();
        await fetchAdminStats();
      }
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  useEffect(() => {
    if (user) {
      refreshData(user);
      const interval = setInterval(() => {
        refreshData(user);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const login = async (e) => {
    e.preventDefault();

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
      setReservation(EMPTY_RESERVATION);
    } catch {
      showMessage("Nie można połączyć się z backendem");
    }
  };

  const logout = () => {
    setUser(null);
    setSelectedSpot(null);
    setReservations([]);
    setAllReservations([]);
    setAdminStats(null);
    setReservation(EMPTY_RESERVATION);
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
    if (!window.confirm("Usunąć miejsce parkingowe razem z jego rezerwacjami?")) return;

    try {
      const res = await fetch(`${API_URL}/api/spots/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || "Nie udało się usunąć miejsca");
        return;
      }

      if (selectedSpot?.id === id) setSelectedSpot(null);

      showMessage("Usunięto miejsce parkingowe");
      refreshData();
    } catch {
      showMessage("Błąd usuwania miejsca");
    }
  };

  const reserveSpot = async () => {
    if (!selectedSpot || !reservation.dataOd || !reservation.dataDo || !reservation.numerRejestracyjny) {
      showMessage("Uzupełnij daty oraz numer rejestracyjny pojazdu");
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
          numerRejestracyjny: reservation.numerRejestracyjny,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || "Nie udało się utworzyć rezerwacji");
        return;
      }

      showMessage("Rezerwacja została utworzona");
      setSelectedSpot(null);
      setReservation(EMPTY_RESERVATION);
      refreshData();
    } catch {
      showMessage("Błąd tworzenia rezerwacji");
    }
  };

  const cancelReservation = async (id) => {
    if (!window.confirm("Anulować tę rezerwację?")) return;

    try {
      const res = await fetch(`${API_URL}/api/reservations/${id}`, { method: "DELETE" });
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
    return typ;
  };

  const getCurrentReservation = (spot) => {
    if (!Array.isArray(spot.reservations)) return null;

    const currentTime = new Date();

    return (
      spot.reservations.find((reservationItem) => {
        const start = new Date(reservationItem.dataOd);
        const end = new Date(reservationItem.dataDo);
        return start <= currentTime && end > currentTime;
      }) || null
    );
  };

  const getFutureReservation = (spot) => {
    if (!Array.isArray(spot.reservations)) return null;

    const currentTime = new Date();

    return (
      spot.reservations
        .filter((reservationItem) => new Date(reservationItem.dataOd) > currentTime)
        .sort((a, b) => new Date(a.dataOd) - new Date(b.dataOd))[0] || null
    );
  };

  const getRelevantReservation = (spot) => {
    return getCurrentReservation(spot) || getFutureReservation(spot);
  };

  const getDisplayStatus = (spot) => {
    if (spot.status === "ZAJETY") return "ZAJETY";
    if (getCurrentReservation(spot)) return "ZAJETY";
    if (getFutureReservation(spot)) return "ZAREZERWOWANY";
    return "WOLNY";
  };

  const getStatusLabel = (spot) => {
    const status = getDisplayStatus(spot);
    return {
      WOLNY: "Wolne",
      ZAJETY: "Zajęte",
      ZAREZERWOWANY: "Zarezerwowane",
    }[status] || status;
  };

  const getStatusClass = (spot) => {
    const status = getDisplayStatus(spot);
    return {
      WOLNY: "free",
      ZAJETY: "occupied",
      ZAREZERWOWANY: "reserved",
    }[status] || "free";
  };

  const canReserve = (spot) => {
    if (!user || !spot || user.rola === "ADMIN") return false;
    if (spot.status === "ZAJETY") return false;
    if (getCurrentReservation(spot)) return false;
    if (spot.typ === "DLA_PROWADZACEGO" && user.rola === "STUDENT") return false;
    return true;
  };

  const visibleSpots = useMemo(() => {
    if (!user) return [];
    return spots;
  }, [spots, user]);

  const row1 = visibleSpots.slice(0, 5);
  const row2 = visibleSpots.slice(5, 10);
  const row3 = visibleSpots.slice(10, 15);
  const row4 = visibleSpots.slice(15, 20);

  const wolne = visibleSpots.filter((s) => getDisplayStatus(s) === "WOLNY").length;
  const zajete = visibleSpots.filter((s) => getDisplayStatus(s) === "ZAJETY").length;
  const zarezerwowane = visibleSpots.filter((s) => getDisplayStatus(s) === "ZAREZERWOWANY").length;

  const formatDate = (value) => new Date(value).toLocaleString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formatShortDate = (value) => new Date(value).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formatHours = (value) => `${Number(value || 0).toFixed(1)} h`;

  const getMinReservationDate = () => new Date().toISOString().slice(0, 16);

  const getMaxReservationDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().slice(0, 16);
  };

  const renderReservationTime = (spot) => {
    const reservationItem = getRelevantReservation(spot);

    if (!reservationItem) return null;

    return (
      <em>
        {formatShortDate(reservationItem.dataOd)} - {formatShortDate(reservationItem.dataDo)}
      </em>
    );
  };

  const renderSpotButton = (spot) => (
    <button
      key={spot.id}
      className={`parking-place ${getStatusClass(spot)} ${spot.typ === "DLA_PROWADZACEGO" ? "teacher" : ""}`}
      onClick={() => setSelectedSpot(spot)}
      title={spot.typ === "DLA_PROWADZACEGO" ? "Miejsce dla prowadzących" : "Miejsce standardowe"}
    >
      <strong>{spot.numer}</strong>
      <span>{getStatusLabel(spot)}</span>
      {renderReservationTime(spot)}
      {spot.typ === "DLA_PROWADZACEGO" && <small>Prowadzący</small>}
    </button>
  );

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
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Hasło"
            value={loginData.haslo}
            onChange={(e) => setLoginData({ ...loginData, haslo: e.target.value })}
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
          <h1>Parking WSPA </h1>
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
        <div><span>Widoczne miejsca</span><strong>{visibleSpots.length}</strong></div>
        <div><span>Wolne</span><strong>{wolne}</strong></div>
        <div><span>Zajęte</span><strong>{zajete}</strong></div>
        <div><span>Zarezerwowane</span><strong>{zarezerwowane}</strong></div>
      </section>

      <main className="layout">
        <section className="map-panel">
          <h2>Mapa parkingu WSPA</h2>

          <div className="realistic-map">
            <div className="building-new">BUDYNEK WSPA</div>

            <div className="parking-row row-a">{row1.map(renderSpotButton)}</div>

            <div className="road-road road-entry">
              <span className="road-label">WJAZD →</span>
            </div>

            <div className="parking-row row-b">{row2.map(renderSpotButton)}</div>

            <div className="road-turn">
              <span className="arrow-down">↓</span>
            </div>

            <div className="parking-row row-c">{row3.map(renderSpotButton)}</div>

            <div className="road-road road-exit">
              <span className="road-label">← WYJAZD</span>
            </div>

            <div className="parking-row row-d">{row4.map(renderSpotButton)}</div>
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

              {getRelevantReservation(selectedSpot) && (
                <p>
                  <strong>Rezerwacja:</strong>{" "}
                  {formatDate(getRelevantReservation(selectedSpot).dataOd)} - {formatDate(getRelevantReservation(selectedSpot).dataDo)}
                </p>
              )}

              {selectedSpot.typ === "DLA_PROWADZACEGO" && user.rola === "STUDENT" && (
                <p className="blocked">
                  To miejsce jest przeznaczone dla prowadzących. Studenci nie mogą go rezerwować.
                </p>
              )}

              {canReserve(selectedSpot) ? (
                <>
                  <label>Numer rejestracyjny pojazdu:</label>
                  <input
                    type="text"
                    placeholder="Np. RZ12345"
                    value={reservation.numerRejestracyjny}
                    onChange={(e) => setReservation({ ...reservation, numerRejestracyjny: e.target.value.toUpperCase() })}
                  />

                  <label>Data od:</label>
                  <input
                    type="datetime-local"
                    min={getMinReservationDate()}
                    max={getMaxReservationDate()}
                    value={reservation.dataOd}
                    onChange={(e) => setReservation({ ...reservation, dataOd: e.target.value })}
                  />

                  <label>Data do:</label>
                  <input
                    type="datetime-local"
                    min={reservation.dataOd || getMinReservationDate()}
                    max={getMaxReservationDate()}
                    value={reservation.dataDo}
                    onChange={(e) => setReservation({ ...reservation, dataDo: e.target.value })}
                  />

                  <p className="hint">
                    Maksymalny czas rezerwacji: 24h. Rezerwacja maksymalnie 3 dni do przodu.
                  </p>

                  <button className="reserve-btn" onClick={reserveSpot}>
                    Zarezerwuj miejsce
                  </button>
                </>
              ) : (
                <p className="blocked">
                  Nie możesz zarezerwować tego miejsca. Sprawdź swoją rolę użytkownika albo aktualny status miejsca.
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

                <p><b>Nr rej.:</b> {item.numerRejestracyjny}</p>
                <p><b>Od:</b> {formatDate(item.dataOd)}</p>
                <p><b>Do:</b> {formatDate(item.dataDo)}</p>

                <button className="delete-btn" onClick={() => cancelReservation(item.id)}>
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
                placeholder="Numer miejsca, np. A-16"
                value={newSpot.numer}
                onChange={(e) => setNewSpot({ ...newSpot, numer: e.target.value.toUpperCase() })}
              />

              <input
                type="number"
                placeholder="Poziom"
                value={newSpot.poziom}
                onChange={(e) => setNewSpot({ ...newSpot, poziom: e.target.value })}
              />

              <select value={newSpot.typ} onChange={(e) => setNewSpot({ ...newSpot, typ: e.target.value })}>
                <option value="STANDARD">Standardowe</option>
                <option value="DLA_PROWADZACEGO">Dla prowadzącego</option>
              </select>

              <button type="submit">Dodaj miejsce</button>
            </form>

            <div className="admin-list">
              {spots.map((spot) => (
                <div className="admin-row" key={spot.id}>
                  <strong>{spot.numer}</strong>

                  <select value={spot.status} onChange={(e) => updateSpot(spot, { status: e.target.value })}>
                    <option value="WOLNY">Wolne</option>
                    <option value="ZAJETY">Zajęte</option>
                    <option value="ZAREZERWOWANY">Zarezerwowane</option>
                  </select>

                  <select value={spot.typ} onChange={(e) => updateSpot(spot, { typ: e.target.value })}>
                    <option value="STANDARD">Standardowe</option>
                    <option value="DLA_PROWADZACEGO">Dla prowadzącego</option>
                  </select>

                  <button className="delete-btn" onClick={() => deleteSpot(spot.id)}>
                    Usuń miejsce
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <h2>Statystyki administratora — obciążenie miejsc</h2>

            {!adminStats ? (
              <p className="empty">Brak statystyk.</p>
            ) : (
              <>
                <div className="stats admin-stats">
                  <div><span>Liczba miejsc</span><strong>{adminStats.totalSpots}</strong></div>
                  <div><span>Liczba rezerwacji</span><strong>{adminStats.totalReservations}</strong></div>
                  <div><span>Łączne obciążenie</span><strong>{formatHours(adminStats.totalReservedHours)}</strong></div>
                </div>

                <h3>Obciążenie konkretnych miejsc</h3>
                <div className="load-table">
                  {adminStats.stats.map((item) => (
                    <div className="load-row" key={item.parkingSpotId}>
                      <strong>{item.numer}</strong>
                      <span>{getTypLabel(item.typ)}</span>
                      <span>Rezerwacje: {item.totalReservations}</span>
                      <span>Aktywne: {item.activeReservations}</span>
                      <span>Obciążenie: {formatHours(item.reservedHours)}</span>
                    </div>
                  ))}
                </div>

                <h3>Statystyki pojazdów</h3>
                {adminStats.vehicleStats?.length ? (
                  <div className="load-table">
                    {adminStats.vehicleStats.map((item) => (
                      <div className="vehicle-row" key={item.numerRejestracyjny}>
                        <strong>{item.numerRejestracyjny}</strong>
                        <span>Rezerwacje: {item.totalReservations}</span>
                        <span>Aktywne: {item.activeReservations}</span>
                        <span>Czas: {formatHours(item.reservedHours)}</span>
                        <span>Miejsca: {item.places.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty">Brak danych o pojazdach.</p>
                )}
              </>
            )}
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

                    <p><b>Nr rej.:</b> {item.numerRejestracyjny}</p>
                    <p><b>Od:</b> {formatDate(item.dataOd)}</p>
                    <p><b>Do:</b> {formatDate(item.dataDo)}</p>

                    <button className="delete-btn" onClick={() => cancelReservation(item.id)}>
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
