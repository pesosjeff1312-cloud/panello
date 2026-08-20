# Pannelli

Tutti implementati. Uno per file, tutti con lo stesso pattern:
header (`PanelHead`) → contenuto → barra di inserimento in fondo.
I mattoni condivisi (`PANEL`, `INPUT`, `BTN`, `Dot`, `Del`, `Check`, `Chip`, `Empty`, `EV_CATS`)
stanno in `src/components/ui.tsx`: usa quelli, non riscriverli.

| Panel | Tabelle | Riferimento visivo |
| --- | --- | --- |
| `CalendarPanel` | `events` + `reminders` (marker PRM) | `design/calendar.jsx` |
| `RemindersPanel` | `reminders` | `design/tasks.jsx` |
| `RoutinePanel` | `habits`, `habit_log` | `design/routine.jsx` |
| `FinancePanel` | `transactions`, `settings` | `design/finance.jsx` |
| `GymPanel` | `exercises`, `exercise_log`, `gym_days` | `design/gym.jsx` |
| `WeatherPanel` | — (`useWeather`) | `design/weather.jsx` |
| `NotesPanel` | `notes` | README → Note rapide |
| `SearchBar` | tutte (in memoria) | README → Header |

Ogni pannello riceve la sua `Collection<'tabella'>` da `useDashboard()`: nessuna query dentro i pannelli.
Le spunte di routine e palestra sono insert/delete su `habit_log` / `exercise_log` (chiave `id+day`),
il tasto riposo è un upsert su `gym_days`.
