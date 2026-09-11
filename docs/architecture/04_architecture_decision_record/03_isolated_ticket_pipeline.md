# ADR-003: Isolated Ingestion Pipeline for Receipt/Ticket OCR

## Status

**ACCEPTED**

## Date

2026-09-11

## Context & Problem Statement

The application introduces supermarket receipt/ticket image processing as its first multimodal feature to simplify adding pantry items to user inventory. 

Receipt OCR (using PaddleOCR) and LLM-based receipt parsing present inherent error risks: degraded image quality, non-standard store text formats, optical character recognition errors, and missing nutritional data (receipts list "Chicken Breast 1kg", but do not contain calorie or macronutrient breakdowns).

If the ticket processing pipeline is tightly coupled to core domain services or database updates, OCR failures could block inventory management or corrupt domain entities.

## Decision Drivers

- **System Isolation**: OCR or image parsing failures must not affect the availability of pantry management or nutritional tracking.
- **Data Integrity**: Raw OCR output must undergo validation before being committed as `InventoryItem` records.
- **Separation of Purchase vs. Nutrition**: Supermarket tickets provide purchase metadata (name, quantity, unit), NOT nutritional values (`calories_kcal`, `protein_g`). Nutritional values must be linked separately via the `FoodItem` dictionary catalog.

## Considered Options

1. **Tightly Coupled OCR Processing**: Run OCR directly within the main inventory API thread and write directly to database tables without isolation.
2. **Auto-Committing Ticket Parser**: Parse receipt image text using an LLM and automatically create `InventoryItem` records without user review or catalog lookup.
3. **Decoupled & Isolated Ingestion Pipeline with Explicit User Validation**: Run OCR (PaddleOCR + LLM JSON parser) in an isolated worker/endpoint, generate candidate draft items for user review, map to `FoodItem` dictionary catalog, and commit validated items to `InventoryItem`.

## Decision Outcome

**Option 3: Decoupled & Isolated Ingestion Pipeline with Explicit User Validation**.

1. **Standalone Pipeline**: The OCR service (PaddleOCR + LLM JSON parser) runs as an isolated ingestion worker/endpoint.
2. **Explicit Validation Gap**: OCR results generate candidate draft items (`products: [{ name, quantity, unit }]`) presented to the user for confirmation prior to database insertion.
3. **FoodItem Catalog Coupling**: Extracted product names are mapped to existing `FoodItem` entities (or prompt the creation of a new `FoodItem` with `NutritionalInformation`) before inserting `InventoryItem` records into the database.
4. **Fallback Handling**: If OCR fails completely or is unavailable, users can directly add, update, or remove inventory items manually via normal API endpoints.

## Consequences

### Positive
- System stability: An failure in PaddleOCR or image parsing leaves the main application 100% operational.
- Database integrity: Invalid or misread receipt text cannot corrupt the user's active pantry inventory.
- Clean separation of concerns between physical purchase receipt data and nutritional composition data.

### Negative
- Requires a two-step flow (Scan $\rightarrow$ User Review/Validation $\rightarrow$ Save to Inventory).
