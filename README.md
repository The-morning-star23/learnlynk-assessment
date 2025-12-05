# LearnLynk Technical Assessment

## Project Structure

- **`frontend/`**: Next.js application (Dashboard)
- **`backend/`**: SQL Schema, RLS Policies, and Edge Functions

## Setup Instructions

### 1. Database Setup

Run the SQL files in your Supabase SQL Editor in the following order:

1. `backend/schema.sql` - Create the database schema
2. `backend/rls_policies.sql` - Apply Row Level Security policies

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Create a `.env.local` file in the frontend directory with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to: `http://localhost:3000/dashboard/today`

### 3. Edge Functions

The create-task function is located in `backend/edge-functions/create-task`.

To deploy (requires Supabase CLI to be installed):

```bash
supabase functions deploy create-task
```

## Implementation Notes

### Stripe Payment Flow (Task 5)

To implement the application fee flow:

1. **Payment Requests Table**: Create a `payment_requests` table to track transaction state.

2. **Initiation**: When the user clicks "Pay", insert a row into `payment_requests` with status `pending` and call `stripe.checkout.sessions.create` from the backend.

3. **Session Metadata**: Pass the `application_id` and internal `payment_request_id` into the Stripe session's metadata field.

4. **Webhooks**: Set up a webhook endpoint listening for `checkout.session.completed` events.

5. **Completion**: When the webhook fires:
   - Verify the webhook signature
   - Extract the `application_id` from the metadata
   - Update the `payment_requests` status to `paid`
   - Programmatically update the `applications` table (e.g., changing stage to `submitted`) in a single transaction