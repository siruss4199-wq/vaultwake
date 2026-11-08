# Vaultwake Merge — Game Name Review (decision: search trademarks first)

Recorded verbatim as the owner (GitHub `siruss4199-wq`) supplied it in the release session on
2026-11-08. **Decision recorded 2026-11-08: option 1, search trademarks before submission.**
The owner re-confirmed this choice later the same day.

---

Proposed game title: Vaultwake Merge

Preliminary web research has not identified an exact competing game title. Formal trademark clearance remains outstanding.

Decision — select one:

* Complete trademark searches in relevant jurisdictions, including Mongolia, before submission.
* Proceed after reviewing the identified naming risks and explicitly accepting the remaining uncertainty.

Owner decision: [Pending]
Date: [To complete]

> **Recorded 2026-11-08.** In the release session the owner selected: *Complete trademark searches in relevant jurisdictions, including Mongolia, before submission.*

This statement does not establish trademark registration or guarantee that the name is legally available.

---

## Search record (2026-11-08)

Searches were run on 2026-11-08 from the release session's cloud browser (headless Chromium) against
the official registers. Raw results are in `trademark-search-2026-11-08/results.json`; screenshots are
in the same folder. **This is a knock-out search, not a legal clearance opinion.**

| Register | Status | Queries | Result |
|---|---|---|---|
| **USPTO** Trademark Search (https://tmsearch.uspto.gov) | ✅ **Completed** | Wordmark: `vaultwake`, `vaultwake merge`, `vault wake` (phrase), `*vaultwake*`, `*vault*wake*`, VAULT + WAKE in the same mark, fuzzy `vaultwake` (2 edits), prefix `vaultw`, fuzzy `voltwake`, `vaultwalk`, phrases `wake merge`, `vault merge`. All statuses (live and dead), all classes. | **0 results** for every VAULTWAKE, VAULT WAKE and VAULT + WAKE query. Nearest by spelling: VAULTWARE (3 filings, all dead), VAULTWYN (live, class 36), VOLTWAVE (98076232, live, class 28; 98033254 dead). None covers a game called Vaultwake. Screenshot `uspto-wordmark-vaultwake.png`. |
| **EUIPO** eSearch plus (https://euipo.europa.eu/eSearch/) | ✅ **Completed** (EU trade marks only) | Basic search, mark text CONTAINS: `vaultwake`, `vaultwake merge`, `vault wake`, `vaultwak`, `voltwake`, `battlewake`, `wake merge`, `vault merge`. | **0 trade marks** for every query. Positive controls on the same search returned results (MERGE MANSION: 2, Metacore Games Oy, classes 9, 41, 42 and 9, 16, 25, 28; ALAN WAKE: 4, Remedy Entertainment), so the zeros are real. Screenshots `euipo-esearch-*.png`. Does **not** cover national marks of EU member states. |
| **WIPO Global Brand Database** (https://branddb.wipo.int) | ❌ **Not completed: blocked** | — | The site requires an automatic "Altcha" anti-bot check before any search. That check could not run from this session, and circumventing it was declined. **No result is claimed.** The owner must run it (steps below). |
| **TMview** (https://www.tmdn.org/tmview/; EU national offices and others) | ❌ **Not completed: blocked** | — | The site's firewall rejected the session ("Request Rejected", support IDs 16866655629037816469 and 2174310247366890583). The search page itself returned 403 (CloudFront) at https://www.euipo.europa.eu/en/search-ip. **No result is claimed.** |
| **Intellectual Property Office of Mongolia** (https://www.ipom.gov.mn) | ❌ **Not completed: blocked** | — | The office's homepage links to its public register at https://ipom.mn.publish.wipo.net/. Every page there returned HTTP 403 (CloudFront, "Request blocked") to this session. **No result is claimed.** |

### Potentially confusing marks found (USPTO, live, classes 9 and/or 41)

These are not identical to Vaultwake, but they share one element of the name. Taken from
`results.json`, query `live_wake_suffix_9_41_games` and the others named.

| Mark | Serial | Status | Classes | Owner | Note |
|---|---|---|---|---|---|
| BATTLEWAKE | 87900316 | Registered | 9, 41 | Survios, Inc. | Video game; closest "-WAKE" game mark |
| ASHWAKE | 98951237 | Registered | 9 | Ghost Development Limited | "-WAKE" coined word |
| ARCHWAKE | 50143955 | Pending | 9, 41 | Guardian Kenny Studios LLC | "-WAKE" coined word, games |
| RAVENWAKE GAMES | 99671413 | Pending | 41, 38, 42 | Daybreak Game Company LLC | "-WAKE" coined word, games |
| DAWN'S WAKE | 50128922 | Pending | 9, 41 | Neptune Corp. | Games |
| MEMORIA WAKE | 98832269 | Registered | 9, 41 | Team Crescendo, LLC | Games |
| ALAN WAKE | 78574816 | Registered | 9, 41, 42 | Remedy Entertainment Oy | Games |
| GAME VAULT | 99580701 | Pending | 9, 41 | Pure Games LLC | "VAULT" + game |
| THE VAULT | 88195775 | Registered | 9 | Everi Games Inc. | Gaming machines |
| MERGE MANSION | 90016849 | Registered | 9, 41, 42 | Metacore Games Oy | Leading merge-genre mark |

How crowded the shared elements are (USPTO, live, classes 9/41, goods mentioning games):
- **VAULT…** marks: 132, mostly casino and slot titles (VAULT OF LIONS, BUST THE VAULT, VAULT SHIFTER and others).
- **…WAKE** marks: 36 (BATTLEWAKE, ASHWAKE, ARCHWAKE and others above).
- Marks containing the word **MERGE**: 132 (MERGE MANSION, MERGE DALE, MERGE KUYA ISLAND, WORLD TOUR MERGE, TREASURE MERGE and others).

## Risk assessment (engineering reading, not legal advice)

- **Identical or near-identical marks: none found** in the two registers that could be searched (USPTO, all statuses; EUIPO, EU trade marks).
- **"‑WAKE" game marks.** These are the main similarity. BATTLEWAKE (registered, 9 and 41), ARCHWAKE, ASHWAKE and RAVENWAKE coexist with one another, which suggests the "-wake" ending alone is not treated as exclusive. "Vaultwake" differs in its first element and in meaning. Risk looks **low**, but it is not zero against BATTLEWAKE.
- **"VAULT" and "MERGE"** are each shared by over a hundred live game marks. Both read as descriptive or weak elements in this field. "Merge" names the genre. Using "Merge" as a trailing descriptor, rather than in a "MERGE + word" pattern like MERGE MANSION, keeps a distance from Metacore's marks.
- **Not covered:**
  - WIPO Global Brand Database: international (Madrid) registrations and many national registers.
  - TMview: national marks in EU member states and other offices.
  - The Mongolian register.
  - The UK.
  - Unregistered (common-law) use.
  - Domain names and app-store listings.

  Earlier web searches found no game called Vaultwake (`RIGHTS_REPORT.md` §3).
- **No clearance is claimed.** Nothing here approves, rejects or changes the name.

## Steps for the owner to finish the blocked searches (about 15 minutes)

Record each result in the table above (date, count, screenshot).

1. **WIPO Global Brand Database.**
   - Open https://branddb.wipo.int/en/similarname in a normal browser and wait for the automatic check to finish.
   - Search Brand name `vaultwake`, then `vault wake`.
   - Filter Nice classes **9** and **41**.
   - If the *Designation* or *Office* filter lists **MN (Mongolia)**, run the search once more with it.
   - Note the number of results and any mark that contains VAULTWAKE or VAULT + WAKE.
2. **TMview.**
   - Open https://www.tmdn.org/tmview/ and search Trade mark name `vaultwake` with all offices selected.
   - Repeat with `vault wake`.
3. **Mongolia (IPOM).**
   - Open https://ipom.mn.publish.wipo.net/, which is linked from https://www.ipom.gov.mn.
   - Choose the trademark search and search `vaultwake`.
   - Also search a Cyrillic spelling you would expect, for example `воултвейк`.
   - If the register is unavailable, ask IPOM directly using the contacts on https://www.ipom.gov.mn.
4. **Decide.** Write one of the following, with the date:
   - **Keep the name** (no conflict found).
   - **Change the name.**
   - **File the name** (optionally with a lawyer's opinion).

## Owner decision after the searches

Owner decision (keep / change / file): [To complete]
Date: [To complete]
