import { GoogleGenAI } from "@google/genai";
import { CompanyInfo, GroundingChunk } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseResponseText = (text: string): CompanyInfo => {
    const getField = (label: string) => {
        const regex = new RegExp(`${label}:\\s*(.*)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : 'Not found';
    };

    return {
        companyName: getField('Company Name'),
        registryNumber: getField('Registry Number'),
        location: getField('Location'),
        country: getField('Country'),
        website: getField('Website'),
        parentCompany: getField('Parent Company'),
        parentCompanySource: getField('Parent Company Source'),
        subsidiaries: getField('Subsidiaries'),
        subsidiariesSource: getField('Subsidiaries Source'),
        websiteSummary: getField('Website Summary'),
        confidenceLevel: getField('Confidence Level'),
        justification: getField('Justification'),
        verifiedOnWebsite: getField('Verified on Website'),
        verifiedOfficers: getField('Verified Officers'),
        KeyExecutives: getField('Key Executives'),
        RecentNewsSummary: getField('Recent News Summary'),
        BusinessActivities: getField('Business Activities'),
    };
};


export const searchCompanyInfo = async (query: string, isDeepSearch: boolean): Promise<{ companyInfo: CompanyInfo; sources: GroundingChunk[] }> => {
  try {
    let prompt = `
      Your task is to act as a corporate intelligence analyst. Given a company query, you will use your search capabilities to find, verify, and present specific information.

      **Query:** "${query}"

      **CRITICAL BUSINESS RULES & GUIDELINES:**
      1. **Acquisitions & Redirects:** If a company's domain redirects to an acquiring/parent company (e.g., Company A -> Company B), USE the destination domain.
      2. **Parent Companies:** If a subsidiary has no standalone website, the parent company's website is the correct match.
      3. **Address Matching:** Minor variations (e.g., street numbers) in otherwise matching addresses (same City/Country) should NOT lower confidence significantly.
      4. **Inaccessible/Broken/Login-Protected/Generic Domains:**
         - If a domain is verified via reliable third-party registries but is broken/inactive:
         - List it as the Website.
         - Label it "Match – Low Confidence".
      5. **Translations & Abbreviations:** English translations of names and standard abbreviations (e.g., NUF) are valid.
      6. **Executives:** Verify via reliable registries if not on the main website.
      7. **No Domain Found:**
         - If you absolutely cannot find a website domain, set 'Website' to 'Not found'.
         - **CRITICAL:** If 'Website' is 'Not found', set 'Confidence Level' to 'No Match'.

      **CRITICAL SOURCE URL RULES (STRICT ENFORCEMENT):**
      - **NO GUESSING:** You must strictly provide URLs that exist. Do not construct URLs based on patterns.
      - **RELEVANCE:** The "Parent Company Source" and "Subsidiaries Source" must be a direct link to a page that *explicitly* mentions the relationship (e.g., an "Our Brands" page, a registry entry listing ownership, or a press release).
      - **NO JUNK LINKS:** Do NOT provide:
        - Google Search result URLs.
        - Generic homepages (unless the info is on the homepage).
        - Login pages (e.g., LinkedIn).
      - **FALLBACK:** If you cannot find a specific, valid, and accessible URL verifying the relationship, output "Not found" for the source field. **IT IS BETTER TO RETURN "Not found" THAN A BAD LINK.**

      **Step 1: Core Information Retrieval**
      - Find the official Company Name.
      - Find the official Registry Number.
      - Find the primary corporate Website URL.
      - Find the Parent Company (if applicable, otherwise "Not found").
      - **Parent Company Source:** Find the EXACT URL proving this relationship. If no direct proof page exists, output "Not found".
      - Find major Subsidiaries (list top 3-5 if applicable, otherwise "Not found").
      - **Subsidiaries Source:** Find the EXACT URL proving this list. If no direct proof page exists, output "Not found".
      - Find the full physical address (Location).
      - Find the Country.

      **Step 2: Website Analysis**
      - Visit the company website found in Step 1.
      - Provide a brief summary of the company's 'About Us'.
      - Cross-reference Step 1 info. List which items (specifically check for: "Company Name", "Registry Number", "Location", "Country") are confirmed on the website.
      - List verified officers/executives.

      **Step 3: Confidence Assessment**
      - Match – High Confidence: Registry number on site, OR Entity Name + Address + Executive match.
      - Match – Medium Confidence: Entity Name + City/Industry match, but no specific address/exec match.
      - Match – Low Confidence: DBA names, or broken/login-required/generic verified domains.
      - Non-Investable: Holding/Shell companies.
      - No Match: No domain found or clear mismatch.

      **Step 4: Deep Search (If Requested)**
    `;

    if (isDeepSearch) {
        prompt += `
      - Leadership Deep Dive: LinkedIn profiles/news for executives.
      - Recent News Analysis: Top 3 news items (last 12 months).
      - Business Activities: Detailed product/service description.
      `;
    }

    prompt += `
      **Final Output Formatting**
      Present your final answer using these exact labels. Do not add extra text.

      Company Name: [Result]
      Registry Number: [Result]
      Location: [Result]
      Country: [Result]
      Website: [Verified URL]
      Parent Company: [Result]
      Parent Company Source: [Direct URL or "Not found"]
      Subsidiaries: [Result]
      Subsidiaries Source: [Direct URL or "Not found"]
      Website Summary: [Result]
      Verified on Website: [Result]
      Verified Officers: [Result]
      Confidence Level: [Selected Level]
      Justification: [Brief explanation]
    `;

    if (isDeepSearch) {
        prompt += `
      Key Executives: [Deep Search Result]
      Recent News Summary: [Deep Search Result]
      Business Activities: [Deep Search Result]
        `;
    }

    prompt += `
      If information is missing, state "Not found".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const companyInfo = parseResponseText(response.text);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { companyInfo, sources };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch company information: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching company information.");
  }
};