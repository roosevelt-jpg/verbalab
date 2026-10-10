# Lugemi residency

**Person / user residency** is the country and region derived from where the person registered (signup geography, organization country, billing country, or an explicit residency field). Fields: `residencyCountry`, `residencyRegion`, `registeredFrom`.

**Model / LLM residency** is the Lugemi data center where that model family is hosted (e.g. `af-west-1` Accra, `af-west-2` Lagos, `af-south-1` Cape Town, `eu-west`, `us-east`). Fields: `hostedResidency`, `dataCenter`, `hostedRegion`.

Inference prefers matching person/org residency to nearby model hosting when ready — affinity, not a hard geo-fence. See `GET /v1/residency`.
