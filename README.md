NutriScan -- AI-Powered Food Label Analyzer
NutriScan is an AI-powered web application that helps users understand
packaged food products by analyzing ingredient-label images and product
barcodes. It uses Google's Gemini AI to interpret food-label images,
identify ingredients that may need attention, generate a health score,
summarize the product, and suggest healthier alternatives.
Live Demo
https://nutriscan-health-hub-phi.vercel.app/
Project Overview
Reading and understanding long ingredient lists on packaged foods can be
difficult. NutriScan simplifies this process by allowing users to upload
or capture an image of a packaged food label, analyze it with AI,
identify ingredients that may need to be limited, receive a health
score, understand the product in simple language, and find healthier
alternatives.
Key Features
AI Food Label Analysis
Users can upload a clear image of a packaged food label. Gemini analyzes
the image and returns: - Product name - Ingredients - Harmful or limited
ingredients - Severity level: Low, Medium, or High - Health score from
0--100 - Plain-language summary - Healthier alternatives
Barcode Scanning
NutriScan supports barcode-based product lookup using Open Food Facts
when product information is available.
Personalized Concerns
The analysis can take user-selected health concerns into account and
explain why particular ingredients may matter for those concerns.
Authentication
The application includes user authentication and password-reset
functionality.
AI Integration
NutriScan uses the Google Gemini API through the `@google/genai`
package.
The application sends the food-label image, system instructions, and
selected user concerns when applicable. Gemini returns structured JSON,
which is validated with Zod before being displayed.
AI Response Structure
``` json
{
  "product_name": "Example Product",
  "ingredients": ["Ingredient A", "Ingredient B"],
  "harmful_ingredients": [
    {
      "name": "Example Ingredient",
      "reason": "Reason for limitation",
      "severity": "medium"
    }
  ],
  "health_score": 72,
  "summary": "A short plain-language product summary.",
  "alternatives": [
    {
      "name": "Alternative Product",
      "reason": "Why it may be a better choice"
    }
  ]
}
```
Technology Stack
Technology          Purpose
---
React               Frontend UI
TypeScript          Application development
TanStack Start      Full-stack application/server functions
Vite                Development and build tooling
Google Gemini API   AI image and nutrition analysis
`@google/genai`     Gemini API integration
Zod                 Input and response validation
ZXing               Barcode scanning
Open Food Facts     Barcode/product information
Supabase            Backend/authentication services
Vercel              Deployment
Application Workflow
``` text
User
  |
  v
Upload Food Image / Scan Barcode
  |
  +--------------------+
  |                    |
  v                    v
AI Image Analysis   Barcode Lookup
  |                    |
  v                    v
Gemini AI          Open Food Facts
  |                    |
  +---------+----------+
            |
            v
      Product Information
            |
            v
   Health Score & Analysis
            |
            v
   Harmful Ingredients
            |
            v
    Healthier Alternatives
```
Project Structure
The main AI and scanning server-side functionality is implemented in:
``` text
src/lib/scans.functions.ts
```
A simplified project structure:
``` text
nutriscan-latest/
├── src/
│   ├── lib/
│   │   └── scans.functions.ts
│   └── routes/
├── public/
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
└── ...
```
Environment Variables
Never commit API keys to GitHub.
Create a `.env` file locally:
``` env
GEMINI_API_KEY=your_gemini_api_key
```
For production, configure the same variable through the Vercel project
environment settings.
Running Locally
``` bash
npm install
npm run dev
```
Then open the local URL shown in the terminal.
Production Deployment
NutriScan is deployed using Vercel. Required environment variables must
be configured in the Vercel project settings before production use.
Security Notes
Never commit Gemini API keys or other secrets to GitHub.
Keep API keys in environment variables.
Do not expose server-side API keys in client-side code.
If an API key is accidentally exposed, revoke it and create a new
one.
Configure authentication and server functions securely for
production.
Limitations
AI analysis depends on image quality.
Blurry, dark, cropped, or partially visible labels may produce
incomplete results.
Barcode results depend on product availability in the Open Food
Facts database.
AI-generated nutrition analysis is informational and should not
replace professional medical or dietary advice.
Future Scope
Improved OCR and image preprocessing
Multilingual ingredient recognition
More localized product databases
Standardized nutrition scoring
Product-to-product comparison
Personalized dietary recommendations
Expanded allergen detection
Nutrition tracking and analytics
Mobile application support
Purpose
NutriScan demonstrates how modern AI can be integrated into a practical
consumer-facing application to reduce the effort required to interpret
packaged food labels.
Disclaimer
NutriScan provides informational AI-generated analysis. It is not
intended to diagnose medical conditions or replace advice from a
qualified healthcare professional or registered dietitian.
