# 2026 Source Refresh: DOJ/FBI/Public-Record Update

Updated: 2026-05-25

This brief records the source-refresh inputs used by the OWL site update. It prioritizes official DOJ/FBI/Congress records and labels media as context only.

## Official source hubs

- DOJ Epstein Library: https://www.justice.gov/epstein
- DOJ Disclosures: https://www.justice.gov/epstein/doj-disclosures
- DOJ/FBI FOIA list: https://www.justice.gov/epstein/doj-disclosures/foia-federal-bureau-investigation-fbi
- FBI Vault legacy collection: https://vault.fbi.gov/jeffrey-epstein
- House Oversight DOJ-provided records release: https://oversight.house.gov/release/oversight-committee-releases-epstein-records-provided-by-the-department-of-justice/

## Caution rules added to the UI

- Court-proven facts, official records, credible reporting, and researcher inference are separated visually.
- Network graph edges generated from role/category metadata are exploratory unless specifically sourced.
- Media transcripts are context, not primary evidence.
- Redactions and omissions are explained as privacy/protective-order/CSAM/grand-jury limitations where applicable, not automatically treated as proof of a hidden claim.

## Video transcript acquisition

A GitHub copy of `youtube-transcript-api` was cloned to `/Users/cody/tools/youtube-transcript-api`; transcripts were fetched into `research/transcripts/`.
