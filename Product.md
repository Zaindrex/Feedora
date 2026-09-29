# MASTER PROMPT — AI QR REVIEW PLATFORM

You are a senior full-stack engineer, product designer, UI/UX designer, database architect, and security engineer.

Build a complete production-ready SaaS web application for businesses that allows customers to scan a QR code, rate their experience, generate an AI-assisted review based on their genuine feedback, and easily continue to the business's Google review page.

The product should feel like a polished modern SaaS product — fast, minimal, premium, responsive, and extremely easy to use.

Do NOT create a basic CRUD dashboard. Build a complete, polished product with excellent UX, animations, loading states, empty states, error handling, responsive layouts, authentication, role-based access control, database security, QR generation, analytics, and AI review generation.

---

# 1. PRODUCT CONCEPT

The product allows a business owner to generate a unique QR code.

Example:

Customer sees:

"Enjoyed your experience?"

They scan the QR code.

The web app opens:

Business logo
Business name
Business location
"How was your experience?"

★★★★★

Customer selects 1–5 stars.

The application then asks a few lightweight questions depending on the rating.

Example:

5 stars:
"What did you like most?"

Options:

* Service
* Staff
* Quality
* Ambience
* Value
* Speed

Lower ratings:
"What could we improve?"

Then AI generates a natural review draft based ONLY on the customer's selected rating and feedback.

Example:

Rating: 5 stars

Customer selected:

* Friendly staff
* Great service
* Good ambience

AI-generated review:

"Had a wonderful experience here. The staff was friendly and attentive, the service was excellent, and the ambience made the whole visit enjoyable. Would definitely recommend this place!"

Customer can:

EDIT REVIEW
COPY REVIEW
REGENERATE

Then:

"Review us on Google"

button opens the business's Google review URL.

IMPORTANT:
The application must NOT fabricate customer experiences.
The customer must be able to edit the generated review.
Never automatically submit a review to Google.
Never hide the Google review option based on a negative rating.
All ratings should have the same fundamental path to the Google review page.
The system should encourage genuine feedback.

---

# 2. CORE USER ROLES

There are three roles.

## ADMIN

Platform administrator.

Admin can:

* Login
* Create owner accounts
* Edit owner accounts
* Disable/enable owners
* Reset owner passwords
* Create businesses
* Assign businesses to owners
* View all businesses
* View all owners
* View platform-wide analytics
* View QR scans
* View ratings
* View review-generation activity
* View Google-review click activity
* Search/filter businesses
* Search/filter owners
* View individual business analytics
* Manage platform settings
* Manage AI configuration
* Manage subscription/status if implemented
* Delete/deactivate businesses
* View audit logs

Admin is the only role allowed to create owner accounts.

---

# 3. OWNER

Business owner.

Owner can:

* Login
* View dashboard
* View their business
* Edit business profile
* Upload business logo
* Add business description
* Add address
* Add phone number
* Add website
* Add Google review URL
* Generate QR code
* Download QR code
* Print QR code
* View QR scan analytics
* View customer ratings
* View feedback
* View generated reviews
* View Google review clicks
* View rating distribution
* View daily/weekly/monthly analytics
* Manage AI review preferences
* Change password
* Update profile

Owner must NEVER be able to access another owner's business or data.

---

# 4. CUSTOMER

Customer does NOT need an account.

The customer journey must be extremely frictionless.

Customer scans QR.

No login.

No registration.

No unnecessary forms.

The goal is to complete the experience in less than 30 seconds.

---

# 5. TECHNOLOGY STACK

Use:

Frontend:

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Lucide icons
* Framer Motion

Backend:

* Supabase

Use Supabase for:

* PostgreSQL database
* Authentication
* Row Level Security
* Storage
* Edge Functions where appropriate

AI:

* Use an abstraction layer so the AI provider can easily be changed.
* Support Gemini/OpenAI through environment variables.
* Never expose AI API keys in frontend code.

QR:

* Use a reliable QR code generation library.

Charts:

* Recharts

Forms:

* React Hook Form
* Zod

Routing:

* React Router

Use TypeScript strictly.

Avoid unnecessary dependencies.

---

# 6. PROJECT STRUCTURE

Use a clean scalable architecture.

Example:

src/
components/
pages/
layouts/
features/
auth/
admin/
owner/
review/
qr/
analytics/
hooks/
lib/
services/
types/
utils/
integrations/
config/

Keep business logic out of UI components whenever possible.

Create reusable components.

---

# 7. DESIGN SYSTEM

The UI must look like a modern premium SaaS application.

Design inspiration:

* Linear
* Stripe
* Vercel
* Notion
* Raycast
* Modern fintech dashboards

Do NOT copy their UI.

Use the same level of cleanliness and polish.

Default visual direction:

Background:
#F8FAFC

Cards:
#FFFFFF

Primary:
#0F917D

Text:
#0F172A

Secondary text:
#64748B

Borders:
#E2E8F0

Use:

* 14–16px body typography
* Strong visual hierarchy
* Large whitespace
* Rounded cards
* Subtle shadows
* Thin borders
* Clean icons
* Consistent spacing
* Accessible contrast

Use Inter or another clean modern sans-serif.

---

# 8. ANIMATIONS

Use Framer Motion.

Animations must be subtle.

Include:

* Page transitions
* Card entrance animations
* Button hover
* Star selection animation
* AI loading animation
* Modal transitions
* Sidebar transitions
* Dropdown animations
* Toast notifications
* QR generation animation

Do NOT over-animate.

The application should feel fast and professional.

---

# 9. LANDING PAGE

Create a public marketing landing page.

Sections:

Hero

Headline:

"Turn Every Customer Experience Into Meaningful Feedback."

Subheadline explaining the QR → rating → AI review → Google flow.

CTA:

"Get Started"

Secondary CTA:

"See How It Works"

Hero visual should show the customer review experience.

Then:

## How It Works

Step 1:
Scan QR

Step 2:
Rate Experience

Step 3:
Create Review

Step 4:
Share on Google

Then:

## Features

* Smart QR Reviews
* AI-assisted review writing
* Google review integration
* Customer feedback
* Business analytics
* Multi-business management
* Real-time dashboard
* Downloadable QR codes

Then:

## Dashboard Preview

Show polished mock dashboard.

Then:

## Built For

Restaurants
Cafes
Hotels
Salons
Clinics
Retail Stores
Gyms
Service Businesses
Local Businesses

Then:

CTA section.

Footer.

---

# 10. AUTHENTICATION

Create separate login experience.

Routes:

/login

/admin/login

Owner login:

Email
Password

Admin login:

Email
Password

After login:

Owner → /owner/dashboard

Admin → /admin/dashboard

Use Supabase Auth.

Implement:

* Session persistence
* Logout
* Protected routes
* Role-based routing
* Unauthorized page
* Forgot password
* Password reset
* Loading states

Admin accounts should NOT be publicly creatable.

Only existing administrators can create owner accounts.

---

# 11. ADMIN DASHBOARD

Route:

/admin/dashboard

Create a professional admin layout.

Sidebar:

Dashboard
Owners
Businesses
Reviews
Analytics
Settings
Audit Logs
Logout

Top navigation:

Search
Notifications
Admin profile

Dashboard cards:

Total Owners
Total Businesses
Total QR Scans
Total Google Review Clicks

Then:

Rating distribution chart.

QR scan chart.

Google click chart.

Recent businesses.

Recent activity.

---

# 12. ADMIN — OWNER MANAGEMENT

Route:

/admin/owners

Table:

Name
Email
Business
Status
Created
Last Login
Actions

Actions:

View
Edit
Disable
Enable
Reset Password

"Create Owner" button.

Create Owner modal/page:

Name
Email
Phone
Temporary Password
Business assignment

After creation:

Show success notification.

Never display passwords after creation.

---

# 13. ADMIN — BUSINESS MANAGEMENT

Route:

/admin/businesses

Table:

Business Name
Owner
Status
QR Scans
Google Clicks
Rating
Created
Actions

Actions:

View
Edit
Disable
Delete

Business creation form:

Business name
Logo
Description
Category
Address
Phone
Website
Google review URL

Generate QR automatically after creation.

---

# 14. OWNER DASHBOARD

Route:

/owner/dashboard

Sidebar:

Overview
Reviews
Analytics
QR Code
Business Profile
Settings

Top section:

"Good morning, {Owner Name}"

Business selector if owner has multiple businesses.

Stats:

Total Scans
Total Ratings
Average Rating
Google Clicks

Charts:

Rating trend
QR scan trend
Google click trend

Rating distribution:

5 stars
4 stars
3 stars
2 stars
1 star

Recent customer feedback.

---

# 15. OWNER — QR CODE PAGE

Route:

/owner/qr

Show:

Business logo
Business name
Large QR code

Text:

"Scan to share your experience"

Buttons:

Download PNG
Download SVG
Print QR

Allow customization:

QR size
Logo
Border
Display title

QR URL format:

/review/{businessSlug}

Each business must have a unique slug.

---

# 16. CUSTOMER REVIEW PAGE

This is the most important part of the application.

Route:

/review/{businessSlug}

The page must be extremely clean.

Mobile-first.

Customer should immediately see:

Business logo

Business name

"How was your experience?"

Stars:

☆ ☆ ☆ ☆ ☆

Stars should animate when selected.

After selecting:

1 star:
"Sorry to hear that. What could we improve?"

2 stars:
"Thanks for your feedback. What could we improve?"

3 stars:
"Thanks! What did you like and what could be better?"

4 stars:
"Glad you had a good experience! What did you enjoy?"

5 stars:
"Wonderful! What did you enjoy most?"

---

# 17. CUSTOMER FEEDBACK OPTIONS

Show selectable chips.

Examples:

Service
Staff
Quality
Speed
Cleanliness
Ambience
Value
Communication
Product
Location

Allow:

"Something else"

with optional text input.

Keep this short.

Do not force customers to write paragraphs.

---

# 18. AI REVIEW GENERATION

After customer feedback:

Show beautiful AI loading state.

Example:

"Creating your review..."

Animated dots.

Then generate 2–3 review variations.

Example:

### Option 1

"Had a great experience here. The staff was friendly and the service was excellent. Everything was smooth and enjoyable."

### Option 2

"Really enjoyed my visit. Great service, helpful staff, and a welcoming atmosphere. Would happily recommend this place."

Customer can select one.

Buttons:

Use this review
Regenerate
Edit

Allow customer to edit generated review.

The AI prompt should instruct:

* Respect selected star rating
* Use only provided customer information
* Never invent facts
* Never claim something the customer didn't mention
* Keep natural human language
* Avoid repetitive marketing language
* Avoid fake enthusiasm
* Avoid mentioning AI
* Avoid excessive emojis
* Do not include quotation marks around the final review
* Generate concise Google-review-style text
* Match tone to rating
* Preserve authenticity

---

# 19. GOOGLE REVIEW FLOW

After selecting/editing the review:

Show:

"Ready to share your experience?"

Buttons:

COPY REVIEW

and:

REVIEW US ON GOOGLE

When customer clicks COPY:

Copy review to clipboard.

Show:

"Review copied!"

Then Google button opens the business's Google review URL.

IMPORTANT:

Do not attempt to automatically post the review.

Do not use Google credentials from the customer.

Do not automate fake reviews.

The customer must manually submit their review.

Track:

review_copy_clicked
google_review_clicked

Do not claim that a Google review was successfully posted unless there is a legitimate API signal proving it.

---

# 20. GOOGLE REVIEW URL

Each business must have:

google_review_url

Owner/admin can paste their Google Business review URL.

Provide helper text:

"Open your Google Business Profile, choose 'Ask for reviews', and paste the review link here."

Add a "Test Link" button.

---

# 21. ANALYTICS

Track:

QR scans
Unique QR visitors
Rating selections
Feedback submissions
AI generations
Review copies
Google review clicks

Do NOT pretend Google review submissions happened if they cannot be verified.

Dashboard funnel:

QR Scans
↓
Ratings
↓
AI Reviews Generated
↓
Reviews Copied
↓
Google Review Clicks

Calculate conversion rates.

Charts:

Scans by day
Ratings by day
Google clicks by day
Rating distribution

Filters:

Today
7 days
30 days
90 days
All time

---

# 22. DATABASE

Create Supabase migrations.

Tables:

profiles

id
user_id
name
email
phone
role
status
created_at
updated_at

roles:

admin
owner

businesses

id
owner_id
name
slug
logo_url
description
category
address
phone
website
google_review_url
status
created_at
updated_at

reviews

id
business_id
rating
feedback
selected_tags
generated_review
final_review
created_at

review_sessions

id
business_id
session_id
rating
feedback
status
created_at

analytics_events

id
business_id
session_id
event_type
metadata
created_at

Example event types:

qr_scan
rating_selected
feedback_submitted
ai_generation_started
ai_generation_completed
review_copied
google_review_clicked

ai_generations

id
business_id
session_id
rating
input
output
provider
model
created_at

audit_logs

id
actor_user_id
action
entity_type
entity_id
metadata
created_at

---

# 23. DATABASE SECURITY

Implement Supabase Row Level Security.

Rules:

Admin:
Can access everything.

Owner:
Can only access businesses where owner_id = authenticated user.

Owner cannot:

* Access other owners
* Access other businesses
* Modify admin accounts
* Read platform-wide data

Customers:

No authenticated account.

Customer-facing endpoints must only expose the minimum required business information.

Never expose:

* owner email
* admin data
* internal analytics
* private database information

---

# 24. QR SECURITY

QR URL should contain only a public business slug or non-sensitive public identifier.

Example:

/review/underground-bar

Do not put:

* owner IDs
* emails
* passwords
* private database IDs
* API keys

in QR URLs.

---

# 25. AI SECURITY

Never call AI APIs directly from the browser using secret API keys.

Use:

Supabase Edge Function

or

secure backend endpoint.

Environment variables:

AI_PROVIDER
AI_API_KEY
AI_MODEL

Also implement:

* Input length limits
* Rate limiting
* Error handling
* Timeout
* Retry handling
* Fallback message

---

# 26. CUSTOMER EXPERIENCE

The customer page should feel almost like a native mobile app.

At the bottom:

"Powered by [Product Name]"

But keep branding subtle.

No unnecessary navigation.

No signup.

No popup spam.

No complicated forms.

---

# 27. RESPONSIVENESS

Must work perfectly on:

320px mobile
375px mobile
390px mobile
430px mobile
768px tablet
1024px laptop
1440px desktop
1920px desktop

Customer experience should be mobile-first.

Admin dashboard should be responsive.

On mobile:

Sidebar becomes drawer.

Tables become cards where necessary.

Charts resize properly.

---

# 28. ACCESSIBILITY

Implement:

* Keyboard navigation
* Proper labels
* ARIA where needed
* Focus states
* Accessible buttons
* Accessible star rating
* Screen-reader friendly forms
* Good contrast

Stars must not rely only on color.

---

# 29. LOADING STATES

Every async operation needs a loading state.

Examples:

Login:
Loading button

Dashboard:
Skeleton cards

Charts:
Skeleton chart

AI:
Animated AI loader

QR:
Generating QR...

Business creation:
Creating business...

Never leave the user staring at a blank screen.

---

# 30. ERROR HANDLING

Create polished error states.

Examples:

Invalid QR:

"This review link isn't available."

Business disabled:

"This business is currently unavailable."

AI failure:

"We couldn't create the review right now. You can write your review manually."

Network failure:

"Something went wrong. Please try again."

404:

"Page not found."

Unauthorized:

"You don't have permission to view this page."

---

# 31. TOASTS

Use toast notifications.

Examples:

"Business created successfully."

"QR code downloaded."

"Review copied to clipboard."

"Profile updated."

"Google review link saved."

"Password updated."

---

# 32. ADMIN SETTINGS

Create:

/admin/settings

Sections:

Platform Settings
AI Settings
Security
Analytics

AI settings:

Provider
Model
Temperature if supported
Max output length

Do not expose API keys in UI unless securely implemented.

---

# 33. OWNER SETTINGS

Create:

/owner/settings

Sections:

Profile
Business
Review Settings
Security

Profile:

Name
Email
Phone

Business:

Name
Logo
Description
Address
Website
Google review URL

Security:

Change password
Logout

---

# 34. EMPTY STATES

Create polished empty states.

Example:

"No reviews yet."

"Once customers scan your QR code, their feedback will appear here."

Button:

"View QR Code"

---

# 35. SEO

Public pages should have:

Title
Meta description
Open Graph metadata
Favicon

Customer review page title:

"Share Your Experience — {Business Name}"

Landing page should be SEO friendly.

---

# 36. PERFORMANCE

Optimize for:

Fast initial load
Code splitting
Lazy loading
Optimized images
Compressed assets
Minimal JavaScript
Efficient database queries

Avoid unnecessary re-renders.

---

# 37. SECURITY CHECKLIST

Implement:

* Supabase RLS
* Protected routes
* Role-based authorization
* Secure AI API access
* Input validation with Zod
* Rate limiting where applicable
* XSS-safe rendering
* No secrets in frontend
* Secure password handling
* Session validation
* Audit logs for admin actions

Never trust frontend role information.

Always verify authorization server-side/database-side.

---

# 38. SAMPLE BUSINESS

Create seed/demo data.

Business:

Underground Bar

Category:

Bar & Restaurant

Use a placeholder logo.

Demo Google review URL should be configurable and clearly marked as demo.

Create a demo owner.

Create a demo admin.

Do not hardcode credentials into production.

---

# 39. DEMO CUSTOMER FLOW

The completed application must allow me to test:

1. Open demo review URL.
2. Select 5 stars.
3. Select "Friendly staff".
4. Select "Great ambience".
5. Generate AI review.
6. View 2–3 generated reviews.
7. Edit one.
8. Copy review.
9. Click Google review button.
10. Analytics should record each relevant event.

Then repeat with:

1 star
2 stars
3 stars
4 stars

and verify the generated review reflects the selected rating.

---

# 40. ADMIN DEMO FLOW

I should be able to:

1. Login as admin.
2. Create owner.
3. Create/assign business.
4. Add Google review URL.
5. Generate QR.
6. View business.
7. View analytics.
8. View reviews.
9. Disable owner.
10. Re-enable owner.

---

# 41. OWNER DEMO FLOW

I should be able to:

1. Login.
2. See dashboard.
3. See rating statistics.
4. See QR scans.
5. See Google clicks.
6. Download QR.
7. Edit business.
8. Update Google review URL.
9. View customer feedback.
10. View analytics.

---

# 42. UI COMPONENTS

Create reusable components:

Button
Input
Textarea
Select
Modal
Drawer
Dropdown
Toast
Card
Badge
Avatar
Table
Pagination
Tabs
Tooltip
Chart
Skeleton
EmptyState
ErrorState
StarRating
ReviewCard
QRCard
StatCard
Sidebar
Topbar
Breadcrumb
DateRangePicker
LoadingSpinner
AIReviewGenerator

---

# 43. STAR RATING COMPONENT

Create a reusable accessible StarRating component.

Requirements:

* 1–5 stars
* Hover preview
* Click selection
* Keyboard support
* Smooth animation
* Selected state
* Mobile friendly

---

# 44. REVIEW CARD

Review cards should show:

Star rating
Generated review
Edit
Copy
Regenerate

Example:

★★★★★

"Had an amazing experience..."

[Edit]

[Copy]

[Regenerate]

---

# 45. PRODUCT BRANDING

Use a temporary product name:

"ReviewFlow AI"

Make the product name configurable so it can easily be changed later.

Primary brand color:

#0F917D

Use this throughout the application subtly.

Do not overuse the accent color.

---

# 46. MOBILE CUSTOMER UI

The customer page is the most important UI.

Design roughly:

---

[LOGO]

Underground Bar

How was your experience?

★★★★★

Tell us what you liked

[ Great service ]
[ Friendly staff ]
[ Great ambience ]
[ Good quality ]

[ Continue ]

---

After generation:

---

✨ Your review

"Had a wonderful experience..."

[ Edit ]

[ Copy Review ]

[ ⭐ Review on Google ]

---

Keep everything centered and spacious.

---

# 47. AI PROMPT

Create a secure server-side prompt similar to:

"You are helping a customer turn their own feedback into a natural Google review.

The customer selected {rating} out of 5 stars.

Their selected feedback:
{tags}

Their optional written feedback:
{feedback}

Generate 3 concise review drafts.

Rules:

* Never invent experiences.
* Never add facts not supplied by the customer.
* Match the selected rating honestly.
* Keep the tone natural and human.
* Avoid exaggerated marketing language.
* Do not mention AI.
* Do not manipulate the customer toward a higher rating.
* Do not include fake claims.
* Keep each review between approximately 30–80 words.
* Make each variation meaningfully different.
* The customer will review and edit the text before posting."

---

# 48. GOOGLE POLICY / AUTHENTICITY

The product must be designed around genuine customer feedback.

Never:

* Create fake reviews
* Create reviews without customer input
* Automatically post reviews
* Hide negative ratings from the Google review path
* Incentivize customers to leave positive reviews
* Rewrite a 1-star rating into a 5-star review
* Claim a review was posted when it wasn't verified

The AI is an assistant for writing the customer's own review, not a fake-review generator.

---

# 49. FINAL QUALITY BAR

Before considering the project complete:

Test:

Authentication
Admin login
Owner login
Role permissions
RLS
Business creation
Owner creation
QR generation
QR scanning
Customer rating
Feedback
AI generation
Review editing
Copy review
Google link
Analytics
Charts
Mobile responsiveness
Desktop responsiveness
Error states
Loading states
Empty states
Logout
Password reset

Fix all TypeScript errors.

Fix all console errors.

Fix all broken routes.

Fix all mobile overflow.

Do not leave TODO placeholders for core functionality.

---

# 50. DEVELOPMENT APPROACH

Build in this order:

PHASE 1
Project setup
Routing
Design system
Supabase configuration

PHASE 2
Authentication
Roles
RLS
Protected routes

PHASE 3
Database
Business management
Owner management

PHASE 4
Customer review experience

PHASE 5
AI review generation

PHASE 6
QR generation

PHASE 7
Google review flow

PHASE 8
Owner dashboard

PHASE 9
Admin dashboard

PHASE 10
Analytics

PHASE 11
Polish
Animations
Responsive design
Accessibility
Error handling

PHASE 12
Testing
Security audit
Performance optimization

---

# 51. IMPORTANT CODING AGENT INSTRUCTIONS

Do not just generate a plan.

Actually implement the application.

First inspect the existing repository and understand its current structure.

If a project already exists, preserve useful existing code and integrate the new architecture rather than unnecessarily destroying the project.

If dependencies are missing, install the required dependencies.

Create all required files.

Create Supabase migrations.

Create environment variable documentation.

Create seed/demo data.

Use clean TypeScript.

Do not use fake API responses for core functionality when the real implementation can be built.

Where an external credential is required, create a clear `.env.example` and a setup instruction.

Do not expose secrets.

If an API cannot be called during local development, implement a clean development fallback/mock provider behind an abstraction layer.

The application must still run locally without crashing when optional AI credentials are missing.

---

# 52. ENVIRONMENT VARIABLES

Create `.env.example` containing placeholders such as:

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

AI_PROVIDER=
AI_API_KEY=
AI_MODEL=

Do not commit `.env`.

---

# 53. README

Create a complete README containing:

Project overview
Features
Tech stack
Architecture
Environment setup
Supabase setup
Database migration
Authentication setup
AI configuration
Local development
Production deployment
QR setup
Google review URL setup
Security notes
Testing instructions

---

# 54. FINAL COMMAND

After implementation:

Run the project.

Check for:

TypeScript errors
Lint errors
Build errors
Broken imports
Broken routes
Console errorss
Responsive issues

Fix everything you can.

Then provide a concise final report:

1. What was built
2. Tech stack
3. Files/components created
4. Database tables
5. Authentication roles
6. How to run
7. Environment variables required
8. Remaining external configuration
9. Test credentials only if safe/demo credentials were created

Do not stop after generating the architecture.

Build the actual working application.

The final result should feel like a real commercial SaaS product, not a tutorial project.
