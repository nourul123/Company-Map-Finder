
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
        confidenceLevel: getField('Confidence Level'),
        justification: getField('Justification'),
    };
};


export const searchCompanyInfo = async (query: string): Promise<{ companyInfo: CompanyInfo; sources: GroundingChunk[] }> => {
  try {
    const prompt = `
      Based on your search, provide the following details for the company matching the query "${query}".

      First, find the core company information:
      - Company Name: [Name]
      - Registry Number: [Number]
      - Location: [Full Address]
      - Country: [Country]
      - Website: [URL]

      Second, compare the data points from official filings/registries found in your search to the content of the identified company website. Based on this comparison, select ONE of the following confidence levels.

      Confidence Level Options:
      - Match – High Confidence: The registry number appears on the website, OR the legal entity name, street address, and at least one officer/executive name matches between the filing and the website.
      - Match – Medium Confidence: The legal entity name, city, and/or industry match, but there is no confirmed match of a street address or officer/executive.
      - Match – Low Confidence: The domain matches casual/DBA names and general locations/industries, but there is no confirmed match between legal names, people, or street address.
      - Non-Investable: The matching domain is for a holding company or shell company and does not actually operate as an investable business.
      - No Match: A domain could not be identified that meets any of the match criteria.

      Finally, format the entire response clearly with these exact labels followed by the information:
      - Company Name: [Name]
      - Registry Number: [Number]
      - Location: [Full Address]
      - Country: [Country]
      - Website: [URL]
      - Confidence Level: [Selected Confidence Level from the options above]
      - Justification: [A brief sentence explaining why this result and confidence level were chosen, based on the sources.]

      If any piece of information cannot be found, please state "Not found" for that specific field.
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