---
sidebar_position: 1
title: "Glossary"
---

# Glossary

Beekeeping has a vocabulary all of its own, and Openbeehive adds a few terms
of its own on top. This page gathers the words you will meet most often, both
at the hive and in the app, with short, practical definitions.

Use your browser's find function to jump straight to a term, or simply skim.
Where a term has its own page, we link to it.

:::tip
New to beekeeping? Start with [the colony](/beekeeping/the-colony) and
[getting started](/beekeeping/getting-started), then come back here whenever a word trips
you up.
:::

## Beekeeping terms

| Term | Meaning |
| --- | --- |
| **Apiary** | A site where one or more hives are kept; a "bee yard". In Openbeehive an apiary is the top of the hierarchy. See [apiaries](/using-the-app/apiaries). |
| **Bee space** | The roughly 6-9 mm gap bees leave as a passage. Spaces smaller are filled with propolis; larger are filled with comb. Correct bee space keeps frames movable. |
| **Brood** | The developing young: eggs, larvae and pupae. A healthy "brood pattern" is compact with few gaps. |
| **Brood box** | The lower box (or boxes) where the queen lays and brood is raised, as opposed to the supers above. |
| **Burr comb** | Stray comb built in gaps or between boxes, outside the frames. |
| **Capped brood** | Pupae sealed under wax cappings. Worker cappings are flat and matt; drone cappings are domed. |
| **Cell** | A single hexagonal compartment of comb. Special cells include queen cells, drone cells and play cups. |
| **Comb** | The wax structure of hexagonal cells used to store honey, pollen and to raise brood. |
| **Drawn comb** | Foundation that bees have built out into full, usable cells. |
| **Drone** | A male bee. Drones do no foraging and have no sting; their role is to mate with queens. |
| **Drone-laying queen** | A failing or unmated queen who lays only unfertilised (drone) eggs - a sign she needs replacing. |
| **Foundation** | A sheet of beeswax or plastic, often embossed with a cell pattern, that gives bees a base to draw comb on. |
| **Forage** | The nectar, pollen, water and propolis bees collect; also the act of collecting it. |
| **Frame** | A removable wooden or plastic rectangle that holds comb or foundation and lets you lift it out for inspection. |
| **Hive** | The box and its colony. In Openbeehive a hive is the unit you inspect and label. See [hives](/using-the-app/hives) and [hive types](/knowledge-base/hive-types). |
| **Hive tool** | A flat metal lever for prising apart boxes and frames stuck with propolis. |
| **Inspection** | A visit during which you open a hive, check its condition and record what you find. See [inspecting](/beekeeping/inspecting). |
| **Laying worker** | A worker who begins laying (drone-only) eggs when a colony is hopelessly queenless. |
| **Nectar flow** | A period when plants yield nectar freely and colonies gain weight quickly; also called a "flow". |
| **Nucleus (nuc)** | A small starter colony - typically 3-5 frames with a queen, brood, food and bees. A common way to buy bees or make increase. |
| **Propolis** | A sticky plant resin bees use to seal gaps and varnish surfaces. |
| **Queen** | The single fertile female who lays the eggs. Her quality drives the whole colony. See [queens](/using-the-app/queens). |
| **Queen cell** | A large, peanut-shaped cell in which a new queen is raised. Their presence signals swarming, supersedure or emergency requeening. |
| **Queen excluder** | A grille sized so workers pass but the larger queen cannot, used to keep brood out of honey supers. |
| **Reign** | The period a particular queen heads a colony, from introduction or emergence until she is replaced or lost. Openbeehive tracks this so colony history stays continuous across queens. |
| **Requeening** | Replacing a colony's queen, whether to improve temperament, productivity or simply because she is failing. |
| **Super** | A box added above the brood, usually over a queen excluder, in which bees store surplus honey for harvest. |
| **Supersedure** | The colony quietly raising a new queen to replace a failing one, usually without swarming. |
| **Swarm** | Reproduction of the colony: the old queen leaves with around half the bees to found a new home. See [swarming](/beekeeping/swarming). |
| **Treatment** | An intervention against pests or disease, most often for varroa. See [treatments](/using-the-app/treatments) and [varroa](/beekeeping/varroa). |
| **Varroa** | *Varroa destructor*, a parasitic mite that weakens bees and spreads viruses; the most serious pest in most regions. See [varroa](/beekeeping/varroa). |
| **Withdrawal period** | The time that must pass after a treatment before honey may be harvested for human consumption. It varies by product and by country - always follow the label. |
| **Worker** | An infertile female bee. Workers do nearly all the colony's labour: nursing, building, guarding and foraging. |

:::caution
Withdrawal periods are a legal and food-safety matter, and they differ between
products and between countries. Treat the label as the authority and check your
national rules.
:::

## Openbeehive terms

| Term | Meaning |
| --- | --- |
| **Event** | An append-only record of something that happened (for example a harvest or a treatment). Events never conflict during sync. See [history and events](/developers/history-and-events). |
| **HLC (Hybrid Logical Clock)** | The timestamp scheme Openbeehive uses to order changes made on different devices, even offline, so sync stays consistent. See [sync protocol](/developers/sync-protocol). |
| **Marking colour** | The international queen-marking colour for the year she was introduced (white, yellow, red, green, blue on a five-year cycle). See [queen marking colours](/knowledge-base/queen-marking-colours). |
| **Offline-first** | The design principle that everything works locally and instantly, with no signal, and syncs in the background when a connection returns. See [offline and sync](/using-the-app/offline-and-sync). |
| **OPFS** | The Origin Private File System, a private area in your browser where Openbeehive stores its local SQLite database. |
| **OR-Set** | An "add-wins" set used for list fields so concurrent additions from different devices all survive a merge. See [sync protocol](/developers/sync-protocol). |
| **PWA** | Progressive Web App - the installable, offline-capable web app you run on phone, tablet or desktop. See [install](/using-the-app/install). |
| **QR label** | A printable code on a hive that encodes a deep link; scanning it opens the app straight at that hive. See [QR labels](/using-the-app/qr-labels). |
| **Sync** | The background, conflict-free merging of your local changes with the server and your other devices. See [offline and sync](/using-the-app/offline-and-sync). |
| **Task** | A reminder with a title and an optional due date, for example "add a super" or "treat for varroa". See [tasks](/using-the-app/tasks). |
| **Tenant** | A collection of apiaries, hives and records shared by its members. Every account has a personal tenant and can be invited into others; there is no finer-grained sharing. See [accounts and tenants](/using-the-app/accounts-tenants). |

:::note
The deeper mechanics of HLCs, OR-Sets and append-only events are covered in the
[developers section](/category/developers). For day-to-day use you only need to know that
your data merges cleanly across devices without ever asking you to resolve a
conflict.
:::
