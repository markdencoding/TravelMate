-- ==========================================
-- TravelMate Demo Seed Data
-- ==========================================
-- NOTE: Execute this script after running all migrations.
-- This creates a fictional user "John Doe" (john.doe@example.com)
-- and seeds a realistic trip to Paris to demonstrate
-- the Dashboard, Notifications, and Trip Reports.
-- Password for the user is: Password123!
-- ==========================================

-- 1. Create Demo User
-- Assuming bcrypt hash for 'Password123!'
INSERT INTO users (id, full_name, email, password_hash) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000', 
    'John Doe', 
    'john.doe@example.com', 
    '$2b$10$T8Z.G6X46z17/HqP3wWw2uekI8x/17k2eI4/qH.r0V/8.5.W4r/a.'
) ON CONFLICT (email) DO NOTHING;

-- Retrieve user ID (Assume it's '550e8400-e29b-41d4-a716-446655440000' for deterministic insertion)
-- Since we are doing raw SQL, we will use DO logic or just assume the UUIDs.
-- To ensure safe execution in any environment, we will use temporary variables if using pgScript,
-- or simply rely on the fixed UUIDs if we enforce them. Let's use fixed UUIDs for the demo.

-- 2. Create Trip
INSERT INTO trips (id, user_id, name, description, primary_destination, start_date, end_date, estimated_budget)
VALUES (
    'trip-uuid-1',
    '550e8400-e29b-41d4-a716-446655440000',
    'Summer in Paris',
    'A week-long vacation to explore art, culture, and food in Paris.',
    'Paris, France',
    CURRENT_DATE + INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '12 days',
    2500.00
) ON CONFLICT (id) DO NOTHING;

-- 3. Create Destinations
INSERT INTO destinations (id, trip_id, name, address, latitude, longitude, description)
VALUES 
(
    'dest-uuid-1',
    'trip-uuid-1',
    'Eiffel Tower',
    'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
    48.8584,
    2.2945,
    'Iconic landmark, must visit at night.'
),
(
    'dest-uuid-2',
    'trip-uuid-1',
    'Louvre Museum',
    'Rue de Rivoli, 75001 Paris, France',
    48.8606,
    2.3376,
    'See the Mona Lisa.'
) ON CONFLICT (id) DO NOTHING;

-- 4. Create Itinerary Days
INSERT INTO itinerary_days (id, trip_id, day_number, date)
VALUES 
(
    'day-uuid-1',
    'trip-uuid-1',
    1,
    CURRENT_DATE + INTERVAL '5 days'
),
(
    'day-uuid-2',
    'trip-uuid-1',
    2,
    CURRENT_DATE + INTERVAL '6 days'
) ON CONFLICT (id) DO NOTHING;

-- 5. Create Activities
INSERT INTO activities (id, trip_id, day_id, destination_id, name, start_time, end_time, location, description, estimated_cost)
VALUES 
(
    'act-uuid-1',
    'trip-uuid-1',
    'day-uuid-1',
    'dest-uuid-1',
    'Eiffel Tower Tour',
    '10:00:00',
    '12:30:00',
    'Eiffel Tower',
    'Guided tour to the summit.',
    35.00
),
(
    'act-uuid-2',
    'trip-uuid-1',
    'day-uuid-2',
    'dest-uuid-2',
    'Louvre Museum Visit',
    '09:00:00',
    '15:00:00',
    'Louvre Museum',
    'Full day pass.',
    25.00
) ON CONFLICT (id) DO NOTHING;

-- 6. Create Expenses
INSERT INTO expenses (id, trip_id, category, name, amount, expense_date, activity_id, description)
VALUES 
(
    'exp-uuid-1',
    'trip-uuid-1',
    'accommodation',
    'Hotel Deposit',
    500.00,
    CURRENT_DATE,
    NULL,
    'Initial booking deposit.'
),
(
    'exp-uuid-2',
    'trip-uuid-1',
    'activities',
    'Eiffel Tickets',
    70.00,
    CURRENT_DATE + INTERVAL '1 day',
    'act-uuid-1',
    'Pre-booked online.'
) ON CONFLICT (id) DO NOTHING;
