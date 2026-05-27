# HY3N Platform TODO

## Foundation
- [x] Define database schema (drivers, trips, commissions, messages, feedback, support tickets)
- [x] Apply schema migration via webdev_execute_sql
- [x] Establish elegant design system (color palette, typography, theme tokens)
- [x] Set up routing skeleton in App.tsx for public, rider, driver, and admin areas
- [x] Create shared constants for ride categories, pricing, and emergency numbers

## Feature 1: Public Landing Page
- [x] Hero section with HY3N branding and dual CTAs (Book a Ride / Drive with HY3N)
- [x] Display all 6 ride categories: Standard, Comfort, Kantanka, Executive, Okada, Express Delivery
- [x] Show base fare and per-km pricing in GH₵ for each category
- [x] How it works section for riders and drivers
- [x] Footer with safety information and emergency numbers

## Feature 2: Rider Booking Flow
- [x] Pickup and destination input with location entry
- [x] Ride category selection with live fare estimate in GH₵
- [x] Multi-stop support (add up to 3 intermediate stops)
- [x] Fare estimate breakdown
- [x] Submit booking and create Trip record

## Feature 3: Driver Dashboard
- [x] Online/offline toggle
- [x] Live demand heatmap visualization
- [x] Shift tracker (online time, session earnings, daily goal)
- [x] Earnings snapshot card (today, week, total)
- [x] Tiered daily commission panel (GH₵30 Okada/Delivery, GH₵50 Cars)

## Feature 4: Driver Registration & Profile
- [x] Registration form with vehicle type selection (Car / Motorcycle / Van)
- [x] Ride category selection (Okada drivers default to Okada; cars can offer multiple categories)
- [x] Document upload section (License, Insurance, Roadworthiness)
- [x] Profile editing for existing drivers

## Feature 5: Live Trip Map
- [x] Map view with Marker A (pickup) and Marker B (destination)
- [x] Auto night mode (6 PM – 6 AM)
- [x] External GPS launcher (Google Maps, Waze)
- [x] Live rider location dot during pickup phase

## Feature 6: Safety Toolkit
- [x] SOS emergency button
- [x] Share Trip Status link generator
- [x] One-tap Police (191) and Ambulance (193) buttons

## Feature 7: In-App Chat
- [x] Real-time messaging between driver and rider
- [x] Quick reply chips ("I've arrived!", "I'm in traffic", etc.)
- [x] Message thread keyed to active trip

## Feature 8: Payment Blocking
- [x] Detect outstanding commission records
- [x] Block trip dispatch for drivers with unpaid records
- [x] Display MoMo instructions (0546728330 — Gad Agyeman Nyantakyi / Guydad Enterprise)

## Feature 9: Admin Panel
- [x] Drivers table with status and blocking indicators
- [x] Confirm MoMo payment and unblock driver
- [x] Live trips monitor with safety alert badges
- [x] Generate daily commission records (tiered)

## Feature 10: Feedback & Support
- [x] Rider feedback display for drivers (ratings, compliments, comments)
- [x] Support center with categorized issues and emergency contact
- [x] Submit support ticket flow

## Quality
- [x] Vitest coverage for HY3N business logic (constants, fare, commission)
- [x] Verify all currency renders as GH₵
- [x] Verify exact emergency numbers (Police 191, Ambulance 193)
- [x] Verify exact MoMo details across all touchpoints
- [x] Save checkpoint and deliver
