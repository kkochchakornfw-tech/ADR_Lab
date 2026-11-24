# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React (user's choice). Data stays in the browser's localStorage; no backend.

## Users

Hospital pharmacists in the pharmacy department of Bangkok Hospital Siriroj (โรงพยาบาลกรุงเทพสิริโรจน์). They work at a desktop computer in the dispensary and phone patients while filling in follow-up results in the same screen. Thai is the working language; drug, gene and ADR terms stay in English.

## Product Purpose

Track patients on two high-risk drugs (Allopurinol – HLA-B*58:01, Carbamazepine – HLA-B*15:02) for adverse drug reactions, and track pharmacogenomic (PGx) lab tests ordered before the drug starts. Success: no scheduled follow-up call is missed, every PGx result is phoned to the patient, positive results get a drug-allergy card, and the month's numbers are ready for reporting.

## Positioning

A purpose-built follow-up log for one department's PGx/ADR protocol, replacing a hand-kept spreadsheet. The schedule rules are the protocol itself: Negative → W1, W2, W4 (Day 7/14/28); Unknown → W1, W2, W3, W4, W9 (Day 7/14/21/28/63); Waiting → no calls until a result.

## Operating Context

- Two case types: (1) started medication, followed weekly; (2) PGx test sent, drug not yet started, followed until the result is phoned in.
- Each weekly follow-up records channel (OPD, IPD, Telephone, Others), informant (patient or relative + relation), ADR outcome (No ADR, Side effects, Allergy minor, Allergy major), pharmacist, note.
- Unknown PGx needs a reason: physician refusal (reason + Key Occurrence) or patient refusal (reason + IMED record + signed refusal form).
- Positive PGx → issue drug-allergy card.
- A per-patient report is printed (Thai labels, Buddhist-era dates dd/mm/BBBB).
- Monthly dashboard split into group 1 (started, excluding Positive) and group 2 (pending, excluding Unknown), plus per-drug, ADR outcome, and per-doctor statistics.

## Capabilities and Constraints

- Keep every feature of the reference app (C:\Users\USER\Downloads\ADRedit.html): ADR log, PGx lab log, call calendar, monthly dashboard, add/edit/delete, print report, sample data.
- New: a "Today" view — calls due today, overdue calls, lab results waiting to be phoned.
- Dates displayed in Thai Buddhist era.
- Patient data is sensitive; nothing leaves the machine.

## Evidence on Hand

Sample patients in the reference file (synthetic). No logo asset supplied.

## Product Principles

1. The protocol decides the schedule; the pharmacist never computes a date by hand.
2. What is due now is the first thing seen.
3. Recording a call must be fast enough to do while on the phone.
4. Safety signals (Positive, Allergy major, overdue) are never quiet.

## Accessibility & Inclusion

Thai text legibility at desktop sizes (Sarabun/Thai-capable face, ≥14px body). Keyboard-operable forms.
