# 🚗 Parking WSPA

System zarządzania parkingiem uczelnianym WSPA.

Projekt został wykonany jako aplikacja webowa umożliwiająca zarządzanie parkingiem uczelnianym, rezerwację miejsc parkingowych oraz analizę wykorzystania parkingu.

---

# 🎯 Cel projektu

Celem projektu było stworzenie systemu umożliwiającego:

- logowanie użytkowników
- zarządzanie miejscami parkingowymi
- tworzenie rezerwacji
- kontrolę dostępu do wybranych miejsc
- monitorowanie wykorzystania parkingu
- analizę obciążenia parkingu

---

# 👥 Role użytkowników

## Administrator

Administrator posiada pełny dostęp do systemu:

- dodawanie miejsc parkingowych
- usuwanie miejsc parkingowych
- zmiana statusów miejsc
- przegląd wszystkich rezerwacji
- anulowanie rezerwacji
- przegląd statystyk wykorzystania parkingu

---

## 👨‍🏫 Prowadzący

Prowadzący mogą:

- rezerwować miejsca P1-P5
- rezerwować miejsca ogólnodostępne
- zarządzać własnymi rezerwacjami

---

## 🎓 Student

Studenci mogą:

- rezerwować wyłącznie miejsca ogólnodostępne
- zarządzać własnymi rezerwacjami

Studenci nie mają dostępu do miejsc przeznaczonych dla prowadzących.

---

# 🅿️ Parking

Parking składa się z:

## Miejsca dla prowadzących

```text
P1 - P5